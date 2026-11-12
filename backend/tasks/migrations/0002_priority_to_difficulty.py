from django.db import migrations, models

PRIORITY_TO_DIFFICULTY = {'alta': 'dificil', 'media': 'media', 'baja': 'tranquila'}


def priority_to_difficulty(apps, schema_editor):
    Task = apps.get_model('tasks', 'Task')
    for old, new in PRIORITY_TO_DIFFICULTY.items():
        Task.objects.filter(difficulty=old).update(difficulty=new)


def difficulty_to_priority(apps, schema_editor):
    Task = apps.get_model('tasks', 'Task')
    for old, new in PRIORITY_TO_DIFFICULTY.items():
        Task.objects.filter(difficulty=new).update(difficulty=old)


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0001_initial'),
    ]

    operations = [
        migrations.RenameField(model_name='task', old_name='priority', new_name='difficulty'),
        migrations.RunPython(priority_to_difficulty, difficulty_to_priority),
        migrations.AlterField(
            model_name='task',
            name='difficulty',
            field=models.CharField(
                choices=[('tranquila', 'Tranquila'), ('media', 'Media'), ('dificil', 'Difícil')],
                default='media',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='task',
            name='wheel_points',
            field=models.FloatField(default=0),
        ),
    ]
