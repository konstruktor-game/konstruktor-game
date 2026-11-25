import json

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
