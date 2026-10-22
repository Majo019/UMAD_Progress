#!/usr/bin/env bash

# ==============================================================================
# Script de instalación de dependencias para UMAD Progress (FastAPI + SQLAlchemy)
# Ejecutable desde la carpeta backend
# ==============================================================================

set -e

echo " Iniciando instalación de dependencias para FastAPI..."

if command -v python3 &> /dev/null; then
    PYTHON_CMD=python3
elif command -v python &> /dev/null; then
    PYTHON_CMD=python
else
    echo " Error: No se encontró Python instalado en el sistema."
    exit 1
fi

echo " Usando $($PYTHON_CMD --version)"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$SCRIPT_DIR/../venv"
if [ ! -d "$VENV_DIR" ]; then
    VENV_DIR="$SCRIPT_DIR/venv"
fi

if [ ! -d "$VENV_DIR" ]; then
    echo " Creando entorno virtual..."
    $PYTHON_CMD -m venv "$VENV_DIR"
fi

if [ -f "$VENV_DIR/Scripts/activate" ]; then
    echo " Activando entorno virtual (Windows)..."
    source "$VENV_DIR/Scripts/activate"
elif [ -f "$VENV_DIR/bin/activate" ]; then
    echo " Activando entorno virtual (Unix/macOS)..."
    source "$VENV_DIR/bin/activate"
fi

echo "⬆ Actualizando pip..."
pip install --upgrade pip

echo " Instalando dependencias de requirements.txt..."
pip install -r "$SCRIPT_DIR/requirements.txt"

echo ""
echo " ¡Instalación completada exitosamente!"
echo "Para iniciar el servidor FastAPI ejecuta:"
echo "   uvicorn main:app --reload"
