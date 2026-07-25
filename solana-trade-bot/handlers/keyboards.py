from telegram import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo

from config import WEBAPP_URL


def main_menu(has_wallet: bool, autotrade: bool) -> InlineKeyboardMarkup:
    rows = []
    if WEBAPP_URL:
        rows.append([InlineKeyboardButton("👻 Connect Phantom", web_app=WebAppInfo(url=WEBAPP_URL))])
    rows.append([InlineKeyboardButton("🔑 Import Wallet Key", callback_data="wallet_import")])
    if has_wallet:
        rows.append([
            InlineKeyboardButton("💰 Balance", callback_data="balance"),
            InlineKeyboardButton("📊 Positions", callback_data="positions"),
        ])
        rows.append([
            InlineKeyboardButton("🔍 Scan Memes", callback_data="scan"),
            InlineKeyboardButton("⚙️ Settings", callback_data="settings"),
        ])
        if autotrade:
            rows.append([InlineKeyboardButton("⏹ Stop Auto Trade", callback_data="autotrade_off")])
        else:
            rows.append([InlineKeyboardButton("🚀 Start Auto Trade", callback_data="autotrade_on")])
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
            InlineKeyboardButton("📦 Max Positions", callback_data="set_maxpos"),
        ],
        [InlineKeyboardButton("« Back", callback_data="menu")],
    ])


def back_button() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([[InlineKeyboardButton("« Back to Menu", callback_data="menu")]])
