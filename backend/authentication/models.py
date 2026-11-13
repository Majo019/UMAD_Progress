from django.conf import settings
from django.db import models


class Role(models.TextChoices):
    USER = 'user', 'Usuario'
    ADMIN = 'admin', 'Administrador'


class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.USER, db_index=True)
    name = models.CharField(max_length=200, blank=True, default='')
    career = models.CharField(max_length=150, blank=True, default='')
    semester = models.PositiveIntegerField(default=1)
    goals = models.TextField(blank=True, default='')
    interests = models.JSONField(default=list, blank=True)
    wheel_quiz_completed = models.BooleanField(default=False)
    wheel = models.JSONField(default=list, blank=True)
    # Último día en que se aplicó la baja diaria de la rueda (ver authentication/wheel.py)
    wheel_decayed_at = models.DateField(null=True, blank=True)
    # Foto fija del cuestionario inicial (no cambia con la baja diaria ni con las tareas)
    wheel_initial = models.JSONField(default=list, blank=True)
    # Rueda final: se puede volver a responder; se compara contra la inicial
    wheel_final = models.JSONField(default=list, blank=True)
    wheel_final_at = models.DateTimeField(null=True, blank=True)
    avatar_look = models.JSONField(default=dict, blank=True)

    @property
    def is_admin(self):
        return self.role == Role.ADMIN

    def __str__(self):
        return f"{self.user.username} ({self.name or 'Sin nombre'}) [{self.role}]"


class WheelSnapshot(models.Model):
    """Foto de cada Rueda de la Vida respondida (inicial y cada vez que se rehace)."""

    class Kind(models.TextChoices):
        INITIAL = 'initial', 'Inicial'
        FINAL = 'final', 'Rehecha'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wheel_snapshots')
    kind = models.CharField(max_length=10, choices=Kind.choices, default=Kind.FINAL)
    values = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(db_index=True)

    class Meta:
        ordering = ['created_at', 'id']

    def __str__(self):
        return f"{self.user.username} · {self.get_kind_display()} · {self.created_at:%Y-%m-%d}"


class AdminProfile(models.Model):
    """Perfil exclusivo de los administradores de la plataforma."""

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='admin_profile')
    display_name = models.CharField(max_length=200, blank=True, default='')
    position = models.CharField(max_length=150, blank=True, default='')
    department = models.CharField(max_length=150, blank=True, default='')
    phone = models.CharField(max_length=30, blank=True, default='')
    bio = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Admin: {self.display_name or self.user.username}"
