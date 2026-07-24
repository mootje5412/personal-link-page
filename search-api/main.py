import csv
import re
import sqlite3
import time
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse

BASE_DIR = Path(__file__).resolve().parent
DATABASE_DIR = BASE_DIR / "databases"
INDEX_DB = BASE_DIR / ".search_index.db"
PORT = 8080
CREDIT = "api made by Ami.192 on signal"

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)

COLUMN_MAP = {
    "name": "first_name",
    "first_name": "first_name",
    "firstname": "first_name",
    "surname": "last_name",
    "last_name": "last_name",
    "lastname": "last_name",
    "phone": "phone",
    "phone number": "phone",
    "phone_number": "phone",
    "telephone": "phone",
    "email": "email",
    "e-mail": "email",
    "e-mail contact": "email",
    "e-mail contact ": "email",
    "mail": "email",
    "identity_number": "identity_number",
    "identity number": "identity_number",
    "id number": "identity_number",
    "tc": "identity_number",
}


def clean_header(value: str) -> str:
    return " ".join(str(value or "").strip().lower().split())


def norm_phone(value: str | None) -> str:
    if not value:
        return ""
    digits = re.sub(r"\D+", "", str(value).strip())
    if digits.startswith("90") and len(digits) >= 12:
        return digits
    if digits.startswith("0") and len(digits) >= 10:
        return "90" + digits[1:]
    return digits


def norm_text(value: str | None) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip()).casefold()


def norm_email(value: str | None) -> str:
    return str(value or "").strip().casefold()


def map_row(raw: dict) -> dict[str, str]:
    mapped = {
        "first_name": "",
        "last_name": "",
        "phone": "",
        "email": "",
        "identity_number": "",
    }

    for key, value in raw.items():
        header = clean_header(key)
        field = COLUMN_MAP.get(header)
        if not field:
            continue
        text = str(value or "").strip()
        if text.lower() in {"x", "none", "null", "nan", ""}:
            continue
        mapped[field] = text

    return mapped


def row_is_valid(record: dict[str, str]) -> bool:
    return any([
        record["first_name"],
        record["last_name"],
        record["phone"],
        record["email"],
        record["identity_number"],
    ])


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        sample = handle.read(4096)
        handle.seek(0)
        delimiter = "\t" if sample.count("\t") > sample.count(",") else ","
        reader = csv.DictReader(handle, delimiter=delimiter)
        return [map_row(row) for row in reader]


def read_xlsx_rows(path: Path) -> list[dict[str, str]]:
    from openpyxl import load_workbook

    workbook = load_workbook(path, read_only=True, data_only=True)
    sheet = workbook.active
    rows = sheet.iter_rows(values_only=True)
    headers = [clean_header(cell) for cell in next(rows, [])]

    mapped_rows = []
    for row in rows:
        raw = {}
        for index, header in enumerate(headers):
            if not header or index >= len(row):
                continue
            raw[header] = row[index]
        mapped_rows.append(map_row(raw))

    workbook.close()
    return mapped_rows


def read_db_rows(path: Path) -> list[dict[str, str]]:
    if path.resolve() == INDEX_DB.resolve():
        return []

    rows: list[dict[str, str]] = []
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    try:
        tables = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='people'"
        ).fetchall()
        if not tables:
            return rows
        for row in conn.execute(
            "SELECT first_name, last_name, phone, email, identity_number FROM people"
        ):
            rows.append({
                "first_name": str(row["first_name"] or "").strip(),
                "last_name": str(row["last_name"] or "").strip(),
                "phone": str(row["phone"] or "").strip(),
                "email": str(row["email"] or "").strip(),
                "identity_number": str(row["identity_number"] or "").strip(),
            })
    finally:
        conn.close()
    return rows


def source_files() -> list[Path]:
    files: list[Path] = []
    if not DATABASE_DIR.exists():
        return files
    for path in sorted(DATABASE_DIR.iterdir()):
        if not path.is_file():
            continue
        suffix = path.suffix.lower()
        if suffix in {".xlsx", ".xlsm", ".csv", ".tsv", ".db"}:
            files.append(path)
    return files


