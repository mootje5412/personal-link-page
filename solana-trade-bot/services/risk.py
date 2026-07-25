"""Balance-aware position sizing — never deploy too much capital."""

from config import MAX_DEPLOYED_PCT_BALANCE, MAX_TRADE_PCT_BALANCE, MIN_RESERVE_SOL, MIN_TRADE_SOL


def compute_trade_sol(
    balance: float,
    user_trade_sol: float,
    invested_sol: float = 0.0,
) -> tuple[float | None, str]:
    """
    Return safe trade size in SOL, or None with reason if trading should not happen.
    Caps each trade and total deployed amount as a % of wallet balance.
    """
    if balance <= MIN_RESERVE_SOL:
        return None, f"need {MIN_RESERVE_SOL:.3f} SOL reserve (balance {balance:.4f})"

    available = balance - MIN_RESERVE_SOL
    max_per_trade = balance * MAX_TRADE_PCT_BALANCE
    max_deployed_left = (balance * MAX_DEPLOYED_PCT_BALANCE) - invested_sol

    if max_deployed_left <= MIN_TRADE_SOL:
        return None, "max capital already deployed — waiting for exit"

    size = min(user_trade_sol, max_per_trade, max_deployed_left, available)
    if size < MIN_TRADE_SOL:
        return None, f"trade size too small after safety caps ({size:.4f} SOL)"

    return round(size, 4), "ok"


def format_risk_summary(balance: float, user_trade_sol: float, invested_sol: float = 0.0) -> str:
    size, reason = compute_trade_sol(balance, user_trade_sol, invested_sol)
    if size is None:
        return f"Next trade: blocked ({reason})"
    pct = (size / balance * 100) if balance > 0 else 0
    return f"Next trade: up to {size:.4f} SOL ({pct:.0f}% of balance)"
