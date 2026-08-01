from config.settings import settings
from models.search import SearchResponse, SearchType
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
    if not response.api_connected:
        return response.message or "Not connected."

    if response.message and not response.results:
        return response.message

    total = response.count
    if total == 0:
        return "No results."

    pages = page_count(total)
    current = min(max(page, 0), max(pages - 1, 0))
    start = current * settings.page_size
    page_results = response.results[start : start + settings.page_size]

    lines = [
        response.query,
        f"{total} results · {current + 1}/{pages}",
        "",
    ]

    for index, result in enumerate(page_results, start=start + 1):
        card = format_result(
            result,
            response.search_type,
            index=None if response.search_type == SearchType.VIN else index,
        )
        lines.extend([card, ""])

    return truncate("\n".join(lines).strip())


def format_welcome(first_name: str) -> str:
    return (
        f"Hi {first_name}\n\n"
        "Send a search:\n"
        "SSN · name + state · VIN · email\n\n"
        "/myid"
    )
