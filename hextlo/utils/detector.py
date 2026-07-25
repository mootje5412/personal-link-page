import re

from models.search import DetectedSearch, SearchType

VIN_PATTERN = re.compile(r"^[A-HJ-NPR-Z0-9]{17}$", re.IGNORECASE)
SSN_PATTERN = re.compile(r"^\d{3}-?\d{2}-?\d{4}$")
PHONE_PATTERN = re.compile(r"^\+?1?[\d\s().-]{10,20}$")
EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
ZIP_PATTERN = re.compile(r"^\d{5}(?:-\d{4})?$")
NAME_PART_PATTERN = re.compile(r"^[A-Za-z][A-Za-z'.-]*$")
PREFIX_PATTERN = re.compile(r"^(intelius|odido|person)[:\s]+(.+)$", re.IGNORECASE)

US_STATES = {
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA",
    "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT",
    "VA", "WA", "WV", "WI", "WY", "DC",
}

NATIONWIDE_STATE = "XX"


def _comma_query(parts: list[str]) -> str:
    return ",".join(part.strip() for part in parts if part.strip())


def _digits(value: str) -> str:
    return re.sub(r"\D", "", value)


def normalize_ssn(value: str) -> str:
    digits = _digits(value)
    if len(digits) != 9:
        return value.strip()
    return f"{digits[:3]}-{digits[3:5]}-{digits[5:]}"


def normalize_phone(value: str) -> str:
    digits = _digits(value)
    if len(digits) == 11 and digits.startswith("1"):
        digits = digits[1:]
    return digits


def _looks_like_phone(value: str) -> bool:
    if not PHONE_PATTERN.match(value.strip()):
        return False
    digits = _digits(value)
    return 10 <= len(digits) <= 11


def _looks_like_ssn(value: str) -> bool:
    compact = value.replace(" ", "")
    if SSN_PATTERN.match(compact):
        return True
    digits = _digits(value)
    return len(digits) == 9


def _looks_like_vin(value: str) -> bool:
    return bool(VIN_PATTERN.match(value.replace(" ", "").upper()))


def _is_state(value: str) -> bool:
    return value.upper() in US_STATES


def _looks_like_zip(value: str) -> bool:
    return bool(ZIP_PATTERN.match(value.strip()))


def _looks_like_name_part(value: str) -> bool:
    return bool(NAME_PART_PATTERN.match(value.strip()))


def _looks_like_email(value: str) -> bool:
    return bool(EMAIL_PATTERN.match(value.strip()))


def _looks_like_dutch_phone(value: str) -> bool:
    digits = _digits(value)
    if digits.startswith("0031") and len(digits) >= 13:
        return True
    if digits.startswith("31") and len(digits) == 11 and digits[2] in "6789":
        return True
    if digits.startswith("06") and len(digits) == 10:
        return True
    return False


def _intelius_search(first: str, second: str, third: str) -> DetectedSearch:
    display = f"{first}, {second}, {third}"
    return DetectedSearch(
        SearchType.INTELIUS,
        _comma_query([first, second, third]),
        display,
        label="Intelius Search",
    )


def _odido_search(query: str) -> DetectedSearch:
    return DetectedSearch(
        SearchType.ODIDO,
        query.strip(),
        query.strip(),
        label="Odido Search",
    )


def _person_search(first: str, last: str, third: str, fourth: str) -> DetectedSearch:
    display = f"{first} {last} {third} {fourth}"
    return DetectedSearch(
        SearchType.PERSON,
        _comma_query([first, last, third, fourth]),
        display,
        label="Person Lookup",
    )


def _name_search(first: str, last: str, state: str = NATIONWIDE_STATE) -> DetectedSearch:
    display = f"{first} {last}" if state == NATIONWIDE_STATE else f"{first} {last} {state}"
    label = "Name Search" if state == NATIONWIDE_STATE else "Criminal Lookup"
    return DetectedSearch(
        SearchType.CRIMINAL,
        _comma_query([first, last, state.upper()]),
        display,
        label=label,
    )


def _criminal_search(first: str, last: str, city: str, state: str) -> DetectedSearch:
    return DetectedSearch(
        SearchType.CRIMINAL,
        _comma_query([first, last, city, state.upper()]),
        f"{first} {last} {city} {state.upper()}",
        label="Criminal Lookup",
    )


