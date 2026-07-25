import json
from datetime import datetime, timezone
from typing import Any

import aiosqlite

from config import DB_PATH, DEFAULT_MAX_POSITIONS, DEFAULT_STOP_LOSS_PCT, DEFAULT_TAKE_PROFIT_PCT, DEFAULT_TRAILING_STOP_PCT, DEFAULT_TRADE_SOL, MIN_AI_SCORE


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
                trailing_stop_pct REAL DEFAULT 10,
                max_positions INTEGER DEFAULT 3,
                min_ai_score REAL DEFAULT 75,
                risk_mode TEXT DEFAULT 'balanced',
                notify_trades INTEGER DEFAULT 1,
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
                peak_price REAL,
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
        # Migrate existing DBs
        migrations = [
            ("users", "trailing_stop_pct", f"REAL DEFAULT {DEFAULT_TRAILING_STOP_PCT}"),
            ("users", "min_ai_score", f"REAL DEFAULT {MIN_AI_SCORE}"),
            ("users", "risk_mode", "TEXT DEFAULT 'balanced'"),
            ("users", "notify_trades", "INTEGER DEFAULT 1"),
            ("positions", "peak_price", "REAL"),
        ]
        for table, col, typedef in migrations:
            try:
                await db.execute(f"ALTER TABLE {table} ADD COLUMN {col} {typedef}")
            except Exception:
                pass
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
                INSERT INTO users (user_id, trade_sol, stop_loss_pct, take_profit_pct, trailing_stop_pct, max_positions, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (user_id, DEFAULT_TRADE_SOL, DEFAULT_STOP_LOSS_PCT, DEFAULT_TAKE_PROFIT_PCT, DEFAULT_TRAILING_STOP_PCT, DEFAULT_MAX_POSITIONS, now, now),
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


async def disconnect_wallet(user_id: int) -> None:
    await upsert_user(user_id, wallet_pubkey=None, encrypted_key=None, autotrade=0)


async def apply_preset(user_id: int, preset: dict, mode_key: str) -> None:
    await upsert_user(
        user_id,
        trade_sol=preset["trade_sol"],
        stop_loss_pct=preset["stop_loss_pct"],
        take_profit_pct=preset["take_profit_pct"],
        trailing_stop_pct=preset["trailing_stop_pct"],
        max_positions=preset["max_positions"],
        min_ai_score=preset["min_ai_score"],
        risk_mode=mode_key,
    )


async def set_autotrade(user_id: int, enabled: bool) -> None:
    await upsert_user(user_id, autotrade=1 if enabled else 0)


async def get_autotrade_users() -> list[dict[str, Any]]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM users WHERE autotrade = 1 AND wallet_pubkey IS NOT NULL AND encrypted_key IS NOT NULL"
        ) as cur:
            return [dict(r) for r in await cur.fetchall()]


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
    peak_price: float | None = None,
) -> int:
    now = _now()
    async with aiosqlite.connect(DB_PATH) as db:
        cur = await db.execute(
            """
            INSERT INTO positions (
                user_id, token_mint, token_symbol, token_name, pair_address,
                entry_price, entry_amount_sol, token_amount, ai_score, peak_price, opened_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (user_id, token_mint, token_symbol, token_name, pair_address,
             entry_price, entry_amount_sol, token_amount, ai_score, peak_price or entry_price, now),
        )
        await db.commit()
        return cur.lastrowid or 0


async def update_position_peak(position_id: int, peak_price: float) -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("UPDATE positions SET peak_price = ? WHERE id = ?", (peak_price, position_id))
        await db.commit()


async def get_open_positions(user_id: int) -> list[dict[str, Any]]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM positions WHERE user_id = ? AND status = 'open' ORDER BY opened_at DESC",
            (user_id,),
        ) as cur:
            return [dict(r) for r in await cur.fetchall()]


async def get_position_by_id(position_id: int, user_id: int) -> dict[str, Any] | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM positions WHERE id = ? AND user_id = ? AND status = 'open'",
            (position_id, user_id),
        ) as cur:
            row = await cur.fetchone()
            return dict(row) if row else None


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


async def get_trade_history(user_id: int, limit: int = 10) -> list[dict[str, Any]]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM trade_log WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
            (user_id, limit),
        ) as cur:
            return [dict(r) for r in await cur.fetchall()]


async def get_cooldown_mints(user_id: int, hours: int = 4) -> set[str]:
    """Mints traded recently — skip rebuying."""
    from datetime import datetime, timedelta, timezone
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute(
            "SELECT DISTINCT token_mint FROM trade_log WHERE user_id = ? AND created_at > ?",
            (user_id, cutoff),
        ) as cur:
            rows = await cur.fetchall()
            return {r[0] for r in rows}


async def get_stats(user_id: int) -> dict[str, Any]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT COUNT(*) as total, SUM(CASE WHEN pnl_pct >= 0 THEN 1 ELSE 0 END) as wins FROM positions WHERE user_id = ? AND status = 'closed'",
            (user_id,),
        ) as cur:
            row = await cur.fetchone()
            total = row["total"] or 0
            wins = row["wins"] or 0

        async with db.execute(
            "SELECT AVG(pnl_pct) as avg_pnl, SUM(pnl_pct) as total_pnl FROM positions WHERE user_id = ? AND status = 'closed'",
            (user_id,),
        ) as cur:
            pnl_row = await cur.fetchone()

        async with db.execute(
            "SELECT COUNT(*) as open_count FROM positions WHERE user_id = ? AND status = 'open'",
            (user_id,),
        ) as cur:
            open_row = await cur.fetchone()

        # Estimate SOL PnL from sell logs
        async with db.execute(
            """
            SELECT details FROM trade_log
            WHERE user_id = ? AND action = 'SELL' ORDER BY created_at DESC LIMIT 50
            """,
            (user_id,),
        ) as cur:
            sell_rows = await cur.fetchall()
        sol_pnl = 0.0
        for row in sell_rows:
            try:
                d = json.loads(row[0] or "{}")
                sol_pnl += float(d.get("sol_pnl", 0))
            except Exception:
                pass

    return {
        "total_trades": total,
        "wins": wins,
        "losses": total - wins,
        "win_rate": round(wins / total * 100, 1) if total > 0 else 0,
        "avg_pnl": round(pnl_row["avg_pnl"] or 0, 1),
        "total_pnl": round(pnl_row["total_pnl"] or 0, 1),
        "sol_pnl": round(sol_pnl, 4),
        "open_positions": open_row["open_count"] or 0,
    }


async def get_best_worst_trade(user_id: int) -> dict[str, Any]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            """
            SELECT token_symbol, pnl_pct FROM positions
            WHERE user_id = ? AND status = 'closed' AND pnl_pct IS NOT NULL
            ORDER BY pnl_pct DESC LIMIT 1
            """,
            (user_id,),
        ) as cur:
            best = await cur.fetchone()
        async with db.execute(
            """
            SELECT token_symbol, pnl_pct FROM positions
            WHERE user_id = ? AND status = 'closed' AND pnl_pct IS NOT NULL
            ORDER BY pnl_pct ASC LIMIT 1
            """,
            (user_id,),
        ) as cur:
            worst = await cur.fetchone()
    return {
        "best_symbol": best["token_symbol"] if best else None,
        "best_pnl": round(best["pnl_pct"], 1) if best else None,
        "worst_symbol": worst["token_symbol"] if worst else None,
        "worst_pnl": round(worst["pnl_pct"], 1) if worst else None,
    }
