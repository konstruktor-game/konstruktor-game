# Konstruktor

Texnikani detallarigacha o'zingiz loyihalab, yig'ib, simlarini ulab, virtual sinovdan o'tkazadigan o'quv sayti.
9 ta tur: multikopter, samolyot, RC mashina, RC kater, Arduino robot, RC vertolyot, model raketa,
gusenitsali tank va Arduino laboratoriyasi (kod simulyatori bilan).

## Tuzilma

```
frontend/                  statik sayt (HTML + JavaScript, build kerak emas)
  index.html
  config.js                API manzili (Render'da build paytida yoziladi)
  img/                     logo va rasmlar
  lib/three.js             3D dvigatel (three.js r160)
  js/core/                 yordamchilar, ikonkalar, detal yasovchilar, lug'at
  js/types/                qurilma turlari (har biri: parametrlar, fizika, 3D model, simlar, sinov)
  js/sim/                  sinov maydoni (fizika) va Arduino kod interpretatori
  js/ui/                   interfeys, yasash stoli, Maslahatchi, o'quv markazi, chat
  scripts/write-config.sh  Render statik sayti uchun config.js yozuvchi
backend/                   Django JSON API (akkaunt, loyihalarni saqlash, galereya, chat)
  config/                  sozlamalar, URL'lar, WSGI
  api/                     modellar, view'lar, testlar, migratsiyalar
  build.sh                 Render build skripti (paketlar, frontend, statik fayllar)
  start.sh                 Render start skripti (migratsiya + gunicorn)
  requirements.txt
render.yaml                Render Blueprint: frontend + backend + PostgreSQL
```

## Lokal ishga tushirish (Windows)

`backend\start.bat` ni ishga tushiring, so'ng http://127.0.0.1:8001 ni oching.
(Birinchi marta virtual muhit yaratiladi va paketlar o'rnatiladi.)

Testlar: `backend\.venv\Scripts\python backend\manage.py test api`

## Render'ga joylash

1. Loyihani **alohida** GitHub repozitoriysiga yuklang (Fitnes Zal repozitoriysi bilan aralashtirmang).
2. Render → **New → Blueprint** → shu repozitoriyni tanlang. `render.yaml` uchta resurs yaratadi:
   - `konstruktor-api` — Django backend (gunicorn). Frontendni ham o'zi beradi: `https://konstruktor-api…onrender.com`
   - `konstruktor-web` — statik frontend (CDN), API manzili avtomatik ulanadi
   - `konstruktor-db` — PostgreSQL
   Qo'lda Web Service yaratilsa: Root Directory `backend`, Build Command `bash build.sh`, Start Command `bash start.sh`.
3. Deploy tugagach, administrator yaratish (Render → konstruktor-api → Shell):
   `python manage.py createsuperuser`

### Muhit o'zgaruvchilari (backend)

| O'zgaruvchi | Ma'nosi |
|---|---|
| `KONS_DEBUG` | `0` — production (majburiy Render'da) |
| `KONS_SECRET_KEY` | Django maxfiy kaliti (Render o'zi yaratadi) |
| `DATABASE_URL` | PostgreSQL manzili (Render bazadan beradi); bo'lmasa SQLite |
| `KONS_CORS_HOSTS` | Frontend domenlari (vergul bilan), API'ga ruxsat |
| `KONS_ALLOWED_HOSTS` | Qo'shimcha domenlar (Render domeni avtomatik qo'shiladi) |
| `KONS_AI_CHAT` | `1` — chatda Claude javobi (`anthropic` paketi va `ANTHROPIC_API_KEY` kerak) |

**Eslatma:** Render'ning bepul PostgreSQL bazasi cheklangan muddatga beriladi — doimiy foydalanish uchun pullik rejaga o'tkazing.
Bepul web servis 15 daqiqa ishlatilmasa uxlaydi; birinchi so'rov ~30–60 soniya kechikadi.
