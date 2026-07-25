# ApexSearch Telegram Bot

OSINT intelligence platform with plan-based access, unlimited searches, and Machine Viewer for Premium users.

## Setup

```bash
cd bot
cp .env.example .env
npm install
npm start
```

## Plans

| Plan | Price | Searches | Machine Viewer |
|------|-------|----------|----------------|
| Basic | €12,50/month | Unlimited | No |
| Premium | €25,00/month | Unlimited | Yes |

**Payment:** Crypto (BTC, ETH, LTC, USDT), PayPal, Bank Transfer

## Commands

| Command | Who | Description |
|---------|-----|-------------|
| `/start` | Everyone | Main menu |
| `/prices` | Everyone | View plans and payment methods |
| `/account` | Users | View subscription |
| `/myid` | Everyone | Show your Telegram user ID |
| `/machine <name>` | Premium | Search stealer machines |
| `/grant @user basic 30` | Owner | Grant Basic for 30 days |
| `/grant @user premium 30` | Owner | Grant Premium for 30 days |
| `/revoke @user` | Owner | Remove access |
| `/users` | Owner | List all users |

Send any text message to search.

## Structure

```
bot/
├── index.js
├── config/
│   ├── config.js
│   └── plans.js
├── src/
│   ├── bot.js
│   ├── handlers/
│   ├── services/
│   └── utils/
└── data/
```
