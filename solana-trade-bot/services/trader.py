import asyncio
import logging
from typing import Callable, Awaitable

from config import LAMPORTS_PER_SOL, MIN_AI_SCORE, SCAN_INTERVAL_SEC, SLIPPAGE_BPS
from db.database import (
    add_position,
    close_position,
    get_autotrade_users,
    get_open_positions,
    log_trade,
)
from services.ai_scorer import rank_coins
from services.crypto_store import decrypt_private_key
from services.jupiter import swap_sol_for_token, swap_token_for_sol
from services.scanner import scan_meme_coins, MemeCoin
from services.wallet import get_balance_sol, keypair_from_private_key

logger = logging.getLogger(__name__)


class AutoTrader:
    def __init__(self, notify: Callable[[int, str], Awaitable[None]] | None = None):
        self._running = False
        self._task: asyncio.Task | None = None
        self._notify = notify

    async def start(self) -> None:
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._loop())
        logger.info("AutoTrader started")

    async def stop(self) -> None:
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("AutoTrader stopped")

    async def _notify_user(self, user_id: int, msg: str) -> None:
        if self._notify:
            try:
                await self._notify(user_id, msg)
            except Exception as exc:
                logger.error("Notify failed for %s: %s", user_id, exc)

    async def _loop(self) -> None:
        while self._running:
            try:
                users = await get_autotrade_users()
                for user in users:
                    try:
                        await self._process_user(user)
                    except Exception as exc:
                        logger.error("User %s trade error: %s", user["user_id"], exc)
            except Exception as exc:
                logger.error("AutoTrader loop error: %s", exc)
            await asyncio.sleep(SCAN_INTERVAL_SEC)

    async def _process_user(self, user: dict) -> None:
        user_id = user["user_id"]
        if not user.get("encrypted_key"):
            return

        open_positions = await get_open_positions(user_id)
        await self._check_exits(user, open_positions)

        if len(open_positions) >= user.get("max_positions", 3):
            return

        balance = await get_balance_sol(user["wallet_pubkey"])
        trade_sol = float(user.get("trade_sol") or 0.05)
        if balance < trade_sol + 0.01:
            await self._notify_user(user_id, f"⚠️ Low balance: {balance:.4f} SOL. Need {trade_sol} SOL + fees.")
            return

        coins = await scan_meme_coins()
        ranked = rank_coins(coins)
        top = [c for c in ranked if c.ai_score >= MIN_AI_SCORE]

        held_mints = {p["token_mint"] for p in open_positions}
        for coin in top[:5]:
            if coin.mint in held_mints:
                continue
            if len(await get_open_positions(user_id)) >= user.get("max_positions", 3):
                break
            await self._buy(user, coin, trade_sol)
            await asyncio.sleep(2)

    async def _buy(self, user: dict, coin: MemeCoin, trade_sol: float) -> None:
        user_id = user["user_id"]
        key = decrypt_private_key(user_id, user["encrypted_key"])
        kp = keypair_from_private_key(key)
        lamports = int(trade_sol * LAMPORTS_PER_SOL)

        try:
            sig, details = await swap_sol_for_token(kp, coin.mint, lamports, SLIPPAGE_BPS)
            out_amount = details.get("out_amount", 0)
            token_amount = out_amount / (10 ** 6)  # approximate, varies by decimals

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
            )
            await log_trade(user_id, "BUY", coin.mint, coin.symbol, trade_sol, sig, {"ai_score": coin.ai_score})

            msg = (
                f"🟢 <b>BOUGHT {coin.symbol}</b>\n\n"
                f"💰 Amount: {trade_sol} SOL\n"
                f"🤖 AI Score: {coin.ai_score}/100\n"
                f"💵 Price: ${coin.price_usd:.8f}\n"
                f"📊 Liq: ${coin.liquidity_usd:,.0f}\n"
                f"🔗 <a href='{coin.url}'>DexScreener</a>\n"
                f"📝 TX: <code>{sig[:20]}...</code>"
            )
            await self._notify_user(user_id, msg)
        except Exception as exc:
            await self._notify_user(user_id, f"❌ Buy failed for {coin.symbol}: {exc}")

    async def _check_exits(self, user: dict, positions: list[dict]) -> None:
        if not positions:
            return

        user_id = user["user_id"]
        stop_loss = float(user.get("stop_loss_pct") or 15)
        take_profit = float(user.get("take_profit_pct") or 50)

        coins = await scan_meme_coins(limit=50)
        price_map = {c.mint: c for c in coins}

        for pos in positions:
            coin = price_map.get(pos["token_mint"])
            if not coin:
                from services.scanner import get_token_price

                coin = await get_token_price(pos["token_mint"])
                if not coin:
                    continue

            if not coin or coin.price_usd <= 0:
                continue

            entry = float(pos["entry_price"])
            current = coin.price_usd
            pnl_pct = ((current - entry) / entry) * 100

            should_sell = False
            reason = ""

            if pnl_pct <= -stop_loss:
                should_sell = True
                reason = f"🛑 Stop Loss ({pnl_pct:.1f}%)"
            elif pnl_pct >= take_profit:
                should_sell = True
                reason = f"🎯 Take Profit ({pnl_pct:.+.1f}%)"
            elif coin.price_change_m5 <= -12 and pnl_pct < 0:
                should_sell = True
                reason = f"📉 Flash dump ({coin.price_change_m5:.1f}% 5m)"
            elif coin.sells_1h > coin.buys_1h * 1.5 and pnl_pct < -5:
                should_sell = True
                reason = f"🔴 Sell pressure exit ({pnl_pct:.1f}%)"

            if should_sell:
                await self._sell(user, pos, coin, reason, pnl_pct)

    async def _sell(self, user: dict, pos: dict, coin: MemeCoin, reason: str, pnl_pct: float) -> None:
        user_id = user["user_id"]
        if not user.get("encrypted_key"):
            return

        key = decrypt_private_key(user_id, user["encrypted_key"])
        kp = keypair_from_private_key(key)
        token_amount_raw = int(float(pos.get("token_amount") or 0))

        if token_amount_raw <= 0:
            await close_position(pos["id"], coin.price_usd, reason, pnl_pct)
            return

        try:
            sig, details = await swap_token_for_sol(kp, pos["token_mint"], token_amount_raw, SLIPPAGE_BPS + 200)
            out_sol = details.get("out_lamports", 0) / LAMPORTS_PER_SOL

            await close_position(pos["id"], coin.price_usd, reason, pnl_pct)
            await log_trade(user_id, "SELL", pos["token_mint"], pos["token_symbol"], out_sol, sig, {"pnl_pct": pnl_pct, "reason": reason})

            emoji = "🟢" if pnl_pct >= 0 else "🔴"
            msg = (
                f"{emoji} <b>SOLD {pos['token_symbol']}</b>\n\n"
                f"📋 Reason: {reason}\n"
                f"💰 Received: ~{out_sol:.4f} SOL\n"
                f"📊 PnL: {pnl_pct:+.1f}%\n"
                f"💵 Exit: ${coin.price_usd:.8f}\n"
                f"📝 TX: <code>{sig[:20]}...</code>"
            )
            await self._notify_user(user_id, msg)
        except Exception as exc:
            await self._notify_user(user_id, f"❌ Sell failed for {pos['token_symbol']}: {exc}")


auto_trader = AutoTrader()
