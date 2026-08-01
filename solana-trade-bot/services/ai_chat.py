"""AI assistant — answer trading questions with live market context."""

import re
import time

import httpx

from config import OPENAI_API_KEY
from db.database import get_open_positions, get_stats
from services.ai_scorer import rank_coins
from services.entry_filter import validate_entry
from services.portfolio import get_unrealized_pnl
from services.scanner import scan_meme_coins, get_token_price_cached
from services.trader import get_cached_coin
from services.wallet import get_balance_sol

_scan_cache: tuple[float, list] = (0.0, [])


async def _get_ranked_coins() -> list:
    global _scan_cache
    now = time.time()
    if _scan_cache[1] and now - _scan_cache[0] < 30:
        return _scan_cache[1]

    coins = await scan_meme_coins()
    ranked = rank_coins(coins)
    _scan_cache = (now, ranked)
    return ranked


def _find_coin_by_symbol(ranked: list, symbol: str):
    sym = symbol.upper().lstrip("$")
    for c in ranked:
        if c.symbol.upper() == sym:
            return c
    for c in ranked:
        if sym in c.symbol.upper() or sym in c.name.upper():
            return c
    return None


async def _build_user_context(user: dict | None) -> str:
    if not user:
        return ""

    lines = []
    if user.get("wallet_pubkey"):
        bal = await get_balance_sol(user["wallet_pubkey"])
        lines.append(f"Wallet balance: {bal:.4f} SOL")
        lines.append(
            f"Mode: {user.get('risk_mode', 'balanced')} | Auto trade: "
            f"{'on' if user.get('autotrade') else 'off'}"
        )

    user_id = user.get("user_id")
    if user_id:
        stats = await get_stats(user_id)
        lines.append(
            f"Closed trades: {stats['total_trades']} | Win rate: {stats['win_rate']}% | "
            f"Realized PnL: {stats.get('sol_pnl', 0):+.4f} SOL"
        )
        positions = await get_open_positions(user_id)
        if positions:
            unrealized = await get_unrealized_pnl(user_id, positions, user)
            lines.append(
                f"Open positions: {len(positions)} | Unrealized: "
                f"{unrealized['unrealized_sol']:+.4f} SOL ({unrealized['unrealized_pct']:+.1f}%)"
            )
            for p, d in zip(positions, unrealized["positions"]):
                lines.append(
                    f"  - ${p['token_symbol']}: {d['pnl_pct']:+.1f}% | "
                    f"{d['sol_in']:.4f} SOL in -> ~{d['est_sol']:.4f} SOL"
                )

    return "\n".join(lines)


async def _build_market_context(min_score: float = 70, user: dict | None = None) -> str:
    ranked = await _get_ranked_coins()
    if not ranked:
        return "No quality meme coins found in current scan."

    buys = [c for c in ranked if getattr(c, "ai_verdict", "") in ("STRONG BUY", "BUY") and c.ai_score >= min_score]
    best = buys[0] if buys else ranked[0]

    lines = ["Current top Solana meme coins:"]
    for i, c in enumerate(ranked[:8], 1):
        verdict = getattr(c, "ai_verdict", "WATCH")
        why = c.ai_signals[0] if c.ai_signals else "Mixed signals"
        ok, entry_note = validate_entry(c, min_score)
        entry = "ready" if ok else f"blocked ({entry_note})"
        tag = " <-- BEST BUY" if c.mint == best.mint else ""
        lines.append(
            f"{i}. ${c.symbol} | Score {c.ai_score}/100 | {verdict}{tag} | "
            f"Price ${c.price_usd:.8f} | 5m {c.price_change_m5:+.1f}% | 1h {c.price_change_h1:+.1f}% | "
            f"Liq ${c.liquidity_usd:,.0f} | Vol ${c.volume_24h:,.0f} | Entry: {entry} | {why}"
        )

    lines.append(
        f"\nBest pick right now: ${best.symbol} ({getattr(best, 'ai_verdict', 'BUY')}, score {best.ai_score})"
    )
    lines.append(f"Minimum recommended score for auto-buy: {min_score}")

    user_ctx = await _build_user_context(user)
    if user_ctx:
        lines.extend(["", "User account:", user_ctx])

    return "\n".join(lines)


async def _openai_answer(question: str, context: str) -> str | None:
    if not OPENAI_API_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You are an expert Solana meme coin trading AI assistant. "
                                "Be direct, clear, and honest. No emojis. "
                                "Use the live market data and user account info provided. "
                                "When recommending coins, explain WHY based on score, liquidity, momentum, and order flow. "
                                "Keep answers under 250 words unless analyzing a specific coin in detail."
                            ),
                        },
                        {
                            "role": "user",
                            "content": f"Context:\n{context}\n\nUser question: {question}",
                        },
                    ],
                    "max_tokens": 500,
                    "temperature": 0.35,
                },
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"].strip()
    except Exception:
        return None


