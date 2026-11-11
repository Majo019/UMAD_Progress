from django.conf import settings
from django.db import models


class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    name = models.CharField(max_length=200, blank=True, default='')
    career = models.CharField(max_length=150, blank=True, default='')
    semester = models.PositiveIntegerField(default=1)
    goals = models.TextField(blank=True, default='')
    interests = models.JSONField(default=list, blank=True)
    wheel_quiz_completed = models.BooleanField(default=False)
    wheel = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"{self.user.username} ({self.name or 'Sin nombre'})"

