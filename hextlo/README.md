# HexTLO

Telegram bot for TLO-style lookups powered by the ZopzTLO API.

## How it works

Only `/start` is a command. After that, just type your search and the bot auto-detects the lookup type:

| Input | Detected search |
|-------|-----------------|
| `John Smith` | SSN / name search |
| `John Smith CA` | Intelius |
| `John Smith Los Angeles CA` | Criminal lookup |
| `John, Smith, Los Angeles, CA` | Criminal lookup (exact) |
| `5551234567` | Mobile lookup |
| `1HGBH41JXMN109186` | VIN search |

## Setup

```bash
cd hextlo
pip install -r requirements.txt
cp .env.example .env
```

Set in `.env`:

```
HEXTLO_BOT_TOKEN=your_telegram_bot_token
HEXTLO_API_KEY=your_zopztlo_api_key
```

Run:

```bash
python main.py
```

## Project layout

```
hextlo/
├── main.py
├── config/settings.py
├── bot/app.py
├── handlers/
│   ├── commands.py      # /start only
│   └── messages.py      # Auto-detect + search
├── services/
│   ├── zopztlo_client.py
│   └── registry.py
├── models/search.py
└── utils/
    ├── detector.py
    └── formatting.py
```

## API endpoints used

- `ssnsearch` — name-based SSN search
- `vinsearch` — VIN lookup
- `criminal-lookup` — criminal records (4 fields)
- `intelius` — people search (3 fields)
- `Million_Mobile` — mobile / phone lookup
