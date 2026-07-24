import csv
import fcntl
import itertools
import json
import os
import re
import shutil
import sqlite3
import subprocess
import threading
import time
import tempfile
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import Response

BASE_DIR = Path(__file__).resolve().parent
DATABASE_DIR = BASE_DIR / "databases"
INDEX_DB = BASE_DIR / ".search_index.db"
SCHEMA_VERSION = 11
PORT = 8080
API_VERSION = "2026-07-24-stats"
CREDIT = "api made by Ami.192 on signal"
API_USAGE = {
    "status": "/api",
    "stats": "/api/stats",
    "name": "/api?q=Mootje bicep",
    "phone": "/api?q=905544784243",
    "email": "/api?q=email@example.com",
    "id": "/api?q=12345678901",
}
INDEX_LOCK = threading.Lock()
INDEX_READY = threading.Event()
INDEX_ERROR: str | None = None
BATCH_SIZE = 20000
TURBO_BATCH_SIZE = 250000
PROGRESS_EVERY = 50000
LARGE_FILE_BYTES = 100_000_000
MEGA_FILE_BYTES = 10_000_000
TURBO_PROGRESS_EVERY = 500000
STAGING_TABLE = "_import_staging"
BUILD_LOCK_FILE = BASE_DIR / ".index-build.lock"
BULK_TRANSFORM_CHUNK = 1_000_000
DISK_BUFFER_BYTES = 500_000_000
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
    "ad": "first_name",
    "isim": "first_name",
    "musteri adi": "first_name",
    "surname": "last_name",
    "last_name": "last_name",
    "lastname": "last_name",
    "soyad": "last_name",
    "soyisim": "last_name",
    "soyadi": "last_name",
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
    "telefon no": "phone",
    "telefon numarasi": "phone",
    "tel no": "phone",
    "numara": "phone",
    "email": "email",
    "e-mail": "email",
    "e-mail contact": "email",
    "e-mail contact ": "email",
    "e-posta": "email",
    "eposta": "email",
    "mail": "email",
    "mail adresi": "email",
    "email address": "email",
    "identity_number": "identity_number",
    "identity number": "identity_number",
    "id number": "identity_number",
    "tc": "identity_number",
    "tc kimlik": "identity_number",
    "tc kimlik no": "identity_number",
    "tc_kimlik_no": "identity_number",
    "tc no": "identity_number",
    "tcno": "identity_number",
    "kimlik": "identity_number",
    "dogum yeri": "city",
    "il": "city",
    "ilce": "notes",
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


HEADER_WORDS = {
    "name", "surname", "phone", "email", "ad", "soyad", "telefon", "mail",
    "isim", "soyisim", "gsm", "e-mail", "eposta", "numara", "firstname", "lastname",
}


def split_line(line: str, delimiter: str) -> list[str]:
    if delimiter == "space":
        return [part.strip() for part in re.split(r"\s{2,}", line.strip()) if part.strip()]
    return [part.strip() for part in line.split(delimiter)]


def line_is_header(parts: list[str]) -> bool:
    if len(parts) >= 2:
        text = clean_header(" ".join(parts))
        return any(word in HEADER_WORDS for word in text.split())

    single = clean_header(parts[0] if parts else "")
    for delimiter in ["|", ";", "\t", ","]:
        if delimiter in parts[0]:
            return line_is_header(split_line(parts[0], "|" if delimiter == "|" else delimiter))
    return any(word in HEADER_WORDS for word in single.split())


def record_quality(record: dict) -> int:
    score = 0
    if record["phone"]:
        score += 3
    if record["email"]:
        score += 3
    if record["first_name"]:
        score += 1
    if record["last_name"]:
        score += 1
    if record["identity_number"]:
        score += 1
    return score


