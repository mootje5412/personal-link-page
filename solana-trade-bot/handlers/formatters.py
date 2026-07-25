"""Clean text formatters — no emojis."""

from datetime import datetime, timezone


def greeting(name: str | None) -> str:
    hour = datetime.now(timezone.utc).hour
    if 5 <= hour < 12:
        period = "Good morning"
    elif 12 <= hour < 18:
        period = "Good afternoon"
    else:
        period = "Good evening"
    if name:
        return f"{period}, {name}."
    return f"{period}."


def short_address(pubkey: str) -> str:
    if len(pubkey) <= 16:
        return pubkey
    return f"{pubkey[:6]}...{pubkey[-4:]}"


def performance_label(win_rate: float, sol_pnl: float) -> str:
    if win_rate >= 60 and sol_pnl > 0:
        return "Strong"
    if win_rate >= 50 and sol_pnl >= 0:
        return "Profitable"
    if win_rate >= 40:
        return "Mixed"
    if sol_pnl < -0.05:
        return "Needs adjustment"
    return "Getting started"
