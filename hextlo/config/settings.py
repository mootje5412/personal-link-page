import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def _parse_admin_ids(raw: str) -> set[int]:
    if not raw.strip():
        return set()
    return {int(part.strip()) for part in raw.split(",") if part.strip().isdigit()}


@dataclass(frozen=True)
class Settings:
    bot_token: str = field(default_factory=lambda: os.getenv("HEXTLO_BOT_TOKEN", "").strip())
    bot_name: str = "HexTLO"
    bot_version: str = "0.1.0"
    admin_ids: set[int] = field(
        default_factory=lambda: _parse_admin_ids(os.getenv("HEXTLO_ADMIN_IDS", ""))
    )

    ssn_api_url: str = field(default_factory=lambda: os.getenv("HEXTLO_SSN_API_URL", "").strip())
    name_api_url: str = field(default_factory=lambda: os.getenv("HEXTLO_NAME_API_URL", "").strip())
    npd_api_url: str = field(default_factory=lambda: os.getenv("HEXTLO_NPD_API_URL", "").strip())
    court_api_url: str = field(default_factory=lambda: os.getenv("HEXTLO_COURT_API_URL", "").strip())
    phone_api_url: str = field(default_factory=lambda: os.getenv("HEXTLO_PHONE_API_URL", "").strip())
    email_api_url: str = field(default_factory=lambda: os.getenv("HEXTLO_EMAIL_API_URL", "").strip())
    address_api_url: str = field(
        default_factory=lambda: os.getenv("HEXTLO_ADDRESS_API_URL", "").strip()
    )

    max_results: int = 15
    message_limit: int = 3900


settings = Settings()
