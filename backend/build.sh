#!/usr/bin/env bash
# Render build skripti (backend web servisi): paketlar, frontend nusxasi, statik fayllar.
# Migratsiya bu yerda EMAS: build paytida Render ichki tarmog'i (bazaning Internal URL) ishlamaydi — u start.sh da.
set -o errexit
cd "$(dirname "$0")"
pip install --upgrade pip
pip install -r requirements.txt
# Frontend repozitoriyning frontend/ papkasida — uni backend ichiga nusxalaymiz (WhiteNoise shu yerdan beradi)
rm -rf frontend_dist
cp -r ../frontend frontend_dist
# Backend o'zi bergan saytda API shu domenda: config.js bo'sh qoladi
printf "window.KONS_API = '';\n" > frontend_dist/config.js
python manage.py collectstatic --noinput
