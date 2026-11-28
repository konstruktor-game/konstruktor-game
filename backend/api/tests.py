import json

from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import TestCase

from .models import Build


def project(t='copter', **extra):
    return dict({'v': 2, 'type': t, 'name': 'Sinov', 'p': {}, 'inst': {}, 'wires': {}}, **extra)


class ApiTests(TestCase):
    def setUp(self):
        cache.clear()

    def call(self, method, url, data=None, token=None):
        h = {'HTTP_AUTHORIZATION': 'Token ' + token} if token else {}
        return getattr(self.client, method)(url, json.dumps(data) if data is not None else None, content_type='application/json', **h)

    def register(self, name='Quruvchi_1', pwd='MustahkamParol77'):
        r = self.call('post', '/api/register', {'username': name, 'password': pwd})
        self.assertEqual(r.status_code, 201, r.content)
        return r.json()['token']

    def test_site_files(self):
        r = self.client.get('/')
        self.assertEqual(r.status_code, 200)
        self.assertIn(b'Konstruktor', b''.join(r.streaming_content))
        # frontend fayllari mavjud va index.html ularga to'g'ri yo'l bilan murojaat qiladi
        from django.conf import settings
        html = (settings.FRONTEND_DIR / 'index.html').read_text(encoding='utf-8')
        import re as _re
        for src in _re.findall(r'<script src="([^"]+)"', html) + _re.findall(r'(?:href|src)="(img/[^"]+)"', html):
            self.assertTrue((settings.FRONTEND_DIR / src).is_file(), src)
        # backend kodi va baza tashqariga berilmaydi
        self.assertEqual(self.client.get('/manage.py').status_code, 404)
        self.assertEqual(self.client.get('/db.sqlite3').status_code, 404)

    def test_register_login_logout(self):
        tok = self.register()
        self.assertEqual(self.call('post', '/api/register', {'username': 'quruvchi_1', 'password': 'MustahkamParol77'}).status_code, 409)
        self.assertEqual(self.call('post', '/api/register', {'username': 'a b', 'password': 'MustahkamParol77'}).status_code, 400)
        self.assertEqual(self.call('post', '/api/register', {'username': 'Boshqa', 'password': '12345678'}).status_code, 400)
        self.assertEqual(self.call('post', '/api/login', {'username': 'Quruvchi_1', 'password': 'xato'}).status_code, 401)
        r = self.call('post', '/api/login', {'username': 'QURUVCHI_1', 'password': 'MustahkamParol77'})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(self.call('get', '/api/me', token=tok).json()['user']['username'], 'Quruvchi_1')
        self.assertEqual(self.call('post', '/api/logout', token=tok).status_code, 200)
        self.assertEqual(self.call('get', '/api/me', token=tok).status_code, 401)

    def test_me_extra_fields(self):
        tok = self.register()
        self.call('post', '/api/builds', {'name': 'A', 'type': 'copter', 'data': project(), 'public': True}, tok)
        self.call('post', '/api/builds', {'name': 'B', 'type': 'copter', 'data': project(), 'public': False}, tok)
        u = self.call('get', '/api/me', token=tok).json()['user']
        self.assertEqual((u['builds'], u['public']), (2, 1))
        self.assertTrue(u['joined'])
        self.assertIsNone(u['last_login'])
        self.call('post', '/api/login', {'username': 'Quruvchi_1', 'password': 'MustahkamParol77'})
        tok2 = self.call('post', '/api/login', {'username': 'Quruvchi_1', 'password': 'MustahkamParol77'}).json()['token']
        self.assertTrue(self.call('get', '/api/me', token=tok2).json()['user']['last_login'])

    def test_change_password(self):
        old_tok = self.register()
        r = self.call('post', '/api/password', {'old': 'MustahkamParol77', 'new': 'YangiParol2025x'}, old_tok)
        self.assertEqual(r.status_code, 200, r.content)
        new_tok = r.json()['token']
        self.assertEqual(self.call('get', '/api/me', token=old_tok).status_code, 401)
        self.assertEqual(self.call('get', '/api/me', token=new_tok).status_code, 200)
        self.assertEqual(self.call('post', '/api/login', {'username': 'Quruvchi_1', 'password': 'MustahkamParol77'}).status_code, 401)
        self.assertEqual(self.call('post', '/api/login', {'username': 'Quruvchi_1', 'password': 'YangiParol2025x'}).status_code, 200)

    def test_change_password_errors(self):
        tok = self.register()
        url = '/api/password'
        self.assertEqual(self.call('post', url, {'old': 'MustahkamParol77', 'new': 'YangiParol2025x'}).status_code, 401)
        self.assertEqual(self.call('post', url, {'old': 'xato', 'new': 'YangiParol2025x'}, tok).status_code, 403)
        self.assertEqual(self.call('post', url, {'old': 'MustahkamParol77', 'new': '12345678'}, tok).status_code, 400)
        self.assertEqual(self.call('post', url, {'old': 'MustahkamParol77', 'new': 'MustahkamParol77'}, tok).status_code, 400)
        self.assertEqual(self.call('post', url, {'old': 'MustahkamParol77', 'new': 'a' * 200}, tok).status_code, 400)
        # hech narsa o'zgarmagan: eski token va eski parol ishlaydi
        self.assertEqual(self.call('get', '/api/me', token=tok).status_code, 200)

    def test_change_password_throttle(self):
        tok = self.register()
        for _ in range(10):
            self.assertEqual(self.call('post', '/api/password', {'old': 'xato', 'new': 'YangiParol2025x'}, tok).status_code, 403)
        self.assertEqual(self.call('post', '/api/password', {'old': 'MustahkamParol77', 'new': 'YangiParol2025x'}, tok).status_code, 429)

    def test_delete_account(self):
        tok = self.register()
        self.call('post', '/api/builds', {'name': 'A', 'type': 'copter', 'data': project()}, tok)
        self.assertEqual(self.call('post', '/api/account/delete', {'password': 'xato'}, tok).status_code, 403)
        self.assertEqual(Build.objects.count(), 1)
        self.assertEqual(self.call('post', '/api/account/delete', {'password': 'MustahkamParol77'}).status_code, 401)
        r = self.call('post', '/api/account/delete', {'password': 'MustahkamParol77'}, tok)
        self.assertEqual(r.status_code, 200, r.content)
        self.assertFalse(User.objects.filter(username='Quruvchi_1').exists())
        self.assertEqual(Build.objects.count(), 0)
        self.assertEqual(self.call('get', '/api/me', token=tok).status_code, 401)

    def test_delete_account_staff_refused(self):
        tok = self.register()
        User.objects.filter(username='Quruvchi_1').update(is_staff=True)
        self.assertEqual(self.call('post', '/api/account/delete', {'password': 'MustahkamParol77'}, tok).status_code, 403)
        self.assertTrue(User.objects.filter(username='Quruvchi_1').exists())

    def test_logout_all(self):
        t1 = self.register()
        t2 = self.call('post', '/api/login', {'username': 'Quruvchi_1', 'password': 'MustahkamParol77'}).json()['token']
        other = self.register('Ikkinchi', 'BoshqaParol99')
        r = self.call('post', '/api/logout-all', token=t1)
        self.assertEqual((r.status_code, r.json()['count']), (200, 2))
        self.assertEqual(self.call('get', '/api/me', token=t1).status_code, 401)
        self.assertEqual(self.call('get', '/api/me', token=t2).status_code, 401)
        self.assertEqual(self.call('get', '/api/me', token=other).status_code, 200)

    def test_login_throttle(self):
        self.register()
        for _ in range(10):
            self.call('post', '/api/login', {'username': 'Quruvchi_1', 'password': 'xato'})
        self.assertEqual(self.call('post', '/api/login', {'username': 'Quruvchi_1', 'password': 'MustahkamParol77'}).status_code, 429)

    def test_build_crud_and_privacy(self):
        a, b = self.register(), self.register('Ikkinchi', 'BoshqaParol99')
        body = {'name': 'Mening dronim', 'type': 'copter', 'data': project(id='eski'), 'summary': 'TWR 10', 'public': False,
                'thumb': 'javascript:alert(1)'}
        self.assertEqual(self.call('post', '/api/builds', body).status_code, 401)
        r = self.call('post', '/api/builds', body, a)
        self.assertEqual(r.status_code, 201, r.content)
        slug = r.json()['build']['slug']
        saved = Build.objects.get(slug=slug)
        self.assertEqual(saved.thumb, '')               # xavfli rasm manzili saqlanmaydi
        self.assertNotIn('id', saved.data)
        # shaxsiy loyiha boshqalarga ko'rinmaydi va galereyada yo'q
        self.assertEqual(self.call('get', '/api/builds/' + slug, token=b).status_code, 404)
        self.assertEqual(self.client.get('/api/gallery').json()['builds'], [])
        # egasi yangilaydi va ochiq qiladi
        r = self.call('put', '/api/builds/' + slug, dict(body, public=True, name='Yangi nom'), a)
        self.assertEqual(r.status_code, 200, r.content)
        g = self.client.get('/api/gallery?type=copter').json()['builds']
        self.assertEqual([x['name'] for x in g], ['Yangi nom'])
        self.assertEqual(self.client.get('/api/gallery?type=car').json()['builds'], [])
        # boshqa foydalanuvchi o'qiy oladi, lekin o'zgartira/o'chira olmaydi
        r = self.call('get', '/api/builds/' + slug, token=b)
        self.assertEqual(r.status_code, 200)
        self.assertFalse(r.json()['build']['mine'])
        self.assertEqual(self.call('put', '/api/builds/' + slug, body, b).status_code, 403)
        self.assertEqual(self.call('delete', '/api/builds/' + slug, token=b).status_code, 403)
        self.assertEqual(Build.objects.get(slug=slug).views, 1)
        self.assertEqual(self.call('delete', '/api/builds/' + slug, token=a).status_code, 200)
        self.assertFalse(Build.objects.exists())

    def test_build_validation(self):
        tok = self.register()
        bad = [{'type': 'tank', 'data': project()}, {'type': 'car', 'data': project('copter')}, {'type': 'car', 'data': 'x'},
               {'type': 'car', 'data': project('car', big='a' * 300000)}]
        for body in bad:
            self.assertIn(self.call('post', '/api/builds', body, tok).status_code, (400, 413), body.get('type'))
        ok = self.call('post', '/api/builds', {'type': 'plane', 'data': project('plane'), 'thumb': 'data:image/jpeg;base64,AAAA'}, tok)
        self.assertEqual(ok.status_code, 201)
        self.assertEqual(ok.json()['build']['name'], 'Nomsiz loyiha')
        self.assertTrue(Build.objects.get().thumb.startswith('data:image/jpeg'))

    def test_cors_only_for_allowed_origin(self):
        r = self.client.options('/api/ping', HTTP_ORIGIN='http://127.0.0.1:8765')
        self.assertEqual(r['Access-Control-Allow-Origin'], 'http://127.0.0.1:8765')
        self.assertNotIn('Access-Control-Allow-Origin', self.client.get('/api/ping', HTTP_ORIGIN='https://begona.example'))

    def test_new_types_and_chat(self):
        tok = self.register()
        for t in ('boat', 'robot', 'heli', 'rocket', 'tank', 'lab', 'free'):
            r = self.call('post', '/api/builds', {'type': t, 'data': project(t)}, tok)
            self.assertEqual(r.status_code, 201, t)
        # AI o'chirilgan: chat "offline" qaytaradi, brauzer o'zi javob beradi
        self.assertEqual(self.client.get('/api/chat').json(), {'ok': True, 'ai': False})
        r = self.call('post', '/api/chat', {'q': 'KV nima?', 'ctx': {'tur': 'Dron'}})
        self.assertEqual(r.json(), {'ok': False, 'offline': True})
        self.assertEqual(self.call('post', '/api/chat', {'q': '  '}).status_code, 400)

    def test_malformed_input_gives_400_not_500(self):
        tok = self.register()
        raw = lambda body: self.client.post('/api/builds', body, content_type='application/json', HTTP_AUTHORIZATION='Token ' + tok)
        self.assertEqual(raw('{"type":"car","data":' + '[' * 5000 + ']' * 5000 + '}').status_code, 400)   # RecursionError
        self.assertEqual(raw('{"type":"car","data":{"v":2,"type":"car","x":NaN}}').status_code, 400)    # NaN bazani buzardi
        self.assertEqual(raw(json.dumps({'type': ['car'], 'data': project('car')})).status_code, 400)   # unhashable tur
        self.assertEqual(raw(json.dumps({'type': 'car', 'data': project('car', x='a\x00b')})).status_code, 400)
        ok = raw(json.dumps({'type': 'car', 'data': project('car'), 'name': None, 'summary': {'a': 1}}))
        self.assertEqual(ok.status_code, 201, ok.content)
        # juda uzun parol / NUL belgili login 500 bermaydi
        self.assertEqual(self.call('post', '/api/register', {'username': 'Uzun_1', 'password': 'a' * 5000}).status_code, 400)
        self.assertEqual(self.call('post', '/api/login', {'username': 'x\x00y', 'password': 'p'}).status_code, 401)

    def test_expired_token_rejected_and_listing_has_no_data(self):
        from datetime import timedelta
        from django.utils import timezone
        from .models import AuthToken
        tok = self.register()
        self.call('post', '/api/builds', {'type': 'car', 'data': project('car')}, tok)
        row = self.call('get', '/api/builds', token=tok).json()['builds'][0]
        self.assertNotIn('data', row)
        AuthToken.objects.update(created_at=timezone.now() - timedelta(days=400))
        self.assertEqual(self.call('get', '/api/builds', token=tok).status_code, 401)
