import os
from pathlib import Path

# Ruta raíz del backend
BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings:
    PROJECT_NAME: str = "UMAD Progress API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Base de datos: por defecto SQLite local en backend/umad_progress.db
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{BASE_DIR / 'umad_progress.db'}"
    )

    # Orígenes permitidos para CORS (Frontend Vite/React)
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]


settings = Settings()
