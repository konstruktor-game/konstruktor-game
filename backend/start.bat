@echo off
cd /d "%~dp0"
if not exist .venv (python -m venv .venv && .venv\Scripts\python -m pip install -r requirements.txt)
.venv\Scripts\python manage.py migrate
echo Oyin: http://127.0.0.1:8001/
.venv\Scripts\python manage.py runserver 127.0.0.1:8001
