#!/usr/bin/env python3
import argparse
import csv
import sqlite3
from pathlib import Path

from database import connect, ensure_database, normalize_identity, normalize_phone, normalize_text


def import_csv(path: Path) -> int:
    ensure_database()
    inserted = 0

    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        rows = list(reader)

    with connect() as conn:
        for row in rows:
            first_name = row.get("first_name", "").strip()
            last_name = row.get("last_name", "").strip()
            phone = row.get("phone", "").strip()
            identity_number = row.get("identity_number", "").strip()

            if not any([first_name, last_name, phone, identity_number]):
                continue

            conn.execute(
                """
                INSERT INTO people (
                    first_name, last_name, phone, identity_number, email,
                    city, country, source, notes,
                    phone_norm, first_name_norm, last_name_norm, identity_norm
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    first_name,
                    last_name,
                    phone,
                    identity_number,
                    row.get("email", "").strip(),
                    row.get("city", "").strip(),
                    row.get("country", "").strip(),
                    row.get("source", "").strip(),
                    row.get("notes", "").strip(),
                    normalize_phone(phone),
                    normalize_text(first_name),
                    normalize_text(last_name),
                    normalize_identity(identity_number),
                ),
            )
            inserted += 1

    return inserted


def main() -> None:
    parser = argparse.ArgumentParser(description="Import people records into SQLite")
    parser.add_argument("csv_file", type=Path, help="CSV file to import")
    args = parser.parse_args()

    count = import_csv(args.csv_file)
    print(f"Imported {count} records.")


if __name__ == "__main__":
    main()
