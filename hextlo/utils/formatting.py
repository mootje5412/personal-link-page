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
        block = result.to_text()
        if response.search_type.value == "vinsearch":
            lines.append(block + "\n")
        else:
            lines.append(f"{index}. {block}\n")

    remaining = response.count - settings.max_results
    if remaining > 0:
        lines.append(f"... and {remaining} more result(s)")

    return truncate("\n".join(lines).strip())


def format_welcome(first_name: str) -> str:
    return (
        f"Welcome to HexTLO, {first_name}.\n\n"
        "Type anything to search. I auto-detect the lookup type.\n\n"
        "Examples:\n"
        "• 418-90-8868 — SSN lookup\n"
        "• John Smith — name search\n"
        "• John Smith CA — Intelius\n"
        "• John Smith Los Angeles CA — criminal\n"
        "• 5551234567 — phone lookup\n"
        "• 1HGBH41JXMN109186 — VIN\n\n"
        "Best accuracy with commas:\n"
        "John, Smith, Los Angeles, CA"
    )
