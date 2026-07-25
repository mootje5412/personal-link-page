import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
BOT_SECRET_KEY = os.getenv("BOT_SECRET_KEY", "").strip()
SOLANA_RPC_URL = os.getenv("SOLANA_RPC_URL", "https://api.mainnet-beta.solana.com").strip()
WEBAPP_URL = os.getenv("WEBAPP_URL", "").strip()

DEFAULT_TRADE_SOL = float(os.getenv("DEFAULT_TRADE_SOL", "0.05"))
DEFAULT_STOP_LOSS_PCT = float(os.getenv("DEFAULT_STOP_LOSS_PCT", "15"))
DEFAULT_TAKE_PROFIT_PCT = float(os.getenv("DEFAULT_TAKE_PROFIT_PCT", "50"))
DEFAULT_TRAILING_STOP_PCT = float(os.getenv("DEFAULT_TRAILING_STOP_PCT", "10"))
DEFAULT_MAX_POSITIONS = int(os.getenv("DEFAULT_MAX_POSITIONS", "3"))
SCAN_INTERVAL_SEC = int(os.getenv("SCAN_INTERVAL_SEC", "30"))
EXIT_CHECK_SEC = int(os.getenv("EXIT_CHECK_SEC", "15"))
MIN_RESERVE_SOL = float(os.getenv("MIN_RESERVE_SOL", "0.02"))

SOL_MINT = "So11111111111111111111111111111111111111112"
LAMPORTS_PER_SOL = 1_000_000_000
MIN_LIQUIDITY_USD = 15_000
MIN_VOLUME_24H_USD = 8_000
MIN_AI_SCORE = 75
MAX_PRICE_IMPACT_PCT = 8.0
SLIPPAGE_BPS = 350
SELL_SLIPPAGE_BPS = 600

# Known scam / honeypot name patterns
SCAM_KEYWORDS = {"honeypot", "test", "scam", "rug", "airdrop claim", "free sol"}

DB_PATH = BASE_DIR / "data" / "trades.db"
