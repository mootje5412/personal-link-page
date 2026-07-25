from __future__ import annotations

from typing import Any

import httpx

from config.settings import settings
from models.search import DetectedSearch, SearchResponse, SearchResult, SearchType


def _flatten_value(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (dict, list)):
        return str(value)
    return str(value).strip()


def _record_from_mapping(record: dict[str, Any], index: int) -> SearchResult:
    preferred_keys = (
        "name",
        "full_name",
        "first_name",
        "last_name",
        "ssn",
        "phone",
        "mobile",
        "email",
        "address",
        "city",
        "state",
        "zip",
        "dob",
        "vin",
        "case",
        "court",
        "offense",
        "status",
    )

    fields: dict[str, str] = {}
    for key in preferred_keys:
        if key in record and record[key] not in (None, "", []):
            label = key.replace("_", " ").title()
            fields[label] = _flatten_value(record[key])

    if not fields:
        for key, value in record.items():
            if value not in (None, "", []):
                fields[key.replace("_", " ").title()] = _flatten_value(value)

    title = fields.pop("Name", None) or fields.pop("Full Name", None) or f"Result {index}"
    return SearchResult(title=title, fields=fields, raw=record)


def _extract_records(payload: Any) -> tuple[list[Any], int]:
    if not isinstance(payload, dict):
        return [], 0

    data = payload.get("data")
    if isinstance(data, dict):
        nested = data.get("results")
        if isinstance(nested, dict) and isinstance(nested.get("results"), list):
            records = nested["results"]
            total = int(nested.get("returned") or len(records))
            return records, total
        if isinstance(nested, list):
            return nested, len(nested)
        for key in ("records", "matches", "items"):
            if isinstance(data.get(key), list):
                records = data[key]
                return records, len(records)

    for key in ("results", "data", "records", "matches", "items"):
        value = payload.get(key)
        if isinstance(value, list):
            return value, len(value)

    return [], 0


def _parse_results(payload: Any) -> tuple[list[SearchResult], int, str]:
    if payload is None:
        return [], 0, "No data returned."

    if isinstance(payload, dict):
        if payload.get("success") is False:
            return [], 0, str(payload.get("error") or payload.get("message") or "Search failed.")

        records, total = _extract_records(payload)
        if records:
            parsed = [
                _record_from_mapping(item, idx)
                for idx, item in enumerate(records, start=1)
                if isinstance(item, dict)
            ]
            if parsed:
                return parsed, total or len(parsed), ""
            text_rows = [SearchResult(title=str(item)) for item in records if item]
            return text_rows, len(text_rows), ""

        message = str(payload.get("message") or payload.get("result") or "").strip()
        if message:
            return [SearchResult(title=message)], 1, ""

        if payload.get("success") is True:
            return [], 0, ""

        if any(not str(key).startswith("_") for key in payload.keys()):
            parsed = [_record_from_mapping(payload, 1)]
            return parsed, 1, ""

    if isinstance(payload, list):
        parsed = [_record_from_mapping(item, idx) for idx, item in enumerate(payload, start=1) if isinstance(item, dict)]
        if parsed:
            return parsed, len(parsed), ""
        text_rows = [SearchResult(title=str(item)) for item in payload if item]
        return text_rows, len(text_rows), ""

    if isinstance(payload, str):
        return [SearchResult(title=payload)], 1, ""

    return [], 0, "Unexpected API response format."


class ZopzTloClient:
    async def search(self, detected: DetectedSearch) -> SearchResponse:
        if not settings.api_key:
            return SearchResponse(
                search_type=detected.search_type,
                query=detected.display_query,
                api_connected=False,
                message="HEXTLO_API_KEY is not configured.",
            )

        endpoint = detected.search_type.value
        url = f"{settings.api_base_url.rstrip('/')}/{endpoint}"
        params = {"q": detected.api_query, "key": settings.api_key}

        try:
            transport = httpx.AsyncHTTPTransport(local_address="0.0.0.0")
            async with httpx.AsyncClient(timeout=settings.api_timeout, transport=transport) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                payload = response.json()
        except httpx.TimeoutException:
            return SearchResponse(
                search_type=detected.search_type,
                query=detected.display_query,
                message="Search timed out. Try again.",
            )
        except httpx.HTTPStatusError as error:
            return SearchResponse(
                search_type=detected.search_type,
                query=detected.display_query,
                message=f"API error {error.response.status_code}.",
            )
        except ValueError:
            return SearchResponse(
                search_type=detected.search_type,
                query=detected.display_query,
                message="API returned invalid JSON.",
            )
        except httpx.HTTPError as error:
            return SearchResponse(
                search_type=detected.search_type,
                query=detected.display_query,
                message=f"Network error: {error}",
            )

        results, total, message = _parse_results(payload)
        return SearchResponse(
            search_type=detected.search_type,
            query=detected.display_query,
            results=results,
            total=total,
            message=message,
            raw=payload,
        )