def map_row_positional(parts: list[str]) -> dict:
    raw: dict = {}
    if len(parts) >= 5:
        raw = {
            "name": parts[0],
            "surname": parts[1],
            "phone number": parts[2],
            "e-mail": parts[3],
            "identity_number": parts[4],
        }
    elif len(parts) >= 4:
        raw = {
            "name": parts[0],
            "surname": parts[1],
            "phone number": parts[2],
            "e-mail": parts[3],
        }
    elif len(parts) == 3:
        if "@" in parts[2]:
            raw = {"name": parts[0], "surname": parts[1], "e-mail": parts[2]}
        else:
            raw = {"name": parts[0], "surname": parts[1], "phone number": parts[2]}
    elif len(parts) == 2:
        if "@" in parts[1]:
            raw = {"name": parts[0], "e-mail": parts[1]}
        else:
            raw = {"name": parts[0], "phone number": parts[1]}
    elif len(parts) == 1:
        raw = {"name": parts[0]}
    return map_row(raw)


def choose_best_delimiter(lines: list[str], suffix: str = ".txt") -> str:
    if suffix == ".tsv":
        return "\t"

    options = ["\t", "|", ";", ",", "space"]
    sample_lines = lines[:100]
    best = "\t"
    best_score = -1

    for delimiter in options:
        column_counts = [len(split_line(line, delimiter)) for line in sample_lines[:20]]
        avg_columns = sum(column_counts) / max(len(column_counts), 1)
        if avg_columns < 2:
            continue

        score = 0
        first_parts = split_line(sample_lines[0], delimiter)
        has_header = line_is_header(first_parts)
        headers = [clean_header(part) for part in first_parts] if has_header else []
        data_lines = sample_lines[1:] if has_header else sample_lines

        for line in data_lines:
            parts = split_line(line, delimiter)
            if len(parts) < 2:
                continue
            if headers:
                raw = {
                    headers[index]: parts[index] if index < len(parts) else ""
                    for index in range(len(headers))
                }
                record = map_row(raw)
            else:
                record = map_row_positional(parts)
            score += record_quality(record)

        if score > best_score:
            best_score = score
            best = delimiter

    if best_score <= 0:
        return detect_delimiter("\n".join(lines[:20]), suffix)
    return best


def detect_delimiter(sample: str, suffix: str = ".csv") -> str:
    if suffix == ".tsv":
        return "\t"
    options = ["\t", ",", ";", "|"]
    best = max(options, key=lambda item: sample.count(item))
    if sample.count(best) > 0:
        return best
    return ","


def detect_text_encoding(path: Path) -> str:
    raw = path.read_bytes()[:262144]
    for encoding in ("utf-8-sig", "utf-8", "utf-16", "utf-16-le", "utf-16-be", "cp1254", "cp1252", "latin-1"):
        try:
            raw.decode(encoding)
            return encoding
        except UnicodeDecodeError:
            continue
    return "utf-8"


def iter_text_lines(path: Path, encoding: str):
    with path.open("r", encoding=encoding, errors="replace") as handle:
        for line in handle:
            stripped = line.strip()
            if stripped and not stripped.startswith("#"):
                yield stripped


def parse_delimited_line(line: str, delimiter: str, headers: list[str]) -> dict:
    parts = split_line(line, delimiter)
    if headers:
        raw = {
            headers[index]: parts[index] if index < len(parts) else ""
            for index in range(len(headers))
        }
        return map_row(raw)
    return map_row_positional(parts)


def free_disk_bytes(path: Path | None = None) -> int:
    target = path or BASE_DIR
    return shutil.disk_usage(target).free


def bulk_import_fits(path: Path) -> bool:
    file_size = path.stat().st_size
    needed = file_size * 25 // 10 + DISK_BUFFER_BYTES
    return free_disk_bytes(path.parent) >= needed


def cleanup_sqlite_sidecars(db_path: Path | None = None) -> None:
    paths = {db_path or INDEX_DB, INDEX_DB, BASE_DIR / ".search_index.building.db"}
    for target in paths:
        if target is None:
            continue
        for suffix in ("-wal", "-shm", "-journal"):
            sidecar = Path(str(target) + suffix)
            if sidecar.exists():
                try:
                    sidecar.unlink()
                except OSError:
                    pass
        if target.exists() and target.name == ".search_index.building.db":
            try:
                target.unlink()
            except OSError:
                pass


