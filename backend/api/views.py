"""Konstruktor JSON API va sayt fayllarini berish.

Autentifikatsiya: `Authorization: Token <key>` sarlavhasi (cookie emas) — shuning uchun API
view'lari csrf_exempt: brauzer tokenni o'zi avtomatik yubormaydi, CSRF hujumi ishlamaydi.
"""
import json
import re
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
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import PROJECT_TYPES, AuthToken, Build

USER_RE = re.compile(r'^[A-Za-z0-9_.-]{3,24}$')
ASSET_RE = re.compile(r'^[a-z_]+\.js$')
TYPES = {k for k, _ in PROJECT_TYPES}
THUMB_PREFIXES = ('data:image/jpeg;base64,', 'data:image/png;base64,')
LOGIN_FAIL_LIMIT = 10      # 10 daqiqada shuncha xato urinishdan keyin bloklanadi
SAVE_LIMIT_PER_MIN = 20    # bir daqiqada saqlashlar soni
MAX_BUILDS_PER_USER = 300


def err(msg, status=400):
    return JsonResponse({'ok': False, 'error': msg}, status=status)


def body_json(request):
    try:
        data = json.loads(request.body or b'{}')
    except (ValueError, UnicodeDecodeError):
        return None
    return data if isinstance(data, dict) else None


def get_user(request):
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Token '):
        return None, None
    tok = AuthToken.objects.select_related('user').filter(key=auth[6:].strip()).first()
    if not tok:
        return None, None
    if tok.expired or not tok.user.is_active:
        tok.delete()
        return None, None
    return tok.user, tok


def login_required_api(view):
    @wraps(view)
    def wrapper(request, *a, **kw):
        user, tok = get_user(request)
        if not user:
            return err('Kirish talab qilinadi yoki sessiya tugagan', 401)
        request.api_user, request.api_token = user, tok
        return view(request, *a, **kw)
    return wrapper


def user_json(u):
    return {'username': u.username, 'builds': u.builds.count()}


# ---------------- sayt fayllari ----------------
def index(request):
    return FileResponse(open(settings.SITE_DIR / 'konstruktor' / 'index.html', 'rb'), content_type='text/html; charset=utf-8')


def asset(request, name):
    if not ASSET_RE.match(name):
        raise Http404
    path = settings.SITE_DIR / 'konstruktor' / name
    if not path.is_file():
        raise Http404
    return FileResponse(open(path, 'rb'), content_type='application/javascript; charset=utf-8')


def three_js(request):
    path = settings.SITE_DIR / 'lib' / 'three.js'
    if not path.is_file():
        raise Http404
    return FileResponse(open(path, 'rb'), content_type='application/javascript')


# ---------------- akkaunt ----------------
@require_http_methods(['GET'])
def ping(request):
    return JsonResponse({'ok': True, 'name': 'konstruktor'})


@csrf_exempt
@require_http_methods(['POST'])
def register(request):
    data = body_json(request)
    if data is None:
        return err("Noto'g'ri so'rov")
    username, pwd = str(data.get('username', '')).strip(), str(data.get('password', ''))
    if not USER_RE.match(username):
        return err("Foydalanuvchi nomi 3–24 belgi: lotin harflari, raqam, _ . -")
    if User.objects.filter(username__iexact=username).exists():
        return err('Bu nom band', 409)
    try:
        validate_password(pwd, User(username=username))
    except ValidationError as e:
        return err(' '.join(e.messages))
    try:
        user = User.objects.create_user(username=username, password=pwd)
    except IntegrityError:
        return err('Bu nom band', 409)
    return JsonResponse({'ok': True, 'token': AuthToken.issue(user).key, 'user': user_json(user)}, status=201)


@csrf_exempt
@require_http_methods(['POST'])
def login(request):
    data = body_json(request)
    if data is None:
        return err("Noto'g'ri so'rov")
    username = str(data.get('username', '')).strip()
    key = 'kons-login-fail:' + username.lower()
    if cache.get(key, 0) >= LOGIN_FAIL_LIMIT:
        return err("Juda ko'p urinish. 10 daqiqadan keyin qayta urinib ko'ring.", 429)
    real = User.objects.filter(username__iexact=username).values_list('username', flat=True).first()
    user = authenticate(request, username=real or username, password=str(data.get('password', '')))
    if not user:
        cache.set(key, cache.get(key, 0) + 1, 600)
        return err("Foydalanuvchi nomi yoki parol noto'g'ri", 401)
    cache.delete(key)
    return JsonResponse({'ok': True, 'token': AuthToken.issue(user).key, 'user': user_json(user)})


