#!/usr/bin/env bash

# ==============================================================================
# Script de instalación de dependencias para UMAD Progress (FastAPI + SQLAlchemy)
# ==============================================================================

set -e

echo "🚀 Iniciando instalación de dependencias para FastAPI..."

# Detectar el ejecutable de Python disponible
if command -v python3 &> /dev/null; then
    PYTHON_CMD=python3
elif command -v python &> /dev/null; then
    PYTHON_CMD=python
else
    echo "❌ Error: No se encontró Python instalado en el sistema."
    exit 1
fi

echo "🐍 Usando $($PYTHON_CMD --version)"

# Determinar ruta del entorno virtual (venv en raíz)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$SCRIPT_DIR/venv"

if [ ! -d "$VENV_DIR" ]; then
    echo "📦 Creando entorno virtual en $VENV_DIR..."
    $PYTHON_CMD -m venv "$VENV_DIR"
fi

# Activar entorno virtual según el sistema operativo (Windows Git Bash vs Linux/macOS)
if [ -f "$VENV_DIR/Scripts/activate" ]; then
    echo "⚡ Activando entorno virtual (Windows)..."
    source "$VENV_DIR/Scripts/activate"
elif [ -f "$VENV_DIR/bin/activate" ]; then
    echo "⚡ Activando entorno virtual (Unix/macOS)..."
    source "$VENV_DIR/bin/activate"
else
    echo "⚠️ No se pudo localizar el script de activación de venv. Continuando con python global..."
fi

# Actualizar pip
echo "⬆️ Actualizando pip..."
pip install --upgrade pip

# Instalar dependencias desde requirements.txt
REQ_FILE="$SCRIPT_DIR/backend/requirements.txt"
if [ ! -f "$REQ_FILE" ]; then
    REQ_FILE="$SCRIPT_DIR/requirements.txt"
fi

if [ -f "$REQ_FILE" ]; then
    echo "📥 Instalando dependencias desde $REQ_FILE..."
    pip install -r "$REQ_FILE"
else
    echo "❌ No se encontró requirements.txt. Instalando paquetes esenciales directamente..."
    pip install "fastapi>=0.115.0" "uvicorn[standard]>=0.32.0" "sqlalchemy>=2.0.36" "pydantic>=2.10.0" "email-validator>=2.2.0" "python-dotenv>=1.0.1"
fi

echo ""
echo "✅ ¡Instalación completada exitosamente!"
echo "Para iniciar el servidor FastAPI ejecuta:"
echo "   uvicorn backend.main:app --reload"
echo "O desde la carpeta backend:"
echo "   cd backend && uvicorn main:app --reload"
echo "Documentación interactiva Swagger disponible en:"
echo "   http://127.0.0.1:8000/docs"
