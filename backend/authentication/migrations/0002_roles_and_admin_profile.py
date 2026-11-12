import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def promote_superusers(apps, schema_editor):
    """Los superusuarios existentes pasan a tener rol admin y perfil de administrador."""
    User = apps.get_model(*settings.AUTH_USER_MODEL.split('.'))
    UserProfile = apps.get_model('authentication', 'UserProfile')
    AdminProfile = apps.get_model('authentication', 'AdminProfile')

    for user in User.objects.filter(is_superuser=True):
        full_name = f'{user.first_name} {user.last_name}'.strip() or user.username
        profile, _ = UserProfile.objects.get_or_create(user=user, defaults={'name': full_name})
        profile.role = 'admin'
        profile.save(update_fields=['role'])
        AdminProfile.objects.get_or_create(user=user, defaults={'display_name': full_name})


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='role',
            field=models.CharField(
                choices=[('user', 'Usuario'), ('admin', 'Administrador')],
                db_index=True,
                default='user',
                max_length=10,
            ),
        ),
        migrations.CreateModel(
            name='AdminProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('display_name', models.CharField(blank=True, default='', max_length=200)),
                ('position', models.CharField(blank=True, default='', max_length=150)),
                ('department', models.CharField(blank=True, default='', max_length=150)),
                ('phone', models.CharField(blank=True, default='', max_length=30)),
                ('bio', models.TextField(blank=True, default='')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='admin_profile',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
        ),
        migrations.RunPython(promote_superusers, migrations.RunPython.noop),
    ]
