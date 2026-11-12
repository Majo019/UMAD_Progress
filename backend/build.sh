#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "==> Instalando dependencias de Python..."
pip install --upgrade pip
pip install -r backend/requirements.txt || pip install -r requirements.txt

echo "==> Aplicando migraciones de la base de datos..."
python backend/manage.py migrate || python manage.py migrate

echo "==> Creando la cuenta de administrador (si no existe)..."
python backend/manage.py seed_users || python manage.py seed_users

echo "==> Recolectando archivos estáticos para WhiteNoise..."
python backend/manage.py collectstatic --noinput || python manage.py collectstatic --noinput

echo "==> Backend listo para iniciar!"

