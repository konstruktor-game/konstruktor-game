"""
Osmon Qalqoni (FPV dron o'yini) backend sozlamalari.

Bu loyiha Fitnes Zal saytidan butunlay alohida: o'z papkasi, o'z bazasi, o'z virtual muhiti.
Maxfiy qiymatlar muhit o'zgaruvchilaridan olinadi (ishlab chiqishda xavfsiz standartlar bilan).
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
# O'yin fayllari (dron-3d.html, lib/three.js) backend papkasining bir pog'ona yuqorisida
GAME_DIR = BASE_DIR.parent

DEBUG = os.environ.get('DRON_DEBUG', '1') == '1'
SECRET_KEY = os.environ.get('DRON_SECRET_KEY', 'dev-only-insecure-key-change-me' if DEBUG else '')
if not SECRET_KEY:
    raise RuntimeError("DRON_SECRET_KEY muhit o'zgaruvchisi o'rnatilmagan (DEBUG=0 rejimida majburiy)")

ALLOWED_HOSTS = [h for h in os.environ.get('DRON_ALLOWED_HOSTS', '127.0.0.1,localhost,testserver').split(',') if h]

# O'yin boshqa portdan (masalan python http.server 8765) ochilganda API'ga ruxsat beriladigan manbalar
CORS_ALLOWED_ORIGINS = [o for o in os.environ.get(
    'DRON_CORS_ORIGINS', 'http://127.0.0.1:8765,http://localhost:8765').split(',') if o]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'game',
]

MIDDLEWARE = [
    'game.middleware.SimpleCorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
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

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.environ.get('DRON_DB_PATH', str(BASE_DIR / 'db.sqlite3')),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 6}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'uz'
TIME_ZONE = 'Asia/Tashkent'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Progress JSON hajmi chegarasi (baytda) — bazani to'ldirib yuborishdan himoya
DRON_MAX_PROGRESS_BYTES = 64 * 1024
# Token amal qilish muddati (kun)
DRON_TOKEN_DAYS = 90
