from services.scanner import MemeCoin


def get_verdict(score: float, coin: MemeCoin) -> str:
    if coin.is_scam or score < 50:
        return "AVOID"
    if score >= 82:
        return "STRONG BUY"
    if score >= 75:
        return "BUY"
    if score >= 65:
        return "WATCH"
    return "AVOID"


def score_meme_coin(coin: MemeCoin) -> tuple[float, list[str], str]:
    """Weighted AI analysis. Returns score, reasons, and verdict."""
    if coin.is_scam:
        return 0.0, ["Flagged as scam or honeypot"], "AVOID"

    reasons: list[str] = []
    weights: list[tuple[float, float, str | None]] = []

    if coin.liquidity_usd >= 300_000:
        weights.append((95, 20, "Deep liquidity"))
    elif coin.liquidity_usd >= 100_000:
        weights.append((85, 20, "Strong liquidity"))
    elif coin.liquidity_usd >= 40_000:
        weights.append((72, 20, "Good liquidity"))
    elif coin.liquidity_usd >= 20_000:
        weights.append((58, 20, None))
    elif coin.liquidity_usd >= 15_000:
        weights.append((45, 20, None))
    else:
        weights.append((15, 20, "Thin liquidity"))

    vr = coin.volume_24h / max(coin.liquidity_usd, 1)
    if vr >= 2.5:
        weights.append((92, 18, "Volume surge vs liquidity"))
    elif vr >= 1.2:
        weights.append((80, 18, "High volume relative to liquidity"))
    elif vr >= 0.6:
        weights.append((65, 18, None))
    elif vr >= 0.3:
        weights.append((50, 18, None))
    else:
        weights.append((30, 18, "Low volume activity"))

    t24 = coin.buys_24h + coin.sells_24h
    if t24 >= 30:
        br = coin.buys_24h / t24
        if br >= 0.60:
            weights.append((88, 18, "Strong buy pressure"))
        elif br >= 0.54:
            weights.append((72, 18, "Bullish order flow"))
        elif br >= 0.48:
            weights.append((55, 18, None))
        else:
            weights.append((25, 18, "Sellers dominating"))
    else:
        weights.append((40, 18, None))

    h1 = coin.price_change_h1
    if 5 <= h1 <= 30:
        weights.append((90, 15, "Healthy 1h momentum"))
    elif 2 <= h1 < 5:
        weights.append((70, 15, "Building momentum"))
    elif 30 < h1 <= 50:
        weights.append((55, 15, "Getting overextended"))
    elif h1 > 50:
        weights.append((30, 15, "Already pumped hard"))
    elif -8 <= h1 < 2:
        weights.append((50, 15, None))
    else:
        weights.append((20, 15, "Dumping on 1h chart"))

    m5 = coin.price_change_m5
    if 1 <= m5 <= 12:
        weights.append((85, 10, "Good short-term entry timing"))
    elif m5 > 20:
        weights.append((25, 10, "Chasing a 5m pump"))
    elif m5 < -8:
        weights.append((15, 10, "Crashing on 5m chart"))
    else:
        weights.append((55, 10, None))

    if coin.fdv > 0:
        ratio = coin.liquidity_usd / coin.fdv
        if ratio >= 0.10:
            weights.append((90, 12, "Safe liquidity to FDV ratio"))
        elif ratio >= 0.05:
            weights.append((65, 12, None))
        elif ratio >= 0.02:
            weights.append((40, 12, None))
        else:
            weights.append((5, 12, "Rug pull risk"))
    else:
        weights.append((50, 12, None))

    mc = coin.market_cap
    if 25_000 <= mc <= 2_000_000:
        weights.append((85, 7, "Ideal meme coin market cap range"))
    elif 2_000_000 < mc <= 10_000_000:
        weights.append((60, 7, None))
    elif mc > 30_000_000:
        weights.append((35, 7, "Too large for meme upside"))
    else:
        weights.append((45, 7, None))

    total_w = sum(w for _, w, _ in weights)
    score = sum(s * w for s, w, _ in weights) / total_w if total_w else 0

    if coin.price_change_h24 >= 200:
        score -= 12
        reasons.append("Already up 2x+ today — late entry")
    if coin.buys_1h + coin.sells_1h >= 80:
        score += 3
        reasons.append("Very active trading")
    if coin.dex in ("pumpfun", "pumpswap") and coin.liquidity_usd >= 30_000:
        score += 4
        reasons.append("Pump.fun with solid liquidity")

    for _, _, sig in weights:
        if sig and sig not in reasons:
            reasons.append(sig)

    score = max(0.0, min(100.0, round(score, 1)))
    verdict = get_verdict(score, coin)
    return score, reasons[:5], verdict


def rank_coins(coins: list[MemeCoin]) -> list[MemeCoin]:
    for coin in coins:
        coin.ai_score, coin.ai_signals, verdict = score_meme_coin(coin)
        coin.ai_verdict = verdict  # type: ignore[attr-defined]
    return sorted(coins, key=lambda c: c.ai_score, reverse=True)


def format_verdict_label(score: float, verdict: str | None = None) -> str:
    if verdict:
        return verdict
    if score >= 82:
        return "STRONG BUY"
    if score >= 75:
        return "BUY"
    if score >= 65:
        return "WATCH"
    return "AVOID"
