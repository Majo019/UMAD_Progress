@echo off
setlocal
cd /d "%~dp0"

echo ==========================================
echo   UMAD Progress - Arranque Front + Back
echo ==========================================
echo.

where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python no esta instalado o no esta en el PATH.
    pause
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js / npm no esta instalado o no esta en el PATH.
    pause
    exit /b 1
)

if not exist "venv\Scripts\python.exe" (
    echo [1/4] Creando entorno virtual Python...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] No se pudo crear el entorno virtual.
        pause
        exit /b 1
    )
    echo [1/4] Instalando dependencias del backend...
    "%~dp0venv\Scripts\python.exe" -m pip install -r backend\requirements.txt
    if errorlevel 1 (
        echo [ERROR] No se pudieron instalar las dependencias de Python.
        pause
        exit /b 1
    )
) else (
    echo [1/4] Entorno virtual encontrado.
)

if not exist "node_modules" (
    echo [2/4] Instalando dependencias del frontend ^(npm install^)...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Fallo npm install.
        pause
        exit /b 1
    )
) else (
    echo [2/4] Dependencias de Node encontradas.
)

echo [3/4] Aplicando migraciones y usuarios iniciales...
pushd "%~dp0backend"
"%~dp0venv\Scripts\python.exe" manage.py migrate
if errorlevel 1 (
    echo [ERROR] Fallo al aplicar migraciones.
    popd
    pause
    exit /b 1
)
"%~dp0venv\Scripts\python.exe" manage.py seed_users
popd

echo [4/4] Iniciando Backend ^(8000^) y Frontend ^(5173^)...
start "UMAD Progress - Backend (8000)" /D "%~dp0backend" cmd /k ""%~dp0venv\Scripts\python.exe" manage.py runserver 127.0.0.1:8000"
timeout /t 2 /nobreak >nul
start "UMAD Progress - Frontend (5173)" /D "%~dp0" cmd /k "npm run dev"

echo.
echo Servicios iniciados en ventanas separadas:
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://127.0.0.1:8000/api/
echo.
pause
