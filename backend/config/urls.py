from django.contrib import admin
from django.urls import path

from api import views

urlpatterns = [
    # Sayt fayllarini (frontend) WhiteNoise sayt ildizidan beradi; bu faqat zaxira
    path('', views.index, name='index'),
    path('admin/', admin.site.urls),
    path('api/ping', views.ping),
    path('api/register', views.register),
    path('api/login', views.login),
    path('api/logout', views.logout),
    path('api/me', views.me),
    path('api/builds', views.builds),
    path('api/builds/<str:slug>', views.build_detail),
    path('api/gallery', views.gallery),
    path('api/chat', views.chat),
]
