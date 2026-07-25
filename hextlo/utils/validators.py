import re

SSN_PATTERN = re.compile(r"^\d{3}-?\d{2}-?\d{4}$")
PHONE_PATTERN = re.compile(r"^\+?[\d\s().-]{7,20}$")
EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
ZIP_PATTERN = re.compile(r"^\d{5}(?:-\d{4})?$")


def normalize_ssn(value: str) -> str:
    digits = re.sub(r"\D", "", value)
    if len(digits) != 9:
        raise ValueError("SSN must be 9 digits (e.g. 123-45-6789).")
    return f"{digits[:3]}-{digits[3:5]}-{digits[5:]}"


def validate_phone(value: str) -> str:
    cleaned = value.strip()
    if not PHONE_PATTERN.match(cleaned):
        raise ValueError("Enter a valid phone number (e.g. +1 555-123-4567).")
    return cleaned


def validate_email(value: str) -> str:
    cleaned = value.strip().lower()
    if not EMAIL_PATTERN.match(cleaned):
        raise ValueError("Enter a valid email address.")
    return cleaned


def validate_name(value: str) -> tuple[str, str | None]:
    parts = value.strip().split()
    if len(parts) < 2:
        raise ValueError("Enter at least first and last name (e.g. John Smith).")
    first_name = parts[0]
    last_name = " ".join(parts[1:])
    return first_name, last_name


def validate_address_parts(street: str, city: str, state: str, zip_code: str) -> dict[str, str]:
    if len(street.strip()) < 3:
        raise ValueError("Street address is too short.")
    if len(city.strip()) < 2:
        raise ValueError("City is required.")
    if len(state.strip()) != 2:
        raise ValueError("State must be a 2-letter code (e.g. CA).")
    if not ZIP_PATTERN.match(zip_code.strip()):
        raise ValueError("ZIP must be 5 digits or ZIP+4.")
    return {
        "street": street.strip(),
        "city": city.strip(),
        "state": state.strip().upper(),
        "zip": zip_code.strip(),
    }
