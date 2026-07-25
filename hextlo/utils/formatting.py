from config.settings import settings
from models.search import SearchResponse, SearchType

SEARCH_LABELS: dict[SearchType, str] = {
    SearchType.SSN: "SSN Lookup",
    SearchType.NAME: "Name Search",
    SearchType.NPD: "NPD Records",
    SearchType.COURT: "Court Records",
    SearchType.PHONE: "Phone Lookup",
    SearchType.EMAIL: "Email Lookup",
    SearchType.ADDRESS: "Address Search",
}


def truncate(text: str, limit: int | None = None) -> str:
    max_len = limit or settings.message_limit
    if len(text) <= max_len:
        return text
    return text[: max_len - 3] + "..."


def format_search_response(response: SearchResponse) -> str:
    label = SEARCH_LABELS.get(response.search_type, "Search")
    header = f"{label}\nQuery: {response.query}\n"

    if not response.api_connected:
        return header + (response.message or "API not connected yet. Check back soon.")

    if response.count == 0:
        return header + "No results found."

    lines = [header, f"Found {response.count} result(s):\n"]
    for index, result in enumerate(response.results[: settings.max_results], start=1):
        lines.append(f"{index}. {result.to_text()}\n")

    remaining = response.count - settings.max_results
    if remaining > 0:
        lines.append(f"... and {remaining} more result(s)")

    return truncate("\n".join(lines).strip())


def format_welcome(first_name: str) -> str:
    return (
        f"Welcome to HexTLO, {first_name}.\n\n"
        "Your TLO-style lookup bot for people and public records.\n\n"
        "Search modules:\n"
        "  /ssn — Social Security Number lookup\n"
        "  /name — Full name search\n"
        "  /npd — National Public Data records\n"
        "  /court — Court & case records\n"
        "  /phone — Reverse phone lookup\n"
        "  /email — Email trace\n"
        "  /address — Address lookup\n\n"
        "Use the menu below or type a command to begin.\n"
        "APIs are stubbed for now — we'll wire them up next."
    )


def format_help() -> str:
    return (
        "HexTLO Help\n\n"
        "Commands:\n"
        "/start — Main menu\n"
        "/help — This message\n"
        "/cancel — Cancel current search\n"
        "/status — Check API connection status\n\n"
        "Search commands:\n"
        "/ssn <number> — e.g. /ssn 123-45-6789\n"
        "/name <first last> — e.g. /name John Smith\n"
        "/npd <name or id> — NPD record search\n"
        "/court <name or case> — Court record search\n"
        "/phone <number> — Reverse phone lookup\n"
        "/email <address> — Email lookup\n"
        "/address — Guided address search\n\n"
        "Tip: Use the inline menu from /start for guided searches."
    )


def format_api_status(api_map: dict[str, bool]) -> str:
    lines = ["API Connection Status\n"]
    for name, connected in api_map.items():
        icon = "connected" if connected else "pending"
        lines.append(f"  {name}: {icon}")
    return "\n".join(lines)
