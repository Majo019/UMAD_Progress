from django.db import models

# Create your models here.



from django.conf import settings
from django.db import models


class AvatarProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='avatar')
    level = models.PositiveIntegerField(default=1)
    xp = models.PositiveIntegerField(default=0)  # XP dentro del nivel actual
    vida = models.PositiveIntegerField(default=100)
    alimento = models.PositiveIntegerField(default=100)
    carino = models.PositiveIntegerField(default=100)

    def __str__(self):
        return f'{self.user} - nivel {self.level}'


class AvatarItem(models.Model):
    SLOTS = [('head', 'Cabeza'), ('body', 'Cuerpo'), ('accessory', 'Accesorio')]
    name = models.CharField(max_length=60)
    slot = models.CharField(max_length=20, choices=SLOTS)
    required_level = models.PositiveIntegerField(default=1)
    image = models.CharField(max_length=200, blank=True)  # emoji o ruta de imagen

    def __str__(self):
        return f'{self.name} (nivel {self.required_level})'


class UserItem(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='items')
    item = models.ForeignKey(AvatarItem, on_delete=models.CASCADE)
    equipped = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'item')