"""Osmon Qalqoni JSON API.

Autentifikatsiya: `Authorization: Token <key>` sarlavhasi (cookie emas), shuning uchun API
view'lari csrf_exempt — brauzer tokenni o'zi avtomatik yubormaydi, CSRF hujumi ishlamaydi.
"""
import json
import re
import time
from functools import wraps

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.db.models import F
from django.http import FileResponse, Http404, JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import AuthToken, MissionResult, Player

NICK_RE = re.compile(r"^[\w' -]{3,24}$", re.UNICODE)
LEADER_FIELDS = {'kills': 'total_kills', 'stars': 'total_stars', 'mission': 'max_mission', 'wins': 'total_wins'}
LOGIN_FAIL_LIMIT = 10          # 10 daqiqada shuncha xato urinishdan keyin bloklanadi
RESULT_MIN_INTERVAL = 3.0      # natijalar orasidagi minimal vaqt (soniya)


def err(msg, status=400, **extra):
    return JsonResponse({'ok': False, 'error': msg, **extra}, status=status)


def body_json(request):
    try:
        data = json.loads(request.body or b'{}')
    except (ValueError, UnicodeDecodeError):
        return None
    return data if isinstance(data, dict) else None


def player_json(p, with_progress=False):
    d = {'nickname': p.nickname, 'kills': p.total_kills, 'wins': p.total_wins,
         'stars': p.total_stars, 'mission': p.max_mission}
    if with_progress:
        d['progress'] = p.progress
        d['savedAt'] = p.progress_saved_at
    return d


def get_token(request):
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Token '):
        return None
    tok = AuthToken.objects.select_related('user__player').filter(key=auth[6:].strip()).first()
    if tok and tok.expired:
        tok.delete()
        return None
    if not tok or not tok.user.is_active or not hasattr(tok.user, 'player'):
        return None
    return tok


def token_required(view):
    @wraps(view)
    def wrapper(request, *a, **kw):
        tok = get_token(request)
        if not tok:
            return err('Kirish talab qilinadi yoki sessiya tugagan', 401)
        request.dron_token = tok
        request.player = tok.user.player
        return view(request, *a, **kw)
    return wrapper


# ---------------- o'yin fayllari ----------------
def index(request):
    return FileResponse(open(settings.GAME_DIR / 'dron-3d.html', 'rb'), content_type='text/html; charset=utf-8')


def three_js(request):
    path = settings.GAME_DIR / 'lib' / 'three.js'
    if not path.exists():
        raise Http404
    return FileResponse(open(path, 'rb'), content_type='application/javascript')


# ---------------- API ----------------
@require_http_methods(['GET'])
def ping(request):
    return JsonResponse({'ok': True, 'name': 'osmon-qalqoni', 'time': int(time.time())})


@csrf_exempt
@require_http_methods(['POST'])
def register(request):
    data = body_json(request)
    if data is None:
        return err("Noto'g'ri so'rov")
    nick = str(data.get('nickname', '')).strip()
    pwd = str(data.get('password', ''))
    if not NICK_RE.match(nick):
        return err("Taxallus 3–24 belgi bo'lsin (harf, raqam, _ ' -)")
    username = nick.lower()
    try:
        validate_password(pwd, User(username=username))
    except ValidationError as e:
        return err(' '.join(e.messages))
    if User.objects.filter(username=username).exists() or Player.objects.filter(nickname__iexact=nick).exists():
        return err('Bu taxallus band', 409)
    try:
        with transaction.atomic():
            user = User.objects.create_user(username=username, password=pwd)
            player = Player.objects.create(user=user, nickname=nick)
    except IntegrityError:
        return err('Bu taxallus band', 409)
    tok = AuthToken.issue(user)
    return JsonResponse({'ok': True, 'token': tok.key, 'player': player_json(player, True)}, status=201)


@csrf_exempt
@require_http_methods(['POST'])
def login(request):
    data = body_json(request)
    if data is None:
        return err("Noto'g'ri so'rov")
    username = str(data.get('nickname', '')).strip().lower()
    key = 'dron-login-fail:' + username
    if cache.get(key, 0) >= LOGIN_FAIL_LIMIT:
        return err("Juda ko'p urinish. 10 daqiqadan keyin qayta urinib ko'ring.", 429)
    user = authenticate(request, username=username, password=str(data.get('password', '')))
    if not user or not hasattr(user, 'player'):
        cache.set(key, cache.get(key, 0) + 1, 600)
        return err("Taxallus yoki parol noto'g'ri", 401)
    cache.delete(key)
    tok = AuthToken.issue(user)
    return JsonResponse({'ok': True, 'token': tok.key, 'player': player_json(user.player, True)})


