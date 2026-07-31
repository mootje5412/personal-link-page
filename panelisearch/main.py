import csv
import json
import os
import re
import threading
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import Response

BASE_DIR = Path(__file__).resolve().parent
DATABASE_DIR = BASE_DIR / "database"
PORT = 8080
MAX_RESULTS = 50
SUPPORTED_SUFFIXES = {".csv", ".txt", ".json", ".tsv"}


def normalize(value: str) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip()).casefold()


def phone_digits(value: str) -> str:
    return re.sub(r"\D+", "", value)


def line_matches(query: str, text: str) -> bool:
    needle = normalize(query)
    haystack = normalize(text)
    if needle in haystack:
        return True

    query_digits = phone_digits(query)
    if len(query_digits) >= 4 and query_digits in phone_digits(text):
        return True
    return False


def search_csv(path: Path, query: str) -> list[dict]:
    matches: list[dict] = []
    with path.open("r", encoding="utf-8", errors="replace", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            row_text = " ".join(str(value) for value in row.values() if value)
            if line_matches(query, row_text):
                matches.append(
                    {
                        "source": path.name,
                        "type": "csv",
                        "data": {key: value for key, value in row.items() if value},
                    }
                )
    return matches


def search_txt(path: Path, query: str) -> list[dict]:
    matches: list[dict] = []
    with path.open("r", encoding="utf-8", errors="replace") as handle:
        for line_number, line in enumerate(handle, start=1):
            text = line.strip()
            if text and line_matches(query, text):
                matches.append(
                    {
                        "source": path.name,
                        "type": "txt",
                        "line": line_number,
                        "text": text,
                    }
                )
    return matches


def flatten_json(value, prefix: str = "") -> list[str]:
    parts: list[str] = []
    if isinstance(value, dict):
        for key, item in value.items():
            next_prefix = f"{prefix}.{key}" if prefix else str(key)
            parts.extend(flatten_json(item, next_prefix))
    elif isinstance(value, list):
        for index, item in enumerate(value):
            next_prefix = f"{prefix}[{index}]"
            parts.extend(flatten_json(item, next_prefix))
    else:
        parts.append(f"{prefix}: {value}" if prefix else str(value))
    return parts


def search_json(path: Path, query: str) -> list[dict]:
    matches: list[dict] = []
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return matches

    items = payload if isinstance(payload, list) else [payload]
    for index, item in enumerate(items):
        parts = flatten_json(item)
        blob = " | ".join(parts)
        if line_matches(query, blob):
            matches.append(
                {
                    "source": path.name,
                    "type": "json",
                    "index": index,
                    "data": item,
                }
            )
    return matches


def search_files(query: str) -> list[dict]:
    if not query.strip():
        raise ValueError("Send q with a name, phone, email, or keyword")

    if not DATABASE_DIR.exists():
        return []

    results: list[dict] = []
    for path in sorted(DATABASE_DIR.iterdir()):
        if not path.is_file():
            continue
        suffix = path.suffix.lower()
        if suffix not in SUPPORTED_SUFFIXES:
            continue

        if suffix == ".json":
            results.extend(search_json(path, query))
        elif suffix in {".csv", ".tsv"}:
            results.extend(search_csv(path, query))
        elif suffix == ".txt":
            results.extend(search_txt(path, query))

        if len(results) >= MAX_RESULTS:
            break

    return results[:MAX_RESULTS]


def raw_json(**data) -> Response:
    return Response(
        content=json.dumps({"ok": True, **data}, ensure_ascii=False, indent=2),
        media_type="application/json; charset=utf-8",
    )


@asynccontextmanager
async def lifespan(_app: FastAPI):
    from bot import start_telegram_bot_thread

    start_telegram_bot_thread()
    yield


app = FastAPI(title="PaneliSearch API", docs_url=None, redoc_url=None, openapi_url=None, lifespan=lifespan)


@app.get("/api")
def api(q: str | None = Query(default=None, description="Search query")) -> Response:
    if not q or not q.strip():
        files = [
            path.name
            for path in sorted(DATABASE_DIR.iterdir())
            if path.is_file() and path.suffix.lower() in SUPPORTED_SUFFIXES
        ] if DATABASE_DIR.exists() else []
        return raw_json(
            ready=True,
            bot="panelisearch",
            files=len(files),
            sources=files,
            usage={"search": "/api?q=john"},
        )

    try:
        results = search_files(q)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    return raw_json(
        query=q.strip(),
        found=len(results),
        results=results,
    )


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "bot": "panelisearch"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=PORT)
