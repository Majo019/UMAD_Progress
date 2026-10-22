"""
Re-exportación para compatibilidad. El módulo central está en backend.app.core.database
"""
try:
    from backend.app.core.database import Base, engine, SessionLocal, get_db
except ImportError:
    from app.core.database import Base, engine, SessionLocal, get_db

__all__ = ["Base", "engine", "SessionLocal", "get_db"]