@csrf_exempt
@require_http_methods(['POST'])
@token_required
def logout(request):
    request.dron_token.delete()
    return JsonResponse({'ok': True})


@require_http_methods(['GET'])
@token_required
def me(request):
    return JsonResponse({'ok': True, 'player': player_json(request.player, True)})


@csrf_exempt
@require_http_methods(['PUT', 'POST'])
@token_required
def progress(request):
    if len(request.body) > settings.DRON_MAX_PROGRESS_BYTES:
        return err('Progress juda katta', 413)
    data = body_json(request)
    if data is None or not isinstance(data.get('progress'), dict):
        return err("Noto'g'ri progress")
    saved_at = data.get('savedAt')
    if isinstance(saved_at, bool) or not isinstance(saved_at, (int, float)) or saved_at <= 0:
        return err("savedAt noto'g'ri")
    p = request.player
    # Eski qurilmadagi eskirgan progress yangisini bosib ketmasligi uchun
    if data.get('force') is not True and int(saved_at) < p.progress_saved_at:
        return err('Serverdagi progress yangiroq', 409, player=player_json(p, True))
    p.progress = data['progress']
    p.progress_saved_at = int(saved_at)
    p.save(update_fields=['progress', 'progress_saved_at', 'updated_at'])
    return JsonResponse({'ok': True, 'savedAt': p.progress_saved_at})


def _int(v, lo, hi):
    if isinstance(v, bool) or not isinstance(v, (int, float)):
        raise ValueError
    v = int(v)
    if not lo <= v <= hi:
        raise ValueError
    return v


@csrf_exempt
@require_http_methods(['POST'])
@token_required
def result(request):
    data = body_json(request)
    if data is None:
        return err("Noto'g'ri so'rov")
    p = request.player
    try:
        mission = _int(data.get('mission'), 1, 999)
        mtype = str(data.get('mtype'))
        if mtype not in dict(MissionResult.MTYPES):
            raise ValueError
        win = data.get('win') is True
        t = data.get('time')
        if isinstance(t, bool) or not isinstance(t, (int, float)) or not 1 <= t <= 3600:
            raise ValueError
        kills = _int(data.get('kills', 0), 0, 30)
        stars = _int(data.get('stars', 0), 1 if win else 0, 3 if win else 0)
        coins = _int(data.get('coins', 0), 0, 100000)
    except (TypeError, ValueError):
        return err("Natija ma'lumotlari noto'g'ri")
    # Ochilmagan missiyani "yutib" bo'lmaydi
    try:
        synced = int((p.progress or {}).get('mission', 1) or 1)
    except (TypeError, ValueError):
        synced = 1
    if mission > max(p.max_mission + 1, synced):
        return err('Bu missiya hali ochilmagan', 403)
    last = p.results.first()
    if last and (timezone.now() - last.created_at).total_seconds() < RESULT_MIN_INTERVAL:
        return err('Juda tez', 429)
    with transaction.atomic():
        MissionResult.objects.create(player=p, mission=mission, mtype=mtype, win=win, time_sec=float(t),
                                     kills=kills, stars=stars, coins=coins)
        Player.objects.filter(pk=p.pk).update(total_kills=F('total_kills') + kills,
                                              total_wins=F('total_wins') + (1 if win else 0))
        p.refresh_from_db()
        if win:
            p.max_mission = max(p.max_mission, mission)
            p.recalc_stars()
            p.save(update_fields=['max_mission', 'total_stars', 'updated_at'])
    return JsonResponse({'ok': True, 'player': player_json(p)})


@require_http_methods(['GET'])
def leaderboard(request):
    field = LEADER_FIELDS.get(request.GET.get('by', 'kills'))
    if not field:
        return err("Noto'g'ri saralash")
    try:
        limit = min(100, max(1, int(request.GET.get('limit', 50))))
    except ValueError:
        limit = 50
    qs = Player.objects.filter(**{field + '__gt': 0}).order_by('-' + field, 'updated_at')
    rows = [{'rank': i + 1, 'nickname': n, 'value': v}
            for i, (n, v) in enumerate(qs.values_list('nickname', field)[:limit])]
    out = {'ok': True, 'by': request.GET.get('by', 'kills'), 'rows': rows, 'total': qs.count()}
    tok = get_token(request)
    if tok:  # token bilan so'ralsa — o'yinchining o'z o'rni
        me_ = tok.user.player
        val = getattr(me_, field)
        out['me'] = {'nickname': me_.nickname, 'value': val,
                     'rank': Player.objects.filter(**{field + '__gt': val}).count() + 1 if val > 0 else None}
    return JsonResponse(out)
