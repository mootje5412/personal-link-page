import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
BOT_SECRET_KEY = os.getenv("BOT_SECRET_KEY", "").strip()
SOLANA_RPC_URL = os.getenv("SOLANA_RPC_URL", "https://api.mainnet-beta.solana.com").strip()
WEBAPP_URL = os.getenv("WEBAPP_URL", "").strip()

# Fallback RPCs if primary fails
SOLANA_RPC_FALLBACKS = [
    u.strip() for u in os.getenv(
        "SOLANA_RPC_FALLBACKS",
        "https://api.mainnet-beta.solana.com,https://solana-mainnet.g.alchemy.com/v2/demo",
    ).split(",") if u.strip()
]

DEFAULT_TRADE_SOL = float(os.getenv("DEFAULT_TRADE_SOL", "0.05"))
DEFAULT_STOP_LOSS_PCT = float(os.getenv("DEFAULT_STOP_LOSS_PCT", "15"))
DEFAULT_TAKE_PROFIT_PCT = float(os.getenv("DEFAULT_TAKE_PROFIT_PCT", "50"))
DEFAULT_TRAILING_STOP_PCT = float(os.getenv("DEFAULT_TRAILING_STOP_PCT", "10"))
DEFAULT_MAX_POSITIONS = int(os.getenv("DEFAULT_MAX_POSITIONS", "3"))
SCAN_INTERVAL_SEC = int(os.getenv("SCAN_INTERVAL_SEC", "25"))
EXIT_CHECK_SEC = int(os.getenv("EXIT_CHECK_SEC", "10"))
MIN_RESERVE_SOL = float(os.getenv("MIN_RESERVE_SOL", "0.02"))
REBUY_COOLDOWN_HOURS = int(os.getenv("REBUY_COOLDOWN_HOURS", "4"))

SOL_MINT = "So11111111111111111111111111111111111111112"
LAMPORTS_PER_SOL = 1_000_000_000
MIN_LIQUIDITY_USD = 15_000
MIN_VOLUME_24H_USD = 8_000
MIN_AI_SCORE = 75
MAX_PRICE_IMPACT_PCT = 7.0
SLIPPAGE_BPS = 300
SELL_SLIPPAGE_BPS = 500

# Entry filters — avoid chasing pumps
MAX_M5_PUMP_ENTRY = 25.0
MAX_H1_PUMP_ENTRY = 70.0
MIN_H1_VOLUME = 1_000

SCAM_KEYWORDS = {"honeypot", "test scam", "scam", "rug pull", "airdrop claim", "free sol", "claim reward"}

DB_PATH = BASE_DIR / "data" / "trades.db"
