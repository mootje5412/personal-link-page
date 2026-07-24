import re
import sqlite3
import time
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse

BASE_DIR = Path(__file__).resolve().parent
DATABASE_DIR = BASE_DIR / "databases"
PORT = 8080

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)


def get_db_path() -> Path:
    DATABASE_DIR.mkdir(parents=True, exist_ok=True)
    db_files = sorted(DATABASE_DIR.glob("*.db"))
    if db_files:
        return db_files[0]
    return DATABASE_DIR / "people.db"


def connect():
    conn = sqlite3.connect(get_db_path(), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS people (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL DEFAULT '',
            last_name TEXT NOT NULL DEFAULT '',
            phone TEXT NOT NULL DEFAULT '',
            email TEXT NOT NULL DEFAULT '',
            identity_number TEXT NOT NULL DEFAULT ''
        );
        """
    )


def norm_phone(value: str | None) -> str:
    if not value:
        return ""
    digits = re.sub(r"\D+", "", value.strip())
    if digits.startswith("90") and len(digits) >= 12:
        return digits
    if digits.startswith("0") and len(digits) >= 10:
        return "90" + digits[1:]
    return digits


def norm_text(value: str | None) -> str:
    return re.sub(r"\s+", " ", (value or "").strip().lower())


def norm_email(value: str | None) -> str:
    return (value or "").strip().lower()


def count_records() -> int:
    with connect() as conn:
        ensure_schema(conn)
        conn.commit()
        return conn.execute("SELECT COUNT(*) FROM people").fetchone()[0]


def search(
    phone: str | None = None,
    email: str | None = None,
    first_name: str | None = None,
    last_name: str | None = None,
    identity_number: str | None = None,
    limit: int = 25,
) -> tuple[list[dict], dict]:
    if not any([phone, email, first_name, last_name, identity_number]):
        raise ValueError("Send phone, email, first_name, last_name, or identity_number")

    clauses = []
    params: list = []

    if phone:
        p = norm_phone(phone)
        clauses.append("replace(replace(replace(replace(phone, ' ', ''), '(', ''), ')', ''), '-', '') LIKE ?")
        params.append(f"%{p}%")
    if email:
        clauses.append("lower(email) LIKE ?")
        params.append(f"%{norm_email(email)}%")
    if first_name:
        clauses.append("lower(first_name) LIKE ?")
        params.append(f"%{norm_text(first_name)}%")
    if last_name:
        clauses.append("lower(last_name) LIKE ?")
        params.append(f"%{norm_text(last_name)}%")
    if identity_number:
        clauses.append("replace(replace(identity_number, ' ', ''), '-', '') LIKE ?")
        params.append(f"%{identity_number.strip().upper()}%")

    params.append(min(max(limit, 1), 100))

    with connect() as conn:
        ensure_schema(conn)
        rows = conn.execute(
            f"""
            SELECT first_name, last_name, phone, email, identity_number
            FROM people
            WHERE {' AND '.join(clauses)}
            LIMIT ?
            """,
            params,
        ).fetchall()
        conn.commit()

    results = [{
        "first_name": row["first_name"],
        "last_name": row["last_name"],
        "full_name": f"{row['first_name']} {row['last_name']}".strip(),
        "phone": row["phone"],
        "email": row["email"],
        "identity_number": row["identity_number"],
    } for row in rows]

    return results, {
        "phone": phone,
        "email": email,
        "first_name": first_name,
        "last_name": last_name,
        "identity_number": identity_number,
    }


@app.on_event("startup")
def startup() -> None:
    DATABASE_DIR.mkdir(parents=True, exist_ok=True)
    with connect() as conn:
        ensure_schema(conn)
        conn.commit()


@app.get("/api/health")
def health() -> dict:
    return {"ok": True, "records": count_records(), "database": str(get_db_path())}


@app.get("/api/search")
def api_search(
    phone: str | None = Query(default=None),
    email: str | None = Query(default=None),
    first_name: str | None = Query(default=None),
    last_name: str | None = Query(default=None),
    identity_number: str | None = Query(default=None),
    limit: int = Query(default=25, ge=1, le=100),
) -> JSONResponse:
    started = time.perf_counter()
    try:
        results, query = search(phone, email, first_name, last_name, identity_number, limit)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    return JSONResponse({
        "success": True,
        "query": query,
        "total": len(results),
        "results": results,
        "ms": round((time.perf_counter() - started) * 1000, 2),
    })


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
