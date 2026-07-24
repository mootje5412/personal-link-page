import csv
import json
import re
import shutil
import sqlite3
import subprocess
import threading
import time
import tempfile
from contextlib import asynccontextmanager
from io import StringIO
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import Response

BASE_DIR = Path(__file__).resolve().parent
DATABASE_DIR = BASE_DIR / "databases"
INDEX_DB = BASE_DIR / ".search_index.db"
SCHEMA_VERSION = 7
PORT = 8080
API_VERSION = "2026-07-24-txt-support"
CREDIT = "api made by Ami.192 on signal"
API_USAGE = {
    "status": "/api",
    "name": "/api?q=Mootje bicep",
    "phone": "/api?q=905544784243",
    "email": "/api?q=email@example.com",
    "id": "/api?q=12345678901",
}
INDEX_LOCK = threading.Lock()
INDEX_READY = threading.Event()
INDEX_ERROR: str | None = None
BATCH_SIZE = 2000
DATA_SUFFIXES = {".xlsx", ".xlsm", ".csv", ".tsv", ".txt", ".db"}
ARCHIVE_SUFFIXES = {".7z"}

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
    "tc kimlik": "identity_number",
    "tc kimlik no": "identity_number",
    "tc no": "identity_number",
    "kimlik no": "identity_number",
    "kimlik numarasi": "identity_number",
    "id no": "identity_number",
    "national id": "identity_number",
    "id": "identity_number",
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
        if abs(value) >= 1e9:
            return str(int(round(value)))
        if value.is_integer():
            return str(int(value))
        return f"{value:.0f}".strip()
    if isinstance(value, int):
        return str(value)
    return str(value).strip()


def looks_like_tc(digits: str) -> bool:
    return (
        len(digits) == 11
        and not digits.startswith("0")
        and not digits.startswith("90")
        and not digits.startswith("5")
    )


def looks_like_phone_digits(digits: str) -> bool:
    if len(digits) < 7:
        return False
    if digits.startswith("90"):
        return len(digits) >= 11
    if digits.startswith("0"):
        return len(digits) >= 10
    if digits.startswith("5"):
        return len(digits) >= 10
    return len(digits) >= 10


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


def phone_search_variants(value: str | None) -> set[str]:
    variants = phone_keys(value)
    core = norm_phone(value)
    if core:
        variants.add(core)
        for size in (10, 9, 8, 7):
            if len(core) >= size:
                variants.add(core[-size:])
    return {item for item in variants if len(item) >= 7}


def collect_phone_keys(record: dict) -> str:
    keys: set[str] = set()

    for field in ("phone", "notes", "identity_number"):
        keys.update(phone_keys(str(record.get(field, ""))))

    for value in record.get("extra", {}).values():
        text = clean_value(value)
        digits = phone_digits(text)
        if looks_like_phone_digits(digits):
            keys.update(phone_keys(text))

    if not keys:
        for value in record.get("extra", {}).values():
            keys.update(phone_keys(str(value)))

    return "|".join(sorted(keys, key=len, reverse=True))


PHONE_DIGITS_SQL = (
    "replace(replace(replace(replace(replace(replace(phone, ' ', ''), '-', ''), '+', ''), '(', ''), ')', ''), '.', '')"
)
IDENTITY_DIGITS_SQL = (
    "replace(replace(replace(identity_number, ' ', ''), '-', ''), '.', '')"
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
            if looks_like_tc(digits):
                continue
            if looks_like_phone_digits(digits):
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


def detect_delimiter(sample: str, suffix: str = ".csv") -> str:
    if suffix == ".tsv":
        return "\t"
    options = ["\t", ",", ";", "|"]
    best = max(options, key=lambda item: sample.count(item))
    if sample.count(best) > 0:
        return best
    return ","


def read_text_content(path: Path) -> str:
    raw = path.read_bytes()
    for encoding in ("utf-8-sig", "utf-8", "cp1254", "latin-1"):
        try:
            return raw.decode(encoding)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="replace")


def read_delimited_rows(path: Path, suffix: str = ".csv") -> list[dict]:
    text = read_text_content(path)
    sample = text[:4096]
    delimiter = detect_delimiter(sample, suffix)
    reader = csv.DictReader(StringIO(text), delimiter=delimiter)
    return [map_row(row) for row in reader]


def read_csv_rows(path: Path, suffix: str = ".csv") -> list[dict]:
    return read_delimited_rows(path, suffix)


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


def iter_extracted_data_files(root: Path):
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if path.name.startswith("._"):
            continue
        if path.suffix.lower() in DATA_SUFFIXES:
            yield path


def load_records_from_extracted(root: Path, source_label: str) -> list[dict]:
    records: list[dict] = []
    found_any = False

    for file_path in iter_extracted_data_files(root):
        found_any = True
        try:
            file_records = load_file_records(file_path)
            records.extend(file_records)
            print(
                f"  Loaded {len(file_records)} records from {file_path.name}",
                flush=True,
            )
        except Exception as error:
            print(f"  Failed {file_path.name} in {source_label}: {error}", flush=True)

    if not found_any:
        names = [path.name for path in root.rglob("*") if path.is_file()]
        preview = ", ".join(names[:20]) or "no files"
        print(f"  No supported files in {source_label}. Found: {preview}", flush=True)

    return records


def read_7z_py7zr(path: Path, tmp_path: Path) -> None:
    import py7zr

    with py7zr.SevenZipFile(path, mode="r") as archive:
        names = [name.replace("\\", "/") for name in archive.getnames() if not name.endswith("/")]
        print(f"  7z contents: {', '.join(names[:20])}", flush=True)
        archive.extractall(path=tmp_path)


