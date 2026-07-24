#!/usr/bin/env python3
import argparse
import csv
from pathlib import Path

from config import DATABASE_DIR
from database import connect, ensure_database, insert_person, list_database_files

COLUMN_MAP = {
    "name": "first_name",
    "first_name": "first_name",
    "surname": "last_name",
    "last_name": "last_name",
    "phone": "phone",
    "phone number": "phone",
    "email": "email",
    "e-mail": "email",
    "e-mail contact": "email",
    "identity_number": "identity_number",
    "identity number": "identity_number",
    "tc": "identity_number",
}


def clean_header(value: str) -> str:
    return " ".join(str(value or "").strip().lower().split())


def map_row(raw: dict) -> dict[str, str]:
    record = {
        "first_name": "",
        "last_name": "",
        "phone": "",
        "email": "",
        "identity_number": "",
    }

    for key, value in raw.items():
        field = COLUMN_MAP.get(clean_header(key))
        if not field:
            continue
        text = str(value or "").strip()
        if text.lower() in {"x", "none", "null", "nan", ""}:
            continue
        record[field] = text

    return record


def valid(record: dict[str, str]) -> bool:
    return any(record.values())


def read_csv(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        sample = handle.read(4096)
        handle.seek(0)
        delimiter = "\t" if sample.count("\t") > sample.count(",") else ","
        return [map_row(row) for row in csv.DictReader(handle, delimiter=delimiter)]


def read_xlsx(path: Path) -> list[dict]:
    from openpyxl import load_workbook

    workbook = load_workbook(path, read_only=True, data_only=True)
    sheet = workbook.active
    rows = sheet.iter_rows(values_only=True)
    headers = [clean_header(cell) for cell in next(rows, [])]
    records = []

    for row in rows:
        raw = {headers[i]: row[i] for i in range(min(len(headers), len(row))) if headers[i]}
        records.append(map_row(raw))

    workbook.close()
    return records


def read_file(path: Path) -> list[dict]:
    if path.suffix.lower() in {".xlsx", ".xlsm"}:
        return read_xlsx(path)
    return read_csv(path)


def import_file(path: Path) -> int:
    records = [row for row in read_file(path) if valid(row)]
    if not records:
        return 0

    with connect() as conn:
        for record in records:
            insert_person(conn, record)

    return len(records)


def import_folder(replace: bool = False) -> int:
    ensure_database()
    files = list_database_files()

    if not files:
        print(f"No files in {DATABASE_DIR}")
        return 0

    if replace:
        with connect() as conn:
            conn.execute("DELETE FROM people")

    total = 0
    for path in files:
        count = import_file(path)
        total += count
        print(f"{path.name}: {count}")

    return total


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--replace", action="store_true", help="Clear database first")
    args = parser.parse_args()

    total = import_folder(replace=args.replace)
    print(f"Total imported: {total}")


if __name__ == "__main__":
    main()
