# HexTLO

Telegram bot for TLO-style people and public records lookup.

## Modules

| Command | Description |
|---------|-------------|
| `/start` | Welcome menu with inline buttons |
| `/ssn` | Social Security Number lookup |
| `/name` | Full name search |
| `/npd` | National Public Data records |
| `/court` | Court and case records |
| `/phone` | Reverse phone lookup |
| `/email` | Email trace |
| `/address` | Guided address search |
| `/status` | API connection status |
| `/help` | Command reference |
| `/cancel` | Cancel an in-progress search |

## Project layout

```
hextlo/
├── main.py                 # Entry point
├── run.sh                  # Quick start script
├── requirements.txt
├── .env.example
├── config/
│   └── settings.py         # Env-based configuration
├── bot/
│   ├── app.py              # Application wiring
│   └── keyboards/
│       └── menus.py        # Inline menus
├── handlers/
│   ├── commands.py         # Slash commands
│   ├── conversations.py    # Guided search flows
│   └── callbacks.py        # Button callbacks
├── services/
│   ├── base.py             # Service interface
│   ├── search_services.py  # Per-module stubs
│   └── registry.py         # Service registry
├── models/
│   └── search.py           # Request/response models
└── utils/
    ├── formatting.py
    └── validators.py
```

## Quick start

1. Create a bot with [@BotFather](https://t.me/BotFather) and copy the token.

2. Install dependencies:

```bash
cd hextlo
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

3. Configure:

```bash
cp .env.example .env
# Edit .env and set HEXTLO_BOT_TOKEN
```

4. Run:

```bash
python main.py
```

## Connecting APIs

Each search module has a stub service in `services/search_services.py`. When you're ready:

1. Set the matching `HEXTLO_*_API_URL` in `.env`.
2. Implement the HTTP call inside the service's `search()` method.
3. Return a `SearchResponse` with `api_connected=True` and populated `results`.

The registry in `services/registry.py` routes all searches through one entry point, so wiring a new API only touches one file per module.
