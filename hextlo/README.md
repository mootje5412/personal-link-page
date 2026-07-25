# HexTLO

Telegram bot for TLO-style lookups powered by the ZopzTLO API.

## Setup

```bash
cd hextlo
pip install -r requirements.txt
```

Create `hextlo/.env`:

```
HEXTLO_BOT_TOKEN=your_telegram_bot_token
HEXTLO_API_KEY=d1880ff59709750dfa2bd520d3db929f8fb8da724bed1e6200e23f420d6bd207
```

Run:

```bash
python main.py
```

## Auto-detection

| Input | Search |
|-------|--------|
| `418-90-8868` | SSN lookup |
| `John Smith` | Name / SSN search |
| `John Smith CA` | Intelius |
| `John Smith Los Angeles CA` | Criminal lookup |
| `5551234567` | Mobile / phone |
| `1HGBH41JXMN109186` | VIN |

Use commas for exact matching: `John, Smith, Los Angeles, CA`
