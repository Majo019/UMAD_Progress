from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0002_roles_and_admin_profile'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='avatar_look',
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