def try_acquire_build_lock():
    BUILD_LOCK_FILE.parent.mkdir(parents=True, exist_ok=True)
    handle = open(BUILD_LOCK_FILE, "w", encoding="utf-8")
    try:
        fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        handle.write(str(os.getpid()))
        handle.flush()
        return handle
    except BlockingIOError:
        handle.close()
        return None


def source_sort_key(path: Path) -> tuple[int, int]:
    size = path.stat().st_size
    mega_txt = path.suffix.lower() == ".txt" and size >= MEGA_FILE_BYTES
    return (0 if mega_txt else 1, size)


def norm_text_fast(value: str) -> str:
    return value.strip().lower()


def db_file_path(conn: sqlite3.Connection) -> Path | None:
    row = conn.execute("PRAGMA database_list").fetchone()
    if row and row[2]:
        return Path(row[2])
    return None


def indexes_mapped(indexes: dict[str, int | None]) -> bool:
    return sum(1 for value in indexes.values() if value is not None) >= 2


def txt_has_header(headers: list[str]) -> bool:
    if line_is_header(headers):
        return True
    return any(COLUMN_MAP.get(header) for header in headers)


def read_txt_header_info(path: Path) -> tuple[bytes, list[str], int, bool] | None:
    with path.open("rb", buffering=8 * 1024 * 1024) as handle:
        header_line = handle.readline()
    if not header_line:
        return None

    delimiter = detect_binary_delimiter(header_line)
    header_parts = header_line.rstrip(b"\r\n").split(delimiter)
    headers = [clean_header(decode_part(part)) for part in header_parts]
    has_header = txt_has_header(headers)
    return delimiter, headers, len(header_parts), has_header


def sql_col(index: int | None, default: str = "''") -> str:
    if index is None:
        return default
    return f"trim(COALESCE(col{index}, ''))"


def sql_lower(expr: str) -> str:
    if expr == "''":
        return "''"
    return f"lower({expr})"


def build_bulk_insert_select(indexes: dict[str, int | None]) -> str:
    if indexes_mapped(indexes):
        first = sql_col(indexes["first_name"])
        last = sql_col(indexes["last_name"])
        phone = sql_col(indexes["phone"])
        email = sql_col(indexes["email"])
        identity = sql_col(indexes["identity_number"])
        city = sql_col(indexes["city"])
        country = sql_col(indexes["country"])
        notes = sql_col(indexes["notes"])
    else:
        tc_first = "length(replace(trim(COALESCE(col0,'')),' ','')) = 11"
        first = f"CASE WHEN {tc_first} THEN trim(COALESCE(col1,'')) ELSE trim(COALESCE(col0,'')) END"
        last = f"CASE WHEN {tc_first} THEN trim(COALESCE(col2,'')) ELSE trim(COALESCE(col1,'')) END"
        identity = f"CASE WHEN {tc_first} THEN trim(COALESCE(col0,'')) ELSE trim(COALESCE(col2,'')) END"
        phone = f"CASE WHEN {tc_first} THEN trim(COALESCE(col3,'')) ELSE trim(COALESCE(col2,'')) END"
        email = f"CASE WHEN {tc_first} THEN trim(COALESCE(col4,'')) ELSE trim(COALESCE(col3,'')) END"
        city = sql_col(indexes["city"])
        country = "''"
        notes = sql_col(indexes["notes"])

    return f"""
        SELECT
            {first},
            {last},
            {phone},
            {email},
            {identity},
            {city},
            {country},
            {notes},
            '{{}}',
            {sql_lower(first)},
            {sql_lower(last)},
            {sql_lower(phone)},
            {sql_lower(email)},
            {sql_lower(identity)}
        FROM {STAGING_TABLE}
    """


def sqlite_import_mode(delimiter: bytes) -> list[str]:
    if delimiter == b"\t":
        return [".mode tabs"]
    if delimiter == b",":
        return [".mode csv"]
    token = delimiter.decode("latin-1", errors="ignore")
    return [f".separator {token}"]


