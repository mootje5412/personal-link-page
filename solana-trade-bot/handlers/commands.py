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
    format_coin_detail,
    format_dashboard,
    format_position_detail,
    format_position_line,
    format_scan_results,
    format_trade_history,
    greeting,
    short_address,
)
from handlers.keyboards import (
    ask_ai_menu,
    back_button,
    coin_detail_menu,
    confirm_disconnect,
    confirm_sell_all,
    dashboard_menu,
    main_menu,
    modes_menu,
    position_detail_menu,
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
from services.ai_chat import analyze_coin, ask_ai
from services.ai_scorer import rank_coins
from services.crypto_store import encrypt_private_key
from services.portfolio import get_unrealized_pnl
from services.scanner import scan_meme_coins, get_token_price_cached
from services.trader import auto_trader, cache_scan_results, get_autotrade_status, get_cached_coin
from services.wallet import get_balance_sol, keypair_from_private_key, validate_pubkey

logger = logging.getLogger(__name__)

PENDING_IMPORT: set[int] = set()
PENDING_SETTING: dict[int, str] = {}
PENDING_ASK: set[int] = set()


def _looks_like_question(text: str) -> bool:
    t = text.lower().strip()
    if len(t) < 4:
        return False
    if t.endswith("?"):
        return True
    if any(t.startswith(f"{s} ") or t == s for s in (
        "what", "how", "why", "when", "which", "should", "can", "is", "are",
        "do", "does", "tell", "explain", "help", "recommend",
    )):
        return True
    return any(k in t for k in (
        "best to buy", "what to buy", "should i buy", "top pick",
        "auto trade", "stop loss", "take profit", "which mode",
    ))


async def _get_menu_kb(user_id: int):
    user = await get_user(user_id)
    has_wallet = bool(user and user.get("wallet_pubkey"))
    has_key = bool(user and user.get("encrypted_key"))
    autotrade = bool(user and user.get("autotrade"))
    return main_menu(has_wallet, autotrade, has_key)


async def _welcome_text(user_id: int, first_name: str | None) -> str:
    user = await get_user(user_id)
    stats = await get_stats(user_id)

    if user and user.get("wallet_pubkey"):
        autotrade = "Running" if user.get("autotrade") else "Paused"
        lines = [greeting(first_name), "", WELCOME_BACK.strip(), "", f"Status: <b>{autotrade}</b>"]
        if stats["total_trades"] > 0:
            from handlers.formatters import performance_label
            label = performance_label(stats["win_rate"], stats.get("sol_pnl", 0))
            lines.append(f"Performance: {label} | {stats['win_rate']}% win rate")
        lines.append("\nType a question to ask the AI, or tap Best Buys to scan.")
        return "\n".join(lines)

    return f"{greeting(first_name)}\n{WELCOME}\n\nType a question anytime to ask the AI."


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


async def cmd_ask(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.effective_user:
        return
    question = " ".join(context.args) if context.args else ""
    user_id = update.effective_user.id
    user = await get_user(user_id) or {}
    user["user_id"] = user_id

    if not question:
        PENDING_ASK.add(user_id)
        await update.message.reply_text(
            "<b>Ask the AI</b>\n\nType your question below.\n\n"
            "Examples:\n"
            "- What should I buy right now?\n"
            "- How does stop loss work?\n"
            "- Which mode should I use?",
            parse_mode="HTML",
            reply_markup=ask_ai_menu(),
        )
        return

    await update.message.reply_chat_action("typing")
    answer = await ask_ai(question, user)
    await update.message.reply_text(f"<b>AI</b>\n\n{answer}", parse_mode="HTML", reply_markup=back_button())


async def cmd_analyze(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.effective_user:
        return
    symbol = " ".join(context.args).strip().lstrip("$") if context.args else ""
    user_id = update.effective_user.id
    user = await get_user(user_id) or {}
    user["user_id"] = user_id

    if not symbol:
        await update.message.reply_text(
            "<b>Analyze a Coin</b>\n\nUsage: /analyze SYMBOL\nExample: /analyze BONK",
            parse_mode="HTML",
            reply_markup=back_button(),
        )
        return

    await update.message.reply_chat_action("typing")
    ranked = rank_coins(await scan_meme_coins())
    cache_scan_results(ranked[:12])
    coin = None
    sym = symbol.upper()
    for c in ranked:
        if c.symbol.upper() == sym or sym in c.name.upper():
            coin = c
            break
    if not coin:
        answer = await ask_ai(f"Should I buy ${symbol}?", user)
    else:
        answer = await analyze_coin(coin.mint, user)
        kb = coin_detail_menu(coin.mint, bool(user.get("encrypted_key")))
        await update.message.reply_text(
            f"<b>Analysis: ${coin.symbol}</b>\n\n{answer}",
            parse_mode="HTML",
            disable_web_page_preview=True,
            reply_markup=kb,
        )
        return
    await update.message.reply_text(f"<b>AI</b>\n\n{answer}", parse_mode="HTML", reply_markup=back_button())


async def _format_dashboard(user_id: int) -> str:
    user = await get_user(user_id) or {}
    user["user_id"] = user_id
    stats = await get_stats(user_id)
    best = await get_best_worst_trade(user_id)
    positions = await get_open_positions(user_id)
    unrealized = await get_unrealized_pnl(user_id, positions, user) if positions else None
    position_details = unrealized["positions"] if unrealized else []

    bal = 0.0
    if user.get("wallet_pubkey"):
        bal = await get_balance_sol(user["wallet_pubkey"])

    return format_dashboard(
        user, stats, best, bal, unrealized, positions, position_details,
        get_autotrade_status(user_id),
    )


async def cmd_scan(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message:
        return
    await update.message.reply_chat_action("typing")
    msg = await update.message.reply_text("Scanning market...")
    text, top5 = await _format_scan_results(update.effective_user.id if update.effective_user else None)
    kb = scan_results_menu(top5) if top5 else back_button()
    await msg.edit_text(text, parse_mode="HTML", disable_web_page_preview=True, reply_markup=kb)


async def _format_scan_results(user_id: int | None = None) -> tuple[str, list]:
    coins = await scan_meme_coins()
    ranked = rank_coins(coins)[:12]
    cache_scan_results(ranked)

    if not ranked:
        return "No quality coins found. Try again in a minute.", []

    user = await get_user(user_id) if user_id else None
    min_score = float(user.get("min_ai_score", 75)) if user else 75
    buys = [c for c in ranked if getattr(c, "ai_verdict", "") in ("STRONG BUY", "BUY") and c.ai_score >= min_score]

    text = format_scan_results(ranked, min_score, buys)
    return text, (buys[:5] if buys else ranked[:5])


async def _resolve_coin(mint: str):
    coin = get_cached_coin(mint)
    if coin:
        return coin
    coin = await get_token_price_cached(mint)
    if coin:
        rank_coins([coin])
    return coin


async def cmd_wallet(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.effective_user:
        return
    PENDING_IMPORT.add(update.effective_user.id)
    await update.message.reply_text(
        "<b>Import Trading Wallet</b>\n\n"
        "Send your Solana wallet private key (base58 format).\n\n"
        "IMPORTANT:\n"
        "- Use a NEW dedicated wallet\n"
        "- Only deposit what you want to trade\n"
        "- Never use your main wallet\n\n"
        "Your key is encrypted and stored securely.\n"
        "The message with your key will be deleted automatically.",
        parse_mode="HTML",
        reply_markup=back_button(),
    )


async def cmd_balance(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.effective_user:
        return
    user = await get_user(update.effective_user.id)
    if not user or not user.get("wallet_pubkey"):
        await update.message.reply_text("No wallet connected. Use /wallet first.")
        return
    bal = await get_balance_sol(user["wallet_pubkey"])
    autotrade = "ON" if user.get("autotrade") else "OFF"
    has_key = "Auto-ready" if user.get("encrypted_key") else "View-only"
    await update.message.reply_text(
        f"<b>Wallet</b>\n\n"
        f"Address: <code>{short_address(user['wallet_pubkey'])}</code>\n\n"
        f"Balance: {bal:.4f} SOL\n"
        f"Auto trade: {autotrade}\n"
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
    user = await get_user(user_id) or {}
    positions = await get_open_positions(user_id)
    if not positions:
        return "No open positions.\n\nStart auto trade or run Best Buys to buy manually."

    unrealized = await get_unrealized_pnl(user_id, positions, user)
    lines = [
        "<b>Open Positions</b>",
        f"Total: {unrealized['unrealized_sol']:+.4f} SOL ({unrealized['unrealized_pct']:+.1f}%)",
        f"Invested: {unrealized['invested_sol']:.4f} SOL -> Est. {unrealized['current_sol']:.4f} SOL\n",
    ]
    for pos, detail in zip(positions, unrealized["positions"]):
        lines.append(format_position_line(pos, detail))
    lines.append("\nTap Details for full breakdown, or Sell to exit.")
    return "\n".join(lines)


async def _format_position_detail(user_id: int, pos_id: int) -> str | None:
    user = await get_user(user_id) or {}
    pos = await get_position_by_id(pos_id, user_id)
    if not pos:
        return None
    unrealized = await get_unrealized_pnl(user_id, [pos], user)
    detail = unrealized["positions"][0]
    return format_position_detail(pos, detail, user)


async def cmd_history(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.effective_user:
        return
    text = await _format_history(update.effective_user.id)
    await update.message.reply_text(text, parse_mode="HTML", reply_markup=back_button())


async def _format_history(user_id: int) -> str:
    trades = await get_trade_history(user_id, 15)
    return format_trade_history(trades)


async def cmd_autotrade(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.effective_user:
        return
    user = await get_user(update.effective_user.id)
    if not user or not user.get("encrypted_key"):
        await update.message.reply_text(
            "Import a wallet key first (/wallet) to enable auto trading.\n\n"
            "Phantom connect alone is view-only.",
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
    lines = ["<b>Trading Modes</b>\n\nOne tap sets trade size, stops, and AI threshold.\n"]
    for key, p in PRESETS.items():
        lines.append(f"{p['label']}\n<i>{p['desc']}</i>\n{preset_summary(key)}\n")
    await update.message.reply_text(
        "\n".join(lines),
        parse_mode="HTML",
        reply_markup=modes_menu(current),
    )


async def _format_settings(user: dict) -> str:
    notify = "ON" if user.get("notify_trades", 1) else "OFF"
    mode = PRESETS.get(user.get("risk_mode") or "balanced", PRESETS["balanced"])["label"]
    return (
        f"<b>Settings</b> — Mode: {mode}\n\n"
        f"Trade size: <b>{float(user.get('trade_sol', 0.05))} SOL</b>\n"
        f"Stop loss: {float(user.get('stop_loss_pct', 15))}%\n"
        f"Take profit: <b>{float(user.get('take_profit_pct', 50))}%</b>\n"
        f"Trailing stop: <b>{float(user.get('trailing_stop_pct', 10))}%</b>\n"
        f"Max positions: <b>1</b> (one coin at a time)\n"
        f"Min AI score: <b>{float(user.get('min_ai_score', 75))}/100</b>\n"
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
        "<b>Emergency Stop</b>\n\nAuto trading halted. Use /positions to sell open trades.",
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
    elif data == "ask_ai":
        PENDING_ASK.add(user_id)
        await query.edit_message_text(
            "<b>Ask the AI</b>\n\nType your question, or pick one below.",
            parse_mode="HTML",
            reply_markup=ask_ai_menu(),
        )
    elif data == "ask_preset_buy":
        await query.edit_message_text("Thinking...", parse_mode="HTML")
        user = await get_user(user_id) or {}
        answer = await ask_ai("What should I buy right now?", user)
        await query.edit_message_text(f"<b>AI</b>\n\n{answer}", parse_mode="HTML", reply_markup=back_button())
    elif data == "ask_preset_best":
        await query.edit_message_text("Thinking...", parse_mode="HTML")
        user = await get_user(user_id) or {}
        answer = await ask_ai("What is the best coin to buy right now?", user)
        await query.edit_message_text(f"<b>AI</b>\n\n{answer}", parse_mode="HTML", reply_markup=back_button())
    elif data == "ask_preset_auto":
        await query.edit_message_text("Thinking...", parse_mode="HTML")
        user = await get_user(user_id) or {}
        answer = await ask_ai("How does auto trade work?", user)
        await query.edit_message_text(f"<b>AI</b>\n\n{answer}", parse_mode="HTML", reply_markup=back_button())
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
        await query.edit_message_text("Scanning market...", parse_mode="HTML")
        text, top5 = await _format_scan_results(user_id)
        kb = scan_results_menu(top5) if top5 else back_button()
        await query.edit_message_text(text, parse_mode="HTML", disable_web_page_preview=True, reply_markup=kb)
    elif data.startswith("coin_"):
        mint = data.replace("coin_", "", 1)
        user = await get_user(user_id) or {}
        min_score = float(user.get("min_ai_score", 75))
        coin = await _resolve_coin(mint)
        if not coin:
            await query.edit_message_text("Coin not found.", reply_markup=back_button())
            return
        text = format_coin_detail(coin, min_score, user)
        has_key = bool(user.get("encrypted_key"))
        await query.edit_message_text(
            text, parse_mode="HTML", disable_web_page_preview=True,
            reply_markup=coin_detail_menu(mint, has_key),
        )
    elif data.startswith("pos_"):
        pos_id = int(data.replace("pos_", ""))
        text = await _format_position_detail(user_id, pos_id)
        if not text:
            await query.edit_message_text("Position not found.", reply_markup=back_button())
            return
        await query.edit_message_text(
            text, parse_mode="HTML", disable_web_page_preview=True,
            reply_markup=position_detail_menu(pos_id),
        )
    elif data.startswith("askcoin_"):
        mint = data.replace("askcoin_", "", 1)
        user = await get_user(user_id) or {}
        user["user_id"] = user_id
        await query.edit_message_text("Analyzing...", parse_mode="HTML")
        answer = await analyze_coin(mint, user)
        await query.edit_message_text(
            f"<b>AI Analysis</b>\n\n{answer}",
            parse_mode="HTML",
            reply_markup=coin_detail_menu(mint, bool(user.get("encrypted_key"))),
        )
    elif data.startswith("buymint_"):
        mint = data.replace("buymint_", "")
        user = await get_user(user_id)
        if not user or not user.get("encrypted_key"):
            await query.edit_message_text("Import wallet key first.", reply_markup=back_button())
            return
        await query.edit_message_text("Executing buy...", parse_mode="HTML")
        ok, msg = await auto_trader.buy_coin(user, mint)
        await query.edit_message_text(f"{'Done' if ok else 'Failed'}: {msg}", reply_markup=back_button())
    elif data == "wallet_import":
        PENDING_IMPORT.add(user_id)
        await query.edit_message_text("Send your base58 private key now.\n\nUse a dedicated trading wallet only.", reply_markup=back_button())
    elif data == "balance":
        user = await get_user(user_id)
        if not user or not user.get("wallet_pubkey"):
            await query.edit_message_text("No wallet connected.", reply_markup=back_button())
            return
        bal = await get_balance_sol(user["wallet_pubkey"])
        await query.edit_message_text(f"Balance: <b>{bal:.4f} SOL</b>", parse_mode="HTML", reply_markup=back_button())
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
        lines = ["<b>Trading Modes</b>\n"]
        for key, p in PRESETS.items():
            lines.append(f"{p['label']} — <i>{p['desc']}</i>\n{preset_summary(key)}\n")
        await query.edit_message_text("\n".join(lines), parse_mode="HTML", reply_markup=modes_menu(current))
    elif data.startswith("preset_"):
        mode_key = data.replace("preset_", "")
        if mode_key in PRESETS:
            await apply_preset(user_id, PRESETS[mode_key], mode_key)
            p = PRESETS[mode_key]
            await query.edit_message_text(
                f"<b>{p['label']} activated</b>\n\n{preset_summary(mode_key)}\n\n"
                f"Tap Start Auto Trade when ready.",
                parse_mode="HTML",
                reply_markup=await _get_menu_kb(user_id),
            )
    elif data == "buy_top":
        user = await get_user(user_id)
        if not user or not user.get("encrypted_key"):
            await query.edit_message_text("Import wallet key first.", reply_markup=back_button())
            return
        await query.edit_message_text("Buying top AI pick...", parse_mode="HTML")
        ok, msg = await auto_trader.buy_top_coin(user)
        await query.edit_message_text(f"{'Done' if ok else 'Failed'}: {msg}", reply_markup=back_button())
    elif data == "sell_all":
        positions = await get_open_positions(user_id)
        if not positions:
            await query.edit_message_text("No open positions to sell.", reply_markup=back_button())
            return
        await query.edit_message_text(
            f"<b>Sell all {len(positions)} positions?</b>\n\nThis will market-sell everything.",
            parse_mode="HTML",
            reply_markup=confirm_sell_all(),
        )
    elif data == "sell_all_confirm":
        user = await get_user(user_id)
        if not user or not user.get("encrypted_key"):
            await query.edit_message_text("No wallet.", reply_markup=back_button())
            return
        await query.edit_message_text("Selling all positions...", parse_mode="HTML")
        ok, total = await auto_trader.sell_all(user)
        await query.edit_message_text(
            f"<b>Done.</b> Sold {ok}/{total} positions.",
            parse_mode="HTML",
            reply_markup=back_button(),
        )
    elif data == "toggle_notify":
        user = await get_user(user_id) or {}
        new_val = 0 if user.get("notify_trades", 1) else 1
        await upsert_user(user_id, notify_trades=new_val)
        status = "ON" if new_val else "OFF"
        await query.answer(f"Notifications {status}")
        user = await get_user(user_id) or {}
        await query.edit_message_text(await _format_settings(user), parse_mode="HTML", reply_markup=settings_menu())
    elif data == "disconnect":
        await query.edit_message_text(
            "<b>Disconnect wallet?</b>\n\nThis stops auto trade and removes your wallet.",
            parse_mode="HTML",
            reply_markup=confirm_disconnect(),
        )
    elif data == "disconnect_confirm":
        await disconnect_wallet(user_id)
        await query.edit_message_text(
            "<b>Wallet disconnected.</b>\n\nAuto trade stopped.",
            parse_mode="HTML",
            reply_markup=await _get_menu_kb(user_id),
        )
    elif data == "settings":
        user = await get_user(user_id) or {}
        await query.edit_message_text(await _format_settings(user), parse_mode="HTML", reply_markup=settings_menu())
    elif data == "autotrade_on":
        user = await get_user(user_id)
        if not user or not user.get("encrypted_key"):
            await query.edit_message_text("Import wallet key first (/wallet).", reply_markup=back_button())
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
            await query.edit_message_text("Position not found.", reply_markup=back_button())
            return
        await query.edit_message_text(f"Selling ${pos['token_symbol']}...", parse_mode="HTML")
        ok, msg = await auto_trader.sell_position_manual(user, pos)
        result = f"Done: {msg}" if ok else f"Failed: {msg}"
        await query.edit_message_text(result, reply_markup=back_button())
    elif data.startswith("quick_trade_"):
        val = float(data.replace("quick_trade_", ""))
        await upsert_user(user_id, trade_sol=val)
        await query.edit_message_text(f"Trade size set to {val} SOL", parse_mode="HTML", reply_markup=settings_menu())
    elif data.startswith("quick_sl_"):
        val = float(data.replace("quick_sl_", ""))
        await upsert_user(user_id, stop_loss_pct=val)
        await query.edit_message_text(f"Stop loss set to {val}%", parse_mode="HTML", reply_markup=settings_menu())
    elif data == "set_trade":
        await query.edit_message_text("Pick trade size:", parse_mode="HTML", reply_markup=trade_size_quick())
    elif data == "set_stoploss":
        await query.edit_message_text("Pick stop loss %:", parse_mode="HTML", reply_markup=stop_loss_quick())
    elif data == "set_minscore":
        PENDING_SETTING[user_id] = "min_ai_score"
        await query.edit_message_text("Min AI score (70-95, e.g. <code>80</code>):", parse_mode="HTML", reply_markup=back_button())
    elif data == "set_takeprofit":
        PENDING_SETTING[user_id] = "take_profit_pct"
        await query.edit_message_text("Send take profit % (e.g. <code>50</code>):", parse_mode="HTML", reply_markup=back_button())
    elif data == "set_trailing":
        PENDING_SETTING[user_id] = "trailing_stop_pct"
        await query.edit_message_text("Send trailing stop % (e.g. <code>10</code>):", parse_mode="HTML", reply_markup=back_button())
    elif data == "set_maxpos":
        PENDING_SETTING[user_id] = "max_positions"
        await query.edit_message_text("Send max open positions (e.g. <code>3</code>):", parse_mode="HTML", reply_markup=back_button())


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.message.text or not update.effective_user:
        return
    user_id = update.effective_user.id
    text = update.message.text.strip()

    if user_id in PENDING_SETTING:
        field = PENDING_SETTING.pop(user_id)
        try:
            if field == "max_positions":
                val = 1
            elif field == "trade_sol":
                val = max(0.01, min(5.0, float(text)))
            elif field == "min_ai_score":
                val = max(65, min(95, float(text)))
            elif field in ("stop_loss_pct", "take_profit_pct", "trailing_stop_pct"):
                val = max(1, min(100, float(text)))
            else:
                val = float(text)
            await upsert_user(user_id, **{field: val})
            await update.message.reply_text(f"Updated to <b>{val}</b>", parse_mode="HTML", reply_markup=await _get_menu_kb(user_id))
        except ValueError:
            await update.message.reply_text("Invalid value. Try again.")
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
                f"<b>Wallet connected</b>\n\n"
                f"Address: <code>{short_address(pubkey)}</code>\n"
                f"Balance: <b>{bal:.4f} SOL</b>\n"
                f"Mode: Balanced\n\n"
                f"Tap <b>Start Auto Trade</b> when ready, or run Best Buys to see what to buy.",
                parse_mode="HTML",
                reply_markup=await _get_menu_kb(user_id),
            )
        except Exception as exc:
            await update.message.reply_text(f"Invalid key: {exc}")
        return

    if user_id in PENDING_ASK or _looks_like_question(text):
        PENDING_ASK.discard(user_id)
        user = await get_user(user_id) or {}
        user["user_id"] = user_id
        await update.message.reply_chat_action("typing")
        answer = await ask_ai(text, user)
        await update.message.reply_text(
            f"<b>AI</b>\n\n{answer}",
            parse_mode="HTML",
            reply_markup=back_button(),
        )
        return

    if 32 <= len(text) <= 50 and validate_pubkey(text):
        await set_wallet(user_id, text, None)
        bal = await get_balance_sol(text)
        await update.message.reply_text(
            f"Wallet linked (view-only): {bal:.4f} SOL\n\nImport key via /wallet for auto trading.",
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
                f"<b>Phantom Connected</b>\n\n"
                f"<code>{pubkey[:12]}...{pubkey[-8:]}</code>\n"
                f"Balance: <b>{bal:.4f} SOL</b>\n\n"
                f"Import key via /wallet for auto trading.",
                parse_mode="HTML",
                reply_markup=await _get_menu_kb(user_id),
            )
    except Exception as exc:
        await update.message.reply_text(f"Phantom connect failed: {exc}")


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
        ("ask", cmd_ask), ("analyze", cmd_analyze),
    ]:
        app.add_handler(CommandHandler(cmd, handler))

    app.add_handler(CallbackQueryHandler(handle_callback))
    app.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_webapp_data))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    return app
