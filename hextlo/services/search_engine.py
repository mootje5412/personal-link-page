from models.search import DetectedSearch, SearchResponse, SearchResult, SearchType
from services.zopztlo_client import ZopzTloClient

_client = ZopzTloClient()


def _dedupe_key(result: SearchResult) -> str:
    if isinstance(result.raw, dict):
        raw_id = result.raw.get("id") or result.raw.get("_id")
        if raw_id is not None and str(raw_id).strip():
            return f"id:{raw_id}"

    ssn = result.fields.get("SSN", "").strip()
    if ssn:
        return f"ssn:{ssn}|{result.fields.get('Id', '')}|{result.fields.get('Address', '')}"

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


def _build_plans(detected: DetectedSearch) -> list[DetectedSearch]:
    if detected.search_type == SearchType.MOBILE:
        phone = detected.api_query.split(",")[0]
        formatted = f"({phone[:3]}) {phone[3:6]}-{phone[6:]}" if len(phone) == 10 else phone
        label = detected.label or "Phone Search"
        return [
            DetectedSearch(SearchType.SSN, phone, detected.display_query, label=label),
            DetectedSearch(SearchType.SSN, formatted, detected.display_query, label=label),
            DetectedSearch(SearchType.MOBILE, f"{phone},*", detected.display_query, label=label),
            DetectedSearch(SearchType.MOBILE, f"{phone},{phone}", detected.display_query, label=label),
        ]

    return [detected]


def _empty_message(detected: DetectedSearch) -> str:
    if detected.search_type == SearchType.MOBILE:
        return (
            "No phone records found.\n"
            "Try searching by SSN (418-90-8868) or full name (John Doe)."
        )
    if detected.search_type == SearchType.ODIDO:
        return (
            "No Odido records found.\n"
            "Try an email, Dutch phone (06xxxxxxxx), or keyword: odido example"
        )
    if detected.search_type == SearchType.INTELIUS:
        return (
            "No Intelius results.\n"
            "Format: First,Last,ZIP — e.g. John,Doe,90210"
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
    api_total = 0

    for plan in plans:
        response = await _client.search(plan)
        api_connected = api_connected and response.api_connected

        if response.message and not response.results:
            message = message or response.message

        if response.count > api_total:
            api_total = response.count

        for result in response.results:
            key = _dedupe_key(result)
            if key in seen:
                continue
            seen.add(key)
            merged.append(result)

        if response.results and plan.search_type == SearchType.SSN:
            search_type = SearchType.SSN

        if merged and plan.search_type == detected.search_type:
            break

    merged = _sort_results(merged)
    total = len(merged) if merged else api_total

    if not merged and not message:
        message = _empty_message(detected)

    return SearchResponse(
        search_type=search_type,
        query=detected.display_query,
        results=merged,
        total=total,
        api_connected=api_connected,
        message=message,
        label=label,
    )
