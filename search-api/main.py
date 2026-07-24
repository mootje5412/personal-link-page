import csv
import json
import re
import sqlite3
import threading
import time
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import Response

BASE_DIR = Path(__file__).resolve().parent
DATABASE_DIR = BASE_DIR / "databases"
INDEX_DB = BASE_DIR / ".search_index.db"
SCHEMA_VERSION = 3
PORT = 8080
CREDIT = "api made by Ami.192 on signal"
INDEX_LOCK = threading.Lock()
INDEX_READY = threading.Event()
INDEX_ERROR: str | None = None
BATCH_SIZE = 2000

INSERT_SQL = """
INSERT INTO people (
    first_name, last_name, phone, email, identity_number,
    city, country, notes, extra_json,
    first_name_n, last_name_n, phone_n, email_n, identity_number_n
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
"""


@asynccontextmanager
async def lifespan(_app: FastAPI):
    thread = threading.Thread(target=build_index_background, daemon=True)
    thread.start()
    yield


app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None, lifespan=lifespan)

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
    "gsm": "phone",
    "mobile": "phone",
    "cell": "phone",
    "tel": "phone",
    "telefon": "phone",
    "cep": "phone",
    "cep telefonu": "phone",
    "cep no": "phone",
    "gsm no": "phone",
    "mobile phone": "phone",
    "contact phone": "phone",
    "phone no": "phone",
    "email": "email",
    "e-mail": "email",
    "e-mail contact": "email",
    "e-mail contact ": "email",
    "mail": "email",
    "identity_number": "identity_number",
    "identity number": "identity_number",
    "id number": "identity_number",
    "tc": "identity_number",
    "city": "city",
    "country": "country",
    "source": "source",
    "notes": "notes",
    "ip": "notes",
}


def clean_header(value: str) -> str:
    return " ".join(str(value or "").strip().lower().split())


def clean_value(value) -> str:
    if value is None:
        return ""
    if isinstance(value, float):
        if value.is_integer():
            return str(int(value))
        text = f"{value:.0f}" if abs(value) > 1e9 else str(value)
        return text.strip()
    if isinstance(value, int):
        return str(value)
    return str(value).strip()


def phone_digits(value: str | None) -> str:
    return re.sub(r"\D+", "", clean_value(value))


def norm_phone(value: str | None) -> str:
    digits = phone_digits(value)
    if not digits:
        return ""

    while digits.startswith("90") and len(digits) > 10:
        digits = digits[2:]
    while digits.startswith("0") and len(digits) > 10:
        digits = digits[1:]

    if len(digits) > 10:
        digits = digits[-10:]
    return digits


def phone_keys(value: str | None) -> set[str]:
    digits = phone_digits(value)
    if not digits:
        return set()

    keys = {digits}
    core = norm_phone(value)
    if core:
        keys.add(core)
        keys.add("0" + core)
        keys.add("90" + core)

    if digits.startswith("90") and len(digits) > 2:
        rest = digits[2:]
        keys.add(rest)
        if not rest.startswith("0"):
            keys.add("0" + rest)

    if digits.startswith("0") and len(digits) > 1:
        keys.add(digits[1:])
        keys.add("90" + digits[1:])

    if len(digits) >= 10:
        keys.add(digits[-10:])

    return {key for key in keys if len(key) >= 7}


def phone_index_value(value: str | None) -> str:
    return "|".join(sorted(phone_keys(value), key=len, reverse=True))


PHONE_DIGITS_SQL = (
    "replace(replace(replace(replace(replace(replace(phone, ' ', ''), '-', ''), '+', ''), '(', ''), ')', ''), '.', '')"
)


def norm_text(value: str | None) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip()).casefold()


def norm_email(value: str | None) -> str:
    return str(value or "").strip().casefold()


