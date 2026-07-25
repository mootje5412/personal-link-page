"""Smart entry validation."""

from services.scanner import MemeCoin


def validate_entry(coin: MemeCoin, min_score: float) -> tuple[bool, str]:
    if coin.is_scam:
        return False, "scam flagged"
    if coin.ai_score < min_score:
        return False, f"score {coin.ai_score} below minimum {min_score}"
    if coin.liquidity_usd < 20_000:
        return False, "liquidity too low"
    if coin.volume_1h < 2_000:
        return False, "low 1h volume"
    if coin.price_change_m5 > 18:
        return False, f"chasing +{coin.price_change_m5:.0f}% 5m pump"
    if coin.price_change_h1 > 45:
        return False, f"overextended +{coin.price_change_h1:.0f}% 1h"
    if coin.price_change_h1 < -15:
        return False, f"dumping {coin.price_change_h1:.0f}% on 1h"
    if coin.price_change_m5 < -10:
        return False, f"crashing {coin.price_change_m5:.0f}% on 5m"
    total = coin.buys_1h + coin.sells_1h
    if total >= 5 and coin.buys_1h / total < 0.48:
        return False, "sell pressure"
    if coin.fdv > 0 and coin.liquidity_usd / coin.fdv < 0.015:
        return False, "rug risk"
    return True, "ok"


def validate_entry_auto(coin: MemeCoin, min_score: float) -> tuple[bool, str]:
    """Stricter rules for automatic buys — best coin only."""
    ok, reason = validate_entry(coin, min_score)
    if not ok:
        return False, reason

    verdict = getattr(coin, "ai_verdict", "WATCH")
    if verdict not in ("STRONG BUY", "BUY"):
        return False, f"verdict {verdict} — auto only buys BUY or STRONG BUY"

    if coin.ai_score < max(min_score, 80):
        return False, f"score {coin.ai_score} below auto minimum 80"

    if coin.price_change_m5 > 12:
        return False, f"too hot on 5m (+{coin.price_change_m5:.0f}%)"

    if coin.price_change_h1 > 35:
        return False, f"already extended on 1h (+{coin.price_change_h1:.0f}%)"

    total = coin.buys_1h + coin.sells_1h
    if total >= 8 and coin.buys_1h / total < 0.52:
        return False, "weak buy flow for auto entry"

    return True, "ok"


def entry_quality_label(coin: MemeCoin) -> str:
    if coin.price_change_m5 > 15:
        return "Late entry — already moving fast"
    if 3 <= coin.price_change_h1 <= 25:
        return "Good entry zone"
    if coin.price_change_h1 > 50:
        return "Already extended"
    return "Monitoring"