def _format_coin_answer(coin, min_score: float) -> str:
    ok, entry_note = validate_entry(coin, min_score)
    signals = "\n".join(f"- {s}" for s in coin.ai_signals[:4]) or "- Mixed signals"
    verdict = getattr(coin, "ai_verdict", "WATCH")
    return (
        f"Analysis of ${coin.symbol}:\n\n"
        f"Verdict: {verdict} | Score: {coin.ai_score}/100\n"
        f"Price: ${coin.price_usd:.8f}\n"
        f"5m: {coin.price_change_m5:+.1f}% | 1h: {coin.price_change_h1:+.1f}% | "
        f"24h: {coin.price_change_h24:+.1f}%\n"
        f"Liquidity: ${coin.liquidity_usd:,.0f} | Volume 24h: ${coin.volume_24h:,.0f}\n"
        f"Buy ratio 1h: {coin.buys_1h}B / {coin.sells_1h}S\n\n"
        f"AI signals:\n{signals}\n\n"
        f"Entry check: {'PASS — good setup' if ok else f'BLOCKED — {entry_note}'}\n"
        f"Use /scan and tap Details for the full breakdown."
    )


def _local_answer(question: str, context: str, user: dict | None, ranked: list) -> str:
    q = question.lower().strip()

    match = re.search(r"(?:buy|about|analyze|think about|check)\s+\$?(\w{2,12})", q)
    if match or re.search(r"\$([A-Za-z0-9]{2,12})", question):
        symbol = (match.group(1) if match else re.search(r"\$([A-Za-z0-9]{2,12})", question).group(1))
        coin = _find_coin_by_symbol(ranked, symbol)
        if coin:
            min_score = float(user.get("min_ai_score", 75)) if user else 75
            return _format_coin_answer(coin, min_score)
        return (
            f"${symbol.upper()} was not found in the current top scan.\n\n"
            f"{context}\n\nRun Best Buys to see what is available right now."
        )

    if any(k in q for k in ("what should i buy", "best coin", "best to buy", "what to buy", "top pick", "recommend")):
        return (
            f"Based on the current scan:\n\n{context}\n\n"
            "Look for STRONG BUY or BUY with score above your minimum. "
            "Tap Best Buys for the full ranked list with buy buttons."
        )

    if "stop loss" in q or "stop-loss" in q:
        sl = user.get("stop_loss_pct", 15) if user else 15
        return (
            f"Your stop loss is {sl}%. The bot sells when a position drops by that amount. "
            "Tighter stops protect capital but exit early. Wider stops give more room but bigger losses."
        )

    if "take profit" in q:
        tp = user.get("take_profit_pct", 50) if user else 50
        return (
            f"Your take profit is {tp}%. The bot sells when a position hits that gain. "
            "Lower targets lock wins faster. Higher targets aim for bigger moves."
        )

    if "trailing" in q:
        tr = user.get("trailing_stop_pct", 10) if user else 10
        return (
            f"Your trailing stop is {tr}%. After a position is up 8%+, "
            f"the bot sells if price drops {tr}% from its peak. This locks in profits on runners."
        )

    if "auto trade" in q or "autotrade" in q or "how does" in q:
        return (
            "Auto trade:\n"
            "1. Scans DexScreener every 25 seconds\n"
            "2. AI scores liquidity, volume, buy pressure, momentum, rug risk\n"
            "3. Buys BUY/STRONG BUY coins above your min score\n"
            "4. Monitors every 10 seconds\n"
            "5. Sells on stop loss, take profit, trailing stop, or flash crash\n\n"
            "Import wallet key, pick a mode, tap Start Auto Trade."
        )

    if "safe mode" in q or "balanced" in q or "degen" in q or "which mode" in q:
        return (
            "Trading modes:\n"
            "Safe — 0.02 SOL/trade, 10% stop, score 85+, 2 positions\n"
            "Balanced — 0.05 SOL, 15% stop, score 75+, 3 positions (recommended)\n"
            "Degen — 0.1 SOL, 20% stop, score 70+, 5 positions\n\n"
            "New users should start Safe or Balanced."
        )

    if "make money" in q or "profit" in q or "will i win" in q:
        return (
            "Honest answer: maybe, but nothing is guaranteed.\n\n"
            "The bot gives speed, scam filtering, and disciplined exits. "
            "Meme coins are high risk. Start small, use Safe mode, check /dashboard after a few days."
        )

    if "wallet" in q or "phantom" in q or "private key" in q:
        return (
            "Create a dedicated Phantom wallet with only your trading SOL. "
            "Tap Import Wallet Key and paste your base58 private key. "
            "It gets encrypted and the message is deleted."
        )

    if "position" in q or "portfolio" in q or "dashboard" in q:
        return (
            f"Your account and market:\n\n{context}\n\n"
            "Use /dashboard for full portfolio view or /positions for live PnL on each trade."
        )

    return (
        f"Current market:\n\n{context}\n\n"
        "Ask me:\n"
        "- What should I buy right now?\n"
        "- Should I buy $SYMBOL?\n"
        "- How does trailing stop work?\n"
        "- Which mode should I use?"
    )


async def ask_ai(question: str, user: dict | None = None) -> str:
    min_score = float(user.get("min_ai_score", 75)) if user else 75
    ranked = await _get_ranked_coins()
    context = await _build_market_context(min_score, user)

    ai_response = await _openai_answer(question, context)
    if ai_response:
        return ai_response

    return _local_answer(question, context, user, ranked)


async def analyze_coin(mint: str, user: dict | None = None) -> str:
    min_score = float(user.get("min_ai_score", 75)) if user else 75
    coin = get_cached_coin(mint)
    if not coin:
        coin = await get_token_price_cached(mint)
    if not coin:
        return "Coin not found. Run Best Buys to refresh the market scan."

    ranked = await _get_ranked_coins()
    for c in ranked:
        if c.mint == mint:
            coin = c
            break

    return _format_coin_answer(coin, min_score)
