import os
from django.conf import settings
from django.contrib import admin
from django.http import HttpResponse, JsonResponse
from django.urls import include, path, re_path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return JsonResponse({
        'status': 'ok',
        'app': 'UMAD Progress API',
        'version': '1.0.0',
    })


def spa_or_api_root(request):
    """
    Ruta raíz (/):
    - Si el frontend está compilado en dist/index.html, lo sirve como SPA.
    - Si es solo el servicio de backend API, devuelve información de bienvenida y endpoints.
    """
    dist_index = settings.BASE_DIR.parent / 'dist' / 'index.html'
    if dist_index.exists():
        try:
            with open(dist_index, 'r', encoding='utf-8') as f:
                return HttpResponse(f.read(), content_type='text/html')
        except Exception:
            pass

    return JsonResponse({
        'status': 'online',
        'app': 'UMAD Progress API',
        'message': '¡Backend Django desplegado y operando exitosamente en Render!',
        'endpoints': {
            'health': '/api/health/',
            'auth_register': '/api/auth/register/',
            'auth_login': '/api/auth/login/',
            'auth_me': '/api/auth/me/',
            'tasks': '/api/tasks/',
            'avatar': '/api/avatar/',
            'pomodoro': '/api/pomodoro/',
            'calendar': '/api/calendar/events/',
            'friends': '/api/friends/',
            'admin_panel_api': '/api/admin/',
            'admin': '/admin/',
        },
        'frontend_note': 'Esta URL corresponde al servicio de Backend/API. Para ver la interfaz web, ingresa a la URL de tu servicio Frontend en Render.',
    })


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health-check'),
    path('api/auth/', include('authentication.urls')),
    path('api/admin/', include('administration.urls')),
    path('api/pomodoro/', include('pomodoro.urls')),
    path('api/avatar/', include('gamification.urls')),
    path('api/', include('social.urls')),
    path('api/', include('tasks.urls')),
    # Raíz y catch-all para evitar 404 en la raíz del servidor
    path('', spa_or_api_root, name='root'),
    re_path(r'^(?!api/|admin/|static/).*$', spa_or_api_root, name='catch-all'),
]
