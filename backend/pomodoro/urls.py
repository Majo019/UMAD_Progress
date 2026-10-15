from rest_framework.routers import SimpleRouter

from .views import PomodoroViewSet

router = SimpleRouter()
router.register('', PomodoroViewSet, basename='pomodoro')
urlpatterns = router.urls