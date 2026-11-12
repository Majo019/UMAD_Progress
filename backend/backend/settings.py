"""
Django settings for backend project.
UMAD Progress · Producción y Desarrollo
"""

import os
from pathlib import Path
import dj_database_url

# BASE_DIR apunta a la carpeta backend
BASE_DIR = Path(__file__).resolve().parent.parent

# Cargar variables de entorno desde .env si existe
try:
    from dotenv import load_dotenv
    load_dotenv(BASE_DIR.parent / '.env')
    load_dotenv(BASE_DIR / '.env')
except ImportError:
    pass

# ==========================================
# SEGURIDAD Y ENTORNO
# ==========================================

# SECRET_KEY leída de variable de entorno; fallback solo para desarrollo local
SECRET_KEY = os.environ.get(
    'SECRET_KEY',
    'django-insecure-)mob69k)gu4@97a==h(28+by7*=1f!%!p8l1m^ydlc1%g_&r-m'
)

# DEBUG: False en producción (o si está en Render), True solo si se pide explícitamente en desarrollo
is_render = bool(os.environ.get('RENDER') or os.environ.get('RENDER_EXTERNAL_HOSTNAME'))
default_debug = 'False' if is_render or os.environ.get('DATABASE_URL') else 'True'
DEBUG = os.environ.get('DEBUG', default_debug).lower() in ('true', '1', 'yes')

# ALLOWED_HOSTS configurables para Render y local
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '[::1]']
env_hosts = os.environ.get('ALLOWED_HOSTS')
if env_hosts:
    ALLOWED_HOSTS.extend([h.strip() for h in env_hosts.split(',') if h.strip()])

render_external_hostname = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
if render_external_hostname:
    ALLOWED_HOSTS.append(render_external_hostname)

# Permitir subdominios de render.com
ALLOWED_HOSTS.append('.onrender.com')

# Si DEBUG está desactivado y no hay hosts específicos, permitir comodín seguro para Render
if '*' in ALLOWED_HOSTS:
    ALLOWED_HOSTS = ['*']


# ==========================================
# APLICACIONES INSTALADAS
# ==========================================

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'whitenoise.runserver_nostatic',
    'django.contrib.staticfiles',

    # Terceros
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',

    # Nuestras apps
    'authentication',
    'tasks',
    'pomodoro',
    'gamification',
    'social',
    'administration',
]


# ==========================================
# MIDDLEWARE
# ==========================================

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Primer middleware para CORS
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Servir archivos estáticos eficientemente en producción
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR.parent / 'dist'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'


# ==========================================
# BASE DE DATOS (Multi-usuario para Producción)
# ==========================================
# En Render: usa PostgreSQL a través de DATABASE_URL
# En local: usa SQLite por defecto si DATABASE_URL no está definida

DATABASES = {
    'default': dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600,
        conn_health_checks=True,
    )
}


# ==========================================
# VALIDACIÓN DE CONTRASEÑAS
# ==========================================

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 6},
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# ==========================================
# INTERNACIONALIZACIÓN
# ==========================================

LANGUAGE_CODE = 'es-mx'

TIME_ZONE = 'America/Mexico_City'

USE_I18N = True

USE_TZ = True


# ==========================================
# ARCHIVOS ESTÁTICOS Y WHITENOISE
# ==========================================

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# WhiteNoise para compresión y caché de estáticos
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'


# ==========================================
# EMAIL
# ==========================================

MAILERS = {
    'default': {
        'BACKEND': 'django.core.mail.backends.console.EmailBackend',
    },
}


# ==========================================
# CORS Y CSRF
# ==========================================

CORS_ALLOW_ALL_ORIGINS = True  # Permite que el frontend en Render o local se comunique libremente

CSRF_TRUSTED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://*.onrender.com',
]

env_csrf = os.environ.get('CSRF_TRUSTED_ORIGINS')
if env_csrf:
    CSRF_TRUSTED_ORIGINS.extend([c.strip() for c in env_csrf.split(',') if c.strip()])


# ==========================================
# DJANGO REST FRAMEWORK
# ==========================================

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
