from services.scanner import MemeCoin


def _score_bar(score: float) -> str:
    filled = round(score / 10)
    return "🟩" * filled + "⬜" * (10 - filled)


def score_meme_coin(coin: MemeCoin) -> tuple[float, list[str]]:
    """AI scoring — calibrated so 85+ is genuinely elite."""
    signals: list[str] = []
    score = 35.0

    if coin.is_scam:
        return 0.0, ["🚨 Flagged as scam/honeypot"]

    # ── Liquidity (max +18) ──
    if coin.liquidity_usd >= 500_000:
        score += 18; signals.append("💎 Deep liquidity")
    elif coin.liquidity_usd >= 150_000:
        score += 14; signals.append("✅ Strong liquidity")
    elif coin.liquidity_usd >= 50_000:
        score += 10; signals.append("🟢 Good liquidity")
    elif coin.liquidity_usd >= 20_000:
        score += 6
    elif coin.liquidity_usd >= 15_000:
        score += 3
    else:
        score -= 15; signals.append("⚠️ Thin liquidity")

    # ── Volume momentum (max +18) ──
    vol_ratio = coin.volume_24h / max(coin.liquidity_usd, 1)
    if vol_ratio >= 3:
        score += 18; signals.append("🔥 Volume explosion")
    elif vol_ratio >= 1.5:
        score += 14; signals.append("📈 High vol/liq")
    elif vol_ratio >= 0.8:
        score += 10
    elif vol_ratio >= 0.4:
        score += 5
    else:
        score -= 3

    # ── Buy pressure (max +16) ──
    total_24h = coin.buys_24h + coin.sells_24h
    if total_24h >= 50:
        buy_ratio = coin.buys_24h / total_24h
        if buy_ratio >= 0.62:
            score += 12; signals.append("🟢 Strong buy pressure")
        elif buy_ratio >= 0.55:
            score += 8; signals.append("📊 Bullish flow")
        elif buy_ratio >= 0.48:
            score += 3
        else:
            score -= 10; signals.append("🔴 Sellers dominating")

    total_1h = coin.buys_1h + coin.sells_1h
    if total_1h >= 10:
        br1h = coin.buys_1h / total_1h
        if br1h >= 0.58:
            score += 8; signals.append("⚡ 1h buy surge")
        elif br1h < 0.42:
            score -= 6

    # ── Price momentum (max +16) ──
    if 8 <= coin.price_change_h1 <= 40:
        score += 12; signals.append("🚀 Healthy 1h pump")
    elif 3 <= coin.price_change_h1 < 8:
        score += 6; signals.append("📈 Building momentum")
    elif coin.price_change_h1 > 60:
        score -= 8; signals.append("⚠️ Overextended 1h")
    elif coin.price_change_h1 <= -12:
        score -= 14; signals.append("📉 Dumping hard")
    elif coin.price_change_h1 <= -5:
        score -= 6

    if 2 <= coin.price_change_m5 <= 15:
        score += 5; signals.append("⚡ 5m momentum")
    elif coin.price_change_m5 <= -10:
        score -= 10; signals.append("💀 5m crash")

    # ── Rug detection (max +12 / min -25) ──
    if coin.fdv > 0 and coin.liquidity_usd > 0:
        liq_fdv = coin.liquidity_usd / coin.fdv
        if liq_fdv >= 0.12:
            score += 12; signals.append("🛡️ Safe liq/FDV ratio")
        elif liq_fdv >= 0.06:
            score += 5
        elif liq_fdv < 0.015:
            score -= 25; signals.append("🚨 RUG RISK — exit liquidity")

    # ── Market cap zone (max +10) ──
    if 30_000 <= coin.market_cap <= 3_000_000:
        score += 10; signals.append("🎯 Sweet spot mcap")
    elif 3_000_000 < coin.market_cap <= 15_000_000:
        score += 4
    elif coin.market_cap > 50_000_000:
        score -= 6; signals.append("🐋 Too big for memes")

    # ── Late entry penalty ──
    if coin.price_change_h24 >= 300:
        score -= 15; signals.append("⚠️ Already 3x+ today — late")
    elif coin.price_change_h24 >= 150:
        score -= 8; signals.append("⚠️ Big run already")

    # ── Activity bonus ──
    if coin.buys_1h + coin.sells_1h >= 100:
        score += 5; signals.append("🔥 Active trading")

    # Pump.fun bonus
    if coin.dex in ("pumpfun", "pumpswap"):
        score += 4; signals.append("🎰 Pump.fun token")

    score = max(0.0, min(100.0, score))
    return round(score, 1), signals[:4]  # cap signals for clean display


def rank_coins(coins: list[MemeCoin]) -> list[MemeCoin]:
    for coin in coins:
        coin.ai_score, coin.ai_signals = score_meme_coin(coin)
    return sorted(coins, key=lambda c: c.ai_score, reverse=True)


def format_score_emoji(score: float) -> str:
    if score >= 85:
        return "🔥 ELITE"
    if score >= 75:
        return "✅ STRONG"
    if score >= 65:
        return "🟡 DECENT"
    if score >= 50:
        return "🟠 WEAK"
    return "🔴 AVOID"
