"""Smart entry validation — only buy at the right moment."""

from services.scanner import MemeCoin


def validate_entry(coin: MemeCoin, min_score: float) -> tuple[bool, str]:
    if coin.is_scam:
        return False, "scam flagged"
    if coin.ai_score < min_score:
        return False, f"score {coin.ai_score} < {min_score}"
    if coin.liquidity_usd < 15_000:
        return False, "liquidity too low"
    if coin.volume_1h < 1_000:
        return False, "dead 1h volume"
    if coin.price_change_m5 > 25:
        return False, f"chasing +{coin.price_change_m5:.0f}% 5m pump"
    if coin.price_change_h1 > 70:
        return False, f"overextended +{coin.price_change_h1:.0f}% 1h"
    if coin.price_change_h1 < -20:
        return False, f"dumping {coin.price_change_h1:.0f}% 1h"
    if coin.price_change_m5 < -12:
        return False, f"crashing {coin.price_change_m5:.0f}% 5m"
    total = coin.buys_1h + coin.sells_1h
    if total >= 5 and coin.buys_1h / total < 0.40:
        return False, "heavy sell pressure"
    if coin.fdv > 0 and coin.liquidity_usd / coin.fdv < 0.01:
        return False, "rug risk liq/fdv"
    return True, "ok"


def entry_quality_label(coin: MemeCoin) -> str:
    if coin.price_change_m5 > 15:
        return "⚠️ Hot — may be late"
    if 3 <= coin.price_change_h1 <= 25:
        return "🎯 Ideal entry zone"
    if coin.price_change_h1 > 50:
        return "🔥 Already running"
    return "📊 Monitoring"
