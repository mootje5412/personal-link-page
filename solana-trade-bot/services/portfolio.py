"""Portfolio calculations for live PnL."""

from services.scanner import get_token_price_cached


async def get_unrealized_pnl(user_id: int, positions: list[dict]) -> dict:
    total_invested = 0.0
    total_current = 0.0
    details = []

    for p in positions:
        entry = float(p["entry_price"])
        sol_in = float(p["entry_amount_sol"])
        coin = await get_token_price_cached(p["token_mint"])
        current = coin.price_usd if coin else entry
        pnl_pct = ((current - entry) / entry * 100) if entry > 0 else 0
        # Estimate current SOL value
        est_sol = sol_in * (1 + pnl_pct / 100)
        total_invested += sol_in
        total_current += est_sol
        details.append({
            "symbol": p["token_symbol"],
            "pnl_pct": pnl_pct,
            "sol_in": sol_in,
            "est_sol": est_sol,
        })

    total_pnl_pct = ((total_current - total_invested) / total_invested * 100) if total_invested > 0 else 0
    return {
        "invested_sol": round(total_invested, 4),
        "current_sol": round(total_current, 4),
        "unrealized_sol": round(total_current - total_invested, 4),
        "unrealized_pct": round(total_pnl_pct, 1),
        "positions": details,
    }
