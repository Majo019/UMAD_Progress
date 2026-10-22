import sys
from pathlib import Path
import subprocess

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
VENV_PYTHON = ROOT_DIR / "venv" / "Scripts" / "python.exe"

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

if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import uvicorn

if __name__ == "__main__":
    print("[INFO] Levantando UMAD Progress FastAPI en http://127.0.0.1:8000 ...")
    print("[INFO] Swagger UI disponible en: http://127.0.0.1:8000/docs")
    uvicorn.run("app.main:app", app_dir=str(BACKEND_DIR), host="127.0.0.1", port=8000, reload=True)