@csrf_exempt
@require_http_methods(['POST'])
@login_required_api
def logout(request):
    request.api_token.delete()
    return JsonResponse({'ok': True})


@require_http_methods(['GET'])
@login_required_api
def me(request):
    return JsonResponse({'ok': True, 'user': user_json(request.api_user)})


# ---------------- loyihalar ----------------
def clean_build(data):
    """Kiruvchi loyihani tekshiradi; xato bo'lsa (None, xabar) qaytaradi."""
    name = str(data.get('name', '')).strip()[:60] or 'Nomsiz loyiha'
    btype = data.get('type')
    payload = data.get('data')
    if btype not in TYPES:
        return None, "Loyiha turi noto'g'ri"
    if not isinstance(payload, dict) or payload.get('type') != btype or payload.get('v') != 2:
        return None, "Loyiha ma'lumoti noto'g'ri"
    if len(json.dumps(payload)) > settings.KONS_MAX_BUILD_BYTES:
        return None, 'Loyiha juda katta'
    thumb = data.get('thumb') or ''
    if thumb and (not isinstance(thumb, str) or not thumb.startswith(THUMB_PREFIXES) or len(thumb) > settings.KONS_MAX_THUMB_CHARS):
        thumb = ''
    payload.pop('id', None)
    return {'name': name, 'type': btype, 'data': payload, 'summary': str(data.get('summary', ''))[:200],
            'thumb': thumb, 'public': data.get('public') is True}, None


def save_throttled(user):
    key = f'kons-save:{user.pk}'
    n = cache.get(key, 0)
    if n >= SAVE_LIMIT_PER_MIN:
        return True
    cache.set(key, n + 1, 60)
    return False


@csrf_exempt
@require_http_methods(['GET', 'POST'])
@login_required_api
def builds(request):
    user = request.api_user
    if request.method == 'GET':
        return JsonResponse({'ok': True, 'builds': [b.as_dict(user) for b in user.builds.all()[:MAX_BUILDS_PER_USER]]})
    if len(request.body) > settings.KONS_MAX_BUILD_BYTES + settings.KONS_MAX_THUMB_CHARS + 4096:
        return err("So'rov juda katta", 413)
    data = body_json(request)
    if data is None:
        return err("Noto'g'ri so'rov")
    fields, problem = clean_build(data)
    if problem:
        return err(problem)
    if user.builds.count() >= MAX_BUILDS_PER_USER:
        return err("Loyihalar soni chegarasiga yetdingiz — eskilarini o'chiring", 403)
    if save_throttled(user):
        return err('Juda tez — biroz kuting', 429)
    b = Build.objects.create(owner=user, **fields)
    return JsonResponse({'ok': True, 'build': b.as_dict(user)}, status=201)


@csrf_exempt
@require_http_methods(['GET', 'PUT', 'DELETE'])
def build_detail(request, slug):
    b = Build.objects.select_related('owner').filter(slug=slug).first()
    user, _ = get_user(request)
    mine = bool(b and user and b.owner_id == user.pk)
    if not b or (not b.public and not mine):
        return err('Loyiha topilmadi', 404)
    if request.method == 'GET':
        if not mine:
            Build.objects.filter(pk=b.pk).update(views=F('views') + 1)
        return JsonResponse({'ok': True, 'build': b.as_dict(user, with_data=True)})
    if not mine:
        return err("Bu loyiha sizniki emas", 403)
    if request.method == 'DELETE':
        b.delete()
        return JsonResponse({'ok': True})
    if len(request.body) > settings.KONS_MAX_BUILD_BYTES + settings.KONS_MAX_THUMB_CHARS + 4096:
        return err("So'rov juda katta", 413)
    data = body_json(request)
    if data is None:
        return err("Noto'g'ri so'rov")
    fields, problem = clean_build(data)
    if problem:
        return err(problem)
    if save_throttled(user):
        return err('Juda tez — biroz kuting', 429)
    with transaction.atomic():
        for k, v in fields.items():
            setattr(b, k, v)
        b.save()
    return JsonResponse({'ok': True, 'build': b.as_dict(user)})


@require_http_methods(['GET'])
def gallery(request):
    qs = Build.objects.filter(public=True).select_related('owner')
    t = request.GET.get('type')
    if t in TYPES:
        qs = qs.filter(type=t)
    user, _ = get_user(request)
    return JsonResponse({'ok': True, 'builds': [b.as_dict(user) for b in qs[:60]]})
