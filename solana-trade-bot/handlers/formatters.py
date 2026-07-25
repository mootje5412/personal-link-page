"""Beautiful message formatters for a premium Telegram experience."""

from datetime import datetime, timezone


def pnl_bar(pct: float, width: int = 10) -> str:
    """Visual PnL bar centered at 0."""
    if pct >= 0:
        filled = min(width, round(pct / 10))
        return "🟩" * filled + "⬜" * (width - filled)
    filled = min(width, round(abs(pct) / 10))
    return "⬜" * (width - filled) + "🟥" * filled


def score_bar(score: float, width: int = 10) -> str:
    filled = round(score / 100 * width)
    return "█" * filled + "░" * (width - filled)


def performance_badge(win_rate: float, sol_pnl: float) -> str:
    if win_rate >= 60 and sol_pnl > 0:
        return "🏆 On Fire"
    if win_rate >= 50 and sol_pnl >= 0:
        return "📈 Profitable"
    if win_rate >= 40:
        return "⚖️ Break Even Zone"
    if sol_pnl < -0.05:
        return "⚠️ Needs Tuning"
    return "🌱 Getting Started"


def greeting(name: str | None) -> str:
    hour = datetime.now(timezone.utc).hour
    if 5 <= hour < 12:
        period = "Good morning"
    elif 12 <= hour < 18:
        period = "Good afternoon"
    else:
        period = "Good evening"
    if name:
        return f"{period}, <b>{name}</b>!"
    return f"{period}!"


def short_address(pubkey: str) -> str:
    if len(pubkey) <= 16:
        return pubkey
    return f"{pubkey[:6]}...{pubkey[-4:]}"


def format_pnl(pct: float) -> str:
    emoji = "🟢" if pct >= 0 else "🔴"
    return f"{emoji} <b>{pct:+.1f}%</b>"


def divider() -> str:
    return "─" * 24
