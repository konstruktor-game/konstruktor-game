"""
Konstruktor (dron, samolyot, mashina yig'ish sayti) backend sozlamalari.

Bu loyiha Fitnes Zal saytidan butunlay alohida: o'z papkasi, o'z bazasi, o'z virtual muhiti.
Maxfiy qiymatlar muhit o'zgaruvchilaridan olinadi (ishlab chiqishda xavfsiz standartlar bilan).
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
# Sayt fayllari (konstruktor/, lib/three.js) backend papkasining bir pog'ona yuqorisida
SITE_DIR = BASE_DIR.parent

DEBUG = os.environ.get('KONS_DEBUG', '1') == '1'
SECRET_KEY = os.environ.get('KONS_SECRET_KEY', 'dev-only-insecure-key-change-me' if DEBUG else '')
if not SECRET_KEY:
    raise RuntimeError("KONS_SECRET_KEY muhit o'zgaruvchisi o'rnatilmagan (DEBUG=0 rejimida majburiy)")

ALLOWED_HOSTS = [h for h in os.environ.get('KONS_ALLOWED_HOSTS', '127.0.0.1,localhost,testserver').split(',') if h]

# Sayt boshqa portdan (masalan python http.server 8765) ochilganda API'ga ruxsat beriladigan manbalar
CORS_ALLOWED_ORIGINS = [o for o in os.environ.get(
    'KONS_CORS_ORIGINS', 'http://127.0.0.1:8765,http://localhost:8765').split(',') if o]

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
        'NAME': os.environ.get('KONS_DB_PATH', str(BASE_DIR / 'db.sqlite3')),
    }
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

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Loyiha JSON va rasm hajmi chegaralari — bazani to'ldirib yuborishdan himoya
KONS_MAX_BUILD_BYTES = 200 * 1024
KONS_MAX_THUMB_CHARS = 120 * 1024
# Token amal qilish muddati (kun)
KONS_TOKEN_DAYS = 90
DATA_UPLOAD_MAX_MEMORY_SIZE = 1024 * 1024

# Chat yordamchisi: KONS_AI_CHAT=1 bo'lsa va `anthropic` paketi o'rnatilgan, API kaliti
# (ANTHROPIC_API_KEY yoki `ant auth login`) sozlangan bo'lsa — savollarga Claude javob beradi.
# Aks holda brauzer o'zidagi lug'at va hisob-kitoblar asosida javob beradi (pul sarflanmaydi).
KONS_AI_CHAT = os.environ.get('KONS_AI_CHAT', '0') == '1'
KONS_AI_MODEL = os.environ.get('KONS_AI_MODEL', 'claude-opus-5-5')
KONS_AI_PER_HOUR = int(os.environ.get('KONS_AI_PER_HOUR', '30'))
