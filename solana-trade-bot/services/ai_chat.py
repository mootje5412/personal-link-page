"""AI assistant — answer trading questions with live market context."""

import re

import httpx

from config import OPENAI_API_KEY
from services.ai_scorer import rank_coins
from services.scanner import scan_meme_coins, get_token_price_cached


async def _build_market_context(min_score: float = 70, user: dict | None = None) -> str:
    coins = await scan_meme_coins()
    ranked = rank_coins(coins)
    if not ranked:
        return "No quality meme coins found in current scan."

    buys = [c for c in ranked if getattr(c, "ai_verdict", "") in ("STRONG BUY", "BUY") and c.ai_score >= min_score]
    best = buys[0] if buys else ranked[0]

    lines = ["Current top Solana meme coins:"]
    for i, c in enumerate(ranked[:8], 1):
        verdict = getattr(c, "ai_verdict", "WATCH")
        why = c.ai_signals[0] if c.ai_signals else "Mixed signals"
        tag = " <-- BEST BUY" if c.mint == best.mint else ""
        lines.append(
            f"{i}. ${c.symbol} | Score {c.ai_score}/100 | {verdict}{tag} | "
            f"Price ${c.price_usd:.8f} | 1h {c.price_change_h1:+.1f}% | "
            f"Liq ${c.liquidity_usd:,.0f} | {why}"
        )

    lines.append(
        f"\nBest pick right now: ${best.symbol} ({getattr(best, 'ai_verdict', 'BUY')}, score {best.ai_score})"
    )
    if user:
        mode = user.get("risk_mode") or "balanced"
        lines.append(
            f"User mode: {mode} | Min score: {min_score} | "
            f"Stop: -{float(user.get('stop_loss_pct', 15))}% | Target: +{float(user.get('take_profit_pct', 50))}%"
        )
    lines.append(f"Minimum recommended score for auto-buy: {min_score}")
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
                                "You are a Solana meme coin trading AI assistant. "
                                "Be direct, clear, and honest. No emojis. No financial advice disclaimers unless asked. "
                                "Use the live market data provided. Keep answers under 200 words. "
                                "When recommending coins, explain WHY based on data."
                            ),
                        },
                        {
                            "role": "user",
                            "content": f"Live market data:\n{context}\n\nUser question: {question}",
                        },
                    ],
                    "max_tokens": 400,
                    "temperature": 0.4,
                },
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"].strip()
    except Exception:
        return None


def _local_answer(question: str, context: str, user: dict | None) -> str:
    q = question.lower().strip()

    # What to buy / best coin
    if any(k in q for k in ("what should i buy", "best coin", "best to buy", "what to buy", "top pick", "recommend")):
        return (
            f"Based on the current scan:\n\n{context}\n\n"
            "Look for STRONG BUY or BUY ratings with score above 75. "
            "Use /scan to see the full list with buy buttons, or tap Buy Top Coin from the menu."
        )

    # Should I buy X
    match = re.search(r"(?:buy|think about|is)\s+\$?(\w+)", q)
    if match or "should i" in q:
        symbol = match.group(1).upper() if match else None
        if symbol:
            return (
                f"I searched for ${symbol} in the current market.\n\n{context}\n\n"
                f"If ${symbol} appears above with a BUY or STRONG BUY verdict and score above 75, "
                "it passes our filters. Otherwise wait for a better setup."
            )

    # Stop loss / take profit
    if "stop loss" in q or "stop-loss" in q:
        sl = user.get("stop_loss_pct", 15) if user else 15
        return (
            f"Your stop loss is set to {sl}%. "
            "The bot automatically sells when a position drops by that amount. "
            "Tighter stops (10%) protect capital but exit early. Wider stops (20%) give more room but bigger losses."
        )

    if "take profit" in q:
        tp = user.get("take_profit_pct", 50) if user else 50
        return (
            f"Your take profit is set to {tp}%. "
            "The bot sells automatically when a position hits that gain. "
            "Lower targets (30%) lock in wins faster. Higher targets (100%) aim for bigger moves."
        )

    # Auto trade
    if "auto trade" in q or "autotrade" in q or "how does" in q:
        return (
            "Auto trade works like this:\n"
            "1. Bot scans DexScreener every 25 seconds\n"
            "2. AI scores each coin on liquidity, volume, buy pressure, momentum, rug risk\n"
            "3. Buys coins rated BUY or STRONG BUY above your minimum score\n"
            "4. Monitors positions every 10 seconds\n"
            "5. Sells on stop loss, take profit, trailing stop, or flash crash\n\n"
            "Import your wallet key, pick a mode, then tap Start Auto Trade."
        )

    # Modes
    if "safe mode" in q or "balanced" in q or "degen" in q or "which mode" in q:
        return (
            "Trading modes:\n"
            "Safe — 0.02 SOL per trade, 10% stop loss, only elite coins (85+ score)\n"
            "Balanced — 0.05 SOL, 15% stop, score 75+ (recommended for most people)\n"
            "Degen — 0.1 SOL, 20% stop, score 70+, up to 5 positions\n\n"
            "New users should start with Safe or Balanced."
        )

    # Profit
    if "make money" in q or "profit" in q or "will i win" in q:
        return (
            "Honest answer: maybe, but nothing is guaranteed.\n\n"
            "The bot gives you an edge on speed, scam filtering, and disciplined exits. "
            "But meme coins are high risk and most traders lose overall.\n\n"
            "Start small, use Safe mode, check /dashboard after a few days, and only trade what you can lose."
        )

    # Wallet
    if "wallet" in q or "phantom" in q or "private key" in q:
        return (
            "Create a dedicated Phantom wallet with only your trading SOL. "
            "Tap Import Wallet Key and paste your base58 private key. "
            "It gets encrypted and the message is deleted. Never use your main wallet."
        )

    # Default with market context
    return (
        f"Here is what the market looks like right now:\n\n{context}\n\n"
        "Ask me things like:\n"
        "- What should I buy right now?\n"
        "- How does auto trade work?\n"
        "- What is stop loss?\n"
        "- Which mode should I use?"
    )


async def ask_ai(question: str, user: dict | None = None) -> str:
    min_score = float(user.get("min_ai_score", 75)) if user else 75
    context = await _build_market_context(min_score, user)

    ai_response = await _openai_answer(question, context)
    if ai_response:
        return ai_response

    return _local_answer(question, context, user)
