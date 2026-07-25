import logging

from telegram import Update
from telegram.ext import Application, CallbackQueryHandler, CommandHandler, ContextTypes, MessageHandler, filters

from config import TELEGRAM_BOT_TOKEN
from db.database import get_open_positions, get_user, init_db, set_autotrade, set_wallet, upsert_user
from handlers.keyboards import back_button, main_menu, settings_menu
from handlers.messages import HELP, WELCOME
from services.ai_scorer import rank_coins
from services.crypto_store import encrypt_private_key
from services.scanner import scan_meme_coins
from services.trader import auto_trader
from services.wallet import get_balance_sol, keypair_from_private_key, validate_pubkey

logger = logging.getLogger(__name__)

PENDING_IMPORT: set[int] = set()
PENDING_SETTING: dict[int, str] = {}


async def _get_menu_kb(user_id: int):
    user = await get_user(user_id)
    has_wallet = bool(user and user.get("wallet_pubkey"))
    autotrade = bool(user and user.get("autotrade"))
    return main_menu(has_wallet, autotrade)


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.effective_user or not update.message:
        return
    user_id = update.effective_user.id
    await upsert_user(user_id)
    await update.message.reply_text(WELCOME, parse_mode="HTML", reply_markup=await _get_menu_kb(user_id))


async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.effective_user:
        return
    await update.message.reply_text(HELP, parse_mode="HTML", reply_markup=back_button())


