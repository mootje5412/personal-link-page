# DataStress Bot

Educational network stress testing Telegram bot.

## Setup

1. Edit `config/config.js` if needed (admin ID, wallet addresses).
2. Install dependencies:

```bash
npm install
```

3. Start the bot:

```bash
npm start
```

## Config

All settings are in `config/config.js`:

- `botToken` - Telegram bot token
- `adminUserId` - Your Telegram user ID for `/approve`
- `wallets` - BTC, ETH, LTC, USDT addresses

## Features

- `/start` - Main menu with bot overview (no emojis)
- **Methods** - View available stress testing methods
- **Plans** - 8 subscription tiers (60s to 3000s max duration), priced in EUR
- **Pay** - Crypto payment flow (BTC, ETH, LTC, USDT) with wallet address, Payment ID, and auto-activation
- **Launch Attack** - Log attacks to CSV (requires active plan)
- **My Account** - View subscription status

## Data Storage

- **Users** - SQLite database at `database/users.db`
- **Attacks** - CSV log at `data/attacks.csv`

## Admin

Set your Telegram ID in `config/config.js` as `adminUserId`. Payments auto-activate when the user confirms. If auto-activation fails, manually approve with:

```
/approve <payment_id>
```

## Disclaimer

For educational and authorized testing only. Only test systems you own or have explicit permission to test.
