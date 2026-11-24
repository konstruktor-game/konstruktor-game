import json

from django.core.cache import cache
from django.test import TestCase

from .models import MissionResult, Player


class ApiTests(TestCase):
    def setUp(self):
        cache.clear()

    def post(self, url, data, token=None, method='post'):
        h = {'HTTP_AUTHORIZATION': 'Token ' + token} if token else {}
        return getattr(self.client, method)(url, json.dumps(data), content_type='application/json', **h)

    def register(self, nick='Lochin_01', pwd='kuchliParol77'):
        r = self.post('/api/register', {'nickname': nick, 'password': pwd})
        self.assertEqual(r.status_code, 201, r.content)
        return r.json()['token']

    def test_index_serves_game(self):
        r = self.client.get('/')
        self.assertEqual(r.status_code, 200)
        self.assertIn(b'Osmon Qalqoni', b''.join(r.streaming_content))

    def test_register_login_me(self):
        self.register()
        self.assertEqual(self.post('/api/register', {'nickname': 'lochin_01', 'password': 'kuchliParol77'}).status_code, 409)
        self.assertEqual(self.post('/api/register', {'nickname': 'ab', 'password': 'kuchliParol77'}).status_code, 400)
        self.assertEqual(self.post('/api/register', {'nickname': 'Burgut', 'password': '123'}).status_code, 400)
        self.assertEqual(self.post('/api/login', {'nickname': 'Lochin_01', 'password': 'xato-parol'}).status_code, 401)
        r = self.post('/api/login', {'nickname': 'LOCHIN_01', 'password': 'kuchliParol77'})
        self.assertEqual(r.status_code, 200)
        tok = r.json()['token']
        me = self.client.get('/api/me', HTTP_AUTHORIZATION='Token ' + tok).json()
        self.assertEqual(me['player']['nickname'], 'Lochin_01')
        self.assertEqual(self.client.get('/api/me').status_code, 401)

    def test_login_throttle(self):
        self.register()
        for _ in range(10):
            self.post('/api/login', {'nickname': 'Lochin_01', 'password': 'xato'})
        r = self.post('/api/login', {'nickname': 'Lochin_01', 'password': 'kuchliParol77'})
        self.assertEqual(r.status_code, 429)

    def test_progress_sync_and_conflict(self):
        tok = self.register()
        r = self.post('/api/progress', {'progress': {'coins': 900, 'mission': 3}, 'savedAt': 2000}, tok, 'put')
        self.assertEqual(r.status_code, 200, r.content)
        # eskiroq progress yangisini bosib ketmaydi
        r = self.post('/api/progress', {'progress': {'coins': 1}, 'savedAt': 1000}, tok, 'put')
        self.assertEqual(r.status_code, 409)
        self.assertEqual(r.json()['player']['progress']['coins'], 900)
        r = self.post('/api/progress', {'progress': {'coins': 1}, 'savedAt': 1000, 'force': True}, tok, 'put')
        self.assertEqual(r.status_code, 200)
        big = {'progress': {'x': 'a' * 70000}, 'savedAt': 3000}
        self.assertEqual(self.post('/api/progress', big, tok, 'put').status_code, 413)

    def test_result_validation_and_leaderboard(self):
        tok = self.register()
        ok = {'mission': 1, 'mtype': 'destroy', 'win': True, 'time': 75.5, 'kills': 3, 'stars': 3, 'coins': 600}
        self.assertEqual(self.post('/api/result', ok, tok).status_code, 200)
        # juda tez qayta yuborish
        self.assertEqual(self.post('/api/result', ok, tok).status_code, 429)
        MissionResult.objects.update(created_at='2020-01-01T00:00:00Z')
        # ochilmagan missiya
        self.assertEqual(self.post('/api/result', dict(ok, mission=9), tok).status_code, 403)
        # noto'g'ri qiymatlar
        for bad in (dict(ok, kills=999), dict(ok, stars=5), dict(ok, time=0), dict(ok, mtype='hack'), dict(ok, win=False, stars=2)):
            self.assertEqual(self.post('/api/result', bad, tok).status_code, 400, bad)
        # o'sha missiyani qayta yutish yulduzlarni ikki barobar qilmaydi
        self.assertEqual(self.post('/api/result', ok, tok).status_code, 200)
        p = Player.objects.get()
        self.assertEqual((p.total_kills, p.total_wins, p.total_stars, p.max_mission), (6, 2, 3, 1))

        tok2 = self.register('Burgut', 'boshqaParol88')
        MissionResult.objects.update(created_at='2020-01-01T00:00:00Z')
        self.post('/api/result', dict(ok, kills=10), tok2)
        lb = self.client.get('/api/leaderboard?by=kills', HTTP_AUTHORIZATION='Token ' + tok).json()
        self.assertEqual([r['nickname'] for r in lb['rows']], ['Burgut', 'Lochin_01'])
        self.assertEqual(lb['me']['rank'], 2)
        self.assertEqual(self.client.get('/api/leaderboard?by=nimadir').status_code, 400)

    def test_cors_only_for_allowed_origin(self):
        r = self.client.options('/api/ping', HTTP_ORIGIN='http://127.0.0.1:8765')
        self.assertEqual(r['Access-Control-Allow-Origin'], 'http://127.0.0.1:8765')
        r = self.client.get('/api/ping', HTTP_ORIGIN='https://yomon-sayt.example')
        self.assertNotIn('Access-Control-Allow-Origin', r)
