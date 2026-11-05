from django.db import models

# Create your models here.




from django.conf import settings
from django.db import models
from django.utils import timezone


class PomodoroSession(models.Model):
    class Status(models.TextChoices):
        RUNNING = 'running'
        PAUSED = 'paused'
        COMPLETED = 'completed'
        CANCELLED = 'cancelled'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='pomodoros')
    task_id = models.PositiveIntegerField(null=True, blank=True)
    label = models.CharField(max_length=120, blank=True)
    planned_minutes = models.PositiveIntegerField(default=25)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.RUNNING)
    started_at = models.DateTimeField(default=timezone.now)
    last_resumed_at = models.DateTimeField(null=True, blank=True)
    accumulated_seconds = models.PositiveIntegerField(default=0)
    finished_at = models.DateTimeField(null=True, blank=True)
    xp_earned = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-started_at']

    def elapsed_seconds(self):
        total = self.accumulated_seconds
        if self.status == self.Status.RUNNING and self.last_resumed_at:
            total += int((timezone.now() - self.last_resumed_at).total_seconds())
        return total