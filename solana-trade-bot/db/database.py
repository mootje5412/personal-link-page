import json
from datetime import datetime, timezone
from typing import Any

import aiosqlite

from config import DB_PATH, DEFAULT_MAX_POSITIONS, DEFAULT_STOP_LOSS_PCT, DEFAULT_TAKE_PROFIT_PCT, DEFAULT_TRADE_SOL


async def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY,
                wallet_pubkey TEXT,
                encrypted_key TEXT,
                autotrade INTEGER DEFAULT 0,
                trade_sol REAL DEFAULT 0.05,
                stop_loss_pct REAL DEFAULT 15,
                take_profit_pct REAL DEFAULT 50,
                max_positions INTEGER DEFAULT 3,
                created_at TEXT,
                updated_at TEXT
            );

            CREATE TABLE IF NOT EXISTS positions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token_mint TEXT NOT NULL,
                token_symbol TEXT,
                token_name TEXT,
                pair_address TEXT,
                entry_price REAL NOT NULL,
                entry_amount_sol REAL NOT NULL,
                token_amount REAL,
                ai_score REAL,
                status TEXT DEFAULT 'open',
                exit_price REAL,
                exit_reason TEXT,
                pnl_pct REAL,
                opened_at TEXT,
                closed_at TEXT,
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            );

            CREATE TABLE IF NOT EXISTS trade_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                action TEXT,
                token_mint TEXT,
                token_symbol TEXT,
                amount_sol REAL,
                tx_signature TEXT,
                details TEXT,
                created_at TEXT
            );
            """
        )
        await db.commit()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def get_user(user_id: int) -> dict[str, Any] | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM users WHERE user_id = ?", (user_id,)) as cur:
            row = await cur.fetchone()
            return dict(row) if row else None


async def upsert_user(user_id: int, **fields: Any) -> dict[str, Any]:
    existing = await get_user(user_id)
    now = _now()
    if not existing:
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute(
                """
                INSERT INTO users (user_id, trade_sol, stop_loss_pct, take_profit_pct, max_positions, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (user_id, DEFAULT_TRADE_SOL, DEFAULT_STOP_LOSS_PCT, DEFAULT_TAKE_PROFIT_PCT, DEFAULT_MAX_POSITIONS, now, now),
            )
            await db.commit()
        existing = await get_user(user_id)

    if fields:
        sets = ", ".join(f"{k} = ?" for k in fields)
        values = list(fields.values()) + [now, user_id]
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute(f"UPDATE users SET {sets}, updated_at = ? WHERE user_id = ?", values)
            await db.commit()

    return await get_user(user_id) or {}


async def set_wallet(user_id: int, pubkey: str, encrypted_key: str | None = None) -> None:
    await upsert_user(user_id, wallet_pubkey=pubkey, encrypted_key=encrypted_key)


async def set_autotrade(user_id: int, enabled: bool) -> None:
    await upsert_user(user_id, autotrade=1 if enabled else 0)


async def get_autotrade_users() -> list[dict[str, Any]]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM users WHERE autotrade = 1 AND wallet_pubkey IS NOT NULL") as cur:
            rows = await cur.fetchall()
            return [dict(r) for r in rows]


async def add_position(
    user_id: int,
    token_mint: str,
    token_symbol: str,
    token_name: str,
    pair_address: str,
    entry_price: float,
    entry_amount_sol: float,
    token_amount: float,
    ai_score: float,
) -> int:
    now = _now()
    async with aiosqlite.connect(DB_PATH) as db:
        cur = await db.execute(
            """
            INSERT INTO positions (
                user_id, token_mint, token_symbol, token_name, pair_address,
                entry_price, entry_amount_sol, token_amount, ai_score, opened_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (user_id, token_mint, token_symbol, token_name, pair_address, entry_price, entry_amount_sol, token_amount, ai_score, now),
        )
        await db.commit()
        return cur.lastrowid or 0


async def get_open_positions(user_id: int) -> list[dict[str, Any]]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM positions WHERE user_id = ? AND status = 'open' ORDER BY opened_at DESC",
            (user_id,),
        ) as cur:
            return [dict(r) for r in await cur.fetchall()]


async def close_position(position_id: int, exit_price: float, exit_reason: str, pnl_pct: float) -> None:
    now = _now()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            UPDATE positions SET status = 'closed', exit_price = ?, exit_reason = ?, pnl_pct = ?, closed_at = ?
            WHERE id = ?
            """,
            (exit_price, exit_reason, pnl_pct, now, position_id),
        )
        await db.commit()


async def log_trade(user_id: int, action: str, token_mint: str, token_symbol: str, amount_sol: float, tx_sig: str, details: dict) -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            INSERT INTO trade_log (user_id, action, token_mint, token_symbol, amount_sol, tx_signature, details, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (user_id, action, token_mint, token_symbol, amount_sol, tx_sig, json.dumps(details), _now()),
        )
        await db.commit()
