import re

from models.search import DetectedSearch, SearchType

VIN_PATTERN = re.compile(r"^[A-HJ-NPR-Z0-9]{17}$", re.IGNORECASE)
SSN_PATTERN = re.compile(r"^\d{3}-?\d{2}-?\d{4}$")
PHONE_PATTERN = re.compile(r"^\+?1?[\d\s().-]{10,20}$")
STATE_PATTERN = re.compile(r"^[A-Za-z]{2}$")
ZIP_PATTERN = re.compile(r"^\d{5}(?:-\d{4})?$")

US_STATES = {
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA",
    "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT",
    "VA", "WA", "WV", "WI", "WY", "DC",
}


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


def detect_search(text: str) -> DetectedSearch | None:
    raw = text.strip()
    if not raw or raw.startswith("/"):
        return None

    if "," in raw:
        parts = [part.strip() for part in raw.split(",") if part.strip()]
        if len(parts) >= 4:
            return DetectedSearch(
                SearchType.CRIMINAL,
                _comma_query(parts[:4]),
                raw,
            )
        if len(parts) == 3:
            if _looks_like_ssn(parts[0]) or _looks_like_phone(parts[0]):
                return DetectedSearch(SearchType.SSN, normalize_ssn(parts[0]), raw)
            return DetectedSearch(
                SearchType.INTELIUS,
                _comma_query([parts[0], parts[1], parts[2].upper() if _is_state(parts[2]) else parts[2]]),
                raw,
            )
        if len(parts) == 2:
            left, right = parts
            if _looks_like_ssn(left) or _looks_like_ssn(right):
                return DetectedSearch(SearchType.SSN, normalize_ssn(left if _looks_like_ssn(left) else right), raw)
            if _looks_like_phone(left) or _looks_like_phone(right):
                return DetectedSearch(SearchType.MOBILE, _comma_query([normalize_phone(left), right]), raw)
            return DetectedSearch(SearchType.SSN, _comma_query([left, right]), raw)

    compact = raw.replace(" ", "").upper()
    if _looks_like_vin(compact):
        return DetectedSearch(SearchType.VIN, compact, raw)

    if _looks_like_ssn(raw):
        return DetectedSearch(SearchType.SSN, normalize_ssn(raw), raw)

    if _looks_like_phone(raw):
        phone = normalize_phone(raw)
        return DetectedSearch(SearchType.MOBILE, _comma_query([phone, phone]), raw)

    if ZIP_PATTERN.match(raw):
        return DetectedSearch(SearchType.SSN, raw, raw)

    words = raw.split()
    if len(words) >= 4 and _is_state(words[-1]):
        state = words[-1].upper()
        if len(words) == 4:
            first, last, city = words[0], words[1], words[2]
        else:
            first, last, city = words[0], words[1], " ".join(words[2:-1])
        return DetectedSearch(
            SearchType.CRIMINAL,
            _comma_query([first, last, city, state]),
            raw,
        )

    if len(words) == 3 and _is_state(words[-1]):
        return DetectedSearch(
            SearchType.INTELIUS,
            _comma_query([words[0], words[1], words[2].upper()]),
            raw,
        )

    if len(words) == 3:
        return DetectedSearch(
            SearchType.SSN,
            _comma_query([words[0], " ".join(words[1:])]),
            raw,
        )

    if len(words) == 2:
        return DetectedSearch(
            SearchType.SSN,
            _comma_query([words[0], words[1]]),
            raw,
        )

    if len(words) == 1 and len(words[0]) >= 3:
        return DetectedSearch(SearchType.SSN, words[0], raw)

    return None


def format_detection_hint() -> str:
    return (
        "Could not detect that search. Try:\n\n"
        "• 418-90-8868 — SSN lookup\n"
        "• John Smith — name search\n"
        "• John Smith CA — Intelius\n"
        "• John Smith Los Angeles CA — criminal\n"
        "• 5551234567 — phone / mobile\n"
        "• 1HGBH41JXMN109186 — VIN\n\n"
        "Comma format is most accurate:\n"
        "John, Smith, Los Angeles, CA"
    )
