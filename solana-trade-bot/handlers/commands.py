import logging

from telegram import Update
from telegram.ext import Application, CallbackQueryHandler, CommandHandler, ContextTypes, MessageHandler, filters

from config import TELEGRAM_BOT_TOKEN
from db.database import (
    apply_preset,
    disconnect_wallet,
    get_best_worst_trade,
    get_open_positions,
    get_position_by_id,
    get_stats,
    get_trade_history,
    get_user,
    init_db,
    set_autotrade,
    set_wallet,
    upsert_user,
)
from handlers.formatters import (
    greeting,
    performance_badge,
    pnl_bar,
    score_bar,
    short_address,
)
from handlers.keyboards import (
    back_button,
    confirm_disconnect,
    confirm_sell_all,
    dashboard_menu,
    main_menu,
    modes_menu,
    positions_menu,
    scan_results_menu,
    settings_menu,
    setup_guide_menu,
    stop_loss_quick,
    trade_size_quick,
)
from handlers.messages import (
    AUTOTRADE_OFF,
    AUTOTRADE_ON,
    HELP,
    PROFIT_INFO,
    SETUP_GUIDE,
    WELCOME,
    WELCOME_BACK,
)
from handlers.presets import PRESETS, preset_summary
from handlers.tips import random_tip
from services.ai_scorer import format_score_emoji, rank_coins
from services.crypto_store import encrypt_private_key
from services.entry_filter import entry_quality_label
from services.portfolio import get_unrealized_pnl
from services.scanner import get_token_price_cached, scan_meme_coins
from services.trader import auto_trader, cache_scan_results
from services.wallet import get_balance_sol, keypair_from_private_key, validate_pubkey

logger = logging.getLogger(__name__)

PENDING_IMPORT: set[int] = set()
PENDING_SETTING: dict[int, str] = {}


async def _get_menu_kb(user_id: int):
    user = await get_user(user_id)
    has_wallet = bool(user and user.get("wallet_pubkey"))
    has_key = bool(user and user.get("encrypted_key"))
    autotrade = bool(user and user.get("autotrade"))
    return main_menu(has_wallet, autotrade, has_key)


def _score_bar(score: float) -> str:
    return score_bar(score)


async def _welcome_text(user_id: int, first_name: str | None) -> str:
    user = await get_user(user_id)
    stats = await get_stats(user_id)
    tip = random_tip()

    if user and user.get("wallet_pubkey"):
        autotrade = "🟢 LIVE" if user.get("autotrade") else "⏸ Paused"
        lines = [
            greeting(first_name),
            "",
            WELCOME_BACK,
            "",
            f"Status: <b>{autotrade}</b>",
        ]
        if stats["total_trades"] > 0:
            badge = performance_badge(stats["win_rate"], stats.get("sol_pnl", 0))
            lines.append(f"Performance: {badge} │ {stats['win_rate']}% win rate")
        lines.extend(["", tip])
        return "\n".join(lines)

    lines = [greeting(first_name), "", WELCOME, "", tip]
    return "\n".join(lines)


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.effective_user or not update.message:
        return
    user_id = update.effective_user.id
    name = update.effective_user.first_name
    await upsert_user(user_id)
    text = await _welcome_text(user_id, name)
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=await _get_menu_kb(user_id))


async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message:
        return
    await update.message.reply_text(HELP, parse_mode="HTML", reply_markup=back_button())


async def cmd_dashboard(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.effective_user:
        return
    text = await _format_dashboard(update.effective_user.id)
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=dashboard_menu())


