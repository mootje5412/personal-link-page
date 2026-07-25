from telegram import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo

from config import WEBAPP_URL


def main_menu(has_wallet: bool, autotrade: bool) -> InlineKeyboardMarkup:
    rows = []
    if WEBAPP_URL:
        rows.append([InlineKeyboardButton("👻 Connect Phantom", web_app=WebAppInfo(url=WEBAPP_URL))])
    rows.append([InlineKeyboardButton("🔑 Import Wallet Key", callback_data="wallet_import")])
    if has_wallet:
        rows.append([
            InlineKeyboardButton("📊 Dashboard", callback_data="dashboard"),
            InlineKeyboardButton("🔍 Scan Memes", callback_data="scan"),
        ])
        rows.append([
            InlineKeyboardButton("💰 Balance", callback_data="balance"),
            InlineKeyboardButton("📈 Positions", callback_data="positions"),
        ])
        rows.append([
            InlineKeyboardButton("📜 History", callback_data="history"),
            InlineKeyboardButton("⚙️ Settings", callback_data="settings"),
        ])
        if autotrade:
            rows.append([InlineKeyboardButton("⏹ STOP Auto Trade", callback_data="autotrade_off")])
        else:
            rows.append([InlineKeyboardButton("🚀 START Auto Trade", callback_data="autotrade_on")])
    rows.append([InlineKeyboardButton("❓ Help", callback_data="help")])
    return InlineKeyboardMarkup(rows)


def settings_menu() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("💵 Trade Size", callback_data="set_trade"),
            InlineKeyboardButton("🛑 Stop Loss", callback_data="set_stoploss"),
        ],
        [
            InlineKeyboardButton("🎯 Take Profit", callback_data="set_takeprofit"),
            InlineKeyboardButton("📐 Trailing Stop", callback_data="set_trailing"),
        ],
        [InlineKeyboardButton("📦 Max Positions", callback_data="set_maxpos")],
        [InlineKeyboardButton("« Back", callback_data="menu")],
    ])


def positions_menu(positions: list[dict]) -> InlineKeyboardMarkup:
    rows = []
    for p in positions[:5]:
        rows.append([InlineKeyboardButton(
            f"🔴 Sell ${p['token_symbol']}",
            callback_data=f"sell_{p['id']}",
        )])
    rows.append([InlineKeyboardButton("« Back", callback_data="menu")])
    return InlineKeyboardMarkup(rows)


def back_button() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([[InlineKeyboardButton("« Back to Menu", callback_data="menu")]])
