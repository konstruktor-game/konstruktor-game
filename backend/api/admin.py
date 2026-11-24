from django.contrib import admin

from .models import AuthToken, Build


@admin.register(Build)
class BuildAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'owner', 'public', 'views', 'updated_at')
    list_filter = ('type', 'public')
    search_fields = ('name', 'owner__username', 'slug')
    readonly_fields = ('slug', 'views', 'created_at', 'updated_at')


@admin.register(AuthToken)
class AuthTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at')
    exclude = ('key',)  # token kalitini admin'da ko'rsatmaymiz
