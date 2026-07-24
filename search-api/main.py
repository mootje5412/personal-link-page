import time

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from database import count_people, ensure_database, search_people

app = FastAPI(
    title="People Search API",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class SearchBody(BaseModel):
    phone: str | None = None
    email: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    identity_number: str | None = None
    limit: int = Field(default=25, ge=1, le=100)


def build_response(results: list, query: dict, elapsed_ms: float) -> dict:
    return {
        "success": True,
        "query": query,
        "total": len(results),
        "results": results,
        "elapsed_ms": elapsed_ms,
    }


@app.on_event("startup")
def startup() -> None:
    ensure_database()


@app.get("/")
def root() -> dict:
    return {
        "service": "People Search API",
        "status": "online",
        "records": count_people(),
        "search": "/api/search",
        "fields": ["phone", "email", "first_name", "last_name", "identity_number"],
    }


@app.get("/api/health")
def health() -> dict:
    return {
        "success": True,
        "status": "ok",
        "records": count_people(),
        "timestamp": int(time.time()),
    }


@app.get("/api/search")
def search_get(
    phone: str | None = Query(default=None),
    email: str | None = Query(default=None),
    first_name: str | None = Query(default=None),
    last_name: str | None = Query(default=None),
    identity_number: str | None = Query(default=None),
    limit: int = Query(default=25, ge=1, le=100),
) -> JSONResponse:
    started = time.perf_counter()
    try:
        results, query = search_people(
            phone=phone,
            email=email,
            first_name=first_name,
            last_name=last_name,
            identity_number=identity_number,
            limit=limit,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
    return JSONResponse(build_response(results, query, elapsed_ms))


@app.post("/api/search")
def search_post(body: SearchBody) -> JSONResponse:
    started = time.perf_counter()
    try:
        results, query = search_people(
            phone=body.phone,
            email=body.email,
            first_name=body.first_name,
            last_name=body.last_name,
            identity_number=body.identity_number,
            limit=body.limit,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
    return JSONResponse(build_response(results, query, elapsed_ms))
