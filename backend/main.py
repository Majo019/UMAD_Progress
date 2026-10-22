"""
Punto de entrada principal para compatibilidad con uvicorn backend.main:app
La aplicación modular se encuentra en backend/app/main.py
"""
import sys
from pathlib import Path

# Garantizar que el directorio app y backend estén en el path
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = CURRENT_DIR.parent
if str(PROJECT_DIR) not in sys.path:
    sys.path.insert(0, str(PROJECT_DIR))
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

try:
    from backend.app.main import app
except ImportError:
    from app.main import app

__all__ = ["app"]
