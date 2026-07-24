import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8080"))
DATABASE_DIR = BASE_DIR / "databases"
DATABASE_PATH = BASE_DIR / "data" / "people.db"
