from django.conf import settings
from django.http import HttpResponse


class SimpleCorsMiddleware:
    """Faqat /api/ yo'llari uchun, faqat ruxsat berilgan manbalarga CORS sarlavhalari.

    Kerak bo'lishining sababi: o'yin ba'zan alohida statik serverdan (8765-port) ochiladi,
    backend esa boshqa portda ishlaydi. Django orqali ochilganda (bir xil manba) CORS kerak emas.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        origin = request.headers.get('Origin')
        allowed = request.path.startswith('/api/') and origin in settings.CORS_ALLOWED_ORIGINS
        if allowed and request.method == 'OPTIONS':
            response = HttpResponse(status=204)
        else:
            response = self.get_response(request)
        if allowed:
            response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Headers'] = 'Authorization, Content-Type'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, OPTIONS'
            response['Access-Control-Max-Age'] = '600'
            response['Vary'] = 'Origin'
        return response
