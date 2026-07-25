from __future__ import annotations

from typing import Any

import httpx

from config.settings import settings
from models.search import DetectedSearch, SearchResponse, SearchResult, SearchType

FIELD_ALIASES = {
    "fullname": "Name",
    "full_name": "Name",
    "name": "Name",
    "firstname": "First Name",
    "first_name": "First Name",
    "lastname": "Last Name",
    "last_name": "Last Name",
    "ssn": "SSN",
    "phone": "Phone",
    "mobile": "Mobile",
    "email": "Email",
    "address": "Address",
    "city": "City",
    "state": "State",
    "zip": "ZIP",
    "dob": "DOB",
    "vin": "VIN",
    "case": "Case",
    "court": "Court",
    "offense": "Offense",
    "offensecode": "Offense Code",
    "chargesfileddate": "Charges Filed",
    "agency": "Agency",
    "age": "Age",
    "height": "Height",
    "weight": "Weight",
    "sex": "Sex",
    "status": "Status",
}


def _flatten_value(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (dict, list)):
        return str(value)
    text = str(value).strip()
    return text


def _format_dob(value: str) -> str:
    digits = "".join(ch for ch in value if ch.isdigit())
    if len(digits) == 8:
        return f"{digits[4:6]}/{digits[6:8]}/{digits[:4]}"
    return value


def _record_from_mapping(record: dict[str, Any], index: int) -> SearchResult:
    fields: dict[str, str] = {}

    if "Variable" in record and "Value" in record:
        variable = _flatten_value(record.get("Variable"))
        value = _flatten_value(record.get("Value"))
        if variable and value:
            fields[variable] = value
        title = fields.get("Make") or fields.get("Model") or variable or f"Result {index}"
        return SearchResult(title=title, fields=fields, raw=record)

    for key, value in record.items():
        if value in (None, "", []):
            continue
        label = FIELD_ALIASES.get(str(key).lower(), str(key).replace("_", " ").title())
        text = _flatten_value(value)
        if label.lower() == "dob":
            text = _format_dob(text)
        fields[label] = text

    title = fields.pop("Name", None) or f"Result {index}"
    return SearchResult(title=title, fields=fields, raw=record)


def _extract_records(payload: Any) -> tuple[list[Any], int, str]:
    if not isinstance(payload, dict):
        return [], 0, ""

    data = payload.get("data")
    if isinstance(data, dict):
        nested = data.get("results")
        if isinstance(nested, dict):
            if nested.get("error"):
                return [], 0, str(nested.get("message") or nested.get("error"))

            if isinstance(nested.get("results"), list):
                records = nested["results"]
                total = int(nested.get("returned") or nested.get("total") or len(records))
                return records, total, ""

            if isinstance(nested.get("Results"), list):
                records = nested["Results"]
                total = int(nested.get("Count") or len(records))
                return records, total, ""

        for key in ("records", "matches", "items"):
            if isinstance(data.get(key), list):
                records = data[key]
                return records, len(records), ""

    for key in ("results", "data", "records", "matches", "items"):
        value = payload.get(key)
        if isinstance(value, list):
            return value, len(value), ""

    return [], 0, ""


def _format_vin_results(records: list[Any]) -> SearchResult:
    fields: dict[str, str] = {}
    for item in records:
        if not isinstance(item, dict):
            continue
        variable = _flatten_value(item.get("Variable"))
        value = _flatten_value(item.get("Value"))
        if not variable or not value or value.lower() == "null":
            continue
        fields[variable] = value

    title = " ".join(
        part
        for part in (
            fields.get("Model Year"),
            fields.get("Make"),
            fields.get("Model"),
            fields.get("Trim"),
        )
        if part
    ).strip() or "VIN Lookup"

    return SearchResult(title=title, fields=fields)


def _parse_results(payload: Any, search_type: SearchType | None = None) -> tuple[list[SearchResult], int, str]:
    if payload is None:
        return [], 0, "No data returned."

    if isinstance(payload, dict) and payload.get("success") is False:
        return [], 0, str(payload.get("error") or payload.get("message") or "Search failed.")

    records, total, error = _extract_records(payload)
    if error:
        return [], 0, error

    if records:
        if search_type == SearchType.VIN and isinstance(records[0], dict) and "Variable" in records[0]:
            vin_result = _format_vin_results(records)
            return [vin_result], 1, ""

        parsed = [
            _record_from_mapping(item, idx)
            for idx, item in enumerate(records, start=1)
            if isinstance(item, dict)
        ]
        if parsed:
            return parsed, total or len(parsed), ""

        text_rows = [SearchResult(title=str(item)) for item in records if item]
        return text_rows, len(text_rows), ""

    if isinstance(payload, dict) and payload.get("success") is True:
        return [], 0, ""

    return [], 0, "Unexpected API response format."


class ZopzTloClient:
    def _response(self, detected: DetectedSearch, **kwargs) -> SearchResponse:
        kwargs.setdefault("search_type", detected.search_type)
        kwargs.setdefault("query", detected.display_query)
        kwargs.setdefault("label", detected.label)
        return SearchResponse(**kwargs)

    async def search(self, detected: DetectedSearch) -> SearchResponse:
        if not settings.api_key:
            return self._response(
                detected,
                api_connected=False,
                message="API key is not configured.",
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
            return self._response(detected, message="Search timed out. Try again.")
        except httpx.HTTPStatusError as error:
            return self._response(detected, message=f"API error {error.response.status_code}.")
        except ValueError:
            return self._response(detected, message="API returned invalid JSON.")
        except httpx.HTTPError as error:
            return self._response(detected, message=f"Network error: {error}")

        results, total, message = _parse_results(payload, detected.search_type)
        return self._response(
            detected,
            results=results,
            total=total,
            message=message,
            raw=payload,
        )
