"""Portfolio calculations for live PnL."""

from handlers.formatters import format_buy_ratio, format_pct, format_usd, hold_duration
from services.scanner import get_token_price_cached


async def get_unrealized_pnl(
    user_id: int,
    positions: list[dict],
    user: dict | None = None,
) -> dict:
    total_invested = 0.0
    total_current = 0.0
    details = []

    stop_loss = float(user.get("stop_loss_pct", 15)) if user else 15
    take_profit = float(user.get("take_profit_pct", 50)) if user else 50
    trailing = float(user.get("trailing_stop_pct", 10)) if user else 10

    for p in positions:
        entry = float(p["entry_price"])
        sol_in = float(p["entry_amount_sol"])
        peak = float(p.get("peak_price") or entry)
        coin = await get_token_price_cached(p["token_mint"])
        current = coin.price_usd if coin else entry
        pnl_pct = ((current - entry) / entry * 100) if entry > 0 else 0
        est_sol = sol_in * (1 + pnl_pct / 100)
        unrealized_sol = est_sol - sol_in
        from_peak = ((current - peak) / peak * 100) if peak > 0 else 0
        to_stop = (-stop_loss) - pnl_pct
        to_target = take_profit - pnl_pct
        trail_buffer = (-trailing) - from_peak if pnl_pct > 8 else 999.0

        live_note = ""
        if coin:
            live_note = (
                f"5m {format_pct(coin.price_change_m5)} | 1h {format_pct(coin.price_change_h1)} | "
                f"Liq {format_usd(coin.liquidity_usd)} | "
                f"Flow {format_buy_ratio(coin.buys_1h, coin.sells_1h)}"
            )

        total_invested += sol_in
        total_current += est_sol
        details.append({
            "symbol": p["token_symbol"],
            "pnl_pct": round(pnl_pct, 1),
            "sol_in": sol_in,
            "est_sol": round(est_sol, 4),
            "unrealized_sol": round(unrealized_sol, 4),
            "entry_price": entry,
            "current_price": current,
            "peak_price": peak,
            "hold_time": hold_duration(p.get("opened_at")),
            "to_stop": round(to_stop, 1),
            "to_target": round(to_target, 1),
            "from_peak": round(from_peak, 1),
            "trail_buffer": round(trail_buffer, 1),
            "live_note": live_note,
            "chart_url": coin.url if coin else "",
        })

    total_pnl_pct = ((total_current - total_invested) / total_invested * 100) if total_invested > 0 else 0
    return {
        "invested_sol": round(total_invested, 4),
        "current_sol": round(total_current, 4),
        "unrealized_sol": round(total_current - total_invested, 4),
        "unrealized_pct": round(total_pnl_pct, 1),
        "positions": details,
    }
