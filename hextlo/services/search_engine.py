from models.search import DetectedSearch, SearchResponse, SearchResult, SearchType
from services.zopztlo_client import ZopzTloClient

_client = ZopzTloClient()


def _dedupe_key(result: SearchResult) -> str:
    ssn = result.fields.get("SSN", "").strip()
    if ssn:
        return f"ssn:{ssn}|{result.fields.get('Address', '')}|{result.fields.get('Phone', '')}"

    raw_id = result.raw.get("id") if isinstance(result.raw, dict) else None
    if raw_id:
        return f"id:{raw_id}"

    parts = [result.title.lower()]
    for key in (
        "DOB",
        "Phone",
        "Address",
        "Offense",
        "Charges Filed",
        "Offense Code",
        "Agency",
        "Age",
        "Sex",
        "State",
    ):
        parts.append(result.fields.get(key, "").lower())
    return "|".join(parts)


def _sort_results(results: list[SearchResult]) -> list[SearchResult]:
    return sorted(
        results,
        key=lambda item: (
            0 if item.fields.get("SSN") else 1,
            item.title.lower(),
        ),
    )


def _name_pair(api_query: str) -> tuple[str, str] | None:
    parts = [part.strip() for part in api_query.split(",") if part.strip()]
    if len(parts) >= 2 and parts[2].upper() not in {"XX", "*"} and len(parts[2]) == 2:
        return parts[0], parts[1]
    if len(parts) >= 2:
        return parts[0], parts[1]
    return None


def _build_plans(detected: DetectedSearch) -> list[DetectedSearch]:
    label = detected.label or "Search"

    if detected.search_type == SearchType.MOBILE:
        phone = detected.api_query.split(",")[0]
        formatted = f"({phone[:3]}) {phone[3:6]}-{phone[6:]}" if len(phone) == 10 else phone
        return [
            DetectedSearch(SearchType.SSN, phone, detected.display_query, label=label),
            DetectedSearch(SearchType.SSN, formatted, detected.display_query, label=label),
            DetectedSearch(SearchType.MOBILE, f"{phone},*", detected.display_query, label=label),
            DetectedSearch(SearchType.MOBILE, f"{phone},{phone}", detected.display_query, label=label),
        ]

    if detected.search_type == SearchType.CRIMINAL:
        pair = _name_pair(detected.api_query)
        plans = [detected]
        if pair:
            first, last = pair
            plans.insert(
                0,
                DetectedSearch(
                    SearchType.SSN,
                    f"{first},{last}",
                    detected.display_query,
                    label=label,
                ),
            )
        return plans

    return [detected]


def _empty_message(detected: DetectedSearch) -> str:
    if detected.search_type == SearchType.MOBILE:
        return (
            "No phone records found.\n"
            "Try searching by SSN (418-90-8868) or full name (John Doe)."
        )
    if detected.label == "Name Search":
        return (
            "No records found for that name.\n"
            "Try adding a state: John Doe CA"
        )
    return "No results found."


async def run_detected_search(detected: DetectedSearch, user_id: int) -> SearchResponse:
    plans = _build_plans(detected)
    merged: list[SearchResult] = []
    seen: set[str] = set()
    message = ""
    api_connected = True
    search_type = detected.search_type
    label = detected.label

    for plan in plans:
        response = await _client.search(plan)
        api_connected = api_connected and response.api_connected
        if response.message and not response.results:
            message = message or response.message

        for result in response.results:
            key = _dedupe_key(result)
            if key in seen:
                continue
            seen.add(key)
            merged.append(result)

        if plan.search_type == SearchType.SSN and response.results:
            search_type = SearchType.SSN

    merged = _sort_results(merged)
    if not merged and not message:
        message = _empty_message(detected)

    return SearchResponse(
        search_type=search_type,
        query=detected.display_query,
        results=merged,
        total=len(merged),
        api_connected=api_connected,
        message=message,
        label=label,
    )
