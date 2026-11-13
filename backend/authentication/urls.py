from django.urls import path
from rest_framework.authtoken.views import obtain_auth_token

from .views import register_view, login_view, me_view, logout_view, wheel_award_view, wheel_final_view, wheel_history_view

urlpatterns = [
    path('register/', register_view, name='auth-register'),
    path('login/', login_view, name='auth-login'),
    path('token/', obtain_auth_token, name='auth-token'),
    path('me/', me_view, name='auth-me'),
    path('me/wheel/award/', wheel_award_view, name='auth-wheel-award'),
    path('me/wheel/final/', wheel_final_view, name='auth-wheel-final'),
    path('me/wheel/history/', wheel_history_view, name='auth-wheel-history'),
    path('logout/', logout_view, name='auth-logout'),
]

