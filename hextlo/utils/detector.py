import re

from models.search import DetectedSearch, SearchType

VIN_PATTERN = re.compile(r"^[A-HJ-NPR-Z0-9]{17}$", re.IGNORECASE)
SSN_PATTERN = re.compile(r"^\d{3}-?\d{2}-?\d{4}$")
PHONE_PATTERN = re.compile(r"^\+?[\d\s().-]{10,20}$")
STATE_PATTERN = re.compile(r"^[A-Za-z]{2}$")


def _comma_query(parts: list[str]) -> str:
    return ",".join(part.strip() for part in parts if part.strip())


def detect_search(text: str) -> DetectedSearch | None:
    raw = text.strip()
    if not raw or raw.startswith("/"):
        return None

    if "," in raw:
        parts = [part.strip() for part in raw.split(",") if part.strip()]
        if len(parts) == 4:
            return DetectedSearch(
                SearchType.CRIMINAL,
                _comma_query(parts),
                raw,
            )
        if len(parts) == 3:
            return DetectedSearch(
                SearchType.INTELIUS,
                _comma_query(parts),
                raw,
            )
        if len(parts) == 2:
            if _looks_like_phone(parts[0]) or _looks_like_phone(parts[1]):
                return DetectedSearch(SearchType.MOBILE, _comma_query(parts), raw)
            return DetectedSearch(SearchType.SSN, _comma_query(parts), raw)

    compact = raw.replace(" ", "").upper()
    if VIN_PATTERN.match(compact):
        return DetectedSearch(SearchType.VIN, compact, raw)

    if SSN_PATTERN.match(raw.replace(" ", "")):
        return DetectedSearch(SearchType.SSN, raw.replace(" ", ""), raw)

    if _looks_like_phone(raw):
        digits = re.sub(r"\D", "", raw)
        return DetectedSearch(SearchType.MOBILE, f"{digits},", raw)

    words = raw.split()
    if len(words) >= 4 and STATE_PATTERN.match(words[-1]):
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

    if len(words) == 3 and STATE_PATTERN.match(words[-1]):
        return DetectedSearch(
            SearchType.INTELIUS,
            _comma_query([words[0], words[1], words[2].upper()]),
            raw,
        )

    if len(words) == 2:
        return DetectedSearch(
            SearchType.SSN,
            _comma_query([words[0], words[1]]),
            raw,
        )

    if len(words) == 1 and len(compact) == 17:
        return DetectedSearch(SearchType.VIN, compact, raw)

    return None


def _looks_like_phone(value: str) -> bool:
    if not PHONE_PATTERN.match(value.strip()):
        return False
    digits = re.sub(r"\D", "", value)
    return 10 <= len(digits) <= 11


def format_detection_hint() -> str:
    return (
        "I couldn't detect that search. Try one of these formats:\n\n"
        "• John Smith — SSN / name search\n"
        "• John Smith CA — Intelius (name + state)\n"
        "• John Smith Los Angeles CA — criminal lookup\n"
        "• John, Smith, Los Angeles, CA — criminal (comma format)\n"
        "• 5551234567 — mobile / phone lookup\n"
        "• 1HGBH41JXMN109186 — VIN search\n\n"
        "Commas give the most accurate detection."
    )
