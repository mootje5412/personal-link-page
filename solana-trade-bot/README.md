# Solana AI Meme Coin Trader — Telegram Bot

Automated Solana meme coin trading bot for Telegram. Scans trending meme coins, scores them with an AI engine, auto-buys the best ones, and auto-sells when price drops or hits take profit.

## Features

- **Meme coin scanner** — Pulls trending Solana tokens from DexScreener (boosted, profiles, pump.fun pairs)
- **AI scoring engine** — Ranks coins by liquidity, volume momentum, buy pressure, rug pull risk, and price action
- **Auto buy** — Buys top-scored coins via Jupiter aggregator
- **Auto sell** — Stop loss, take profit, flash dump detection, sell pressure exit
- **Phantom wallet** — Connect via Telegram Web App mini app
- **Wallet import** — Import a dedicated trading wallet key for fully automated signing

## Quick Start

### 1. Create a Telegram Bot

Message [@BotFather](https://t.me/BotFather) → `/newbot` → copy your token.

### 2. Configure

```bash
cd solana-trade-bot
cp .env.example .env
```

Edit `.env`:

```env
TELEGRAM_BOT_TOKEN=your_token
BOT_SECRET_KEY=generate_with_python_below
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
WEBAPP_URL=https://your-hosted-webapp-url/index.html
```

Generate encryption key:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### 3. Install & Run

```bash
pip install -r requirements.txt
python bot.py
```

### 4. Deploy Phantom Web App (optional)

Host `webapp/index.html` on any static host (GitHub Pages, Netlify, Vercel) and set `WEBAPP_URL` in `.env`.

## Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Main menu |
| `/scan` | Scan & rank best meme coins |
| `/wallet` | Import trading wallet key |
| `/balance` | Check SOL balance |
| `/positions` | View open trades |
| `/autotrade` | Toggle auto trading |
| `/settings` | Trade size, stop loss, take profit |
| `/stop` | Emergency stop |

## How Auto Trading Works

1. Bot scans DexScreener every ~45 seconds
2. AI scores each coin (0–100). Only coins scoring **≥ 72** are considered
3. Buys top coins with Jupiter swap (SOL → token)
4. Monitors positions continuously:
   - **Stop loss** — Sells when down X% (default 15%)
   - **Take profit** — Sells when up X% (default 50%)
   - **Flash dump** — Exits on sudden 5m crash while in loss
   - **Sell pressure** — Exits when sells dominate buys + in loss

## AI Score Breakdown

| Factor | Weight |
|--------|--------|
| Liquidity depth | Up to +20 |
| Volume/liquidity ratio | Up to +20 |
| Buy pressure (24h & 1h) | Up to +23 |
| Price momentum (5m, 1h) | Up to +25 |
| Rug pull detection (liq/FDV) | +10 to -20 |
| Market cap sweet spot | Up to +8 |

## Security

- Private keys are encrypted with Fernet (per-user derived keys)
- Use a **dedicated trading wallet** — never your main wallet
- Phantom connect is view-only; auto trading requires key import for signing
- Messages containing private keys are deleted after import

## Requirements

- Python 3.11+
- Telegram bot token
- Solana RPC endpoint (free public or Helius/QuickNode)
- SOL in trading wallet for swaps + fees

## Disclaimer

This bot trades real cryptocurrency on Solana mainnet. Meme coins are extremely volatile and you can lose everything. Use at your own risk. Not financial advice.
