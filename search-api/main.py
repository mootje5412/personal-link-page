import time

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse

from database import count_people, ensure_database, search_people
from import_data import import_folder

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)


@app.on_event("startup")
def startup() -> None:
    ensure_database()
    if count_people() == 0:
        import_folder(replace=False)


@app.get("/api/health")
def health() -> dict:
    return {"ok": True, "records": count_people()}


@app.get("/api/search")
def search(
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

    return JSONResponse({
        "success": True,
        "query": query,
        "total": len(results),
        "results": results,
        "ms": round((time.perf_counter() - started) * 1000, 2),
    })
