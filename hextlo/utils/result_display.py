from __future__ import annotations

import re

from models.search import SearchResult, SearchType

RECORD_LINE = "─" * 22

ODIDO_FIELD_MAP: list[tuple[str, str]] = [
    ("DOB", "DOB"),
    ("Phone", "Phone"),
    ("Mobile", "Mobile"),
    ("Email", "Email"),
    ("Gender", "Gender"),
    ("Nationality", "Nationality"),
    ("ID Number", "ID Number"),
    ("ID Type", "ID Type"),
    ("ID Valid", "ID Valid"),
    ("Brand", "Brand"),
    ("Status", "Status"),
    ("Language", "Language"),
    ("Segment", "Segment"),
    ("Salutation", "Salutation"),
]

VIN_FIELD_MAP: list[tuple[str, str]] = [
    ("VIN", "VIN"),
    ("Model Year", "Year"),
    ("Make", "Make"),
    ("Model", "Model"),
    ("Trim", "Trim"),
    ("Body Class", "Body"),
    ("Vehicle Type", "Type"),
    ("Drive Type", "Drive"),
    ("Transmission Style", "Transmission"),
    ("Engine Number of Cylinders", "Cylinders"),
    ("Displacement (L)", "Engine"),
    ("Fuel Type - Primary", "Fuel"),
    ("Doors", "Doors"),
    ("Plant Country", "Made in"),
    ("Manufacturer Name", "Manufacturer"),
]

SKIP_VALUES = {"", "null", "not applicable", "n/a", "none"}


def _is_noise(value: str) -> bool:
    text = value.strip()
    if not text:
        return True
    if text.lower() in SKIP_VALUES:
        return True
    if text.startswith("<") and ">" in text:
        return True
    return False


def _format_engine(fields: dict[str, str]) -> str | None:
    displacement = fields.get("Displacement (L)", "").strip()
    cylinders = fields.get("Engine Number of Cylinders", "").strip()
    if displacement and cylinders:
        return f"{displacement}L {cylinders}-cyl"
    return displacement or cylinders or None


def format_odido_result(result: SearchResult, index: int | None = None) -> str:
    prefix = f"[{index}] " if index is not None else ""
    lines = [f"{prefix}{result.title}", RECORD_LINE]

    for field_key, label in ODIDO_FIELD_MAP:
        value = result.fields.get(field_key, "").strip()
        if _is_noise(value):
            continue
        lines.append(f"  {label}: {value}")

    return "\n".join(lines)


def format_vin_result(result: SearchResult) -> str:
    lines = [result.title, RECORD_LINE]

    engine_line = _format_engine(result.fields)
    shown: set[str] = set()

    for source_key, label in VIN_FIELD_MAP:
        if source_key in {"Displacement (L)", "Engine Number of Cylinders"}:
            continue
        value = result.fields.get(source_key, "").strip()
        if _is_noise(value):
            continue
        if source_key == "Fuel Type - Primary" and engine_line:
            value = f"{engine_line}, {value}"
            shown.add("engine")
        lines.append(f"  {label}: {value}")
        shown.add(source_key)

    if engine_line and "engine" not in shown:
        insert_at = 2
        for idx, line in enumerate(lines[2:], start=2):
            if line.startswith("  Fuel:"):
                insert_at = idx
                break
            if line.startswith("  Cylinders:") or line.startswith("  Engine:"):
                insert_at = idx + 1
        lines.insert(insert_at, f"  Engine: {engine_line}")

    return "\n".join(lines)


def format_default_result(result: SearchResult, index: int) -> str:
    lines = [f"[{index}] {result.title}", RECORD_LINE]
    shown: set[str] = set()

    priority = (
        "SSN",
        "DOB",
        "Phone",
        "Mobile",
        "Email",
        "Address",
        "City",
        "State",
        "ZIP",
        "Age",
        "Sex",
        "Offense",
        "Offense Code",
        "Charges Filed",
        "Agency",
    )

    for key in priority:
        value = result.fields.get(key, "").strip()
        if value and not _is_noise(value):
            lines.append(f"  {key}: {value}")
            shown.add(key)

    for key, value in result.fields.items():
        if key in shown or key in {"Id", "Name"}:
            continue
        text = str(value).strip()
        if _is_noise(text):
            continue
        if re.search(r"(?i)(created|modified|owner|accountid|photourl|systemmodstamp|__c$)", key):
            continue
        lines.append(f"  {key}: {text}")

    return "\n".join(lines)


def format_result(result: SearchResult, search_type: SearchType, index: int | None = None) -> str:
    if search_type == SearchType.ODIDO:
        return format_odido_result(result, index)
    if search_type == SearchType.VIN:
        return format_vin_result(result)
    if index is None:
        index = 1
    return format_default_result(result, index)
