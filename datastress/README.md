# DataStress Bot

Educational network stress testing Telegram bot.

## Setup

1. Create a bot via [@BotFather](https://t.me/BotFather) and copy the token.
2. Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

3. Install dependencies:

```bash
npm install
```

4. Start the bot:

```bash
npm start
```

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

Set `ADMIN_USER_ID` in `.env`. Approve pending payments with:

```
/approve <payment_id>
```

## Project Structure

```
datastress/
├── config/          # Bot configuration and plans
├── database/        # SQLite init and schema
├── data/            # Attack CSV logs
├── src/
│   ├── handlers/    # Command and callback handlers
│   ├── services/    # User, attack, payment services
│   └── utils/       # Keyboard builders
├── index.js         # Entry point
└── package.json
```

## Disclaimer

For educational and authorized testing only. Only test systems you own or have explicit permission to test.
