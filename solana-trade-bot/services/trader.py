import asyncio
import logging
import time
from typing import Awaitable, Callable

from config import (
    EXIT_CHECK_SEC,
    LAMPORTS_PER_SOL,
    MIN_RESERVE_SOL,
    REBUY_COOLDOWN_HOURS,
    SCAN_INTERVAL_SEC,
    SELL_SLIPPAGE_BPS,
    SLIPPAGE_BPS,
)
from db.database import (
    add_position,
    close_position,
    get_autotrade_users,
    get_cooldown_mints,
    get_open_positions,
    log_trade,
    update_position_peak,
)
from services.ai_scorer import rank_coins
from services.crypto_store import decrypt_private_key
from services.entry_filter import validate_entry
from services.jupiter import swap_sol_for_token, swap_token_for_sol
from services.scanner import MemeCoin, get_token_price_cached, scan_meme_coins
from services.wallet import get_balance_sol, get_token_balance_raw, keypair_from_private_key

logger = logging.getLogger(__name__)

_low_balance_warned: dict[int, float] = {}
_fail_warned: dict[int, float] = {}
_no_candidate_warned: dict[int, float] = {}
WARN_COOLDOWN_SEC = 3600

# Cache last scan for manual buy buttons
_last_scan: dict[str, MemeCoin] = {}

# Per-user autotrade status for dashboard
_autotrade_status: dict[int, dict] = {}


