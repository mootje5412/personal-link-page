from models.search import SearchResponse, SearchResult, SearchType


def save_search_session(context, response: SearchResponse) -> None:
    context.user_data["search_session"] = {
        "search_type": response.search_type.value,
        "query": response.query,
        "message": response.message,
        "api_connected": response.api_connected,
        "total": response.count,
        "label": response.label,
        "results": [{"title": r.title, "fields": dict(r.fields)} for r in response.results],
    }


def load_search_session(context) -> SearchResponse | None:
    data = context.user_data.get("search_session")
    if not data:
        return None

    results = [
        SearchResult(title=item["title"], fields=item.get("fields", {}))
        for item in data.get("results", [])
    ]
    return SearchResponse(
        search_type=SearchType(data["search_type"]),
        query=data["query"],
        results=results,
        total=int(data.get("total") or len(results)),
        api_connected=bool(data.get("api_connected", True)),
        message=str(data.get("message") or ""),
        label=str(data.get("label") or ""),
    )
