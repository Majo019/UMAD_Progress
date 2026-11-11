from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return JsonResponse({'status': 'ok', 'app': 'UMAD Progress API'})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health-check'),
    path('api/auth/', include('authentication.urls')),
    path('api/pomodoro/', include('pomodoro.urls')),
    path('api/avatar/', include('gamification.urls')),
    path('api/', include('social.urls')),
    path('api/', include('tasks.urls')),
]
