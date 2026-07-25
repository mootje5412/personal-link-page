from config.settings import settings
from models.search import SEARCH_LABELS, SearchResponse, SearchType
from utils.result_display import format_result


def truncate(text: str, limit: int | None = None) -> str:
    max_len = limit or settings.message_limit
    if len(text) <= max_len:
        return text
    return text[: max_len - 3] + "..."


def page_count(total: int, page_size: int | None = None) -> int:
    size = page_size or settings.page_size
    if total <= 0:
        return 0
    return (total + size - 1) // size


def format_search_page(response: SearchResponse, page: int = 0) -> str:
    label = response.label or SEARCH_LABELS.get(response.search_type, "Search")
    divider = "─" * 28
    header = f"{label}\n{divider}\nQuery: {response.query}\n"

    if not response.api_connected:
        return header + (response.message or "API not configured.")

    if response.message and not response.results:
        return header + response.message

    total = response.count
    if total == 0:
        return header + "No results found."

    pages = page_count(total)
    current = min(max(page, 0), max(pages - 1, 0))
    start = current * settings.page_size
    end = start + settings.page_size
    page_results = response.results[start:end]

    lines = [
        header,
        f"Found {total} record(s)  •  page {current + 1}/{pages}\n",
    ]

    for index, result in enumerate(page_results, start=start + 1):
        card = format_result(
            result,
            response.search_type,
            index=None if response.search_type == SearchType.VIN else index,
        )
        lines.append(card + "\n")

    return truncate("\n".join(lines).strip())


def format_welcome(first_name: str) -> str:
    return (
        f"Welcome to HexTLO, {first_name}.\n"
        f"{'─' * 28}\n\n"
        "Send anything — I detect the search type automatically.\n\n"
        "Examples:\n"
        "  418-90-8868 .............. SSN lookup\n"
        "  John Doe ................. name search\n"
        "  John Doe CA .............. name + state\n"
        "  John Doe CA 90210 ........ person lookup (SSN, phone, address)\n"
        "  John,Doe,CA,90210 ........ person lookup\n"
        "  John,Doe,90210 ........... Intelius\n"
        "  example .................. Odido keyword\n"
        "  user@email.com ............. Odido lookup\n"
        "  0612345678 ............... Odido (NL phone)\n"
        "  (256) 521-1446 ........... phone lookup\n"
        "  1HGBH41JXMN109186 ........ VIN decode\n\n"
        "SSN searches return the most detail:\n"
        "name, SSN, DOB, phone, and address.\n\n"
        "Access: $5/month — use /myid to get your ID."
    )
