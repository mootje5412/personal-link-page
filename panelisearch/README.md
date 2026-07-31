# PaneliSearch

Simple Telegram bot + Python search API.

## Structure

- `main.py` — FastAPI server on port 8080
- `bot.py` — Telegram bot (starts with the API)
- `database/` — put `.csv`, `.txt`, `.json`, `.tsv` files here
- `telegram.env` — bot token (not committed)

## Local run

```bash
cd panelisearch
cp telegram.env.example telegram.env
# edit telegram.env and set TELEGRAM_BOT_TOKEN
bash run.sh
```

## API

- `GET /health` — status
- `GET /api` — list indexed files
- `GET /api?q=john` — search name, phone, email, or keyword

## Server

```bash
cd /root/panelisearch
bash restart.sh
tail -f api.log
```
