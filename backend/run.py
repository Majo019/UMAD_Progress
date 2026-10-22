import sys
from pathlib import Path
import subprocess

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BACKEND_DIR.parent
VENV_PYTHON = PROJECT_DIR / "venv" / "Scripts" / "python.exe"

# Reenrutar al python del entorno virtual si existe
if VENV_PYTHON.exists() and sys.executable.lower() != str(VENV_PYTHON).lower():
    sys.exit(subprocess.call([str(VENV_PYTHON), str(Path(__file__).resolve())] + sys.argv[1:]))

# Asegurar codificación UTF-8 en consola de Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

if str(PROJECT_DIR) not in sys.path:
    sys.path.insert(0, str(PROJECT_DIR))
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import uvicorn

if __name__ == "__main__":
    print("[INFO] Levantando UMAD Progress FastAPI en http://127.0.0.1:8000 ...")
    print("[INFO] Swagger UI disponible en: http://127.0.0.1:8000/docs")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
