from django.conf import settings
from django.http import HttpResponse


class SimpleCorsMiddleware:
    """Faqat /api/ yo'llari uchun, faqat ruxsat berilgan manbalarga CORS sarlavhalari.

    Sayt ba'zan alohida statik serverdan (masalan 8765-port) ochiladi, backend esa boshqa portda.
    Django orqali ochilganda (bir xil manba) CORS umuman kerak emas.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        origin = request.headers.get('Origin')
        is_api = request.path.startswith('/api/')
        allowed = is_api and origin in settings.CORS_ALLOWED_ORIGINS
        response = HttpResponse(status=204) if allowed and request.method == 'OPTIONS' else self.get_response(request)
        if allowed:
            response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Headers'] = 'Authorization, Content-Type'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response['Access-Control-Max-Age'] = '600'
        if is_api:
            response['Vary'] = 'Origin'  # kesh (CDN/brauzer) manbaga qarab javobni aralashtirib yubormasligi uchun
        return response
