"""
Konstruktor backend sozlamalari.

Ikki rejim:
  • ishlab chiqish (KONS_DEBUG=1, standart): SQLite, http://127.0.0.1:8001
  • production / Render (KONS_DEBUG=0): PostgreSQL (DATABASE_URL), gunicorn, HTTPS, WhiteNoise.
Maxfiy qiymatlar faqat muhit o'zgaruvchilaridan olinadi.
Bu loyiha Fitnes Zal saytidan butunlay alohida: o'z repozitoriysi, o'z bazasi va o'z Render servislari.
"""
import os
from pathlib import Path

import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent


def env_list(name, default=''):
    return [x.strip() for x in os.environ.get(name, default).split(',') if x.strip()]


DEBUG = os.environ.get('KONS_DEBUG', '1') == '1'
SECRET_KEY = os.environ.get('KONS_SECRET_KEY', 'dev-only-insecure-key-change-me' if DEBUG else '')
if not SECRET_KEY:
    raise RuntimeError("KONS_SECRET_KEY muhit o'zgaruvchisi o'rnatilmagan (KONS_DEBUG=0 rejimida majburiy)")

# Frontend fayllari: Render build skripti ularni backend/frontend_dist ga ko'chiradi;
# lokal ishlab chiqishda — repozitoriyning frontend/ papkasi.
_dist = BASE_DIR / 'frontend_dist'
FRONTEND_DIR = Path(os.environ.get('KONS_FRONTEND_DIR') or (_dist if _dist.is_dir() else BASE_DIR.parent / 'frontend'))

ALLOWED_HOSTS = env_list('KONS_ALLOWED_HOSTS', '127.0.0.1,localhost,testserver')
RENDER_HOST = os.environ.get('RENDER_EXTERNAL_HOSTNAME')  # Render avtomatik beradi
if RENDER_HOST:
    ALLOWED_HOSTS.append(RENDER_HOST)

# Frontend boshqa domendan (Render statik sayt) ochilganda API'ga ruxsat beriladigan manbalar.
# KONS_CORS_ORIGINS — to'liq manzillar, KONS_CORS_HOSTS — faqat domen nomlari (https:// qo'shiladi).
CORS_ALLOWED_ORIGINS = env_list('KONS_CORS_ORIGINS', 'http://127.0.0.1:8765,http://localhost:8765') + \
    [f'https://{h}' for h in env_list('KONS_CORS_HOSTS')]
CSRF_TRUSTED_ORIGINS = [f'https://{RENDER_HOST}'] if RENDER_HOST else []

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'api',
]

MIDDLEWARE = [
    'api.middleware.SimpleCorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
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

WSGI_APPLICATION = 'config.wsgi.application'

# DATABASE_URL bo'lsa (Render PostgreSQL) — u, aks holda lokal SQLite
DATABASES = {
    'default': dj_database_url.config(
        default=f"sqlite:///{os.environ.get('KONS_DB_PATH', BASE_DIR / 'db.sqlite3')}",
        conn_max_age=600,
        conn_health_checks=True,
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'uz'
TIME_ZONE = 'Asia/Tashkent'
USE_I18N = True
USE_TZ = True

# Statik fayllar: admin paneli uchun (collectstatic) va frontend (WhiteNoise sayt ildizidan beradi)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STORAGES = {
    'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
    'staticfiles': {'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage' if not DEBUG
                    else 'django.contrib.staticfiles.storage.StaticFilesStorage'},
}
WHITENOISE_ROOT = FRONTEND_DIR
WHITENOISE_INDEX_FILE = True
WHITENOISE_MAX_AGE = 0 if DEBUG else 3600

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Loyiha JSON va rasm hajmi chegaralari — bazani to'ldirib yuborishdan himoya
KONS_MAX_BUILD_BYTES = 200 * 1024
KONS_MAX_THUMB_CHARS = 120 * 1024
KONS_TOKEN_DAYS = 90  # token amal qilish muddati (kun)
DATA_UPLOAD_MAX_MEMORY_SIZE = 1024 * 1024

# Chat yordamchisi: KONS_AI_CHAT=1, `anthropic` paketi va ANTHROPIC_API_KEY bo'lsa — Claude javob beradi.
# Aks holda brauzer o'zidagi lug'at va hisob-kitoblar asosida javob beradi (pul sarflanmaydi).
KONS_AI_CHAT = os.environ.get('KONS_AI_CHAT', '0') == '1'
KONS_AI_MODEL = os.environ.get('KONS_AI_MODEL', 'claude-opus-5-5')
KONS_AI_PER_HOUR = int(os.environ.get('KONS_AI_PER_HOUR', '30'))

# Production xavfsizligi (Render TLS ni proksida tugatadi)
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = True
    SECURE_REDIRECT_EXEMPT = [r'^api/ping$']  # Render health check ichki HTTP orqali keladi
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 3600
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_REFERRER_POLICY = 'same-origin'
    # onrender.com umumiy domen: subdomenlar va preload ro'yxati bizning nazoratimizda emas
    SILENCED_SYSTEM_CHECKS = ['security.W005', 'security.W021']

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {'console': {'class': 'logging.StreamHandler'}},
    'root': {'handlers': ['console'], 'level': 'INFO' if not DEBUG else 'WARNING'},
}
