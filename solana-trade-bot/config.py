import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
BOT_SECRET_KEY = os.getenv("BOT_SECRET_KEY", "").strip()
SOLANA_RPC_URL = os.getenv("SOLANA_RPC_URL", "https://solana.publicnode.com").strip()
WEBAPP_URL = os.getenv("WEBAPP_URL", "").strip()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
JUPITER_API_KEY = os.getenv("JUPITER_API_KEY", "").strip()

# Jupiter v1 API (v6 quote-api.jup.ag is deprecated / DNS dead)
JUPITER_QUOTE_URLS = [
    u.strip() for u in os.getenv(
        "JUPITER_QUOTE_URLS",
        "https://lite-api.jup.ag/swap/v1/quote,https://api.jup.ag/swap/v1/quote",
    ).split(",") if u.strip()
]
JUPITER_SWAP_URLS = [
    u.strip() for u in os.getenv(
        "JUPITER_SWAP_URLS",
        "https://lite-api.jup.ag/swap/v1/swap,https://api.jup.ag/swap/v1/swap",
    ).split(",") if u.strip()
]

SOLANA_RPC_FALLBACKS = [
    u.strip() for u in os.getenv(
        "SOLANA_RPC_FALLBACKS",
        "https://solana.publicnode.com,https://api.mainnet-beta.solana.com",
    ).split(",") if u.strip()
]

DEFAULT_TRADE_SOL = float(os.getenv("DEFAULT_TRADE_SOL", "0.02"))
DEFAULT_STOP_LOSS_PCT = float(os.getenv("DEFAULT_STOP_LOSS_PCT", "12"))
DEFAULT_TAKE_PROFIT_PCT = float(os.getenv("DEFAULT_TAKE_PROFIT_PCT", "35"))
DEFAULT_TRAILING_STOP_PCT = float(os.getenv("DEFAULT_TRAILING_STOP_PCT", "8"))
DEFAULT_MAX_POSITIONS = int(os.getenv("DEFAULT_MAX_POSITIONS", "1"))
SCAN_INTERVAL_SEC = int(os.getenv("SCAN_INTERVAL_SEC", "25"))
EXIT_CHECK_SEC = int(os.getenv("EXIT_CHECK_SEC", "10"))
MIN_RESERVE_SOL = float(os.getenv("MIN_RESERVE_SOL", "0.08"))
MIN_TRADE_SOL = float(os.getenv("MIN_TRADE_SOL", "0.005"))
MAX_TRADE_PCT_BALANCE = float(os.getenv("MAX_TRADE_PCT_BALANCE", "0.08"))
MAX_DEPLOYED_PCT_BALANCE = float(os.getenv("MAX_DEPLOYED_PCT_BALANCE", "0.10"))
REBUY_COOLDOWN_HOURS = int(os.getenv("REBUY_COOLDOWN_HOURS", "6"))

SOL_MINT = "So11111111111111111111111111111111111111112"
LAMPORTS_PER_SOL = 1_000_000_000
MIN_LIQUIDITY_USD = 15_000
MIN_VOLUME_24H_USD = 8_000
MIN_AI_SCORE = 80
MAX_PRICE_IMPACT_PCT = 7.0
SLIPPAGE_BPS = 300
SELL_SLIPPAGE_BPS = 500
MAX_M5_PUMP_ENTRY = 25.0
MAX_H1_PUMP_ENTRY = 70.0

SCAM_KEYWORDS = {"honeypot", "test scam", "scam", "rug pull", "airdrop claim", "free sol", "claim reward"}

DB_PATH = BASE_DIR / "data" / "trades.db"
