from django.urls import path

from .views import (
    admin_profile_view,
    stats_view,
    task_detail_view,
    tasks_list_view,
    user_detail_view,
    users_list_view,
)

urlpatterns = [
    path('profile/', admin_profile_view, name='admin-profile'),
    path('stats/', stats_view, name='admin-stats'),
    path('users/', users_list_view, name='admin-users'),
    path('users/<int:user_id>/', user_detail_view, name='admin-user-detail'),
    path('tasks/', tasks_list_view, name='admin-tasks'),
    path('tasks/<int:task_id>/', task_detail_view, name='admin-task-detail'),
]
