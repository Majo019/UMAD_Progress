from django.db import migrations, models
from django.utils import timezone


def start_decay_today(apps, schema_editor):
    """
    Quien ya respondió el cuestionario empieza a perder puntos a partir de hoy.
    Quien lo había omitido (marcado como completado pero sin rueda) vuelve a tenerlo pendiente,
    porque ahora el cuestionario solo se responde una vez y ya no se puede reabrir.
    """
    UserProfile = apps.get_model('authentication', 'UserProfile')
    for profile in UserProfile.objects.filter(wheel_quiz_completed=True):
        if not profile.wheel:
            profile.wheel_quiz_completed = False
            profile.wheel_decayed_at = None
            profile.save(update_fields=['wheel_quiz_completed', 'wheel_decayed_at'])
    UserProfile.objects.filter(wheel_quiz_completed=True, wheel_decayed_at__isnull=True).update(
        wheel_decayed_at=timezone.localdate()
    )


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0003_userprofile_avatar_look'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='wheel_decayed_at',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.RunPython(start_decay_today, migrations.RunPython.noop),
    ]
