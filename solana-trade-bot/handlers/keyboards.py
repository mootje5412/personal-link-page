from telegram import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo

from config import WEBAPP_URL


def main_menu(has_wallet: bool, autotrade: bool, has_key: bool = False) -> InlineKeyboardMarkup:
    rows = []

    if not has_wallet:
        rows.append([InlineKeyboardButton("🚀 Quick Setup Guide", callback_data="setup_guide")])
        if WEBAPP_URL:
            rows.append([InlineKeyboardButton("👻 Connect Phantom", web_app=WebAppInfo(url=WEBAPP_URL))])
        rows.append([InlineKeyboardButton("🔑 Import Wallet Key", callback_data="wallet_import")])
    else:
        if autotrade:
            rows.append([InlineKeyboardButton("⏹ STOP Auto Trade", callback_data="autotrade_off")])
        else:
            rows.append([InlineKeyboardButton("🚀 START Auto Trade", callback_data="autotrade_on")])

        rows.append([
            InlineKeyboardButton("📊 Dashboard", callback_data="dashboard"),
            InlineKeyboardButton("🔍 Scan Memes", callback_data="scan"),
        ])
        rows.append([
            InlineKeyboardButton("📈 Positions", callback_data="positions"),
            InlineKeyboardButton("💰 Balance", callback_data="balance"),
        ])
        rows.append([
            InlineKeyboardButton("🎛 Trading Modes", callback_data="modes"),
            InlineKeyboardButton("⚙️ Settings", callback_data="settings"),
        ])
        rows.append([
            InlineKeyboardButton("📜 History", callback_data="history"),
            InlineKeyboardButton("💡 Can I Profit?", callback_data="profit_info"),
        ])

        if has_key:
            rows.append([InlineKeyboardButton("🟢 Buy Top Coin Now", callback_data="buy_top")])

        rows.append([
            InlineKeyboardButton("💡 Tips", callback_data="tips"),
            InlineKeyboardButton("❓ Help", callback_data="help"),
        ])

    return InlineKeyboardMarkup(rows)


def confirm_sell_all() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("✅ Yes, Sell All", callback_data="sell_all_confirm"),
            InlineKeyboardButton("❌ Cancel", callback_data="positions"),
        ],
    ])


def confirm_disconnect() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("✅ Yes, Disconnect", callback_data="disconnect_confirm"),
            InlineKeyboardButton("❌ Cancel", callback_data="settings"),
        ],
    ])


def dashboard_menu() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("🔄 Refresh", callback_data="dashboard"),
            InlineKeyboardButton("📈 Positions", callback_data="positions"),
        ],
        [InlineKeyboardButton("« Menu", callback_data="menu")],
    ])


def setup_guide_menu() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("1️⃣ Import Wallet", callback_data="wallet_import")],
        [InlineKeyboardButton("2️⃣ Pick Trading Mode", callback_data="modes")],
        [InlineKeyboardButton("3️⃣ Start Auto Trade", callback_data="autotrade_on")],
        [InlineKeyboardButton("« Back", callback_data="menu")],
    ])


def modes_menu(current: str = "balanced") -> InlineKeyboardMarkup:
    labels = {"safe": "🛡 Safe", "balanced": "⚖️ Balanced", "degen": "🔥 Degen"}
    rows = []
    for key, label in labels.items():
        check = " ✅" if key == current else ""
        rows.append([InlineKeyboardButton(f"{label}{check}", callback_data=f"preset_{key}")])
    rows.append([InlineKeyboardButton("« Back", callback_data="menu")])
    return InlineKeyboardMarkup(rows)


def settings_menu() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("🎛 Trading Modes (Easy)", callback_data="modes")],
        [
            InlineKeyboardButton("💵 Trade Size", callback_data="set_trade"),
            InlineKeyboardButton("🛑 Stop Loss", callback_data="set_stoploss"),
        ],
        [
            InlineKeyboardButton("🎯 Take Profit", callback_data="set_takeprofit"),
            InlineKeyboardButton("📐 Trailing Stop", callback_data="set_trailing"),
        ],
        [
            InlineKeyboardButton("📦 Max Positions", callback_data="set_maxpos"),
            InlineKeyboardButton("🤖 Min AI Score", callback_data="set_minscore"),
        ],
        [
            InlineKeyboardButton("🔔 Notifications", callback_data="toggle_notify"),
            InlineKeyboardButton("🔓 Disconnect Wallet", callback_data="disconnect"),
        ],
        [InlineKeyboardButton("« Back", callback_data="menu")],
    ])


def trade_size_quick() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("0.01 SOL", callback_data="quick_trade_0.01"),
            InlineKeyboardButton("0.05 SOL", callback_data="quick_trade_0.05"),
        ],
        [
            InlineKeyboardButton("0.1 SOL", callback_data="quick_trade_0.1"),
            InlineKeyboardButton("0.25 SOL", callback_data="quick_trade_0.25"),
        ],
        [InlineKeyboardButton("« Back to Settings", callback_data="settings")],
    ])


def stop_loss_quick() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("10%", callback_data="quick_sl_10"),
            InlineKeyboardButton("15%", callback_data="quick_sl_15"),
            InlineKeyboardButton("20%", callback_data="quick_sl_20"),
            InlineKeyboardButton("25%", callback_data="quick_sl_25"),
        ],
        [InlineKeyboardButton("« Back to Settings", callback_data="settings")],
    ])


def positions_menu(positions: list[dict]) -> InlineKeyboardMarkup:
    rows = []
    for p in positions[:5]:
        rows.append([InlineKeyboardButton(
            f"🔴 Sell ${p['token_symbol']}",
            callback_data=f"sell_{p['id']}",
        )])
    if positions:
        rows.append([InlineKeyboardButton("🔴 SELL ALL", callback_data="sell_all")])
    rows.append([InlineKeyboardButton("🔄 Refresh", callback_data="positions")])
    rows.append([InlineKeyboardButton("« Back", callback_data="menu")])
    return InlineKeyboardMarkup(rows)


def scan_results_menu(coins: list) -> InlineKeyboardMarkup:
    rows = []
    for c in coins[:5]:
        rows.append([InlineKeyboardButton(
            f"🟢 Buy ${c.symbol} ({c.ai_score:.0f})",
            callback_data=f"buymint_{c.mint}",
        )])
    rows.append([InlineKeyboardButton("🔄 Refresh Scan", callback_data="scan")])
    rows.append([InlineKeyboardButton("« Menu", callback_data="menu")])
    return InlineKeyboardMarkup(rows)


def back_button() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([[InlineKeyboardButton("« Back to Menu", callback_data="menu")]])
