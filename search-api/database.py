import re
import sqlite3
import time
from contextlib import contextmanager
from typing import Any

from config import DATABASE_PATH


def normalize_phone(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"\D+", "", value.strip())


def normalize_text(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"\s+", " ", value.strip().lower())


def normalize_identity(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"[\s\-]", "", value.strip().upper())


def ensure_database() -> None:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)

    with connect() as conn:
        conn.executescript(
            """
            PRAGMA journal_mode = WAL;
            PRAGMA synchronous = NORMAL;
            PRAGMA temp_store = MEMORY;
            PRAGMA mmap_size = 30000000000;

            CREATE TABLE IF NOT EXISTS people (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT NOT NULL DEFAULT '',
                last_name TEXT NOT NULL DEFAULT '',
                phone TEXT NOT NULL DEFAULT '',
                identity_number TEXT NOT NULL DEFAULT '',
                email TEXT NOT NULL DEFAULT '',
                city TEXT NOT NULL DEFAULT '',
                country TEXT NOT NULL DEFAULT '',
                source TEXT NOT NULL DEFAULT '',
                notes TEXT NOT NULL DEFAULT '',
                phone_norm TEXT NOT NULL DEFAULT '',
                first_name_norm TEXT NOT NULL DEFAULT '',
                last_name_norm TEXT NOT NULL DEFAULT '',
                identity_norm TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_people_phone ON people(phone_norm);
            CREATE INDEX IF NOT EXISTS idx_people_first_name ON people(first_name_norm);
            CREATE INDEX IF NOT EXISTS idx_people_last_name ON people(last_name_norm);
            CREATE INDEX IF NOT EXISTS idx_people_identity ON people(identity_norm);
            CREATE INDEX IF NOT EXISTS idx_people_name ON people(first_name_norm, last_name_norm);
            """
        )

        count = conn.execute("SELECT COUNT(*) FROM people").fetchone()[0]
        if count == 0:
            seed_rows = [
                (
                    "Ege",
                    "Tevkir",
                    "+31612345678",
                    "AB123456",
                    "ege.tevkir@example.com",
                    "Amsterdam",
                    "NL",
                    "sample",
                    "Demo record only",
                ),
                (
                    "John",
                    "Doe",
                    "0612345678",
                    "XY987654",
                    "john.doe@example.com",
                    "Rotterdam",
                    "NL",
                    "sample",
                    "Demo record only",
                ),
            ]
            conn.executemany(
                """
                INSERT INTO people (
                    first_name, last_name, phone, identity_number, email,
                    city, country, source, notes,
                    phone_norm, first_name_norm, last_name_norm, identity_norm
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    (
                        first,
                        last,
                        phone,
                        identity,
                        email,
                        city,
                        country,
                        source,
                        notes,
                        normalize_phone(phone),
                        normalize_text(first),
                        normalize_text(last),
                        normalize_identity(identity),
                    )
                    for first, last, phone, identity, email, city, country, source, notes in seed_rows
                ],
            )


@contextmanager
def connect():
    conn = sqlite3.connect(DATABASE_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "first_name": row["first_name"],
        "last_name": row["last_name"],
        "full_name": f"{row['first_name']} {row['last_name']}".strip(),
        "phone": row["phone"],
        "identity_number": row["identity_number"],
        "email": row["email"],
        "city": row["city"],
        "country": row["country"],
        "source": row["source"],
        "notes": row["notes"],
    }


def search_people(
    *,
    phone: str | None = None,
    first_name: str | None = None,
    last_name: str | None = None,
    identity_number: str | None = None,
    limit: int = 25,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    started = time.perf_counter()

    phone_norm = normalize_phone(phone)
    first_norm = normalize_text(first_name)
    last_norm = normalize_text(last_name)
    identity_norm = normalize_identity(identity_number)

    if not any([phone_norm, first_norm, last_norm, identity_norm]):
        raise ValueError("Provide at least one of: phone, first_name, last_name, identity_number")

    clauses = []
    params: list[Any] = []

    if phone_norm:
        clauses.append("phone_norm LIKE ?")
        params.append(f"%{phone_norm}%")

    if first_norm:
        clauses.append("first_name_norm LIKE ?")
        params.append(f"%{first_norm}%")

    if last_norm:
        clauses.append("last_name_norm LIKE ?")
        params.append(f"%{last_norm}%")

    if identity_norm:
        clauses.append("identity_norm LIKE ?")
        params.append(f"%{identity_norm}%")

    sql = f"""
        SELECT *
        FROM people
        WHERE {' AND '.join(clauses)}
        ORDER BY id ASC
        LIMIT ?
    """
    params.append(min(max(limit, 1), 100))

    with connect() as conn:
        rows = conn.execute(sql, params).fetchall()

    elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
    query = {
        "phone": phone or None,
        "first_name": first_name or None,
        "last_name": last_name or None,
        "identity_number": identity_number or None,
    }

    return [row_to_dict(row) for row in rows], query
