from dataclasses import dataclass, field
import asyncio
import time

import httpx

from config import MIN_LIQUIDITY_USD, MIN_VOLUME_24H_USD, SCAM_KEYWORDS, SOL_MINT

BLOCKED_MINTS = {
    SOL_MINT,
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
    "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",  # BONK
    "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t1GHn2aUaj4q2j2",  # WIF
}

SCAN_QUERIES = [
    "pump", "meme", "bonk", "pepe", "dog", "cat", "ai", "trump", "moon",
    "solana meme", "degen", "based", "frog", "wif", "popcat",
]


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
    ai_verdict: str = "WATCH"
    is_scam: bool = False
    age_hours: float = 0.0


async def _fetch_json(url: str) -> list | dict:
    async with httpx.AsyncClient(timeout=25) as client:
        resp = await client.get(url, headers={"User-Agent": "SolanaMemeBot/2.0"})
        resp.raise_for_status()
        return resp.json()


def _is_scam(coin: MemeCoin) -> bool:
    text = f"{coin.name} {coin.symbol}".lower()
    if any(kw in text for kw in SCAM_KEYWORDS):
        return True
    if coin.liquidity_usd < 5_000 and coin.volume_24h > 50_000:
        return True
    if coin.fdv > 0 and coin.liquidity_usd / coin.fdv < 0.005:
        return True
    if coin.buys_1h + coin.sells_1h < 3 and coin.volume_1h < 500:
        return True
    # Suspicious: huge mcap but tiny liq
    if coin.market_cap > 1_000_000 and coin.liquidity_usd < 20_000:
        return True
    # Single txn dominance
    if coin.buys_24h + coin.sells_24h < 10:
        return True
    return False


def _token_age_hours(created_at: int | None) -> float:
    if not created_at:
        return 999.0
    return max(0, (time.time() * 1000 - created_at) / 3_600_000)


def _parse_pair(pair: dict) -> MemeCoin | None:
    if pair.get("chainId") != "solana":
        return None

    base = pair.get("baseToken") or {}
    mint = base.get("address")
    if not mint or mint in BLOCKED_MINTS:
        return None

    quote = pair.get("quoteToken") or {}
    quote_sym = (quote.get("symbol") or "").upper()
    if quote_sym not in ("SOL", "WSOL", "USDC", "USDT", ""):
        return None

    liq = float((pair.get("liquidity") or {}).get("usd") or 0)
    vol = pair.get("volume") or {}
    pc = pair.get("priceChange") or {}
    txns = pair.get("txns") or {}
    tx24 = txns.get("h24") or {}
    tx1 = txns.get("h1") or {}

    created = pair.get("pairCreatedAt")
    coin = MemeCoin(
        symbol=(base.get("symbol") or "?")[:12],
        name=(base.get("name") or base.get("symbol") or "?")[:32],
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
        pair_created_at=created,
        dex=pair.get("dexId") or "",
        url=pair.get("url") or f"https://dexscreener.com/solana/{pair.get('pairAddress', mint)}",
    )
    coin.age_hours = _token_age_hours(created)
    coin.is_scam = _is_scam(coin)
    return coin


def _dedupe_best_pairs(coins: list[MemeCoin]) -> list[MemeCoin]:
    best: dict[str, MemeCoin] = {}
    for coin in coins:
        existing = best.get(coin.mint)
        if not existing or coin.liquidity_usd > existing.liquidity_usd:
            best[coin.mint] = coin
    return list(best.values())


async def scan_meme_coins(limit: int = 30) -> list[MemeCoin]:
    """Scan Solana meme coins from multiple DexScreener sources in parallel."""
    coins: list[MemeCoin] = []
    mints: set[str] = set()

    async def _collect_boosts(url: str) -> None:
        try:
            data = await _fetch_json(url)
            for item in (data if isinstance(data, list) else []):
                if item.get("chainId") == "solana":
                    addr = item.get("tokenAddress")
                    if addr:
                        mints.add(addr)
        except Exception:
            pass

    async def _collect_search(query: str) -> None:
        try:
            data = await _fetch_json(f"https://api.dexscreener.com/latest/dex/search?q={query}")
            for pair in data.get("pairs") or []:
                parsed = _parse_pair(pair)
                if parsed and not parsed.is_scam:
                    coins.append(parsed)
                    mints.add(parsed.mint)
        except Exception:
            pass

    tasks = [
        _collect_boosts("https://api.dexscreener.com/token-boosts/top/v1"),
        _collect_boosts("https://api.dexscreener.com/token-profiles/latest/v1"),
        *[_collect_search(q) for q in SCAN_QUERIES],
    ]
    await asyncio.gather(*tasks)

    mint_list = list(mints)[:100]
    for i in range(0, len(mint_list), 30):
        batch = ",".join(mint_list[i : i + 30])
        try:
            data = await _fetch_json(f"https://api.dexscreener.com/latest/dex/tokens/{batch}")
            for pair in data.get("pairs") or []:
                parsed = _parse_pair(pair)
                if parsed and not parsed.is_scam:
                    coins.append(parsed)
        except Exception:
            continue

    coins = _dedupe_best_pairs([c for c in coins if not c.is_scam])

    filtered = [
        c for c in coins
        if c.liquidity_usd >= MIN_LIQUIDITY_USD
        and c.volume_24h >= MIN_VOLUME_24H_USD
        and c.price_usd > 0
        and c.buys_24h + c.sells_24h >= 20
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


# Simple cache for price lookups
_price_cache: dict[str, tuple[float, MemeCoin]] = {}
_CACHE_TTL = 20


async def get_token_price_cached(mint: str) -> MemeCoin | None:
    now = time.time()
    if mint in _price_cache and now - _price_cache[mint][0] < _CACHE_TTL:
        return _price_cache[mint][1]
    coin = await get_token_price(mint)
    if coin:
        _price_cache[mint] = (now, coin)
    return coin
