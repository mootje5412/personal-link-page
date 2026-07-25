import asyncio
import logging
import time
from typing import Awaitable, Callable

from config import (
    EXIT_CHECK_SEC,
    LAMPORTS_PER_SOL,
    MIN_AI_SCORE,
    MIN_RESERVE_SOL,
    SCAN_INTERVAL_SEC,
    SELL_SLIPPAGE_BPS,
    SLIPPAGE_BPS,
)
from db.database import (
    add_position,
    close_position,
    get_autotrade_users,
    get_open_positions,
    log_trade,
    update_position_peak,
)
from services.ai_scorer import rank_coins
from services.crypto_store import decrypt_private_key
from services.jupiter import swap_sol_for_token, swap_token_for_sol
from services.scanner import MemeCoin, get_token_price_cached, scan_meme_coins
from services.wallet import get_balance_sol, get_token_balance_raw, keypair_from_private_key

logger = logging.getLogger(__name__)

# Prevent spamming low-balance warnings
_low_balance_warned: dict[int, float] = {}
WARN_COOLDOWN_SEC = 3600


class AutoTrader:
    def __init__(self, notify: Callable[[int, str], Awaitable[None]] | None = None):
        self._running = False
        self._scan_task: asyncio.Task | None = None
        self._exit_task: asyncio.Task | None = None
        self._notify = notify

    async def start(self) -> None:
        if self._running:
            return
        self._running = True
        self._scan_task = asyncio.create_task(self._scan_loop())
        self._exit_task = asyncio.create_task(self._exit_loop())
        logger.info("AutoTrader started (scan=%ss, exit=%ss)", SCAN_INTERVAL_SEC, EXIT_CHECK_SEC)

    async def stop(self) -> None:
        self._running = False
        for task in (self._scan_task, self._exit_task):
            if task:
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass
        logger.info("AutoTrader stopped")

    async def _notify_user(self, user_id: int, msg: str) -> None:
        if self._notify:
            try:
                await self._notify(user_id, msg)
            except Exception as exc:
                logger.error("Notify failed for %s: %s", user_id, exc)

    async def _scan_loop(self) -> None:
        while self._running:
            try:
                for user in await get_autotrade_users():
                    try:
                        await self._process_buys(user)
                    except Exception as exc:
                        logger.error("Buy loop user %s: %s", user["user_id"], exc)
            except Exception as exc:
                logger.error("Scan loop error: %s", exc)
            await asyncio.sleep(SCAN_INTERVAL_SEC)

    async def _exit_loop(self) -> None:
        while self._running:
            try:
                for user in await get_autotrade_users():
                    try:
                        positions = await get_open_positions(user["user_id"])
                        if positions:
                            await self._check_exits(user, positions)
                    except Exception as exc:
                        logger.error("Exit loop user %s: %s", user["user_id"], exc)
            except Exception as exc:
                logger.error("Exit loop error: %s", exc)
            await asyncio.sleep(EXIT_CHECK_SEC)

    async def _process_buys(self, user: dict) -> None:
        user_id = user["user_id"]
        if not user.get("encrypted_key"):
            return

        open_positions = await get_open_positions(user_id)
        max_pos = int(user.get("max_positions") or 3)
        if len(open_positions) >= max_pos:
            return

        balance = await get_balance_sol(user["wallet_pubkey"])
        trade_sol = float(user.get("trade_sol") or 0.05)
        needed = trade_sol + MIN_RESERVE_SOL

        if balance < needed:
            last = _low_balance_warned.get(user_id, 0)
            if time.time() - last > WARN_COOLDOWN_SEC:
                _low_balance_warned[user_id] = time.time()
                await self._notify_user(
                    user_id,
                    f"⚠️ <b>Low Balance</b>\n\n"
                    f"Have: {balance:.4f} SOL\n"
                    f"Need: {needed:.4f} SOL per trade\n\n"
                    f"Send SOL to your trading wallet to continue.",
                )
            return

        coins = await scan_meme_coins()
        ranked = rank_coins(coins)
        top = [c for c in ranked if c.ai_score >= MIN_AI_SCORE and not c.is_scam]

        held_mints = {p["token_mint"] for p in open_positions}
        bought = 0
        for coin in top[:8]:
            if coin.mint in held_mints:
                continue
            current = await get_open_positions(user_id)
            if len(current) >= max_pos:
                break
            await self._buy(user, coin, trade_sol)
            held_mints.add(coin.mint)
            bought += 1
            if bought >= 2:
                break
            await asyncio.sleep(3)

    async def _buy(self, user: dict, coin: MemeCoin, trade_sol: float) -> None:
        user_id = user["user_id"]
        key = decrypt_private_key(user_id, user["encrypted_key"])
        kp = keypair_from_private_key(key)
        lamports = int(trade_sol * LAMPORTS_PER_SOL)

        try:
            sig, details = await swap_sol_for_token(kp, coin.mint, lamports, SLIPPAGE_BPS)
            out_amount = details.get("out_amount", 0)
            impact = details.get("price_impact", 0)

            await add_position(
                user_id=user_id,
                token_mint=coin.mint,
                token_symbol=coin.symbol,
                token_name=coin.name,
                pair_address=coin.pair_address,
                entry_price=coin.price_usd,
                entry_amount_sol=trade_sol,
                token_amount=float(out_amount),
                ai_score=coin.ai_score,
                peak_price=coin.price_usd,
            )
            await log_trade(user_id, "BUY", coin.mint, coin.symbol, trade_sol, sig, {
                "ai_score": coin.ai_score, "price_impact": impact,
            })

            signals = "\n".join(f"   {s}" for s in coin.ai_signals[:3])
            msg = (
                f"🟢 <b>BOUGHT ${coin.symbol}</b>\n\n"
                f"💰 Spent: {trade_sol} SOL\n"
                f"🤖 AI Score: <b>{coin.ai_score}/100</b>\n"
                f"💵 Entry: ${coin.price_usd:.8f}\n"
                f"💧 Liq: ${coin.liquidity_usd:,.0f} | Vol: ${coin.volume_24h:,.0f}\n"
                f"📊 Impact: {impact:.2f}%\n"
                f"{signals}\n"
                f"🔗 <a href='https://solscan.io/tx/{sig}'>View TX</a> · "
                f"<a href='{coin.url}'>Chart</a>"
            )
            await self._notify_user(user_id, msg)
        except Exception as exc:
            logger.warning("Buy failed %s for user %s: %s", coin.symbol, user_id, exc)

    async def _check_exits(self, user: dict, positions: list[dict]) -> None:
        user_id = user["user_id"]
        stop_loss = float(user.get("stop_loss_pct") or 15)
        take_profit = float(user.get("take_profit_pct") or 50)
        trailing = float(user.get("trailing_stop_pct") or 10)

        for pos in positions:
            coin = await get_token_price_cached(pos["token_mint"])
            if not coin or coin.price_usd <= 0:
                continue

            entry = float(pos["entry_price"])
            current = coin.price_usd
            peak = float(pos.get("peak_price") or entry)

            if current > peak:
                peak = current
                await update_position_peak(pos["id"], peak)

            pnl_pct = ((current - entry) / entry) * 100
            drop_from_peak = ((current - peak) / peak) * 100 if peak > 0 else 0

            should_sell = False
            reason = ""

            if pnl_pct <= -stop_loss:
                should_sell = True
                reason = f"🛑 Stop Loss ({pnl_pct:.1f}%)"
            elif pnl_pct >= take_profit:
                should_sell = True
                reason = f"🎯 Take Profit ({pnl_pct:+.1f}%)"
            elif pnl_pct > 10 and drop_from_peak <= -trailing:
                should_sell = True
                reason = f"📐 Trailing Stop ({pnl_pct:+.1f}%, peak drop {drop_from_peak:.1f}%)"
            elif coin.price_change_m5 <= -15 and pnl_pct < -3:
                should_sell = True
                reason = f"📉 Flash Crash ({coin.price_change_m5:.1f}% in 5m)"
            elif coin.sells_1h > coin.buys_1h * 2 and pnl_pct < -4:
                should_sell = True
                reason = f"🔴 Heavy Sell Pressure ({pnl_pct:.1f}%)"
            elif coin.liquidity_usd < 5_000:
                should_sell = True
                reason = f"🚨 Liquidity Collapsed — Emergency Exit"
            elif coin.is_scam:
                should_sell = True
                reason = f"🚨 Scam Flagged — Emergency Exit"

            if should_sell:
                await self._sell(user, pos, coin, reason, pnl_pct)

    async def _sell(self, user: dict, pos: dict, coin: MemeCoin, reason: str, pnl_pct: float) -> None:
        user_id = user["user_id"]
        if not user.get("encrypted_key"):
            return

        key = decrypt_private_key(user_id, user["encrypted_key"])
        kp = keypair_from_private_key(key)

        # Always use on-chain balance for accurate sell amount
        token_raw = await get_token_balance_raw(user["wallet_pubkey"], pos["token_mint"])
        if token_raw <= 0:
            await close_position(pos["id"], coin.price_usd, reason + " (no balance)", pnl_pct)
            return

        try:
            sig, details = await swap_token_for_sol(kp, pos["token_mint"], token_raw, SELL_SLIPPAGE_BPS)
            out_sol = details.get("out_lamports", 0) / LAMPORTS_PER_SOL
            entry_sol = float(pos.get("entry_amount_sol") or 0)
            sol_pnl = out_sol - entry_sol

            await close_position(pos["id"], coin.price_usd, reason, pnl_pct)
            await log_trade(user_id, "SELL", pos["token_mint"], pos["token_symbol"], out_sol, sig, {
                "pnl_pct": pnl_pct, "sol_pnl": sol_pnl, "reason": reason,
            })

            emoji = "💰" if pnl_pct >= 0 else "🔴"
            msg = (
                f"{emoji} <b>SOLD ${pos['token_symbol']}</b>\n\n"
                f"📋 {reason}\n"
                f"💰 Received: {out_sol:.4f} SOL ({sol_pnl:+.4f} SOL)\n"
                f"📊 PnL: <b>{pnl_pct:+.1f}%</b>\n"
                f"💵 Exit: ${coin.price_usd:.8f}\n"
                f"🔗 <a href='https://solscan.io/tx/{sig}'>View TX</a>"
            )
            await self._notify_user(user_id, msg)
        except Exception as exc:
            logger.error("Sell failed %s: %s", pos["token_symbol"], exc)
            await self._notify_user(user_id, f"❌ Sell failed for ${pos['token_symbol']}: {exc}")

    async def sell_position_manual(self, user: dict, pos: dict) -> tuple[bool, str]:
        coin = await get_token_price_cached(pos["token_mint"])
        if not coin:
            return False, "Could not fetch price"
        entry = float(pos["entry_price"])
        pnl = ((coin.price_usd - entry) / entry) * 100 if entry > 0 else 0
        await self._sell(user, pos, coin, "👤 Manual Sell", pnl)
        return True, "Sell executed"


auto_trader = AutoTrader()
