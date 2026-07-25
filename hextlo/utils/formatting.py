from config.settings import settings
from models.search import SEARCH_LABELS, SearchResponse


def truncate(text: str, limit: int | None = None) -> str:
    max_len = limit or settings.message_limit
    if len(text) <= max_len:
        return text
    return text[: max_len - 3] + "..."


def format_search_response(response: SearchResponse) -> str:
    label = SEARCH_LABELS.get(response.search_type, "Search")
    header = f"{label}\nQuery: {response.query}\n"

    if not response.api_connected:
        return header + (response.message or "API not configured.")

    if response.message and not response.results:
        return header + response.message

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
        "Just type what you want to search — I'll detect the lookup type automatically.\n\n"
        "Examples:\n"
        "• John Smith — SSN / name search\n"
        "• John Smith CA — Intelius\n"
        "• John Smith Los Angeles CA — criminal lookup\n"
        "• 5551234567 — mobile lookup\n"
        "• 1HGBH41JXMN109186 — VIN search\n\n"
        "Use commas for exact matching:\n"
        "John, Smith, Los Angeles, CA"
    )