def get_autotrade_status(user_id: int) -> dict:
    return _autotrade_status.get(user_id, {})


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
        logger.info("AutoTrader v3 started (scan=%ss exit=%ss)", SCAN_INTERVAL_SEC, EXIT_CHECK_SEC)

    async def stop(self) -> None:
        self._running = False
        for task in (self._scan_task, self._exit_task):
            if task:
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

    async def _notify_user(self, user_id: int, msg: str, user: dict | None = None) -> None:
        if user and not user.get("notify_trades", 1):
            return
        if self._notify:
            try:
                await self._notify(user_id, msg)
            except Exception as exc:
                logger.error("Notify failed %s: %s", user_id, exc)

    def _set_status(self, user_id: int, **fields) -> None:
        status = _autotrade_status.setdefault(user_id, {})
        status.update(fields)
        status["updated_at"] = time.time()

    async def _scan_loop(self) -> None:
        while self._running:
            try:
                for user in await get_autotrade_users():
                    try:
                        await self._process_buys(user)
                    except Exception as exc:
                        logger.error("Buy user %s: %s", user["user_id"], exc)
                        self._set_status(user["user_id"], last_error=str(exc), state="error")
            except Exception as exc:
                logger.error("Scan loop: %s", exc)
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
                        logger.error("Exit user %s: %s", user["user_id"], exc)
            except Exception as exc:
                logger.error("Exit loop: %s", exc)
            await asyncio.sleep(EXIT_CHECK_SEC)

    async def _process_buys(self, user: dict) -> None:
        user_id = user["user_id"]
        if not user.get("encrypted_key"):
            self._set_status(user_id, state="no_wallet_key")
            return

        open_positions = await get_open_positions(user_id)
        max_pos = int(user.get("max_positions") or 3)
        if len(open_positions) >= max_pos:
            self._set_status(
                user_id, state="max_positions", open_positions=len(open_positions), max_positions=max_pos,
            )
            return

        balance = await get_balance_sol(user["wallet_pubkey"])
        trade_sol = float(user.get("trade_sol") or 0.05)
        needed = trade_sol + MIN_RESERVE_SOL

        if balance < needed:
            self._set_status(
                user_id, state="low_balance", balance=balance, needed=needed,
            )
            last = _low_balance_warned.get(user_id, 0)
            if time.time() - last > WARN_COOLDOWN_SEC:
                _low_balance_warned[user_id] = time.time()
                await self._notify_user(user_id,
                    f"<b>Low Balance</b>\n\n{balance:.4f} SOL available · need {needed:.4f} SOL per trade",
                    user)
            return

        coins = await scan_meme_coins()
        ranked = rank_coins(coins)
        min_score = float(user.get("min_ai_score") or 75)

        global _last_scan
        for c in ranked[:15]:
            _last_scan[c.mint] = c

        cooldown = await get_cooldown_mints(user_id, REBUY_COOLDOWN_HOURS)
        held = {p["token_mint"] for p in open_positions}

        candidates = []
        blocked_samples = []
        for coin in ranked:
            if coin.mint in held or coin.mint in cooldown:
                continue
            ok, reason = validate_entry(coin, min_score)
            if ok:
                candidates.append(coin)
            elif len(blocked_samples) < 3:
                blocked_samples.append(f"${coin.symbol}: {reason}")

        self._set_status(
            user_id,
            state="scanning",
            scanned=len(ranked),
            candidates=len(candidates),
            balance=balance,
            top_pick=f"${candidates[0].symbol}" if candidates else None,
            blocked=blocked_samples,
        )

        if not candidates:
            self._set_status(user_id, state="waiting", scanned=len(ranked), candidates=0)
            last = _no_candidate_warned.get(user_id, 0)
            if time.time() - last > WARN_COOLDOWN_SEC:
                _no_candidate_warned[user_id] = time.time()
                top = ranked[0] if ranked else None
                detail = ""
                if top:
                    _, reason = validate_entry(top, min_score)
                    detail = f"\nTop coin ${top.symbol} ({top.ai_score}/100) blocked: {reason}"
                await self._notify_user(
                    user_id,
                    f"<b>Auto Trade — Waiting</b>\n\n"
                    f"Scanned {len(ranked)} coins. None pass entry filters right now.{detail}\n\n"
                    f"Try Balanced/Degen mode or run Best Buys to buy manually.",
                    user,
                )
            return

        bought = 0
        last_fail = ""
        for coin in candidates[:6]:
            current = await get_open_positions(user_id)
            if len(current) >= max_pos:
                break
            success, err = await self._buy(user, coin, trade_sol)
            if success:
                bought += 1
                self._set_status(user_id, state="bought", last_buy=coin.symbol, last_buy_at=time.time())
                break
            last_fail = err
            await asyncio.sleep(2)

        if bought == 0 and last_fail:
            self._set_status(user_id, state="swap_failed", last_error=last_fail, candidates=len(candidates))
            last = _fail_warned.get(user_id, 0)
            if time.time() - last > WARN_COOLDOWN_SEC:
                _fail_warned[user_id] = time.time()
                await self._notify_user(
                    user_id,
                    f"<b>Auto Trade — Buy Failed</b>\n\n"
                    f"Found {len(candidates)} coin(s) but swap failed:\n{last_fail}\n\n"
                    f"Retrying automatically. Check /dashboard for status.",
                    user,
                )

    async def _buy(self, user: dict, coin: MemeCoin, trade_sol: float) -> tuple[bool, str]:
        user_id = user["user_id"]
        key = decrypt_private_key(user_id, user["encrypted_key"])
        kp = keypair_from_private_key(key)
        lamports = int(trade_sol * LAMPORTS_PER_SOL)

        try:
            sig, details = await swap_sol_for_token(kp, coin.mint, lamports, SLIPPAGE_BPS)
            out_amount = details.get("out_amount", 0)
            impact = details.get("price_impact", 0)

            await add_position(
                user_id=user_id, token_mint=coin.mint, token_symbol=coin.symbol,
                token_name=coin.name, pair_address=coin.pair_address,
                entry_price=coin.price_usd, entry_amount_sol=trade_sol,
                token_amount=float(out_amount), ai_score=coin.ai_score,
                peak_price=coin.price_usd,
            )
            await log_trade(user_id, "BUY", coin.mint, coin.symbol, trade_sol, sig,
                {"ai_score": coin.ai_score, "price_impact": impact})

            signals = "\n".join(f"- {s}" for s in coin.ai_signals[:3])
            msg = (
                f"<b>BOUGHT ${coin.symbol}</b>\n\n"
                f"Amount: {trade_sol} SOL at ${coin.price_usd:.8f}\n"
                f"AI Score: {coin.ai_score}/100 ({getattr(coin, 'ai_verdict', 'BUY')})\n"
                f"Impact: {impact:.1f}%\n\n"
                f"Liquidity: ${coin.liquidity_usd:,.0f} | Volume: ${coin.volume_24h:,.0f}\n"
                f"1h: {coin.price_change_h1:+.1f}% | 5m: {coin.price_change_m5:+.1f}%\n"
                f"{signals}\n\n"
                f"Stop: -{user.get('stop_loss_pct', 15)}% | Target: +{user.get('take_profit_pct', 50)}%\n"
                f"<a href='https://solscan.io/tx/{sig}'>Transaction</a> | <a href='{coin.url}'>Chart</a>"
            )
            await self._notify_user(user_id, msg, user)
            return True, ""
        except Exception as exc:
            err = str(exc)
            logger.warning("Buy fail %s: %s", coin.symbol, err)
            return False, f"${coin.symbol}: {err}"

    async def buy_coin(self, user: dict, mint: str) -> tuple[bool, str]:
        coin = _last_scan.get(mint) or await get_token_price_cached(mint)
        if not coin:
            return False, "Coin not found"
        min_score = float(user.get("min_ai_score") or 75)
        ok, reason = validate_entry(coin, min_score)
        if not ok:
            return False, f"Entry rejected: {reason}"
        trade_sol = float(user.get("trade_sol") or 0.05)
        success, err = await self._buy(user, coin, trade_sol)
        if success:
            return True, f"Bought ${coin.symbol}"
        return False, err or "Swap failed — try again"

    async def buy_top_coin(self, user: dict) -> tuple[bool, str]:
        coins = await scan_meme_coins()
        ranked = rank_coins(coins)
        min_score = float(user.get("min_ai_score") or 75)
        last_err = ""
        for coin in ranked:
            ok, reason = validate_entry(coin, min_score)
            if ok:
                trade_sol = float(user.get("trade_sol") or 0.05)
                success, err = await self._buy(user, coin, trade_sol)
                if success:
                    return True, f"Bought ${coin.symbol} ({coin.ai_score}/100)"
                last_err = err
        if last_err:
            return False, last_err
        return False, "No coins pass entry filters right now"

    async def sell_all(self, user: dict) -> tuple[int, int]:
        positions = await get_open_positions(user["user_id"])
        ok = 0
        for pos in positions:
            coin = await get_token_price_cached(pos["token_mint"])
            if not coin:
                continue
            entry = float(pos["entry_price"])
            pnl = ((coin.price_usd - entry) / entry * 100) if entry > 0 else 0
            try:
                await self._sell(user, pos, coin, "Sell All", pnl)
                ok += 1
            except Exception:
                pass
            await asyncio.sleep(2)
        return ok, len(positions)

    async def _check_exits(self, user: dict, positions: list[dict]) -> None:
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
            should_sell, reason = False, ""

            if pnl_pct <= -stop_loss:
                should_sell, reason = True, f"Stop Loss ({pnl_pct:.1f}%)"
            elif pnl_pct >= take_profit:
                should_sell, reason = True, f"Take Profit ({pnl_pct:+.1f}%)"
            elif pnl_pct > 8 and drop_from_peak <= -trailing:
                should_sell, reason = True, f"Trailing Stop ({pnl_pct:+.1f}%)"
            elif coin.price_change_m5 <= -15 and pnl_pct < -2:
                should_sell, reason = True, f"Flash Crash ({coin.price_change_m5:.0f}% in 5m)"
            elif coin.sells_1h > coin.buys_1h * 2.2 and pnl_pct < -3:
                should_sell, reason = True, f"Sell Pressure ({pnl_pct:.1f}%)"
            elif coin.liquidity_usd < 8_000:
                should_sell, reason = True, "Liquidity Collapse"
            elif coin.is_scam:
                should_sell, reason = True, "Scam Detected"

            if should_sell:
                await self._sell(user, pos, coin, reason, pnl_pct)

    async def _sell(self, user: dict, pos: dict, coin: MemeCoin, reason: str, pnl_pct: float) -> None:
        user_id = user["user_id"]
        if not user.get("encrypted_key"):
            return

        kp = keypair_from_private_key(decrypt_private_key(user_id, user["encrypted_key"]))
        token_raw = await get_token_balance_raw(user["wallet_pubkey"], pos["token_mint"])
        if token_raw <= 0:
            await close_position(pos["id"], coin.price_usd, reason + " (empty)", pnl_pct)
            return

        try:
            sig, details = await swap_token_for_sol(kp, pos["token_mint"], token_raw, SELL_SLIPPAGE_BPS)
            out_sol = details.get("out_lamports", 0) / LAMPORTS_PER_SOL
            entry_sol = float(pos.get("entry_amount_sol") or 0)
            sol_pnl = out_sol - entry_sol

            await close_position(pos["id"], coin.price_usd, reason, pnl_pct)
            await log_trade(user_id, "SELL", pos["token_mint"], pos["token_symbol"], out_sol, sig,
                {"pnl_pct": pnl_pct, "sol_pnl": sol_pnl, "reason": reason})

            tag = "PROFIT" if pnl_pct >= 0 else "LOSS"
            msg = (
                f"<b>SOLD ${pos['token_symbol']}</b> [{tag}]\n\n"
                f"Reason: {reason}\n\n"
                f"Received: {out_sol:.4f} SOL ({sol_pnl:+.4f} SOL)\n"
                f"PnL: {pnl_pct:+.1f}%\n"
                f"<a href='https://solscan.io/tx/{sig}'>Transaction</a>"
            )
            await self._notify_user(user_id, msg, user)
        except Exception as exc:
            logger.error("Sell fail %s: %s", pos["token_symbol"], exc)
            await self._notify_user(user_id, f"Sell failed ${pos['token_symbol']}: {exc}", user)
            raise

    async def sell_position_manual(self, user: dict, pos: dict) -> tuple[bool, str]:
        coin = await get_token_price_cached(pos["token_mint"])
        if not coin:
            return False, "Price unavailable"
        entry = float(pos["entry_price"])
        pnl = ((coin.price_usd - entry) / entry) * 100 if entry > 0 else 0
        try:
            await self._sell(user, pos, coin, "Manual Sell", pnl)
            return True, "Sold!"
        except Exception as exc:
            return False, str(exc)


auto_trader = AutoTrader()


def cache_scan_results(coins: list[MemeCoin]) -> None:
    global _last_scan
    for c in coins:
        _last_scan[c.mint] = c


def get_cached_coin(mint: str) -> MemeCoin | None:
    return _last_scan.get(mint)
