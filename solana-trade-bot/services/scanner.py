from dataclasses import dataclass, field

import httpx

from config import MIN_LIQUIDITY_USD, MIN_VOLUME_24H_USD


@dataclass
class MemeCoin:
    symbol: str
    name: str
    mint: str
    pair_address: str
    price_usd: float
    liquidity_usd: float
    volume_24h: float
    volume_1h: float
    price_change_m5: float
    price_change_h1: float
    price_change_h6: float
    price_change_h24: float
    market_cap: float
    fdv: float
    buys_24h: int
    sells_24h: int
    buys_1h: int
    sells_1h: int
    pair_created_at: int | None
    dex: str
    url: str
    ai_score: float = 0.0
    ai_signals: list[str] = field(default_factory=list)


async def _fetch_json(url: str) -> list | dict:
    async with httpx.AsyncClient(timeout=25) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        return resp.json()


def _parse_pair(pair: dict) -> MemeCoin | None:
    if pair.get("chainId") != "solana":
        return None

    base = pair.get("baseToken") or {}
    mint = base.get("address")
    if not mint:
        return None

    liq = float((pair.get("liquidity") or {}).get("usd") or 0)
    vol = pair.get("volume") or {}
    pc = pair.get("priceChange") or {}
    txns = pair.get("txns") or {}
    tx24 = txns.get("h24") or {}
    tx1 = txns.get("h1") or {}

    return MemeCoin(
        symbol=base.get("symbol") or "?",
        name=base.get("name") or base.get("symbol") or "?",
        mint=mint,
        pair_address=pair.get("pairAddress") or "",
        price_usd=float(pair.get("priceUsd") or 0),
        liquidity_usd=liq,
        volume_24h=float(vol.get("h24") or 0),
        volume_1h=float(vol.get("h1") or 0),
        price_change_m5=float(pc.get("m5") or 0),
        price_change_h1=float(pc.get("h1") or 0),
        price_change_h6=float(pc.get("h6") or 0),
        price_change_h24=float(pc.get("h24") or 0),
        market_cap=float(pair.get("marketCap") or 0),
        fdv=float(pair.get("fdv") or 0),
        buys_24h=int(tx24.get("buys") or 0),
        sells_24h=int(tx24.get("sells") or 0),
        buys_1h=int(tx1.get("buys") or 0),
        sells_1h=int(tx1.get("sells") or 0),
        pair_created_at=pair.get("pairCreatedAt"),
        dex=pair.get("dexId") or "",
        url=pair.get("url") or f"https://dexscreener.com/solana/{pair.get('pairAddress', mint)}",
    )


def _dedupe_best_pairs(coins: list[MemeCoin]) -> list[MemeCoin]:
    best: dict[str, MemeCoin] = {}
    for coin in coins:
        existing = best.get(coin.mint)
        if not existing or coin.liquidity_usd > existing.liquidity_usd:
            best[coin.mint] = coin
    return list(best.values())


async def scan_meme_coins(limit: int = 30) -> list[MemeCoin]:
    """Scan Solana meme coins from DexScreener trending + boosted sources."""
    coins: list[MemeCoin] = []

    sources = [
        "https://api.dexscreener.com/token-boosts/top/v1",
        "https://api.dexscreener.com/token-profiles/latest/v1",
    ]

    mints: set[str] = set()
    for url in sources:
        try:
            data = await _fetch_json(url)
            items = data if isinstance(data, list) else []
            for item in items:
                if item.get("chainId") == "solana":
                    addr = item.get("tokenAddress")
                    if addr:
                        mints.add(addr)
        except Exception:
            continue

    # Also pull latest Solana pairs search
    try:
        search = await _fetch_json("https://api.dexscreener.com/latest/dex/search?q=pump")
        for pair in search.get("pairs") or []:
            parsed = _parse_pair(pair)
            if parsed:
                coins.append(parsed)
                mints.add(parsed.mint)
    except Exception:
        pass

    # Fetch details for collected mints (batch by 30)
    mint_list = list(mints)[:60]
    for i in range(0, len(mint_list), 30):
        batch = ",".join(mint_list[i : i + 30])
        try:
            data = await _fetch_json(f"https://api.dexscreener.com/latest/dex/tokens/{batch}")
            for pair in data.get("pairs") or []:
                parsed = _parse_pair(pair)
                if parsed:
                    coins.append(parsed)
        except Exception:
            continue

    coins = _dedupe_best_pairs(coins)

    # Filter minimum quality
    filtered = [
        c
        for c in coins
        if c.liquidity_usd >= MIN_LIQUIDITY_USD
        and c.volume_24h >= MIN_VOLUME_24H_USD
        and c.price_usd > 0
    ]

    return filtered[: limit * 2]


async def get_token_price(mint: str) -> MemeCoin | None:
    try:
        data = await _fetch_json(f"https://api.dexscreener.com/latest/dex/tokens/{mint}")
        pairs = data.get("pairs") or []
        if not pairs:
            return None
        best = max(pairs, key=lambda p: float((p.get("liquidity") or {}).get("usd") or 0))
        return _parse_pair(best)
    except Exception:
        return None
