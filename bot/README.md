# FindNow Telegram Bot

Intelligent OSINT search bot with owner-controlled access, paginated results, and a polished menu UI.

## Setup

```bash
cd bot
cp .env.example .env
# Edit .env with your bot token and owner ID
npm install
npm start
```

## Commands

| Command | Who | Description |
|---------|-----|-------------|
| `/start` | Everyone | Welcome menu with buttons |
| `/myid` | Everyone | Show your Telegram user ID |
| `/account` | Users | View subscription & usage |
| `/prices` | Everyone | View pricing plans |
| `/grant @user 50 30` | Owner | Grant 50 searches/day for 30 days |
| `/grant 123456789 150 7` | Owner | Grant by user ID |
| `/revoke @user` | Owner | Remove access |
| `/users` | Owner | List all users with access |

Send any text message to search (mock results for now — API layer ready to plug in).

## Structure

```
bot/
├── index.js              # Entry point
├── config/config.js      # Bot configuration
├── src/
│   ├── bot.js            # Bot setup & routing
│   ├── handlers/         # Command, message, pagination
│   ├── services/         # User access & search (mock)
│   └── utils/            # Keyboards & message templates
└── data/                 # User storage (auto-created)
```

## Owner

Default owner ID: `8073205490` — only this user can run `/grant`, `/revoke`, and `/users`. The owner has unlimited searches.
