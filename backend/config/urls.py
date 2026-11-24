from django.contrib import admin
from django.urls import path

from game import views

urlpatterns = [
    path('', views.index, name='index'),
    path('lib/three.js', views.three_js, name='three-js'),
    path('admin/', admin.site.urls),
    path('api/ping', views.ping),
    path('api/register', views.register),
    path('api/login', views.login),
    path('api/logout', views.logout),
    path('api/me', views.me),
    path('api/progress', views.progress),
    path('api/result', views.result),
    path('api/leaderboard', views.leaderboard),
]
