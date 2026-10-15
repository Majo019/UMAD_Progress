from django.urls import path
from rest_framework.routers import SimpleRouter

from . import views

router = SimpleRouter()
router.register('calendar/events', views.CalendarEventViewSet, basename='calendar-event')

urlpatterns = [
    path('calendar/sync/', views.CalendarSyncView.as_view()),
    path('friends/', views.friends_list),
    path('friends/search/', views.search_users),
    path('friends/recommendations/', views.recommendations),
    path('friends/request/', views.send_request),
    path('friends/requests/', views.pending_requests),
    path('friends/requests/<int:pk>/accept/', views.accept_request),
    path('friends/requests/<int:pk>/reject/', views.reject_request),
    path('friends/<int:user_id>/', views.remove_friend),
] + router.urls