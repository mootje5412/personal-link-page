from services.scanner import MemeCoin


def score_meme_coin(coin: MemeCoin) -> tuple[float, list[str]]:
    """AI-style scoring engine for meme coin quality and momentum."""
    signals: list[str] = []
    score = 50.0

    # Liquidity safety (0-20)
    if coin.liquidity_usd >= 500_000:
        score += 20
        signals.append("💎 Deep liquidity")
    elif coin.liquidity_usd >= 100_000:
        score += 15
        signals.append("✅ Strong liquidity")
    elif coin.liquidity_usd >= 50_000:
        score += 10
        signals.append("🟢 Good liquidity")
    elif coin.liquidity_usd >= 10_000:
        score += 5
    else:
        score -= 10
        signals.append("⚠️ Low liquidity")

    # Volume momentum (0-20)
    vol_ratio = coin.volume_24h / max(coin.liquidity_usd, 1)
    if vol_ratio >= 2:
        score += 20
        signals.append("🔥 Volume explosion")
    elif vol_ratio >= 1:
        score += 15
        signals.append("📈 High volume/liq ratio")
    elif vol_ratio >= 0.5:
        score += 10
    elif vol_ratio >= 0.2:
        score += 5
    else:
        score -= 5

    # Buy pressure (0-15)
    total_24h = coin.buys_24h + coin.sells_24h
    if total_24h > 0:
        buy_ratio = coin.buys_24h / total_24h
        if buy_ratio >= 0.65:
            score += 15
            signals.append("🟢 Strong buy pressure")
        elif buy_ratio >= 0.55:
            score += 10
            signals.append("📊 Bullish order flow")
        elif buy_ratio >= 0.45:
            score += 5
        else:
            score -= 8
            signals.append("🔴 Sell pressure dominant")

    total_1h = coin.buys_1h + coin.sells_1h
    if total_1h > 0:
        buy_ratio_1h = coin.buys_1h / total_1h
        if buy_ratio_1h >= 0.6:
            score += 8
            signals.append("⚡ 1h buy surge")

    # Price momentum (0-20)
    if coin.price_change_h1 >= 20:
        score += 12
        signals.append("🚀 +20% in 1h")
    elif coin.price_change_h1 >= 10:
        score += 8
        signals.append("📈 Pumping 1h")
    elif coin.price_change_h1 >= 5:
        score += 5
    elif coin.price_change_h1 <= -15:
        score -= 12
        signals.append("📉 Dumping 1h")
    elif coin.price_change_h1 <= -5:
        score -= 5

    if coin.price_change_m5 >= 5:
        score += 5
        signals.append("⚡ 5m momentum")
    elif coin.price_change_m5 <= -8:
        score -= 8
        signals.append("💀 5m crash")

    # Rug pull detection (-20 to +10)
    if coin.fdv > 0 and coin.liquidity_usd > 0:
        liq_fdv = coin.liquidity_usd / coin.fdv
        if liq_fdv >= 0.15:
            score += 10
            signals.append("🛡️ Healthy liq/FDV")
        elif liq_fdv >= 0.05:
            score += 3
        elif liq_fdv < 0.02:
            score -= 20
            signals.append("🚨 Rug risk — low liq/FDV")

    # Market cap sweet spot for memes
    if 50_000 <= coin.market_cap <= 5_000_000:
        score += 8
        signals.append("🎯 Meme sweet spot mcap")
    elif coin.market_cap > 50_000_000:
        score -= 5
        signals.append("🐋 Already large cap")

    # Penalize extreme 24h pump (likely late entry)
    if coin.price_change_h24 >= 200:
        score -= 10
        signals.append("⚠️ Already 200%+ today")
    elif coin.price_change_h24 >= 100:
        score -= 5

    score = max(0.0, min(100.0, score))
    return round(score, 1), signals


def rank_coins(coins: list[MemeCoin]) -> list[MemeCoin]:
    for coin in coins:
        coin.ai_score, coin.ai_signals = score_meme_coin(coin)
    return sorted(coins, key=lambda c: c.ai_score, reverse=True)