async def cmd_tips(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message:
        return
    await update.message.reply_text(
        f"<b>💡 Pro Tip</b>\n\n{random_tip()}\n\n<i>Tap /tips again for another.</i>",
        parse_mode="HTML",
        reply_markup=back_button(),
    )


async def _format_dashboard(user_id: int) -> str:
    user = await get_user(user_id) or {}
    stats = await get_stats(user_id)
    best = await get_best_worst_trade(user_id)
    positions = await get_open_positions(user_id)
    unrealized = await get_unrealized_pnl(user_id, positions) if positions else None

    bal = 0.0
    if user.get("wallet_pubkey"):
        bal = await get_balance_sol(user["wallet_pubkey"])

    autotrade = "🟢 LIVE" if user.get("autotrade") else "⏸ Paused"
    mode_label = PRESETS.get(user.get("risk_mode") or "balanced", PRESETS["balanced"])["label"]
    badge = performance_badge(stats["win_rate"], stats.get("sol_pnl", 0))

    lines = [
        "📊 <b>Your Trading Dashboard</b>",
        "",
        f"🤖 Bot: <b>{autotrade}</b>  │  🎛 {mode_label}",
        f"💰 Balance: <b>{bal:.4f} SOL</b>  │  📦 {stats['open_positions']} open",
        f"🏅 {badge}",
        "",
        "<b>📈 Performance</b>",
        f"├ Trades: {stats['total_trades']} ({stats['wins']}W / {stats['losses']}L)",
        f"├ Win Rate: {stats['win_rate']}%  {pnl_bar(stats['win_rate'] - 50)}",
        f"├ Avg PnL: {stats['avg_pnl']:+.1f}%",
        f"└ Realized: <b>{stats.get('sol_pnl', 0):+.4f} SOL</b>",
    ]

    if unrealized and unrealized["invested_sol"] > 0:
        u = unrealized["unrealized_sol"]
        up = unrealized["unrealized_pct"]
        emoji = "🟢" if u >= 0 else "🔴"
        lines.extend([
            "",
            "<b>💼 Open Positions (Live)</b>",
            f"├ Invested: {unrealized['invested_sol']:.4f} SOL",
            f"├ Est. Value: {unrealized['current_sol']:.4f} SOL",
            f"└ Unrealized: {emoji} <b>{u:+.4f} SOL ({up:+.1f}%)</b>",
        ])

    if best.get("best_symbol"):
        lines.extend([
            "",
            "<b>🏆 Records</b>",
            f"├ Best: ${best['best_symbol']} ({best['best_pnl']:+.1f}%)",
        ])
        if best.get("worst_symbol"):
            lines.append(f"└ Worst: ${best['worst_symbol']} ({best['worst_pnl']:+.1f}%)")

    lines.extend([
        "",
        "<b>⚙️ Active Rules</b>",
        f"├ {float(user.get('trade_sol', 0.05))} SOL/trade",
        f"├ Stop -{float(user.get('stop_loss_pct', 15))}% │ Target +{float(user.get('take_profit_pct', 50))}%",
        f"└ AI min score: {float(user.get('min_ai_score', 75))}/100",
    ])
    return "\n".join(lines)


async def cmd_scan(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message:
        return
    await update.message.reply_chat_action("typing")
    msg = await update.message.reply_text("🔍 Scanning Solana meme coins with AI...")
    text, top5 = await _format_scan_results(update.effective_user.id if update.effective_user else None)
    kb = scan_results_menu(top5) if top5 else back_button()
    await msg.edit_text(text, parse_mode="HTML", disable_web_page_preview=True, reply_markup=kb)


async def _format_scan_results(user_id: int | None = None) -> tuple[str, list]:
    coins = await scan_meme_coins()
    ranked = rank_coins(coins)[:10]
    cache_scan_results(ranked)

    if not ranked:
        return "❌ No quality coins found. Market may be slow — try again shortly.", []

    user = await get_user(user_id) if user_id else None
    min_score = float(user.get("min_ai_score", 75)) if user else 75

    lines = ["🔥 <b>Top Meme Coins — AI Ranked</b>", f"<i>{len(ranked)} coins scanned · tap to buy</i>\n"]
    for i, c in enumerate(ranked, 1):
        badge = format_score_emoji(c.ai_score)
        bar = _score_bar(c.ai_score)
        sig = c.ai_signals[0] if c.ai_signals else ""
        entry = entry_quality_label(c)
        buyable = "✅" if c.ai_score >= min_score else "⏭"
        lines.append(
            f"{buyable} <b>{i}. ${c.symbol}</b>  {badge}\n"
            f"   {bar} {c.ai_score}/100\n"
            f"   💵 ${c.price_usd:.8f} │ 1h: {c.price_change_h1:+.1f}%\n"
            f"   💧 ${c.liquidity_usd:,.0f} liq │ ${c.volume_24h:,.0f} vol\n"
            f"   {entry} │ {sig}\n"
            f"   🔗 <a href='{c.url}'>Chart</a>\n"
        )
    lines.append("\nTap a button below to buy instantly.")
    return "\n".join(lines), ranked[:5]


async def cmd_wallet(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.effective_user:
        return
    PENDING_IMPORT.add(update.effective_user.id)
    await update.message.reply_text(
        "🔑 <b>Import Trading Wallet</b>\n\n"
        "Send your Solana wallet <b>private key</b> (base58).\n\n"
        "⚠️ <b>IMPORTANT:</b>\n"
        "• Use a NEW dedicated wallet\n"
        "• Only deposit what you want to trade\n"
        "• Never use your main wallet\n\n"
        "Your key is encrypted with AES and stored securely.\n"
        "The message with your key will be deleted automatically.",
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
    has_key = "✅ Auto-ready" if user.get("encrypted_key") else "👁 View-only"
    await update.message.reply_text(
        f"💰 <b>Your Wallet</b>\n\n"
        f"Address: <code>{short_address(user['wallet_pubkey'])}</code>\n\n"
        f"Balance: <b>{bal:.4f} SOL</b>\n"
        f"Auto Trade: {autotrade}\n"
        f"Mode: {has_key}",
        parse_mode="HTML",
        reply_markup=back_button(),
    )


async def cmd_positions(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.effective_user:
        return
    user_id = update.effective_user.id
    positions = await get_open_positions(user_id)
    text = await _format_positions(user_id)
    kb = positions_menu(positions) if positions else back_button()
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=kb)


async def _format_positions(user_id: int) -> str:
    positions = await get_open_positions(user_id)
    if not positions:
        return (
            "📊 <b>No Open Positions</b>\n\n"
            "Start auto trade and the bot will find opportunities.\n"
            "Or tap 🔍 Scan Memes to buy manually."
        )

    unrealized = await get_unrealized_pnl(user_id, positions)
    lines = [
        "📊 <b>Open Positions</b>",
        f"Unrealized: <b>{unrealized['unrealized_sol']:+.4f} SOL ({unrealized['unrealized_pct']:+.1f}%)</b>\n",
    ]
    for p, detail in zip(positions, unrealized["positions"]):
        pnl = detail["pnl_pct"]
        emoji = "🟢" if pnl >= 0 else "🔴"
        bar = pnl_bar(min(pnl, 50))
        lines.append(
            f"{emoji} <b>${p['token_symbol']}</b>  {pnl:+.1f}%\n"
            f"   {bar}\n"
            f"   {detail['sol_in']:.4f} SOL in → ~{detail['est_sol']:.4f} SOL\n"
            f"   AI score: {float(p['ai_score']):.0f}/100\n"
        )
    lines.append("\n<i>Tap below to sell any position.</i>")
    return "\n".join(lines)


async def cmd_history(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.effective_user:
        return
    text = await _format_history(update.effective_user.id)
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=back_button())


async def _format_history(user_id: int) -> str:
    trades = await get_trade_history(user_id, 10)
    if not trades:
        return "📜 <b>No trades yet.</b>\n\nStart auto trade to begin!"

    lines = ["📜 <b>Recent Trades</b>\n"]
    for t in trades:
        action = "🟢 BUY" if t["action"] == "BUY" else "🔴 SELL"
        sig = t.get("tx_signature") or ""
        link = f" <a href='https://solscan.io/tx/{sig}'>↗</a>" if sig else ""
        extra = ""
        if t["action"] == "SELL":
            try:
                import json
                d = json.loads(t.get("details") or "{}")
                pnl = d.get("pnl_pct")
                if pnl is not None:
                    extra = f" ({pnl:+.1f}%)"
            except Exception:
                pass
        lines.append(
            f"{action} <b>${t['token_symbol']}</b>{extra}\n"
            f"   {float(t['amount_sol']):.4f} SOL{link}\n"
        )
    return "\n".join(lines)


async def cmd_autotrade(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.effective_user:
        return
    user = await get_user(update.effective_user.id)
    if not user or not user.get("encrypted_key"):
        await update.message.reply_text(
            "❌ Import a wallet key first (/wallet) to enable auto trading.\n\n"
            "Phantom connect alone is view-only — auto trade needs a signing key.",
        )
        return
    enabled = not bool(user.get("autotrade"))
    await set_autotrade(update.effective_user.id, enabled)
    if enabled:
        msg = AUTOTRADE_ON
    else:
        msg = AUTOTRADE_OFF
    await update.message.reply_text(msg, parse_mode="HTML", reply_markup=await _get_menu_kb(update.effective_user.id))


async def cmd_modes(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.effective_user:
        return
    user = await get_user(update.effective_user.id) or {}
    current = user.get("risk_mode") or "balanced"
    lines = ["🎛 <b>Pick a Trading Mode</b>\n\nOne tap sets everything — trade size, stops, and AI threshold.\n"]
    for key, p in PRESETS.items():
        lines.append(f"{p['label']}\n<i>{p['desc']}</i>\n{preset_summary(key)}\n")
    await update.message.reply_text(
        "\n".join(lines),
        parse_mode="HTML",
        reply_markup=modes_menu(current),
    )


async def _format_settings(user: dict) -> str:
    notify = "🔔 ON" if user.get("notify_trades", 1) else "🔕 OFF"
    mode = PRESETS.get(user.get("risk_mode") or "balanced", PRESETS["balanced"])["label"]
    return (
        f"⚙️ <b>Settings</b> — Mode: {mode}\n\n"
        f"💵 Trade size: <b>{float(user.get('trade_sol', 0.05))} SOL</b>\n"
        f"🛑 Stop loss: <b>{float(user.get('stop_loss_pct', 15))}%</b>\n"
        f"🎯 Take profit: <b>{float(user.get('take_profit_pct', 50))}%</b>\n"
        f"📐 Trailing stop: <b>{float(user.get('trailing_stop_pct', 10))}%</b>\n"
        f"📦 Max positions: <b>{int(user.get('max_positions', 3))}</b>\n"
        f"🤖 Min AI score: <b>{float(user.get('min_ai_score', 75))}/100</b>\n"
        f"Notifications: {notify}\n\n"
        f"Tap a button to change:"
    )


async def cmd_settings(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.effective_user:
        return
    user = await get_user(update.effective_user.id) or {}
    await update.message.reply_text(
        await _format_settings(user),
        parse_mode="HTML",
        reply_markup=settings_menu(),
    )


async def cmd_stop(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.effective_user or not update.message:
        return
    await set_autotrade(update.effective_user.id, False)
    await update.message.reply_text(
        "🛑 <b>Emergency Stop</b>\n\nAuto trading halted. Positions still open — use /positions to sell.",
        parse_mode="HTML",
        reply_markup=await _get_menu_kb(update.effective_user.id),
    )


async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    if not query or not query.data or not update.effective_user:
        return
    await query.answer()
    user_id = update.effective_user.id
    data = query.data

    if data == "menu":
        name = update.effective_user.first_name if update.effective_user else None
        text = await _welcome_text(user_id, name)
        await query.edit_message_text(text, parse_mode="HTML", reply_markup=await _get_menu_kb(user_id))
    elif data == "tips":
        await query.edit_message_text(
            f"<b>💡 Pro Tip</b>\n\n{random_tip()}",
            parse_mode="HTML",
            reply_markup=back_button(),
        )
    elif data == "setup_guide":
        await query.edit_message_text(SETUP_GUIDE, parse_mode="HTML", reply_markup=setup_guide_menu())
    elif data == "profit_info":
        await query.edit_message_text(PROFIT_INFO, parse_mode="HTML", reply_markup=back_button())
    elif data == "help":
        await query.edit_message_text(HELP, parse_mode="HTML", reply_markup=back_button())
    elif data == "dashboard":
        text = await _format_dashboard(user_id)
        await query.edit_message_text(text, parse_mode="HTML", reply_markup=dashboard_menu())
    elif data == "scan":
        await query.edit_message_text("🔍 Scanning with AI...", parse_mode="HTML")
        text, top5 = await _format_scan_results(user_id)
        kb = scan_results_menu(top5) if top5 else back_button()
        await query.edit_message_text(text, parse_mode="HTML", disable_web_page_preview=True, reply_markup=kb)
    elif data.startswith("buymint_"):
        mint = data.replace("buymint_", "")
        user = await get_user(user_id)
        if not user or not user.get("encrypted_key"):
            await query.edit_message_text("❌ Import wallet key first.", reply_markup=back_button())
            return
        await query.edit_message_text("⏳ Executing buy...", parse_mode="HTML")
        ok, msg = await auto_trader.buy_coin(user, mint)
        await query.edit_message_text(f"{'✅' if ok else '❌'} {msg}", reply_markup=back_button())
    elif data == "wallet_import":
        PENDING_IMPORT.add(user_id)
        await query.edit_message_text("🔑 Send your base58 private key now.\n\n⚠️ Dedicated wallet ONLY!", reply_markup=back_button())
    elif data == "balance":
        user = await get_user(user_id)
        if not user or not user.get("wallet_pubkey"):
            await query.edit_message_text("❌ No wallet connected.", reply_markup=back_button())
            return
        bal = await get_balance_sol(user["wallet_pubkey"])
        await query.edit_message_text(f"💰 Balance: <b>{bal:.4f} SOL</b>", parse_mode="HTML", reply_markup=back_button())
    elif data == "positions":
        positions = await get_open_positions(user_id)
        text = await _format_positions(user_id)
        kb = positions_menu(positions) if positions else back_button()
        await query.edit_message_text(text, parse_mode="HTML", reply_markup=kb)
    elif data == "history":
        text = await _format_history(user_id)
        await query.edit_message_text(text, parse_mode="HTML", reply_markup=back_button())
    elif data == "modes":
        user = await get_user(user_id) or {}
        current = user.get("risk_mode") or "balanced"
        lines = ["🎛 <b>Pick a Trading Mode</b>\n"]
        for key, p in PRESETS.items():
            lines.append(f"{p['label']} — <i>{p['desc']}</i>\n{preset_summary(key)}\n")
        await query.edit_message_text("\n".join(lines), parse_mode="HTML", reply_markup=modes_menu(current))
    elif data.startswith("preset_"):
        mode_key = data.replace("preset_", "")
        if mode_key in PRESETS:
            await apply_preset(user_id, PRESETS[mode_key], mode_key)
            p = PRESETS[mode_key]
            await query.edit_message_text(
                f"✅ <b>{p['label']} activated!</b>\n\n{preset_summary(mode_key)}\n\n"
                f"Ready to trade. Tap START Auto Trade when you're set.",
                parse_mode="HTML",
                reply_markup=await _get_menu_kb(user_id),
            )
    elif data == "buy_top":
        user = await get_user(user_id)
        if not user or not user.get("encrypted_key"):
            await query.edit_message_text("❌ Import wallet key first.", reply_markup=back_button())
            return
        await query.edit_message_text("⏳ Buying top AI pick...", parse_mode="HTML")
        ok, msg = await auto_trader.buy_top_coin(user)
        await query.edit_message_text(f"{'✅' if ok else '❌'} {msg}", reply_markup=back_button())
    elif data == "sell_all":
        positions = await get_open_positions(user_id)
        if not positions:
            await query.edit_message_text("No open positions to sell.", reply_markup=back_button())
            return
        await query.edit_message_text(
            f"⚠️ <b>Sell all {len(positions)} positions?</b>\n\nThis will market-sell everything in your wallet.",
            parse_mode="HTML",
            reply_markup=confirm_sell_all(),
        )
    elif data == "sell_all_confirm":
        user = await get_user(user_id)
        if not user or not user.get("encrypted_key"):
            await query.edit_message_text("❌ No wallet.", reply_markup=back_button())
            return
        await query.edit_message_text("⏳ Selling all positions...", parse_mode="HTML")
        ok, total = await auto_trader.sell_all(user)
        await query.edit_message_text(
            f"✅ <b>Done!</b> Sold {ok}/{total} positions.",
            parse_mode="HTML",
            reply_markup=back_button(),
        )
    elif data == "toggle_notify":
        user = await get_user(user_id) or {}
        new_val = 0 if user.get("notify_trades", 1) else 1
        await upsert_user(user_id, notify_trades=new_val)
        status = "🔔 ON" if new_val else "🔕 OFF"
        await query.answer(f"Notifications {status}")
        user = await get_user(user_id) or {}
        await query.edit_message_text(await _format_settings(user), parse_mode="HTML", reply_markup=settings_menu())
    elif data == "disconnect":
        await query.edit_message_text(
            "⚠️ <b>Disconnect wallet?</b>\n\nThis stops auto trade and removes your wallet from the bot.",
            parse_mode="HTML",
            reply_markup=confirm_disconnect(),
        )
    elif data == "disconnect_confirm":
        await disconnect_wallet(user_id)
        await query.edit_message_text(
            "🔓 <b>Wallet disconnected.</b>\n\nAuto trade stopped. Import again anytime to restart.",
            parse_mode="HTML",
            reply_markup=await _get_menu_kb(user_id),
        )
    elif data == "settings":
        user = await get_user(user_id) or {}
        await query.edit_message_text(await _format_settings(user), parse_mode="HTML", reply_markup=settings_menu())
    elif data == "autotrade_on":
        user = await get_user(user_id)
        if not user or not user.get("encrypted_key"):
            await query.edit_message_text("❌ Import wallet key first (/wallet).", reply_markup=back_button())
            return
        await set_autotrade(user_id, True)
        await query.edit_message_text(AUTOTRADE_ON, parse_mode="HTML", reply_markup=await _get_menu_kb(user_id))
    elif data == "autotrade_off":
        await set_autotrade(user_id, False)
        await query.edit_message_text(AUTOTRADE_OFF, parse_mode="HTML", reply_markup=await _get_menu_kb(user_id))
    elif data.startswith("sell_"):
        pos_id = int(data.split("_")[1])
        user = await get_user(user_id)
        pos = await get_position_by_id(pos_id, user_id)
        if not user or not pos:
            await query.edit_message_text("❌ Position not found.", reply_markup=back_button())
            return
        await query.edit_message_text(f"⏳ Selling ${pos['token_symbol']}...", parse_mode="HTML")
        ok, msg = await auto_trader.sell_position_manual(user, pos)
        result = f"✅ {msg}" if ok else f"❌ {msg}"
        await query.edit_message_text(result, reply_markup=back_button())
    elif data.startswith("quick_trade_"):
        val = float(data.replace("quick_trade_", ""))
        await upsert_user(user_id, trade_sol=val)
        await query.edit_message_text(f"✅ Trade size → <b>{val} SOL</b>", parse_mode="HTML", reply_markup=settings_menu())
    elif data.startswith("quick_sl_"):
        val = float(data.replace("quick_sl_", ""))
        await upsert_user(user_id, stop_loss_pct=val)
        await query.edit_message_text(f"✅ Stop loss → <b>{val}%</b>", parse_mode="HTML", reply_markup=settings_menu())
    elif data == "set_trade":
        await query.edit_message_text("💵 Pick trade size:", parse_mode="HTML", reply_markup=trade_size_quick())
    elif data == "set_stoploss":
        await query.edit_message_text("🛑 Pick stop loss %:", parse_mode="HTML", reply_markup=stop_loss_quick())
    elif data == "set_minscore":
        PENDING_SETTING[user_id] = "min_ai_score"
        await query.edit_message_text("🤖 Min AI score (70-95, e.g. <code>80</code>):", parse_mode="HTML", reply_markup=back_button())
    elif data == "set_takeprofit":
        PENDING_SETTING[user_id] = "take_profit_pct"
        await query.edit_message_text("🎯 Send take profit % (e.g. <code>50</code>):", parse_mode="HTML", reply_markup=back_button())
    elif data == "set_trailing":
        PENDING_SETTING[user_id] = "trailing_stop_pct"
        await query.edit_message_text("📐 Send trailing stop % (e.g. <code>10</code>):", parse_mode="HTML", reply_markup=back_button())
    elif data == "set_maxpos":
        PENDING_SETTING[user_id] = "max_positions"
        await query.edit_message_text("📦 Send max open positions (e.g. <code>3</code>):", parse_mode="HTML", reply_markup=back_button())


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.message.text or not update.effective_user:
        return
    user_id = update.effective_user.id
    text = update.message.text.strip()

    if user_id in PENDING_SETTING:
        field = PENDING_SETTING.pop(user_id)
        try:
            if field == "max_positions":
                val = max(1, min(10, int(text)))
            elif field == "trade_sol":
                val = max(0.01, min(5.0, float(text)))
            elif field == "min_ai_score":
                val = max(65, min(95, float(text)))
            elif field in ("stop_loss_pct", "take_profit_pct", "trailing_stop_pct"):
                val = max(1, min(100, float(text)))
            else:
                val = float(text)
            await upsert_user(user_id, **{field: val})
            await update.message.reply_text(f"✅ Updated → <b>{val}</b>", parse_mode="HTML", reply_markup=await _get_menu_kb(user_id))
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
            await apply_preset(user_id, PRESETS["balanced"], "balanced")
            bal = await get_balance_sol(pubkey)
            try:
                await update.message.delete()
            except Exception:
                pass
            await update.message.reply_text(
                f"✅ <b>You're all set!</b>\n\n"
                f"Wallet: <code>{short_address(pubkey)}</code>\n"
                f"Balance: <b>{bal:.4f} SOL</b>\n"
                f"Mode: ⚖️ Balanced\n\n"
                f"🚀 Tap <b>START Auto Trade</b> — the bot handles the rest!",
                parse_mode="HTML",
                reply_markup=await _get_menu_kb(user_id),
            )
        except Exception as exc:
            await update.message.reply_text(f"❌ Invalid key: {exc}")
        return

    if 32 <= len(text) <= 50 and validate_pubkey(text):
        await set_wallet(user_id, text, None)
        bal = await get_balance_sol(text)
        await update.message.reply_text(
            f"👻 Wallet linked (view-only): {bal:.4f} SOL\n\nImport key via /wallet for auto trading.",
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
                f"<code>{pubkey[:12]}...{pubkey[-8:]}</code>\n"
                f"Balance: <b>{bal:.4f} SOL</b>\n\n"
                f"Import key via /wallet for auto trading.",
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

    for cmd, handler in [
        ("start", cmd_start), ("help", cmd_help), ("dashboard", cmd_dashboard),
        ("scan", cmd_scan), ("modes", cmd_modes), ("wallet", cmd_wallet),
        ("balance", cmd_balance), ("positions", cmd_positions), ("history", cmd_history),
        ("autotrade", cmd_autotrade), ("settings", cmd_settings), ("stop", cmd_stop),
        ("tips", cmd_tips),
    ]:
        app.add_handler(CommandHandler(cmd, handler))

    app.add_handler(CallbackQueryHandler(handle_callback))
    app.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_webapp_data))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    return app
