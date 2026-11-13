from django.conf import settings
from django.db import models


class Task(models.Model):
    DIFFICULTY_CHOICES = [
        ('tranquila', 'Tranquila'),
        ('media', 'Media'),
        ('dificil', 'Difícil'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tasks'
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    due_date = models.CharField(max_length=50, blank=True, default='')
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='media')
    area = models.CharField(max_length=50, blank=True, default='trabajo')
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    # Puntos que esta tarea ya sumó a la rueda (solo se otorgan la primera vez que se completa)
    wheel_points = models.FloatField(default=0)
    # Si ya se entregó la recompensa del personaje (vida, alimento, cariño y XP); solo una vez por tarea
    rewarded = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['completed', '-created_at']

    def __str__(self):
        return f"{self.title} ({'✓' if self.completed else '○'})"

