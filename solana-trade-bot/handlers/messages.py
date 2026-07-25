WELCOME = """
<b>Solana AI Trader</b>

Focuses on <b>one coin at a time</b> with small, capped trades. Never deploys your full balance.

<b>Setup:</b>
1. Import wallet key
2. Pick Safe or Balanced mode
3. Start auto trade

Or ask the AI anything — just type your question.
"""

WELCOME_BACK = """
Welcome back. Your bot is ready.

One coin at a time, small trades only. Check the dashboard or run Best Buys.
"""

HELP = """
<b>Commands</b>

/start — Main menu
/scan — Best coin to buy with full breakdown
/ask — Ask the AI a question
/analyze SYMBOL — Deep analysis on any coin
/dashboard — Portfolio and auto trade status
/modes — Safe, Balanced, or Degen (all 1-coin focus)
/wallet — Import trading wallet
/balance — SOL balance
/positions — Your open trade (1 max)
/history — Past trades with exit reasons
/autotrade — Start or stop bot
/settings — Adjust settings
/stop — Emergency stop

<b>How it trades</b>
- Only 1 coin at a time
- Max 8% of balance per trade
- Keeps 0.08 SOL reserve always
- Tight stop loss to cut losses fast
"""

PROFIT_INFO = """
<b>Can This Make Money?</b>

Maybe — but there are no guarantees.

The bot uses small trades and strict filters to protect your balance. Meme coins are still high risk.

Use Safe mode. Only trade what you can afford to lose.
"""

SETUP_GUIDE = """
<b>Setup Guide</b>

<b>Step 1</b> — Create a new Phantom wallet. Send only the SOL you want to trade.

<b>Step 2</b> — Tap Import Wallet Key and paste your private key. It is encrypted and the message is deleted.

<b>Step 3</b> — Pick Safe or Balanced mode (both use 1 coin, small size).

<b>Step 4</b> — Tap Start Auto Trade.
"""

AUTOTRADE_ON = """
<b>Auto Trade Started</b>

Focus mode active:
- 1 coin at a time only
- Small trade size (capped % of your balance)
- 0.08 SOL always kept in reserve
- Tight stop loss and take profit
- Only buys the single best AI-rated coin

You will be notified on every trade.
"""

AUTOTRADE_OFF = """
<b>Auto Trade Stopped</b>

No new buys will be made. Open position is still held. Use Positions to sell manually.
"""
