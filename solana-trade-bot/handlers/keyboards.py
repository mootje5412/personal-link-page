from telegram import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo

from config import WEBAPP_URL


def main_menu(has_wallet: bool, autotrade: bool, has_key: bool = False) -> InlineKeyboardMarkup:
    rows = []

    if not has_wallet:
        rows.append([InlineKeyboardButton("Setup Guide", callback_data="setup_guide")])
        rows.append([
            InlineKeyboardButton("Best Buys", callback_data="scan"),
            InlineKeyboardButton("Ask AI", callback_data="ask_ai"),
        ])
        if WEBAPP_URL:
            rows.append([InlineKeyboardButton("Connect Phantom", web_app=WebAppInfo(url=WEBAPP_URL))])
        rows.append([InlineKeyboardButton("Import Wallet", callback_data="wallet_import")])
    else:
        label = "Stop Auto Trade" if autotrade else "Start Auto Trade"
        cb = "autotrade_off" if autotrade else "autotrade_on"
        rows.append([InlineKeyboardButton(label, callback_data=cb)])

        rows.append([
            InlineKeyboardButton("Best Buys", callback_data="scan"),
            InlineKeyboardButton("Ask AI", callback_data="ask_ai"),
        ])
        rows.append([
            InlineKeyboardButton("Dashboard", callback_data="dashboard"),
            InlineKeyboardButton("Positions", callback_data="positions"),
        ])
        rows.append([
            InlineKeyboardButton("Modes", callback_data="modes"),
            InlineKeyboardButton("Settings", callback_data="settings"),
        ])
        if has_key:
            rows.append([InlineKeyboardButton("Buy Top Pick", callback_data="buy_top")])

    rows.append([InlineKeyboardButton("Help", callback_data="help")])
    return InlineKeyboardMarkup(rows)


def confirm_sell_all() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("Yes, Sell All", callback_data="sell_all_confirm"),
            InlineKeyboardButton("Cancel", callback_data="positions"),
        ],
    ])


def confirm_disconnect() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("Yes, Disconnect", callback_data="disconnect_confirm"),
            InlineKeyboardButton("Cancel", callback_data="settings"),
        ],
    ])


def dashboard_menu() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("Refresh", callback_data="dashboard"),
            InlineKeyboardButton("Best Buys", callback_data="scan"),
        ],
        [
            InlineKeyboardButton("Positions", callback_data="positions"),
            InlineKeyboardButton("History", callback_data="history"),
        ],
        [InlineKeyboardButton("Back", callback_data="menu")],
    ])


def setup_guide_menu() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("Import Wallet", callback_data="wallet_import")],
        [InlineKeyboardButton("Pick Mode", callback_data="modes")],
        [InlineKeyboardButton("Start Auto Trade", callback_data="autotrade_on")],
        [InlineKeyboardButton("Back", callback_data="menu")],
    ])


def modes_menu(current: str = "balanced") -> InlineKeyboardMarkup:
    labels = {"safe": "Safe", "balanced": "Balanced", "degen": "Degen"}
    rows = []
    for key, label in labels.items():
        check = " [active]" if key == current else ""
        rows.append([InlineKeyboardButton(f"{label}{check}", callback_data=f"preset_{key}")])
    rows.append([InlineKeyboardButton("Back", callback_data="menu")])
    return InlineKeyboardMarkup(rows)


def settings_menu() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("Trading Modes", callback_data="modes")],
        [
            InlineKeyboardButton("Trade Size", callback_data="set_trade"),
            InlineKeyboardButton("Stop Loss", callback_data="set_stoploss"),
        ],
        [
            InlineKeyboardButton("Take Profit", callback_data="set_takeprofit"),
            InlineKeyboardButton("Trailing Stop", callback_data="set_trailing"),
        ],
        [
            InlineKeyboardButton("Max Positions", callback_data="set_maxpos"),
            InlineKeyboardButton("Min AI Score", callback_data="set_minscore"),
        ],
        [
            InlineKeyboardButton("Notifications", callback_data="toggle_notify"),
            InlineKeyboardButton("Disconnect", callback_data="disconnect"),
        ],
        [InlineKeyboardButton("Back", callback_data="menu")],
    ])