async def cmd_scan(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message:
        return
    await update.message.reply_chat_action("typing")
    msg = await update.message.reply_text("🔍 Scanning Solana meme coins...")
    text = await _format_scan_results()
    await msg.edit_text(text, parse_mode="HTML", disable_web_page_preview=True, reply_markup=back_button())


async def _format_scan_results() -> str:
    coins = await scan_meme_coins()
    ranked = rank_coins(coins)[:10]
    if not ranked:
        return "No meme coins found matching quality filters. Try again shortly."

    lines = ["🔥 <b>Top Meme Coins (AI Ranked)</b>\n"]
    for i, c in enumerate(ranked, 1):
        sig = c.ai_signals[0] if c.ai_signals else ""
        lines.append(
            f"<b>{i}. {c.symbol}</b> — Score: {c.ai_score}/100\n"
            f"   💵 ${c.price_usd:.8f} | 1h: {c.price_change_h1:+.1f}%\n"
            f"   💧 Liq: ${c.liquidity_usd:,.0f} | Vol: ${c.volume_24h:,.0f}\n"
            f"   {sig}\n"
            f"   🔗 <a href='{c.url}'>Chart</a>\n"
        )
    return "\n".join(lines)


async def cmd_wallet(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.effective_user:
        return
    user_id = update.effective_user.id
    PENDING_IMPORT.add(user_id)
    await update.message.reply_text(
        "🔑 <b>Import Trading Wallet</b>\n\n"
        "Send your Solana wallet <b>private key</b> (base58 format).\n\n"
        "⚠️ Use a <b>dedicated trading wallet</b> with only what you want to risk.\n"
        "Your key is encrypted and stored locally on the bot server.\n\n"
        "Or tap <b>Connect Phantom</b> from the menu for view-only mode.",
        parse_mode="HTML",
        reply_markup=back_button(),
    )


async def cmd_balance(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.effective_user:
        return
    user = await get_user(update.effective_user.id)
    if not user or not user.get("wallet_pubkey"):
        await update.message.reply_text("❌ No wallet connected. Use /wallet first.")
        return
    bal = await get_balance_sol(user["wallet_pubkey"])
    autotrade = "🟢 ON" if user.get("autotrade") else "🔴 OFF"
    await update.message.reply_text(
        f"💰 <b>Wallet</b>\n\n"
        f"Address: <code>{user['wallet_pubkey'][:8]}...{user['wallet_pubkey'][-6:]}</code>\n"
        f"Balance: <b>{bal:.4f} SOL</b>\n"
        f"Auto Trade: {autotrade}",
        parse_mode="HTML",
        reply_markup=back_button(),
    )


async def cmd_positions(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.effective_user:
        return
    text = await _format_positions(update.effective_user.id)
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=back_button())


async def _format_positions(user_id: int) -> str:
    positions = await get_open_positions(user_id)
    if not positions:
        return "📊 No open positions."

    lines = ["📊 <b>Open Positions</b>\n"]
    for p in positions:
        lines.append(
            f"<b>{p['token_symbol']}</b> — Entry: ${float(p['entry_price']):.8f}\n"
            f"   💰 {float(p['entry_amount_sol'])} SOL | AI: {float(p['ai_score'])}/100\n"
        )
    return "\n".join(lines)


async def cmd_autotrade(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.effective_user:
        return
    user = await get_user(update.effective_user.id)
    if not user or not user.get("encrypted_key"):
        await update.message.reply_text("❌ Import a wallet key first (/wallet) to enable auto trading.")
        return
    enabled = not bool(user.get("autotrade"))
    await set_autotrade(update.effective_user.id, enabled)
    status = "🚀 Auto Trade STARTED" if enabled else "⏹ Auto Trade STOPPED"
    await update.message.reply_text(f"{status}\n\nBot will scan and trade automatically.", reply_markup=await _get_menu_kb(update.effective_user.id))


async def cmd_settings(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.effective_user:
        return
    user = await get_user(update.effective_user.id) or {}
    await update.message.reply_text(
        f"⚙️ <b>Settings</b>\n\n"
        f"💵 Trade size: {float(user.get('trade_sol', 0.05))} SOL\n"
        f"🛑 Stop loss: {float(user.get('stop_loss_pct', 15))}%\n"
        f"🎯 Take profit: {float(user.get('take_profit_pct', 50))}%\n"
        f"📦 Max positions: {int(user.get('max_positions', 3))}",
        parse_mode="HTML",
        reply_markup=settings_menu(),
    )


async def cmd_stop(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.effective_user or not update.message:
        return
    await set_autotrade(update.effective_user.id, False)
    await update.message.reply_text("⏹ Auto trade stopped.", reply_markup=await _get_menu_kb(update.effective_user.id))


async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    if not query or not query.data or not update.effective_user:
        return
    await query.answer()
    user_id = update.effective_user.id
    data = query.data

    if data == "menu":
        await query.edit_message_text(WELCOME, parse_mode="HTML", reply_markup=await _get_menu_kb(user_id))
    elif data == "help":
        await query.edit_message_text(HELP, parse_mode="HTML", reply_markup=back_button())
    elif data == "scan":
        await query.edit_message_text("🔍 Scanning...", parse_mode="HTML")
        text = await _format_scan_results()
        await query.edit_message_text(text, parse_mode="HTML", disable_web_page_preview=True, reply_markup=back_button())
    elif data == "wallet_import":
        PENDING_IMPORT.add(user_id)
        await query.edit_message_text(
            "🔑 Send your base58 private key in the next message.\n\n⚠️ Dedicated trading wallet only!",
            reply_markup=back_button(),
        )
    elif data == "balance":
        user = await get_user(user_id)
        if not user or not user.get("wallet_pubkey"):
            await query.edit_message_text("❌ No wallet connected.", reply_markup=back_button())
            return
        bal = await get_balance_sol(user["wallet_pubkey"])
        await query.edit_message_text(f"💰 Balance: <b>{bal:.4f} SOL</b>", parse_mode="HTML", reply_markup=back_button())
    elif data == "positions":
        text = await _format_positions(user_id)
        await query.edit_message_text(text, parse_mode="HTML", reply_markup=back_button())
    elif data == "settings":
        user = await get_user(user_id) or {}
        await query.edit_message_text(
            f"⚙️ <b>Settings</b>\n\n"
            f"💵 Trade: {float(user.get('trade_sol', 0.05))} SOL\n"
            f"🛑 Stop loss: {float(user.get('stop_loss_pct', 15))}%\n"
            f"🎯 Take profit: {float(user.get('take_profit_pct', 50))}%\n"
            f"📦 Max positions: {int(user.get('max_positions', 3))}",
            parse_mode="HTML",
            reply_markup=settings_menu(),
        )
    elif data == "autotrade_on":
        user = await get_user(user_id)
        if not user or not user.get("encrypted_key"):
            await query.edit_message_text("❌ Import wallet key first.", reply_markup=back_button())
            return
        await set_autotrade(user_id, True)
        await query.edit_message_text("🚀 Auto Trade STARTED!", reply_markup=await _get_menu_kb(user_id))
    elif data == "autotrade_off":
        await set_autotrade(user_id, False)
        await query.edit_message_text("⏹ Auto Trade STOPPED.", reply_markup=await _get_menu_kb(user_id))
    elif data == "set_trade":
        PENDING_SETTING[user_id] = "trade_sol"
        await query.edit_message_text("Send trade size in SOL (e.g. 0.05):", reply_markup=back_button())
    elif data == "set_stoploss":
        PENDING_SETTING[user_id] = "stop_loss_pct"
        await query.edit_message_text("Send stop loss % (e.g. 15):", reply_markup=back_button())
    elif data == "set_takeprofit":
        PENDING_SETTING[user_id] = "take_profit_pct"
        await query.edit_message_text("Send take profit % (e.g. 50):", reply_markup=back_button())
    elif data == "set_maxpos":
        PENDING_SETTING[user_id] = "max_positions"
        await query.edit_message_text("Send max open positions (e.g. 3):", reply_markup=back_button())


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.message.text or not update.effective_user:
        return
    user_id = update.effective_user.id
    text = update.message.text.strip()

    # Phantom Web App data comes as web_app_data, but also handle pasted pubkey
    if user_id in PENDING_SETTING:
        field = PENDING_SETTING.pop(user_id)
        try:
            if field == "max_positions":
                val = int(text)
            else:
                val = float(text)
            await upsert_user(user_id, **{field: val})
            await update.message.reply_text(f"✅ Updated {field} → {val}", reply_markup=await _get_menu_kb(user_id))
        except ValueError:
            await update.message.reply_text("❌ Invalid value. Try again.")
        return

    if user_id in PENDING_IMPORT:
        PENDING_IMPORT.discard(user_id)
        try:
            kp = keypair_from_private_key(text)
            pubkey = str(kp.pubkey())
            encrypted = encrypt_private_key(user_id, text)
            await set_wallet(user_id, pubkey, encrypted)
            bal = await get_balance_sol(pubkey)
            # Delete the message containing the private key
            try:
                await update.message.delete()
            except Exception:
                pass
            await update.message.reply_text(
                f"✅ <b>Wallet Connected!</b>\n\n"
                f"Address: <code>{pubkey[:8]}...{pubkey[-6:]}</code>\n"
                f"Balance: {bal:.4f} SOL\n\n"
                f"Tap <b>Start Auto Trade</b> to begin.",
                parse_mode="HTML",
                reply_markup=await _get_menu_kb(user_id),
            )
        except Exception as exc:
            await update.message.reply_text(f"❌ Invalid key: {exc}")
        return

    # Direct pubkey paste (Phantom view-only)
    if len(text) >= 32 and len(text) <= 50 and validate_pubkey(text):
        await set_wallet(user_id, text, None)
        bal = await get_balance_sol(text)
        await update.message.reply_text(
            f"👻 Wallet linked (view-only): {bal:.4f} SOL\n\n"
            f"Import private key for auto trading.",
            reply_markup=await _get_menu_kb(user_id),
        )


async def handle_webapp_data(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.message.web_app_data or not update.effective_user:
        return
    import json

    user_id = update.effective_user.id
    try:
        data = json.loads(update.message.web_app_data.data)
        pubkey = data.get("publicKey", "")
        if pubkey and validate_pubkey(pubkey):
            await set_wallet(user_id, pubkey, None)
            bal = await get_balance_sol(pubkey)
            await update.message.reply_text(
                f"👻 <b>Phantom Connected!</b>\n\n"
                f"Address: <code>{pubkey[:8]}...{pubkey[-6:]}</code>\n"
                f"Balance: {bal:.4f} SOL\n\n"
                f"For auto trading, import your trading wallet key via /wallet.",
                parse_mode="HTML",
                reply_markup=await _get_menu_kb(user_id),
            )
    except Exception as exc:
        await update.message.reply_text(f"❌ Phantom connect failed: {exc}")


async def post_init(application: Application) -> None:
    await init_db()

    async def notify(user_id: int, msg: str) -> None:
        await application.bot.send_message(chat_id=user_id, text=msg, parse_mode="HTML", disable_web_page_preview=True)

    auto_trader._notify = notify
    await auto_trader.start()


async def post_shutdown(_application: Application) -> None:
    await auto_trader.stop()


def build_application() -> Application:
    if not TELEGRAM_BOT_TOKEN:
        raise ValueError("Set TELEGRAM_BOT_TOKEN in .env")

    app = (
        Application.builder()
        .token(TELEGRAM_BOT_TOKEN)
        .post_init(post_init)
        .post_shutdown(post_shutdown)
        .build()
    )

    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("help", cmd_help))
    app.add_handler(CommandHandler("scan", cmd_scan))
    app.add_handler(CommandHandler("wallet", cmd_wallet))
    app.add_handler(CommandHandler("balance", cmd_balance))
    app.add_handler(CommandHandler("positions", cmd_positions))
    app.add_handler(CommandHandler("autotrade", cmd_autotrade))
    app.add_handler(CommandHandler("settings", cmd_settings))
    app.add_handler(CommandHandler("stop", cmd_stop))
    app.add_handler(CallbackQueryHandler(handle_callback))
    app.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_webapp_data))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    return app
