import re
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any

from config import DATABASE_DIR, DATABASE_PATH


def normalize_phone(value: str | None) -> str:
    if not value:
        return ""
    digits = re.sub(r"\D+", "", value.strip())
    if digits.startswith("90") and len(digits) >= 12:
        return digits
    if digits.startswith("0") and len(digits) >= 10:
        return "90" + digits[1:]
    return digits


def normalize_text(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"\s+", " ", value.strip().lower())


def normalize_email(value: str | None) -> str:
    if not value:
        return ""
    return value.strip().lower()


def normalize_identity(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"[\s\-]", "", value.strip().upper())


def ensure_database() -> None:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    DATABASE_DIR.mkdir(parents=True, exist_ok=True)

    with connect() as conn:
        conn.executescript(
            """
            PRAGMA journal_mode = WAL;
            CREATE TABLE IF NOT EXISTS people (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT NOT NULL DEFAULT '',
                last_name TEXT NOT NULL DEFAULT '',
                phone TEXT NOT NULL DEFAULT '',
                email TEXT NOT NULL DEFAULT '',
                identity_number TEXT NOT NULL DEFAULT '',
                phone_norm TEXT NOT NULL DEFAULT '',
                first_name_norm TEXT NOT NULL DEFAULT '',
                last_name_norm TEXT NOT NULL DEFAULT '',
                email_norm TEXT NOT NULL DEFAULT '',
                identity_norm TEXT NOT NULL DEFAULT ''
            );
            CREATE INDEX IF NOT EXISTS idx_people_phone ON people(phone_norm);
            CREATE INDEX IF NOT EXISTS idx_people_email ON people(email_norm);
            CREATE INDEX IF NOT EXISTS idx_people_first_name ON people(first_name_norm);
            CREATE INDEX IF NOT EXISTS idx_people_last_name ON people(last_name_norm);
            CREATE INDEX IF NOT EXISTS idx_people_identity ON people(identity_norm);
            """
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
        "first_name": row["first_name"],
        "last_name": row["last_name"],
        "full_name": f"{row['first_name']} {row['last_name']}".strip(),
        "phone": row["phone"],
        "email": row["email"],
        "identity_number": row["identity_number"],
    }


def insert_person(conn: sqlite3.Connection, record: dict[str, str]) -> None:
    first_name = record.get("first_name", "")
    last_name = record.get("last_name", "")
    phone = record.get("phone", "")
    email = record.get("email", "")
    identity_number = record.get("identity_number", "")

    conn.execute(
        """
        INSERT INTO people (
            first_name, last_name, phone, email, identity_number,
            phone_norm, first_name_norm, last_name_norm, email_norm, identity_norm
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            first_name,
            last_name,
            phone,
            email,
            identity_number,
            normalize_phone(phone),
            normalize_text(first_name),
            normalize_text(last_name),
            normalize_email(email),
            normalize_identity(identity_number),
        ),
    )


def search_people(
    *,
    phone: str | None = None,
    email: str | None = None,
    first_name: str | None = None,
    last_name: str | None = None,
    identity_number: str | None = None,
    limit: int = 25,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    phone_norm = normalize_phone(phone)
    email_norm = normalize_email(email)
    first_norm = normalize_text(first_name)
    last_norm = normalize_text(last_name)
    identity_norm = normalize_identity(identity_number)

    if not any([phone_norm, email_norm, first_norm, last_norm, identity_norm]):
        raise ValueError("Send phone, email, first_name, last_name, or identity_number")

    clauses = []
    params: list[Any] = []

    if phone_norm:
        clauses.append("phone_norm LIKE ?")
        params.append(f"%{phone_norm}%")
    if email_norm:
        clauses.append("email_norm LIKE ?")
        params.append(f"%{email_norm}%")
    if first_norm:
        clauses.append("first_name_norm LIKE ?")
        params.append(f"%{first_norm}%")
    if last_norm:
        clauses.append("last_name_norm LIKE ?")
        params.append(f"%{last_norm}%")
    if identity_norm:
        clauses.append("identity_norm LIKE ?")
        params.append(f"%{identity_norm}%")

    params.append(min(max(limit, 1), 100))

    with connect() as conn:
        rows = conn.execute(
            f"""
            SELECT * FROM people
            WHERE {' AND '.join(clauses)}
            ORDER BY id ASC
            LIMIT ?
            """,
            params,
        ).fetchall()

    return [row_to_dict(row) for row in rows], {
        "phone": phone or None,
        "email": email or None,
        "first_name": first_name or None,
        "last_name": last_name or None,
        "identity_number": identity_number or None,
    }


def count_people() -> int:
    with connect() as conn:
        return conn.execute("SELECT COUNT(*) FROM people").fetchone()[0]


def list_database_files() -> list[Path]:
    files = []
    for pattern in ("*.csv", "*.tsv", "*.xlsx", "*.xlsm"):
        files.extend(DATABASE_DIR.glob(pattern))
    return sorted(files)
