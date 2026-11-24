import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone

PROJECT_TYPES = [('copter', 'Multikopter'), ('plane', 'Samolyot'), ('car', 'RC mashina'), ('boat', 'RC kater'), ('robot', 'Arduino robot'), ('heli', 'RC vertolyot'), ('rocket', 'Model raketa'), ('tank', 'Gusenitsali tank')]


class AuthToken(models.Model):
    """API token (Authorization: Token <key>). Cookie ishlatilmaydi — shuning uchun CSRF xavfi yo'q."""
    key = models.CharField(max_length=64, unique=True, db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='api_tokens')
    created_at = models.DateTimeField(auto_now_add=True)

    @classmethod
    def issue(cls, user):
        return cls.objects.create(key=secrets.token_hex(32), user=user)

    @property
    def expired(self):
        return self.created_at < timezone.now() - timedelta(days=settings.KONS_TOKEN_DAYS)


def new_slug():
    return secrets.token_urlsafe(6).replace('-', 'x').replace('_', 'y')


class Build(models.Model):
    """Foydalanuvchi yig'gan loyiha (dron, samolyot yoki mashina) — to'liq holati JSON da."""
    slug = models.CharField(max_length=16, unique=True, default=new_slug, db_index=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='builds')
    name = models.CharField('Nomi', max_length=60)
    type = models.CharField('Turi', max_length=10, choices=PROJECT_TYPES)
    data = models.JSONField('Loyiha holati')
    summary = models.CharField("Qisqa ko'rsatkichlar", max_length=200, blank=True)
    thumb = models.TextField('Rasm (data URL)', blank=True)
    public = models.BooleanField('Galereyada ochiq', default=False)
    views = models.PositiveIntegerField("Ko'rishlar", default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [models.Index(fields=['public', '-updated_at'])]
        verbose_name = 'Loyiha'
        verbose_name_plural = 'Loyihalar'

    def __str__(self):
        return f'{self.name} ({self.owner.username})'

    def as_dict(self, me=None, with_data=False):
        d = {'slug': self.slug, 'name': self.name, 'type': self.type, 'summary': self.summary, 'thumb': self.thumb,
             'public': self.public, 'views': self.views, 'author': self.owner.username,
             'updated': self.updated_at.isoformat(), 'mine': bool(me and me.pk == self.owner_id)}
        if with_data:
            d['data'] = self.data
        return d
