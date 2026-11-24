from django.contrib import admin

from .models import AuthToken, MissionResult, Player


@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = ('nickname', 'total_kills', 'total_wins', 'total_stars', 'max_mission', 'updated_at')
    search_fields = ('nickname', 'user__username')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(MissionResult)
class MissionResultAdmin(admin.ModelAdmin):
    list_display = ('player', 'mission', 'mtype', 'win', 'time_sec', 'kills', 'stars', 'coins', 'created_at')
    list_filter = ('win', 'mtype')
    search_fields = ('player__nickname',)


@admin.register(AuthToken)
class AuthTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at')
    exclude = ('key',)  # token kalitini admin'da ko'rsatmaymiz
