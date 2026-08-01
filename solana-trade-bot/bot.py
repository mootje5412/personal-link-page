#!/usr/bin/env python3
"""Solana AI Meme Coin Trading Telegram Bot."""

import logging
import sys

from handlers.commands import build_application

logging.basicConfig(
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    level=logging.INFO,
    stream=sys.stdout,
)


def main() -> None:
    app = build_application()
    print("Solana AI Trade Bot running — send /start on Telegram", flush=True)
    app.run_polling(drop_pending_updates=True, allowed_updates=["message", "callback_query"])


if __name__ == "__main__":
    main()