def read_7z_system(path: Path, tmp_path: Path) -> bool:
    command = shutil.which("7z") or shutil.which("7za")
    if not command:
        return False

    result = subprocess.run(
        [command, "x", "-y", f"-o{tmp_path}", str(path)],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(f"  7z command failed: {result.stderr.strip() or result.stdout.strip()}", flush=True)
        return False
    return True


def read_7z_records(path: Path) -> list[dict]:
    records: list[dict] = []
    py7zr_ok = False

    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_path = Path(tmp_dir)
        py7zr_ok = False
        try:
            read_7z_py7zr(path, tmp_path)
            py7zr_ok = True
            records = load_records_from_extracted(tmp_path, path.name)
        except Exception as error:
            print(f"  py7zr failed on {path.name}: {error}", flush=True)

    if records:
        return records

    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_path = Path(tmp_dir)
        if read_7z_system(path, tmp_path):
            records = load_records_from_extracted(tmp_path, path.name)
            if records:
                return records

    if not py7zr_ok:
        raise RuntimeError(
            f"Could not read {path.name}. Make sure p7zip-full is installed and the archive is not password protected."
        )

    return records


def source_files() -> list[Path]:
    files: list[Path] = []
    if not DATABASE_DIR.exists():
        return files
    for path in sorted(DATABASE_DIR.iterdir()):
        if not path.is_file():
            continue
        suffix = path.suffix.lower()
        if suffix in DATA_SUFFIXES or suffix in ARCHIVE_SUFFIXES:
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
        collect_phone_keys(record),
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
    elif suffix in {".csv", ".tsv", ".txt"}:
        records = read_delimited_rows(path, suffix)
    elif suffix == ".db":
        records = read_db_rows(path)
    elif suffix == ".7z":
        records = read_7z_records(path)
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

    if "@" in text and "." in text.split("@", 1)[-1]:
        return {"type": "email", "email": text, "q": text}

    digits = phone_digits(text)
    compact = re.sub(r"\s+", "", text)

    if digits:
        if looks_like_tc(digits):
            return {"type": "identity_number", "identity_number": digits, "q": text}

        if looks_like_phone_digits(digits):
            return {"type": "phone", "phone": text, "q": text}

        digit_ratio = len(digits) / max(len(compact), 1)
        if len(digits) >= 7 and digit_ratio >= 0.7:
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


def search(q: str | None = None) -> tuple[list[dict], dict]:
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
        variants = phone_search_variants(phone)
        if not variants:
            raise ValueError("Invalid phone number")

        phone_parts = []
        for variant in sorted(variants, key=len, reverse=True):
            phone_parts.append("phone_n LIKE ?")
            params.append(f"%{variant}%")
            phone_parts.append(f"{PHONE_DIGITS_SQL} LIKE ?")
            params.append(f"%{variant}%")
            phone_parts.append(f"{IDENTITY_DIGITS_SQL} LIKE ?")
            params.append(f"%{variant}%")
            phone_parts.append("notes LIKE ?")
            params.append(f"%{variant}%")
            phone_parts.append("extra_json LIKE ?")
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
        id_digits = phone_digits(identity_number)
        id_parts = ["identity_number_n LIKE ?"]
        id_params = [f"%{norm_text(identity_number)}%"]
        if id_digits:
            id_parts.append(f"{IDENTITY_DIGITS_SQL} LIKE ?")
            id_params.append(f"%{id_digits}%")
        clauses.append(f"({' OR '.join(id_parts)})")
        params.extend(id_params)

    query_sql = f"""
        SELECT
            first_name, last_name, phone, email, identity_number,
            city, country, notes, extra_json
        FROM people
        WHERE {' AND '.join(clauses)}
    """

    with connect_index() as conn:
        ensure_index_schema(conn)
        rows = conn.execute(query_sql, params).fetchall()

    results = [format_result(row) for row in rows]
    return results, parsed


def raw_json(**data) -> Response:
    payload = {"credit": CREDIT, "version": API_VERSION, **data}
    return Response(
        content=json.dumps(payload, ensure_ascii=False, indent=2),
        media_type="application/json; charset=utf-8",
    )


@app.get("/api")
def api(
    q: str | None = Query(default=None, description="Name, phone, email, or ID number"),
) -> Response:
    started = time.perf_counter()

    if not q or not q.strip():
        if not INDEX_READY.is_set():
            return raw_json(
                ok=True,
                ready=False,
                status="indexing",
                records=0,
                usage=API_USAGE,
            )
        return raw_json(
            ok=True,
            ready=True,
            status="ready",
            records=count_records(),
            usage=API_USAGE,
        )

    try:
        results, query = search(q)
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
        found=len(results),
        returned=len(results),
        results=results,
        ms=round((time.perf_counter() - started) * 1000, 2),
    )


@app.get("/api/search")
def api_search_legacy(
    q: str | None = Query(default=None),
    phone: str | None = Query(default=None),
    email: str | None = Query(default=None),
    first_name: str | None = Query(default=None),
    last_name: str | None = Query(default=None),
    identity_number: str | None = Query(default=None),
) -> Response:
    if q:
        return api(q=q)
    if phone:
        return api(q=phone)
    if email:
        return api(q=email)
    if first_name and last_name:
        return api(q=f"{first_name} {last_name}")
    if first_name:
        return api(q=first_name)
    if last_name:
        return api(q=last_name)
    if identity_number:
        return api(q=identity_number)
    return api()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
