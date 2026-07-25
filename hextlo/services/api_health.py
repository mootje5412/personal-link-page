import asyncio

import httpx

from config.settings import settings
from models.search import SearchType


async def _ping(endpoint: str, query: str) -> tuple[bool, str, int]:
    url = f"{settings.api_base_url.rstrip('/')}/{endpoint}"
    params = {"q": query, "key": settings.api_key}

    try:
        transport = httpx.AsyncHTTPTransport(local_address="0.0.0.0")
        async with httpx.AsyncClient(timeout=20, transport=transport) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            payload = response.json()
    except Exception as error:
        return False, str(error), 0

    if payload.get("success") is False:
        return False, str(payload.get("error") or "failed"), 0

    data = payload.get("data", {})
    results = data.get("results", {})
    if isinstance(results, dict) and results.get("error"):
        return False, str(results.get("error")), 0

    count = 0
    if isinstance(results, dict):
        count = int(
            results.get("returned")
            or results.get("total")
            or results.get("Count")
            or len(results.get("results") or results.get("Results") or [])
            or 0
        )
    return True, "ok", count


async def check_all_apis() -> list[tuple[str, bool, str, int]]:
    checks = [
        ("SSN Search", SearchType.SSN.value, "418-90-8868"),
        ("Name Search", SearchType.CRIMINAL.value, "John,Doe,XX"),
        ("VIN Search", SearchType.VIN.value, "1HGBH41JXMN109186"),
        ("Phone Search", SearchType.MOBILE.value, "2565211446,*"),
    ]
    tasks = [_ping(endpoint, query) for _, endpoint, query in checks]
    results = await asyncio.gather(*tasks)
    return [
        (label, ok, msg, count)
        for (label, _, _), (ok, msg, count) in zip(checks, results)
    ]
