WELCOME = """
🤖 <b>Solana AI Meme Coin Trader</b>

The bot that scans, scores, and trades the best Solana meme coins automatically.

<b>What it does:</b>
• 🔍 Scans trending meme coins on DexScreener
• 🧠 AI scores each coin (liquidity, volume, buy pressure, rug risk)
• 🟢 Auto-buys top scored coins
• 🔴 Auto-sells when price drops (stop loss) or hits take profit

<b>Setup:</b>
1. Connect Phantom or import a trading wallet key
2. Set your trade size & stop loss
3. Hit <b>Start Auto Trade</b>

⚠️ <b>Auto trading requires a wallet private key</b> so the bot can sign swaps via Jupiter. Use a dedicated trading wallet — never your main wallet.

Made for degens who want the bot to do the work.
"""

HELP = """
<b>Commands</b>
/start — Main menu
/scan — Scan best meme coins now
/wallet — Connect or import wallet
/balance — Check SOL balance
/positions — Open positions
/autotrade — Toggle auto trading
/settings — Trade settings
/stop — Emergency stop auto trade

<b>Auto Trade Logic</b>
• Scans every ~45 seconds
• Buys coins with AI score ≥ 72
• Stop loss: sells when down X% (default 15%)
• Take profit: sells when up X% (default 50%)
• Flash dump protection: exits on sudden 5m crashes

<b>AI Score Factors</b>
Liquidity depth · Volume momentum · Buy/sell ratio · Price action · Rug pull detection · Market cap sweet spot
"""