def connect_index() -> sqlite3.Connection:
    conn = sqlite3.connect(INDEX_DB, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_index_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS people (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL DEFAULT '',
            last_name TEXT NOT NULL DEFAULT '',
            phone TEXT NOT NULL DEFAULT '',
            email TEXT NOT NULL DEFAULT '',
            identity_number TEXT NOT NULL DEFAULT '',
            first_name_n TEXT NOT NULL DEFAULT '',
            last_name_n TEXT NOT NULL DEFAULT '',
            phone_n TEXT NOT NULL DEFAULT '',
            email_n TEXT NOT NULL DEFAULT '',
            identity_number_n TEXT NOT NULL DEFAULT '',
            source_file TEXT NOT NULL DEFAULT ''
        );
        """
    )


def insert_record(conn: sqlite3.Connection, record: dict[str, str], source_file: str) -> None:
    conn.execute(
        """
        INSERT INTO people (
            first_name, last_name, phone, email, identity_number,
            first_name_n, last_name_n, phone_n, email_n, identity_number_n, source_file
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            record["first_name"],
            record["last_name"],
            record["phone"],
            record["email"],
            record["identity_number"],
            norm_text(record["first_name"]),
            norm_text(record["last_name"]),
            norm_phone(record["phone"]),
            norm_email(record["email"]),
            norm_text(record["identity_number"]),
            source_file,
        ),
    )


def load_file_records(path: Path) -> list[dict[str, str]]:
    suffix = path.suffix.lower()
    if suffix in {".xlsx", ".xlsm"}:
        records = read_xlsx_rows(path)
    elif suffix in {".csv", ".tsv"}:
        records = read_csv_rows(path)
    elif suffix == ".db":
        records = read_db_rows(path)
    else:
        records = []
    return [record for record in records if row_is_valid(record)]


def rebuild_index() -> dict:
    DATABASE_DIR.mkdir(parents=True, exist_ok=True)
    if INDEX_DB.exists():
        INDEX_DB.unlink()

    sources = source_files()
    loaded_files = []
    total_records = 0

    with connect_index() as conn:
        ensure_index_schema(conn)
        for path in sources:
            try:
                records = load_file_records(path)
            except Exception as error:
                print(f"Failed to load {path.name}: {error}")
                continue
            for record in records:
                insert_record(conn, record, path.name)
            if records:
                loaded_files.append(path.name)
                total_records += len(records)
        conn.commit()

    return {
        "sources": loaded_files,
        "records": total_records,
    }


def count_records() -> int:
    if not INDEX_DB.exists():
        return 0
    with connect_index() as conn:
        ensure_index_schema(conn)
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
        clauses.append("phone_n LIKE ?")
        params.append(f"%{norm_phone(phone)}%")
    if email:
        clauses.append("email_n LIKE ?")
        params.append(f"%{norm_email(email)}%")
    if first_name:
        clauses.append("first_name_n LIKE ?")
        params.append(f"%{norm_text(first_name)}%")
    if last_name:
        clauses.append("last_name_n LIKE ?")
        params.append(f"%{norm_text(last_name)}%")
    if identity_number:
        clauses.append("identity_number_n LIKE ?")
        params.append(f"%{norm_text(identity_number)}%")

    params.append(min(max(limit, 1), 100))

    with connect_index() as conn:
        ensure_index_schema(conn)
        rows = conn.execute(
            f"""
            SELECT first_name, last_name, phone, email, identity_number, source_file
            FROM people
            WHERE {' AND '.join(clauses)}
            LIMIT ?
            """,
            params,
        ).fetchall()

    results = [{
        "first_name": row["first_name"],
        "last_name": row["last_name"],
        "full_name": f"{row['first_name']} {row['last_name']}".strip(),
        "phone": row["phone"],
        "email": row["email"],
        "identity_number": row["identity_number"],
        "source_file": row["source_file"],
    } for row in rows]

    return results, {
        "phone": phone,
        "email": email,
        "first_name": first_name,
        "last_name": last_name,
        "identity_number": identity_number,
    }


def api_payload(**data) -> dict:
    return {"credit": CREDIT, **data}


@app.on_event("startup")
def startup() -> None:
    info = rebuild_index()
    print(f"Loaded {info['records']} records from {len(info['sources'])} file(s)")


@app.get("/api/health")
def health() -> dict:
    files = source_files()
    return api_payload(
        ok=True,
        records=count_records(),
        sources=[path.name for path in files],
    )


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

    return JSONResponse(api_payload(
        success=True,
        query=query,
        total=len(results),
        results=results,
        ms=round((time.perf_counter() - started) * 1000, 2),
    ))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