def map_row(raw: dict) -> dict:
    mapped = {
        "first_name": "",
        "last_name": "",
        "phone": "",
        "email": "",
        "identity_number": "",
        "city": "",
        "country": "",
        "notes": "",
        "extra": {},
    }

    for key, value in raw.items():
        header = clean_header(key)
        text = clean_value(value)
        if text.lower() in {"x", "none", "null", "nan", ""}:
            continue

        field = COLUMN_MAP.get(header)
        if field == "phone":
            text = phone_digits(text) or text
        if field == "notes" and mapped["notes"]:
            mapped["notes"] = f"{mapped['notes']} | {text}"
        elif field:
            mapped[field] = text
        elif header:
            mapped["extra"][header] = text

    if not mapped["phone"]:
        for value in raw.values():
            digits = phone_digits(clean_value(value))
            if len(digits) >= 10:
                mapped["phone"] = digits
                break

    return mapped


def row_is_valid(record: dict) -> bool:
    return any([
        record["first_name"],
        record["last_name"],
        record["phone"],
        record["email"],
        record["identity_number"],
        record["city"],
        record["country"],
        record["notes"],
        record["extra"],
    ])


def read_csv_rows(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        sample = handle.read(4096)
        handle.seek(0)
        delimiter = "\t" if sample.count("\t") > sample.count(",") else ","
        reader = csv.DictReader(handle, delimiter=delimiter)
        return [map_row(row) for row in reader]


def read_xlsx_rows(path: Path) -> list[dict]:
    from openpyxl import load_workbook

    workbook = load_workbook(path, read_only=True, data_only=True)
    sheet = workbook.active
    rows = sheet.iter_rows(values_only=True)

    headers: list[str] = []
    for row in rows:
        headers = [clean_header(cell) for cell in row]
        if any(headers):
            break

    if not any(headers):
        workbook.close()
        return []

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


def read_db_rows(path: Path) -> list[dict]:
    if path.resolve() == INDEX_DB.resolve():
        return []

    rows: list[dict] = []
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    try:
        tables = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='people'"
        ).fetchall()
        if not tables:
            return rows
        for row in conn.execute("SELECT * FROM people"):
            record = {
                "first_name": str(row["first_name"] or "").strip() if "first_name" in row.keys() else "",
                "last_name": str(row["last_name"] or "").strip() if "last_name" in row.keys() else "",
                "phone": str(row["phone"] or "").strip() if "phone" in row.keys() else "",
                "email": str(row["email"] or "").strip() if "email" in row.keys() else "",
                "identity_number": str(row["identity_number"] or "").strip() if "identity_number" in row.keys() else "",
                "city": str(row["city"] or "").strip() if "city" in row.keys() else "",
                "country": str(row["country"] or "").strip() if "country" in row.keys() else "",
                "notes": str(row["notes"] or "").strip() if "notes" in row.keys() else "",
                "extra": {},
            }
            if record["first_name"] or record["last_name"] or record["phone"] or record["email"]:
                rows.append(record)
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
            city TEXT NOT NULL DEFAULT '',
            country TEXT NOT NULL DEFAULT '',
            notes TEXT NOT NULL DEFAULT '',
            extra_json TEXT NOT NULL DEFAULT '{}',
            first_name_n TEXT NOT NULL DEFAULT '',
            last_name_n TEXT NOT NULL DEFAULT '',
            phone_n TEXT NOT NULL DEFAULT '',
            email_n TEXT NOT NULL DEFAULT '',
            identity_number_n TEXT NOT NULL DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS meta (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        """
    )
    conn.execute(
        "INSERT OR REPLACE INTO meta (key, value) VALUES ('schema_version', ?)",
        (str(SCHEMA_VERSION),),
    )


def record_to_row(record: dict) -> tuple:
    return (
        record["first_name"],
        record["last_name"],
        record["phone"],
        record["email"],
        record["identity_number"],
        record["city"],
        record["country"],
        record["notes"],
        json.dumps(record["extra"], ensure_ascii=False),
        norm_text(record["first_name"]),
        norm_text(record["last_name"]),
        phone_index_value(record["phone"]),
        norm_email(record["email"]),
        norm_text(record["identity_number"]),
    )


def insert_records(conn: sqlite3.Connection, records: list[dict]) -> None:
    batch: list[tuple] = []
    for record in records:
        batch.append(record_to_row(record))
        if len(batch) >= BATCH_SIZE:
            conn.executemany(INSERT_SQL, batch)
            batch.clear()
    if batch:
        conn.executemany(INSERT_SQL, batch)


def load_file_records(path: Path) -> list[dict]:
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


def index_schema_ok() -> bool:
    if not INDEX_DB.exists():
        return False

    conn = sqlite3.connect(INDEX_DB)
    try:
        version = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='meta'"
        ).fetchone()
        if not version:
            return False
        stored = conn.execute("SELECT value FROM meta WHERE key='schema_version'").fetchone()
        if not stored or int(stored[0]) != SCHEMA_VERSION:
            return False

        columns = {row[1] for row in conn.execute("PRAGMA table_info(people)")}
        required = {
            "first_name", "last_name", "phone", "email", "identity_number",
            "city", "country", "notes", "extra_json", "phone_n",
        }
        return required.issubset(columns)
    except (sqlite3.Error, ValueError, TypeError):
        return False
    finally:
        conn.close()


def index_is_stale() -> bool:
    if not INDEX_DB.exists():
        return True
    if not index_schema_ok():
        return True
    index_mtime = INDEX_DB.stat().st_mtime
    for path in source_files():
        if path.stat().st_mtime > index_mtime:
            return True
    return False


def ensure_index() -> None:
    with INDEX_LOCK:
        if index_is_stale():
            info = rebuild_index()
            print(
                f"Loaded {info['records']} records from {len(info['sources'])} file(s)",
                flush=True,
            )


def build_index_background() -> None:
    global INDEX_ERROR
    try:
        ensure_index()
    except Exception as error:
        INDEX_ERROR = str(error)
        print(f"Index build failed: {error}", flush=True)
    finally:
        INDEX_READY.set()


def wait_for_index() -> None:
    if not INDEX_READY.wait(timeout=900):
        raise HTTPException(status_code=503, detail="Index is still building, try again in a minute")
    if INDEX_ERROR:
        raise HTTPException(status_code=500, detail=INDEX_ERROR)


def rebuild_index() -> dict:
    DATABASE_DIR.mkdir(parents=True, exist_ok=True)
    temp_db = BASE_DIR / ".search_index.building.db"
    if temp_db.exists():
        temp_db.unlink()

    sources = source_files()
    loaded_files = []
    total_records = 0

    conn = sqlite3.connect(temp_db)
    try:
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA synchronous=NORMAL")
        ensure_index_schema(conn)
        for path in sources:
            records: list[dict] = []
            try:
                print(f"Loading {path.name}...", flush=True)
                records = load_file_records(path)
                insert_records(conn, records)
            except Exception as error:
                print(f"Failed to load {path.name}: {error}", flush=True)
                continue
            if records:
                loaded_files.append(path.name)
                total_records += len(records)
                print(f"Loaded {len(records)} records from {path.name}", flush=True)
        conn.commit()
    finally:
        conn.close()

    if INDEX_DB.exists():
        INDEX_DB.unlink()
    temp_db.replace(INDEX_DB)

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


def format_result(row: sqlite3.Row) -> dict:
    extra = {}
    try:
        extra = json.loads(row["extra_json"] or "{}")
    except json.JSONDecodeError:
        extra = {}

    result = {
        "first_name": row["first_name"],
        "last_name": row["last_name"],
        "full_name": f"{row['first_name']} {row['last_name']}".strip(),
        "phone": row["phone"],
        "email": row["email"],
        "identity_number": row["identity_number"],
        "city": row["city"],
        "country": row["country"],
        "notes": row["notes"],
    }
    if extra:
        result["extra"] = extra
    return result


def parse_search_query(q: str | None) -> dict:
    text = re.sub(r"\s+", " ", (q or "").strip())
    if not text:
        return {}

    lowered = text.casefold()
    if "@" in text and "." in text.split("@", 1)[-1]:
        return {"type": "email", "email": text, "q": text}

    digits = phone_digits(text)
    digit_ratio = len(digits) / max(len(re.sub(r"\s+", "", text)), 1)
    if len(digits) >= 7 and digit_ratio >= 0.7:
        return {"type": "phone", "phone": text, "q": text}

    if text.isdigit() and len(text) >= 7:
        return {"type": "phone", "phone": text, "q": text}

    parts = text.split(" ")
    if len(parts) == 1:
        return {"type": "name", "name": text, "q": text}

    return {
        "type": "name",
        "q": text,
        "first_name": parts[0],
        "last_name": " ".join(parts[1:]),
        "full_name": text,
    }


def search(
    q: str | None = None,
    limit: int = 25,
) -> tuple[list[dict], dict]:
    wait_for_index()

    parsed = parse_search_query(q)
    if not parsed:
        raise ValueError("Send q with a name, phone, or email")

    phone = parsed.get("phone")
    email = parsed.get("email")
    first_name = parsed.get("first_name")
    last_name = parsed.get("last_name")
    name = parsed.get("name")
    identity_number = parsed.get("identity_number")

    clauses = []
    params: list = []

    if phone:
        variants = phone_keys(phone)
        if not variants:
            raise ValueError("Invalid phone number")

        phone_parts = []
        for variant in sorted(variants, key=len, reverse=True):
            phone_parts.append("phone_n LIKE ?")
            params.append(f"%{variant}%")
            phone_parts.append(f"{PHONE_DIGITS_SQL} LIKE ?")
            params.append(f"%{variant}%")

        clauses.append(f"({' OR '.join(phone_parts)})")

    if email:
        clauses.append("email_n LIKE ?")
        params.append(f"%{norm_email(email)}%")

    if first_name and last_name:
        clauses.append("first_name_n LIKE ?")
        params.append(f"%{norm_text(first_name)}%")
        clauses.append("last_name_n LIKE ?")
        params.append(f"%{norm_text(last_name)}%")
    elif name:
        needle = norm_text(name)
        clauses.append(
            "(first_name_n LIKE ? OR last_name_n LIKE ? OR (first_name_n || ' ' || last_name_n) LIKE ?)"
        )
        params.extend([f"%{needle}%", f"%{needle}%", f"%{needle}%"])

    if identity_number:
        clauses.append("identity_number_n LIKE ?")
        params.append(f"%{norm_text(identity_number)}%")

    params.append(min(max(limit, 1), 100))

    with connect_index() as conn:
        ensure_index_schema(conn)
        rows = conn.execute(
            f"""
            SELECT
                first_name, last_name, phone, email, identity_number,
                city, country, notes, extra_json
            FROM people
            WHERE {' AND '.join(clauses)}
            LIMIT ?
            """,
            params,
        ).fetchall()

    results = [format_result(row) for row in rows]
    return results, parsed


def raw_json(**data) -> Response:
    payload = {"credit": CREDIT, **data}
    return Response(
        content=json.dumps(payload, ensure_ascii=False, indent=2),
        media_type="application/json; charset=utf-8",
    )


@app.get("/api")
def api(
    q: str | None = Query(default=None, description="Name, phone, or email"),
    limit: int = Query(default=25, ge=1, le=100),
) -> Response:
    started = time.perf_counter()

    if not q or not q.strip():
        if not INDEX_READY.is_set():
            return raw_json(
                ok=True,
                ready=False,
                status="indexing",
                records=0,
                usage="Search: /api?q=Mootje bicep",
            )
        return raw_json(
            ok=True,
            ready=True,
            status="ready",
            records=count_records(),
            usage="Search: /api?q=Mootje bicep",
        )

    try:
        results, query = search(q, limit)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except HTTPException:
        raise
    except sqlite3.Error as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error

    return raw_json(
        ok=True,
        ready=INDEX_READY.is_set(),
        success=True,
        query=query,
        total=len(results),
        results=results,
        ms=round((time.perf_counter() - started) * 1000, 2),
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