def trade_size_quick() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("0.01 SOL", callback_data="quick_trade_0.01"),
            InlineKeyboardButton("0.02 SOL", callback_data="quick_trade_0.02"),
        ],
        [
            InlineKeyboardButton("0.03 SOL", callback_data="quick_trade_0.03"),
            InlineKeyboardButton("0.05 SOL", callback_data="quick_trade_0.05"),
        ],
        [InlineKeyboardButton("Back", callback_data="settings")],
    ])


def stop_loss_quick() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("10%", callback_data="quick_sl_10"),
            InlineKeyboardButton("15%", callback_data="quick_sl_15"),
            InlineKeyboardButton("20%", callback_data="quick_sl_20"),
            InlineKeyboardButton("25%", callback_data="quick_sl_25"),
        ],
        [InlineKeyboardButton("Back", callback_data="settings")],
    ])


def scan_results_menu(coins: list) -> InlineKeyboardMarkup:
    rows = []
    for c in coins[:5]:
        verdict = getattr(c, "ai_verdict", "BUY")
        rows.append([
            InlineKeyboardButton(
                f"Buy ${c.symbol} ({verdict})",
                callback_data=f"buymint_{c.mint}",
            ),
            InlineKeyboardButton(
                f"Details ${c.symbol}",
                callback_data=f"coin_{c.mint}",
            ),
        ])
    rows.append([
        InlineKeyboardButton("Ask AI", callback_data="ask_ai"),
        InlineKeyboardButton("Refresh Scan", callback_data="scan"),
    ])
    rows.append([InlineKeyboardButton("Back", callback_data="menu")])
    return InlineKeyboardMarkup(rows)


def coin_detail_menu(mint: str, has_key: bool = False) -> InlineKeyboardMarkup:
    rows = []
    if has_key:
        rows.append([InlineKeyboardButton("Buy This Coin", callback_data=f"buymint_{mint}")])
    rows.append([
        InlineKeyboardButton("Ask AI About This", callback_data=f"askcoin_{mint}"),
        InlineKeyboardButton("Back to Scan", callback_data="scan"),
    ])
    rows.append([InlineKeyboardButton("Menu", callback_data="menu")])
    return InlineKeyboardMarkup(rows)


def positions_menu(positions: list[dict]) -> InlineKeyboardMarkup:
    rows = []
    for p in positions[:5]:
        rows.append([
            InlineKeyboardButton(
                f"Details ${p['token_symbol']}",
                callback_data=f"pos_{p['id']}",
            ),
            InlineKeyboardButton(
                f"Sell ${p['token_symbol']}",
                callback_data=f"sell_{p['id']}",
            ),
        ])
    if positions:
        rows.append([InlineKeyboardButton("Sell All", callback_data="sell_all")])
    rows.append([InlineKeyboardButton("Refresh", callback_data="positions")])
    rows.append([InlineKeyboardButton("Back", callback_data="menu")])
    return InlineKeyboardMarkup(rows)


def position_detail_menu(pos_id: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("Sell Now", callback_data=f"sell_{pos_id}")],
        [
            InlineKeyboardButton("All Positions", callback_data="positions"),
            InlineKeyboardButton("Dashboard", callback_data="dashboard"),
        ],
        [InlineKeyboardButton("Menu", callback_data="menu")],
    ])


def ask_ai_menu() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("What should I buy?", callback_data="ask_preset_buy")],
        [InlineKeyboardButton("Best coin right now?", callback_data="ask_preset_best")],
        [InlineKeyboardButton("How does auto trade work?", callback_data="ask_preset_auto")],
        [InlineKeyboardButton("Back", callback_data="menu")],
    ])


def back_button() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([[InlineKeyboardButton("Back", callback_data="menu")]])
