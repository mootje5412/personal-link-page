from services.scanner import MemeCoin


def score_meme_coin(coin: MemeCoin) -> tuple[float, list[str]]:
    """Weighted AI score — properly calibrated, 90+ is rare elite."""
    if coin.is_scam:
        return 0.0, ["🚨 Scam / honeypot"]

    signals: list[str] = []
    weights: list[tuple[float, float, str | None]] = []  # score, weight, signal

    # Liquidity safety (weight 20)
    if coin.liquidity_usd >= 300_000:
        weights.append((95, 20, "💎 Deep liquidity"))
    elif coin.liquidity_usd >= 100_000:
        weights.append((85, 20, "✅ Strong liquidity"))
    elif coin.liquidity_usd >= 40_000:
        weights.append((72, 20, "🟢 Good liquidity"))
    elif coin.liquidity_usd >= 20_000:
        weights.append((58, 20, None))
    elif coin.liquidity_usd >= 15_000:
        weights.append((45, 20, None))
    else:
        weights.append((15, 20, "⚠️ Thin liquidity"))

    # Volume momentum (weight 18)
    vr = coin.volume_24h / max(coin.liquidity_usd, 1)
    if vr >= 2.5:
        weights.append((92, 18, "🔥 Volume explosion"))
    elif vr >= 1.2:
        weights.append((80, 18, "📈 High vol/liq"))
    elif vr >= 0.6:
        weights.append((65, 18, None))
    elif vr >= 0.3:
        weights.append((50, 18, None))
    else:
        weights.append((30, 18, None))

    # Buy pressure (weight 18)
    t24 = coin.buys_24h + coin.sells_24h
    if t24 >= 30:
        br = coin.buys_24h / t24
        if br >= 0.60:
            weights.append((88, 18, "🟢 Strong buy pressure"))
        elif br >= 0.54:
            weights.append((72, 18, "📊 Bullish flow"))
        elif br >= 0.48:
            weights.append((55, 18, None))
        else:
            weights.append((25, 18, "🔴 Sellers winning"))
    else:
        weights.append((40, 18, None))

    # 1h momentum (weight 15) — sweet spot 5-30%
    h1 = coin.price_change_h1
    if 5 <= h1 <= 30:
        weights.append((90, 15, "🚀 Ideal 1h momentum"))
    elif 2 <= h1 < 5:
        weights.append((70, 15, "📈 Building"))
    elif 30 < h1 <= 50:
        weights.append((55, 15, "⚠️ Getting hot"))
    elif h1 > 50:
        weights.append((30, 15, "⚠️ Overextended"))
    elif -8 <= h1 < 2:
        weights.append((50, 15, None))
    else:
        weights.append((20, 15, "📉 Dumping"))

    # 5m timing (weight 10)
    m5 = coin.price_change_m5
    if 1 <= m5 <= 12:
        weights.append((85, 10, "⚡ Good 5m entry"))
    elif m5 > 20:
        weights.append((25, 10, "💨 Already pumping 5m"))
    elif m5 < -8:
        weights.append((15, 10, "💀 5m crash"))
    else:
        weights.append((55, 10, None))

    # Rug safety (weight 12)
    if coin.fdv > 0:
        ratio = coin.liquidity_usd / coin.fdv
        if ratio >= 0.10:
            weights.append((90, 12, "🛡️ Safe liq/FDV"))
        elif ratio >= 0.05:
            weights.append((65, 12, None))
        elif ratio >= 0.02:
            weights.append((40, 12, None))
        else:
            weights.append((5, 12, "🚨 Rug risk"))
    else:
        weights.append((50, 12, None))

    # Market cap (weight 7)
    mc = coin.market_cap
    if 25_000 <= mc <= 2_000_000:
        weights.append((85, 7, "🎯 Meme sweet spot"))
    elif 2_000_000 < mc <= 10_000_000:
        weights.append((60, 7, None))
    elif mc > 30_000_000:
        weights.append((35, 7, "🐋 Too large"))
    else:
        weights.append((45, 7, None))

    total_w = sum(w for _, w, _ in weights)
    score = sum(s * w for s, w, _ in weights) / total_w if total_w else 0

    # Penalties
    if coin.price_change_h24 >= 200:
        score -= 12; signals.append("⚠️ Already 2x+ today")
    if coin.buys_1h + coin.sells_1h >= 80:
        score += 3; signals.append("🔥 Very active")
    if coin.dex in ("pumpfun", "pumpswap") and coin.liquidity_usd >= 30_000:
        score += 4; signals.append("🎰 Pump.fun verified")

    for _, _, sig in weights:
        if sig:
            signals.append(sig)

    score = max(0.0, min(100.0, round(score, 1)))
    return score, signals[:4]


def rank_coins(coins: list[MemeCoin]) -> list[MemeCoin]:
    for coin in coins:
        coin.ai_score, coin.ai_signals = score_meme_coin(coin)
    return sorted(coins, key=lambda c: c.ai_score, reverse=True)


def format_score_emoji(score: float) -> str:
    if score >= 88:
        return "🔥 ELITE"
    if score >= 78:
        return "✅ STRONG"
    if score >= 68:
        return "🟡 DECENT"
    if score >= 50:
        return "🟠 WEAK"
    return "🔴 SKIP"
