@echo off
rem Konstruktor — lokal ishga tushirish (Windows)
cd /d "%~dp0"
if not exist .venv python -m venv .venv
.venv\Scripts\python -m pip install -q -r requirements.txt
.venv\Scripts\python manage.py migrate
echo Konstruktor: http://127.0.0.1:8001/
.venv\Scripts\python manage.py runserver 127.0.0.1:8001
