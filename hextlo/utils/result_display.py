from __future__ import annotations

from models.search import SearchResult, SearchType

SKIP = {"", "null", "not applicable", "n/a", "none"}


def _clean(value: str) -> str:
    return value.strip()


def _ok(value: str) -> bool:
    text = _clean(value)
    return bool(text) and text.lower() not in SKIP


def _line(label: str, value: str) -> str | None:
    if not _ok(value):
        return None
    return f"{label}: {value}"


def _truncate(text: str, limit: int = 80) -> str:
    text = _clean(text)
    if len(text) <= limit:
        return text
    return text[: limit - 3] + "..."


def _pick(result: SearchResult, *keys: str) -> str:
    for key in keys:
        value = result.fields.get(key, "")
        if _ok(value):
            return _clean(value)
    return ""


def _card(index: int | None, title: str, lines: list[str | None]) -> str:
    head = f"{index}. {title}" if index is not None else title
    body = [line for line in lines if line]
    if not body:
        return head
    return "\n".join([head, *body])


def format_name_result(result: SearchResult, index: int | None = None) -> str:
    offense = _pick(result, "Offense")
    return _card(
        index,
        result.title,
        [
            _line("SSN", _pick(result, "SSN")),
            _line("DOB", _pick(result, "DOB")),
            _line("Phone", _pick(result, "Phone")),
            _line("Address", _pick(result, "Address")),
            _line("Offense", _truncate(offense)) if offense else None,
        ],
    )


def format_ssn_result(result: SearchResult, index: int | None = None) -> str:
    return _card(
        index,
        result.title,
        [
            _line("SSN", _pick(result, "SSN")),
            _line("DOB", _pick(result, "DOB")),
            _line("Phone", _pick(result, "Phone")),
            _line("Address", _pick(result, "Address")),
        ],
    )


def format_odido_result(result: SearchResult, index: int | None = None) -> str:
    phone = _pick(result, "Phone", "Mobile")
    email = _pick(result, "Email")
    contact = " · ".join(part for part in (phone, email) if part)
    return _card(
        index,
        result.title,
        [
            contact or None,
            _line("DOB", _pick(result, "DOB")),
            _line("Address", _pick(result, "Address", "Nationality")),
        ],
    )


def format_vin_result(result: SearchResult) -> str:
    engine = _pick(result, "Displacement (L)")
    cylinders = _pick(result, "Engine Number of Cylinders")
    fuel = _pick(result, "Fuel Type - Primary")
    if engine and cylinders:
        motor = f"{engine}L {cylinders}-cyl"
    else:
        motor = engine or cylinders
    if motor and fuel:
        motor = f"{motor} · {fuel}"
    elif fuel:
        motor = fuel

    body = _pick(result, "Body Class")
    drive = _pick(result, "Drive Type")
    spec = " · ".join(part for part in (body, drive, motor) if part)

    return _card(
        None,
        result.title,
        [
            _line("VIN", _pick(result, "VIN")),
            spec or None,
        ],
    )


def format_result(result: SearchResult, search_type: SearchType, index: int | None = None) -> str:
    if search_type == SearchType.VIN:
        return format_vin_result(result)
    if search_type in {SearchType.NAME, SearchType.PERSON, SearchType.CRIMINAL}:
        return format_name_result(result, index)
    if search_type == SearchType.SSN:
        return format_ssn_result(result, index)
    if search_type == SearchType.ODIDO:
        return format_odido_result(result, index)
    return format_name_result(result, index)