def detect_search(text: str) -> DetectedSearch | None:
    raw = text.strip()
    if not raw or raw.startswith("/"):
        return None

    prefix_match = PREFIX_PATTERN.match(raw)
    if prefix_match:
        prefix = prefix_match.group(1).lower()
        query = prefix_match.group(2).strip()
        if not query:
            return None
        if prefix == "intelius":
            parts = [part.strip() for part in query.split(",") if part.strip()]
            if len(parts) >= 3:
                return _intelius_search(parts[0], parts[1], parts[2])
            return None
        if prefix == "person":
            parts = [part.strip() for part in query.split(",") if part.strip()]
            if len(parts) >= 4:
                return _person_search(parts[0], parts[1], parts[2], parts[3])
            return None
        return _odido_search(query)

    if _looks_like_email(raw):
        return _odido_search(raw)

    if _looks_like_dutch_phone(raw):
        return _odido_search(raw)

    if "," in raw:
        parts = [part.strip() for part in raw.split(",") if part.strip()]
        if len(parts) >= 4:
            if _is_state(parts[3]):
                return _criminal_search(parts[0], parts[1], parts[2], parts[3])
            return _person_search(parts[0], parts[1], parts[2], parts[3])
        if len(parts) == 3:
            if _looks_like_ssn(parts[0]):
                return DetectedSearch(SearchType.SSN, normalize_ssn(parts[0]), raw, label="SSN Search")
            if _is_state(parts[2]):
                return _name_search(parts[0], parts[1], parts[2])
            return _intelius_search(parts[0], parts[1], parts[2])
        if len(parts) == 2:
            left, right = parts
            if _looks_like_ssn(left) or _looks_like_ssn(right):
                ssn = left if _looks_like_ssn(left) else right
                return DetectedSearch(SearchType.SSN, normalize_ssn(ssn), raw, label="SSN Search")
            if _looks_like_phone(left) or _looks_like_phone(right):
                phone = normalize_phone(left if _looks_like_phone(left) else right)
                return DetectedSearch(
                    SearchType.MOBILE,
                    f"{phone},*",
                    raw,
                    label="Phone Search",
                )
            return _name_search(left, right)

    compact = raw.replace(" ", "").upper()
    if _looks_like_vin(compact):
        return DetectedSearch(SearchType.VIN, compact, raw, label="VIN Search")

    if _looks_like_ssn(raw):
        return DetectedSearch(SearchType.SSN, normalize_ssn(raw), raw, label="SSN Search")

    if _looks_like_phone(raw):
        phone = normalize_phone(raw)
        return DetectedSearch(
            SearchType.MOBILE,
            f"{phone},*",
            raw,
            label="Phone Search",
        )

    words = raw.split()
    if len(words) == 4 and _is_state(words[-2]) and _looks_like_zip(words[-1]):
        return _person_search(words[0], words[1], words[-2], words[-1])

    if len(words) >= 4 and _is_state(words[-1]):
        state = words[-1].upper()
        if len(words) == 4:
            return _criminal_search(words[0], words[1], words[2], state)
        return _criminal_search(words[0], words[1], " ".join(words[2:-1]), state)

    if len(words) == 3 and _is_state(words[-1]):
        return _name_search(words[0], words[1], words[-1])

    if len(words) >= 2 and all(_looks_like_name_part(word) for word in words):
        if len(words) == 2:
            return _name_search(words[0], words[1])
        return _name_search(words[0], " ".join(words[1:]))

    if len(words) == 1 and re.match(r"^[A-Za-z0-9@._-]{5,}$", words[0]):
        return _odido_search(words[0])

    return None


def format_detection_hint() -> str:
    return (
        "Could not detect that search.\n\n"
        "Try one of these:\n"
        "  418-90-8868 .............. SSN\n"
        "  John Doe ................. name\n"
        "  John Doe CA .............. name + state\n"
        "  John Doe CA 90210 ........ person lookup\n"
        "  John,Doe,CA,90210 ........ person lookup\n"
        "  John,Doe,90210 ........... Intelius\n"
        "  example .................. Odido keyword\n"
        "  user@email.com ............. Odido\n"
        "  0612345678 ............... Odido (NL phone)\n"
        "  (256) 521-1446 ........... phone\n"
        "  1HGBH41JXMN109186 ........ VIN"
    )
