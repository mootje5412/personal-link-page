"""Rotating pro tips shown to users."""

import random

TIPS = [
    "💡 Start with 🛡 Safe mode until you see green on your dashboard.",
    "💡 Check /dashboard daily — if win rate is below 40%, tighten your stop loss.",
    "💡 Use a dedicated wallet with only what you can afford to lose.",
    "💡 The bot won't chase pumps — that's why it skips coins up 25%+ in 5 minutes.",
    "💡 Trailing stop locks in profits when a coin peaks then drops.",
    "💡 Tap /scan to see live AI scores and buy any coin with one button.",
    "💡 Safe mode only buys elite coins (85+ AI score) — fewer trades, higher quality.",
    "💡 If you're up big on a position, consider manual sell via /positions.",
    "💡 Low balance? Send more SOL to your trading wallet — bot pauses automatically.",
    "💡 Degen mode = more action but bigger risk. Not for beginners.",
]


def random_tip() -> str:
    return random.choice(TIPS)
