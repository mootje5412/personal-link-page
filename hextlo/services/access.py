import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
SUBSCRIBERS_FILE = DATA_DIR / "subscribers.json"

MONTHLY_PRICE = "$5/month"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _load() -> dict[str, dict]:
    if not SUBSCRIBERS_FILE.exists():
        return {}
    try:
        return json.loads(SUBSCRIBERS_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}


def _save(subscribers: dict[str, dict]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    SUBSCRIBERS_FILE.write_text(json.dumps(subscribers, indent=2), encoding="utf-8")


def register_user(user_id: int, username: str | None, first_name: str | None) -> None:
    subscribers = _load()
    key = str(user_id)
    entry = subscribers.get(key, {})
    entry["username"] = username or entry.get("username")
    entry["first_name"] = first_name or entry.get("first_name")
    entry["last_seen"] = _now().isoformat()
    subscribers[key] = entry
    _save(subscribers)


def is_owner(user_id: int, owner_id: int) -> bool:
    return user_id == owner_id


def has_access(user_id: int, owner_id: int) -> bool:
    if is_owner(user_id, owner_id):
        return True

    subscribers = _load()
    entry = subscribers.get(str(user_id))
    if not entry or not entry.get("expires_at"):
        return False

    expires = datetime.fromisoformat(entry["expires_at"])
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    return _now() < expires


def grant_access(user_id: int, days: int, username: str | None = None) -> str:
    subscribers = _load()
    key = str(user_id)
    now = _now()
    expires = now + timedelta(days=max(days, 1))

    entry = subscribers.get(key, {})
    entry.update(
        {
            "username": username or entry.get("username"),
            "granted_at": now.isoformat(),
            "expires_at": expires.isoformat(),
        }
    )
    subscribers[key] = entry
    _save(subscribers)

    label = f"@{username}" if username else f"ID {user_id}"
    return (
        f"Access granted to {label}\n"
        f"Duration: {days} day(s)\n"
        f"Expires: {expires.strftime('%Y-%m-%d %H:%M UTC')}"
    )


def revoke_access(user_id: int) -> str:
    subscribers = _load()
    key = str(user_id)
    if key not in subscribers:
        return "User not found."

    username = subscribers[key].get("username") or key
    del subscribers[key]
    _save(subscribers)
    return f"Access revoked for {username}."


def get_access_info(user_id: int, owner_id: int) -> dict | None:
    if is_owner(user_id, owner_id):
        return {"plan": "Owner", "expires_at": "Never", "days_left": "∞"}

    subscribers = _load()
    entry = subscribers.get(str(user_id))
    if not entry or not entry.get("expires_at"):
        return None

    expires = datetime.fromisoformat(entry["expires_at"])
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)

    days_left = max(0, (expires - _now()).days)
    if days_left == 0 and _now() >= expires:
        return None

    return {
        "plan": "HexTLO",
        "expires_at": expires.strftime("%Y-%m-%d %H:%M UTC"),
        "days_left": days_left,
    }


def list_subscribers() -> list[dict]:
    subscribers = _load()
    rows: list[dict] = []
    for user_id, entry in subscribers.items():
        if not entry.get("expires_at"):
            continue
        expires = datetime.fromisoformat(entry["expires_at"])
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        days_left = (expires - _now()).days
        rows.append(
            {
                "user_id": user_id,
                "username": entry.get("username") or "—",
                "expires_at": expires.strftime("%Y-%m-%d"),
                "days_left": days_left,
                "active": days_left >= 0 and _now() < expires,
            }
        )
    rows.sort(key=lambda row: int(row["days_left"]), reverse=True)
    return rows


def access_required_message(user_id: int) -> str:
    return (
        "Access required\n"
        "────────────────────────────\n\n"
        f"HexTLO is {MONTHLY_PRICE}.\n\n"
        f"Your User ID: {user_id}\n\n"
        "Contact the owner to purchase access.\n"
        "Send your User ID above to get activated."
    )
