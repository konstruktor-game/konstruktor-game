from django.contrib import admin
from django.urls import path

from api import views

urlpatterns = [
    path('', views.index, name='index'),
    path('konstruktor/img/<str:name>', views.image, name='image'),
    path('konstruktor/<str:name>', views.asset, name='asset'),
    path('lib/three.js', views.three_js, name='three-js'),
    path('admin/', admin.site.urls),
    path('api/ping', views.ping),
    path('api/register', views.register),
    path('api/login', views.login),
    path('api/logout', views.logout),
    path('api/me', views.me),
    path('api/builds', views.builds),
    path('api/builds/<str:slug>', views.build_detail),
    path('api/gallery', views.gallery),
]
