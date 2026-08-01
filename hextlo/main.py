#!/usr/bin/env python3
"""HexTLO Telegram bot entry point."""

import logging
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from bot.app import build_application
from config.settings import settings

logging.basicConfig(
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger("hextlo")


def main() -> None:
    if not settings.bot_token:
        logger.error("HEXTLO_BOT_TOKEN is not set. Copy .env.example to .env and add your token.")
        sys.exit(1)

    logger.info("Starting %s v%s", settings.bot_name, settings.bot_version)
    app = build_application(settings.bot_token)
    app.run_polling(drop_pending_updates=True, allowed_updates=["message", "callback_query"])


if __name__ == "__main__":
    main()
