import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

DEFAULT_API_KEY = "d1880ff59709750dfa2bd520d3db929f8fb8da724bed1e6200e23f420d6bd207"


def _parse_admin_ids(raw: str) -> set[int]:
    if not raw.strip():
        return set()
    return {int(part.strip()) for part in raw.split(",") if part.strip().isdigit()}


@dataclass(frozen=True)
class Settings:
    bot_token: str = field(default_factory=lambda: os.getenv("HEXTLO_BOT_TOKEN", "").strip())
    bot_name: str = "HexTLO"
    bot_version: str = "0.3.0"
    admin_ids: set[int] = field(
        default_factory=lambda: _parse_admin_ids(os.getenv("HEXTLO_ADMIN_IDS", ""))
    )

    api_base_url: str = field(
        default_factory=lambda: os.getenv(
            "HEXTLO_API_BASE_URL", "https://zopztlo.zopzstress.st/api/v1"
        ).strip()
    )
    api_key: str = field(
        default_factory=lambda: os.getenv("HEXTLO_API_KEY", DEFAULT_API_KEY).strip()
    )
    api_timeout: float = 30.0

    page_size: int = 10
    message_limit: int = 3900


settings = Settings()
