import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class Player(models.Model):
    """O'yinchi profili: taxallus va qurilmalar o'rtasida sinxronlanadigan progress."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='player')
    nickname = models.CharField('Taxallus', max_length=24, unique=True)
    progress = models.JSONField('Progress', default=dict, blank=True)
    progress_saved_at = models.BigIntegerField('Progress vaqti (ms)', default=0)
    # Reyting uchun agregatlar — faqat server tekshirgan natijalardan hisoblanadi
    total_kills = models.PositiveIntegerField(default=0)
    total_wins = models.PositiveIntegerField(default=0)
    total_stars = models.PositiveIntegerField(default=0)
    max_mission = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "O'yinchi"
        verbose_name_plural = "O'yinchilar"

    def __str__(self):
        return self.nickname

    def recalc_stars(self):
        """Har bir missiyaning eng yaxshi yulduzi yig'indisi (qayta o'ynab yulduz 'yig'ib' bo'lmaydi)."""
        best = {}
        for m, s in self.results.filter(win=True).values_list('mission', 'stars'):
            best[m] = max(best.get(m, 0), s)
        self.total_stars = sum(best.values())


class AuthToken(models.Model):
    """Oddiy API token (Authorization: Token <key>). Cookie ishlatilmaydi — CSRF xavfi yo'q."""
    key = models.CharField(max_length=64, unique=True, db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='dron_tokens')
    created_at = models.DateTimeField(auto_now_add=True)

    @classmethod
    def issue(cls, user):
        return cls.objects.create(key=secrets.token_hex(32), user=user)

    @property
    def expired(self):
        return self.created_at < timezone.now() - timedelta(days=settings.DRON_TOKEN_DAYS)


class MissionResult(models.Model):
    MTYPES = [(k, k) for k in ('destroy', 'convoy', 'timer', 'recon', 'cash', 'night')]
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='results')
    mission = models.PositiveIntegerField()
    mtype = models.CharField(max_length=12, choices=MTYPES)
    win = models.BooleanField()
    time_sec = models.FloatField()
    kills = models.PositiveIntegerField(default=0)
    stars = models.PositiveSmallIntegerField(default=0)
    coins = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [models.Index(fields=['player', 'mission'])]
        verbose_name = 'Missiya natijasi'
        verbose_name_plural = 'Missiya natijalari'
