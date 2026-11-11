from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='avatar_look',
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