def stream_txt_bulk_import(conn: sqlite3.Connection, path: Path) -> int:
    if not shutil.which("sqlite3"):
        raise RuntimeError("sqlite3 CLI not found")

    db_path = db_file_path(conn)
    if not db_path:
        raise RuntimeError("bulk import needs a file-backed database")

    header_info = read_txt_header_info(path)
    if not header_info:
        return 0

    delimiter, headers, num_cols, has_header = header_info
    indexes = build_field_indexes(headers)
    skip_rows = 1 if has_header else 0
    size_mb = path.stat().st_size // (1024 * 1024)

    print(
        f"  Fast bulk import for {path.name} ({size_mb} MB, ~49M lines in 1-3 min)...",
        flush=True,
    )
    print(f"  Headers: {headers[:12]}", flush=True)

    conn.execute(f"DROP TABLE IF EXISTS {STAGING_TABLE}")
    staging_cols = ", ".join(f"col{index} TEXT" for index in range(num_cols))
    conn.execute(f"CREATE TABLE {STAGING_TABLE} ({staging_cols})")
    conn.commit()

    import_script = "\n".join(
        sqlite_import_mode(delimiter)
        + [f".import --skip {skip_rows} {path.resolve()} {STAGING_TABLE}"]
    )

    started = time.perf_counter()
    result = subprocess.run(
        ["sqlite3", str(db_path)],
        input=import_script,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        conn.execute(f"DROP TABLE IF EXISTS {STAGING_TABLE}")
        raise RuntimeError(result.stderr.strip() or result.stdout.strip() or "sqlite3 import failed")

    imported = conn.execute(f"SELECT COUNT(*) FROM {STAGING_TABLE}").fetchone()[0]
    elapsed = time.perf_counter() - started
    rate = int(imported / elapsed) if elapsed > 0 else imported
    print(
        f"  Imported {imported} rows in {elapsed:.1f}s ({rate}/sec), transforming...",
        flush=True,
    )

    transform_started = time.perf_counter()
    transformed = 0
    insert_sql = f"""
        INSERT INTO people (
            first_name, last_name, phone, email, identity_number,
            city, country, notes, extra_json,
            first_name_n, last_name_n, phone_n, email_n, identity_number_n
        )
        {build_bulk_insert_select(indexes)}
        LIMIT {BULK_TRANSFORM_CHUNK}
    """
    delete_sql = f"""
        DELETE FROM {STAGING_TABLE} WHERE rowid IN (
            SELECT rowid FROM {STAGING_TABLE} LIMIT {BULK_TRANSFORM_CHUNK}
        )
    """

    while True:
        remaining = conn.execute(f"SELECT COUNT(*) FROM {STAGING_TABLE}").fetchone()[0]
        if remaining == 0:
            break
        conn.execute(insert_sql)
        conn.execute(delete_sql)
        conn.commit()
        transformed += min(BULK_TRANSFORM_CHUNK, remaining)
        if transformed % 2_000_000 == 0 or remaining <= BULK_TRANSFORM_CHUNK:
            print(f"  Transformed {transformed}/{imported} rows...", flush=True)

    conn.execute(f"DROP TABLE IF EXISTS {STAGING_TABLE}")
    conn.commit()
    print(
        f"  Done {path.name}: {imported} rows total in {time.perf_counter() - started:.1f}s "
        f"(transform {time.perf_counter() - transform_started:.1f}s)",
        flush=True,
    )
    return imported


def stream_txt_fast(conn: sqlite3.Connection, path: Path) -> int:
    free_mb = free_disk_bytes(path.parent) // (1024 * 1024)
    file_mb = path.stat().st_size // (1024 * 1024)

    if bulk_import_fits(path) and shutil.which("sqlite3"):
        try:
            return stream_txt_bulk_import(conn, path)
        except (sqlite3.OperationalError, OSError, RuntimeError) as error:
            message = str(error).lower()
            cleanup_sqlite_sidecars(db_file_path(conn))
            if "disk" in message or "i/o" in message or "full" in message:
                print(
                    f"  Bulk import hit disk limit ({error}), switching to turbo...",
                    flush=True,
                )
            else:
                print(f"  Bulk import failed ({error}), using turbo fallback...", flush=True)
    else:
        print(
            f"  Using turbo for {path.name} ({file_mb} MB file, {free_mb} MB free disk)...",
            flush=True,
        )

    return stream_txt_turbo(conn, path)


def build_field_indexes(headers: list[str]) -> dict[str, int | None]:
    indexes: dict[str, int | None] = {
        "first_name": None,
        "last_name": None,
        "phone": None,
        "email": None,
        "identity_number": None,
        "city": None,
        "country": None,
        "notes": None,
    }
    for index, header in enumerate(headers):
        field = COLUMN_MAP.get(header)
        if field in indexes and indexes[field] is None:
            indexes[field] = index
    return indexes


def decode_part(part: bytes) -> str:
    return part.decode("utf-8", errors="ignore").strip()


def turbo_tuple_from_parts(parts: list[bytes], indexes: dict[str, int | None]) -> tuple | None:
    def get(field: str) -> str:
        idx = indexes.get(field)
        if idx is None or idx >= len(parts):
            return ""
        return decode_part(parts[idx])

    first = get("first_name")
    last = get("last_name")
    phone = phone_digits(get("phone"))
    email = get("email").lower()
    identity = get("identity_number")
    city = get("city")
    country = get("country")
    notes = get("notes")

    if not any([first, last, phone, email, identity, city, country, notes]):
        if len(parts) >= 3:
            vals = [decode_part(part) for part in parts]
            if len(phone_digits(vals[0])) == 11:
                identity, first, last = vals[0], vals[1], vals[2]
                phone = phone_digits(vals[3]) if len(vals) > 3 else ""
                email = vals[4].lower() if len(vals) > 4 else ""
            elif len(parts) >= 4:
                first, last, identity = vals[0], vals[1], vals[2]
                phone = phone_digits(vals[3])
            else:
                first, last = vals[0], vals[1]
                identity = vals[2] if len(vals) > 2 else ""
        else:
            return None

    if not any([first, last, phone, email, identity, city, country, notes]):
        return None

    return (
        first,
        last,
        phone,
        email,
        identity,
        city,
        country,
        notes,
        "{}",
        norm_text_fast(first),
        norm_text_fast(last),
        phone[-10:] if len(phone) >= 10 else phone,
        email,
        norm_text_fast(identity),
    )


def detect_binary_delimiter(header_line: bytes) -> bytes:
    for delimiter in (b"\t", b"|", b";", b","):
        if delimiter in header_line:
            return delimiter
    return b"\t"


def stream_txt_turbo(conn: sqlite3.Connection, path: Path) -> int:
    size_mb = path.stat().st_size // (1024 * 1024)
    print(f"  Turbo fallback for {path.name} ({size_mb} MB)...", flush=True)

    batch: list[tuple] = []
    total = 0
    started = time.perf_counter()

    with path.open("rb", buffering=16 * 1024 * 1024) as handle:
        header_line = handle.readline()
        if not header_line:
            return 0

        delimiter = detect_binary_delimiter(header_line)
        header_parts = header_line.rstrip(b"\r\n").split(delimiter)
        headers = [clean_header(decode_part(part)) for part in header_parts]
        indexes = build_field_indexes(headers)
        print(f"  Turbo headers: {headers[:12]}", flush=True)

        for line in handle:
            if not line.strip():
                continue
            parts = line.rstrip(b"\r\n").split(delimiter)
            row = turbo_tuple_from_parts(parts, indexes)
            if row is None:
                continue
            batch.append(row)
            total += 1
            if len(batch) >= TURBO_BATCH_SIZE:
                insert_record_batch(conn, batch)
            if total % TURBO_PROGRESS_EVERY == 0:
                elapsed = max(time.perf_counter() - started, 0.001)
                rate = int(total / elapsed)
                print(
                    f"  Indexed {total} rows from {path.name} ({rate}/sec)...",
                    flush=True,
                )

    insert_record_batch(conn, batch)
    return total


def phone_index_fast(record: dict) -> str:
    phone = record.get("phone", "")
    if not phone:
        return ""
    keys = phone_keys(phone)
    return "|".join(sorted(keys, key=len, reverse=True)) if keys else ""


def tune_sqlite_for_bulk(conn: sqlite3.Connection) -> None:
    conn.execute("PRAGMA journal_mode=DELETE")
    conn.execute("PRAGMA synchronous=OFF")
    conn.execute("PRAGMA temp_store=MEMORY")
    conn.execute("PRAGMA cache_size=-1000000")
    conn.execute("PRAGMA mmap_size=268435456")


def finalize_index_db(db_path: Path) -> None:
    conn = sqlite3.connect(db_path)
    try:
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA synchronous=NORMAL")
        conn.commit()
    finally:
        conn.close()


def restore_sqlite_settings(conn: sqlite3.Connection) -> None:
    conn.execute("PRAGMA synchronous=NORMAL")


def read_delimited_rows(path: Path, suffix: str = ".csv") -> list[dict]:
    return list(iter_delimited_records(path, suffix))


def read_csv_rows(path: Path, suffix: str = ".csv") -> list[dict]:
    return read_delimited_rows(path, suffix)


def insert_record_batch(conn: sqlite3.Connection, batch: list[tuple]) -> None:
    if batch:
        conn.executemany(INSERT_SQL, batch)
        batch.clear()


def stream_records(conn: sqlite3.Connection, path: Path, records) -> int:
    batch: list[tuple] = []
    total = 0
    progress_every = PROGRESS_EVERY
    if path.stat().st_size >= LARGE_FILE_BYTES:
        progress_every = 100000

    for record in records:
        if not row_is_valid(record):
            continue
        batch.append(record_to_row(record))
        total += 1
        if len(batch) >= BATCH_SIZE:
            insert_record_batch(conn, batch)
        if total % progress_every == 0:
            print(f"  Indexed {total} rows from {path.name}...", flush=True)

    insert_record_batch(conn, batch)
    return total


def iter_xlsx_records(path: Path):
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
        return

    parsed = 0
    for row in rows:
        raw = {}
        for index, header in enumerate(headers):
            if not header or index >= len(row):
                continue
            raw[header] = row[index]
        parsed += 1
        if parsed % PROGRESS_EVERY == 0:
            print(f"  Indexed {parsed} rows from {path.name}...", flush=True)
        yield map_row(raw)

    workbook.close()


def iter_delimited_records(path: Path, suffix: str = ".csv"):
    encoding = detect_text_encoding(path)
    line_iter = iter_text_lines(path, encoding)
    sample = list(itertools.islice(line_iter, 100))

    if not sample:
        print(f"  {path.name} is empty", flush=True)
        return

    delimiter = choose_best_delimiter(sample, suffix)
    print(f"  Delimiter for {path.name}: {repr(delimiter)}", flush=True)

    first_parts = split_line(sample[0], delimiter)
    has_header = line_is_header(first_parts)
    headers = [clean_header(part) for part in first_parts] if has_header else []

    if has_header:
        print(f"  Headers for {path.name}: {headers[:12]}", flush=True)
    else:
        print(f"  No header row in {path.name}, using positional columns", flush=True)

    progress_every = PROGRESS_EVERY
    if path.stat().st_size >= LARGE_FILE_BYTES:
        progress_every = 100000
        print(f"  Large file detected ({path.stat().st_size // (1024 * 1024)} MB), streaming...", flush=True)

    valid = 0
    start = 1 if has_header else 0

    for line in itertools.chain(sample[start:], line_iter):
        record = parse_delimited_line(line, delimiter, headers)
        if not row_is_valid(record):
            continue

        valid += 1
        if valid <= 3:
            print(
                f"  Sample row {valid}: {record.get('first_name', '')} {record.get('last_name', '')} {record.get('phone', '') or record.get('identity_number', '')}",
                flush=True,
            )
        if valid % progress_every == 0:
            print(f"  Indexed {valid} rows from {path.name}...", flush=True)
        yield record

    if valid == 0:
        print(f"  No valid rows loaded from {path.name}. First line: {sample[0][:200]}", flush=True)


def read_xlsx_rows(path: Path) -> list[dict]:
    return list(iter_xlsx_records(path))


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


def count_text_lines(path: Path) -> int:
    wc = shutil.which("wc")
    if wc:
        result = subprocess.run(
            [wc, "-l", str(path)],
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode == 0 and result.stdout.strip():
            return int(result.stdout.split()[0])

    total = 0
    with path.open("rb", buffering=16 * 1024 * 1024) as handle:
        while True:
            chunk = handle.read(16 * 1024 * 1024)
            if not chunk:
                break
            total += chunk.count(b"\n")
    return total


def count_xlsx_lines(path: Path) -> int:
    from openpyxl import load_workbook

    workbook = load_workbook(path, read_only=True, data_only=True)
    sheet = workbook.active
    total = 0
    for _ in sheet.iter_rows(values_only=True):
        total += 1
    workbook.close()
    return total


def count_db_lines(path: Path) -> int:
    if path.resolve() == INDEX_DB.resolve():
        return 0

    conn = sqlite3.connect(path)
    try:
        tables = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='people'"
        ).fetchall()
        if not tables:
            return 0
        return conn.execute("SELECT COUNT(*) FROM people").fetchone()[0]
    finally:
        conn.close()


def count_file_lines(path: Path) -> int | None:
    suffix = path.suffix.lower()
    if suffix in {".txt", ".csv", ".tsv"}:
        return count_text_lines(path)
    if suffix in {".xlsx", ".xlsm"}:
        return count_xlsx_lines(path)
    if suffix == ".db":
        return count_db_lines(path)
    return None


def file_stats(path: Path) -> dict:
    stat = path.stat()
    suffix = path.suffix.lower()
    lines = count_file_lines(path)
    data_lines = None

    if lines is not None and suffix in {".txt", ".csv", ".tsv", ".xlsx", ".xlsm"}:
        if suffix == ".txt":
            header_info = read_txt_header_info(path)
            has_header = header_info[3] if header_info else False
        else:
            has_header = True
        data_lines = max(lines - 1, 0) if has_header and lines > 0 else lines

    return {
        "file": path.name,
        "type": suffix.lstrip(".") or "unknown",
        "size_bytes": stat.st_size,
        "size_mb": round(stat.st_size / (1024 * 1024), 2),
        "lines": lines,
        "data_lines": data_lines,
    }


def collect_stats() -> dict:
    files = source_files()
    file_rows = [file_stats(path) for path in files]
    line_counts = [row["lines"] for row in file_rows if isinstance(row["lines"], int)]

    stats = {
        "files": len(file_rows),
        "total_lines": sum(line_counts),
        "total_size_bytes": sum(row["size_bytes"] for row in file_rows),
        "total_size_mb": round(sum(row["size_bytes"] for row in file_rows) / (1024 * 1024), 2),
        "free_disk_mb": free_disk_bytes() // (1024 * 1024),
        "index_ready": INDEX_READY.is_set(),
        "indexed_records": count_records() if INDEX_READY.is_set() and INDEX_DB.exists() else 0,
        "sources": file_rows,
    }

    if INDEX_ERROR:
        stats["index_error"] = INDEX_ERROR

    return stats


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
    extra = record.get("extra") or {}
    return (
        record["first_name"],
        record["last_name"],
        record["phone"],
        record["email"],
        record["identity_number"],
        record["city"],
        record["country"],
        record["notes"],
        "{}" if not extra else json.dumps(extra, ensure_ascii=False),
        norm_text(record["first_name"]),
        norm_text(record["last_name"]),
        phone_index_fast(record) if not extra else collect_phone_keys(record),
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
        records = list(iter_xlsx_records(path))
    elif suffix in {".csv", ".tsv", ".txt"}:
        records = list(iter_delimited_records(path, suffix))
    elif suffix == ".db":
        records = read_db_rows(path)
    elif suffix == ".7z":
        records = read_7z_records(path)
    else:
        records = []
    return [record for record in records if row_is_valid(record)]


def index_file(conn: sqlite3.Connection, path: Path) -> int:
    suffix = path.suffix.lower()
    print(f"Loading {path.name}...", flush=True)

    if suffix in {".xlsx", ".xlsm"}:
        return stream_records(conn, path, iter_xlsx_records(path))
    if suffix in {".csv", ".tsv", ".txt"}:
        if suffix == ".txt" and path.stat().st_size >= MEGA_FILE_BYTES:
            return stream_txt_fast(conn, path)
        return stream_records(conn, path, iter_delimited_records(path, suffix))

    records = load_file_records(path)
    insert_records(conn, records)
    return len(records)


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
        if not index_is_stale():
            return

        lock_handle = try_acquire_build_lock()
        if lock_handle is None:
            print("Another index build is already running, keeping current index", flush=True)
            return

        try:
            free_mb = free_disk_bytes() // (1024 * 1024)
            print(f"Building search index ({free_mb} MB free disk)...", flush=True)
            info = rebuild_index()
            print(
                f"Loaded {info['records']} records from {len(info['sources'])} file(s)",
                flush=True,
            )
        finally:
            fcntl.flock(lock_handle.fileno(), fcntl.LOCK_UN)
            lock_handle.close()


def build_index_background() -> None:
    global INDEX_ERROR
    try:
        ensure_index()
    except Exception as error:
        INDEX_ERROR = str(error)
        print(f"Index build failed: {error}", flush=True)
        cleanup_sqlite_sidecars()
        if INDEX_DB.exists() and index_schema_ok():
            try:
                records = count_records()
            except sqlite3.Error:
                records = 0
            if records > 0:
                INDEX_ERROR = None
                print(f"Keeping previous index with {records} records for searches", flush=True)
    finally:
        INDEX_READY.set()


def wait_for_index() -> None:
    if not INDEX_READY.wait(timeout=None):
        raise HTTPException(status_code=503, detail="Index is still building, try again in a few minutes")
    if INDEX_ERROR:
        raise HTTPException(status_code=500, detail=INDEX_ERROR)


def rebuild_index() -> dict:
    DATABASE_DIR.mkdir(parents=True, exist_ok=True)
    temp_db = BASE_DIR / ".search_index.building.db"
    cleanup_sqlite_sidecars(temp_db)
    if temp_db.exists():
        temp_db.unlink()

    sources = sorted(source_files(), key=source_sort_key)
    loaded_files = []
    total_records = 0

    conn = sqlite3.connect(temp_db)
    try:
        tune_sqlite_for_bulk(conn)
        ensure_index_schema(conn)
        for path in sources:
            try:
                count = index_file(conn, path)
            except (sqlite3.OperationalError, OSError) as error:
                print(f"Failed to load {path.name}: {error}", flush=True)
                cleanup_sqlite_sidecars(db_file_path(conn))
                if "disk" in str(error).lower() or "i/o" in str(error).lower():
                    raise RuntimeError(
                        f"Disk full while loading {path.name}. "
                        f"Free space: {free_disk_bytes() // (1024 * 1024)} MB. "
                        "Delete old files or use turbo-only mode."
                    ) from error
                continue
            except Exception as error:
                print(f"Failed to load {path.name}: {error}", flush=True)
                continue
            if count:
                loaded_files.append(path.name)
                total_records += count
                print(f"Loaded {count} records from {path.name}", flush=True)
        conn.commit()
        restore_sqlite_settings(conn)
    finally:
        conn.close()

    cleanup_sqlite_sidecars(INDEX_DB)
    if INDEX_DB.exists():
        INDEX_DB.unlink()
    temp_db.replace(INDEX_DB)
    cleanup_sqlite_sidecars(INDEX_DB)
    finalize_index_db(INDEX_DB)

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


@app.get("/api/stats")
def api_stats() -> Response:
    started = time.perf_counter()
    return raw_json(
        ok=True,
        stats=collect_stats(),
        ms=round((time.perf_counter() - started) * 1000, 2),
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
                free_disk_mb=free_disk_bytes() // (1024 * 1024),
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
