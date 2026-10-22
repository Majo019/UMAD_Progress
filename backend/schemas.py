"""
Re-exportación para compatibilidad. Los esquemas modulares se encuentran en backend.app.schemas
"""
try:
    from backend.app.schemas import *
except ImportError:
    from app.schemas import *
