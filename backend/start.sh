#!/usr/bin/env bash
# Render start skripti: avval baza jadvallarini yangilaydi (ichki tarmoq endi ishlaydi), so'ng serverni ishga tushiradi
set -o errexit
cd "$(dirname "$0")"
python manage.py migrate --noinput
exec gunicorn config.wsgi:application --bind "0.0.0.0:${PORT:-10000}" --workers 2 --timeout 60
