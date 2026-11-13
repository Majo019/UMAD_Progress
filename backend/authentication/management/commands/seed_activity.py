import random
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from authentication.models import Role, UserProfile, WheelSnapshot
from authentication.wheel import WHEEL_AREAS, normalize_wheel, record_snapshot
from gamification.models import AvatarProfile
from gamification.services import get_profile, unlock_items, xp_needed
from pomodoro.models import PomodoroSession
from pomodoro.views import xp_for
from tasks.models import Task

User = get_user_model()

TASK_TITLES = {
    'amigos': ['Llamar a un amigo', 'Salir a cenar con amigos', 'Responder mensajes pendientes', 'Organizar reunión del grupo'],
    'trabajo': ['Entregar reporte de laboratorio', 'Estudiar para el parcial', 'Avanzar el proyecto final', 'Leer capítulo asignado', 'Hacer ejercicios de práctica', 'Preparar exposición'],
    'familia': ['Comer con la familia', 'Llamar a mis papás', 'Ayudar en casa', 'Visitar a los abuelos'],
    'deporte': ['Ir al gimnasio', 'Salir a correr 30 min', 'Clase de yoga', 'Jugar fútbol'],
    'economia': ['Registrar gastos de la semana', 'Pagar servicios', 'Armar presupuesto mensual', 'Ahorrar para el viaje'],
    'retrospeccion': ['Escribir en el diario', 'Meditar 10 minutos', 'Revisar metas del mes', 'Reflexionar sobre la semana'],
    'ocio': ['Ver una película', 'Leer por gusto', 'Tocar la guitarra', 'Jugar videojuegos'],
    'alimentacion': ['Preparar la comida de la semana', 'Hacer el súper', 'Tomar 2 L de agua', 'Desayunar saludable'],
}
AREA_WEIGHTS = {'trabajo': 5, 'deporte': 2, 'retrospeccion': 1, 'amigos': 1, 'familia': 1, 'economia': 1, 'ocio': 1, 'alimentacion': 1}
DIFFICULTIES = (['tranquila'] * 3) + (['media'] * 5) + (['dificil'] * 2)
POMODORO_MINUTES = [25] * 7 + [15] * 1 + [50] * 2


def random_moment(rng, start, end):
    """Momento aleatorio entre start y end, ajustado a horario de 8:00 a 22:59 (hora local)."""
    span = max(int((end - start).total_seconds()), 60)
    moment = timezone.localtime(start + timedelta(seconds=rng.randint(0, span)))
    if not 8 <= moment.hour <= 22:
        moment = moment.replace(hour=rng.randint(8, 22))
    return min(max(moment, start), end)


class Command(BaseCommand):
    help = (
        'Genera actividad para los alumnos: tareas registradas/completadas, pomodoros y tiempo de '
        'enfoque, nivel del avatar y calificación del cuestionario de la Rueda de la Vida. '
        'Por defecto omite a los alumnos que ya tienen tareas o pomodoros.'
    )

    def add_arguments(self, parser):
        parser.add_argument('--seed', type=int, default=2026, help='Semilla para que los datos sean reproducibles.')
        parser.add_argument('--replace', action='store_true',
                            help='Borra las tareas y pomodoros existentes de cada alumno antes de generar.')
        parser.add_argument('--email', action='append', default=[], help='Solo estos correos (se puede repetir).')
        parser.add_argument('--dry-run', action='store_true', help='Solo muestra lo que haría, sin guardar.')

    def handle(self, *args, seed, replace, email, dry_run, **options):
        users = User.objects.filter(profile__role=Role.USER).select_related('profile').order_by('id')
        if email:
            users = users.filter(email__in=[e.strip().lower() for e in email])
        if not users.exists():
            raise CommandError('No hay alumnos (rol user) que procesar.')

        now = timezone.now()
        done = skipped = 0
        with transaction.atomic():
            for user in users:
                has_activity = Task.objects.filter(user=user).exists() or PomodoroSession.objects.filter(user=user).exists()
                if has_activity and not replace:
                    self.stdout.write(self.style.WARNING(f'Ya tiene actividad, se omite: {user.email}'))
                    skipped += 1
                    continue
                if replace:
                    Task.objects.filter(user=user).delete()
                    PomodoroSession.objects.filter(user=user).delete()

                summary = self.seed_user(user, random.Random(f'{seed}-{user.pk}'), now)
                done += 1
                self.stdout.write(
                    f'{user.email}: {summary["completed"]}/{summary["tasks"]} tareas, '
                    f'{summary["pomodoros"]} pomodoros ({summary["focus"]} min), nivel {summary["level"]}, '
                    f'rueda {summary["wheel"]}'
                )

            if dry_run:
                transaction.set_rollback(True)

        verb = 'se actualizarían' if dry_run else 'actualizados'
        self.stdout.write(self.style.SUCCESS(f'{done} alumnos {verb}, {skipped} omitidos.'))

    def seed_user(self, user, rng, now):
        start = min(user.date_joined, now - timedelta(hours=1))

        # Tareas
        areas = list(AREA_WEIGHTS)
        weights = [AREA_WEIGHTS[a] for a in areas]
        total = rng.randint(8, 25)
        completed_target = round(total * rng.uniform(0.4, 0.9))
        tasks = []
        for i in range(total):
            area = rng.choices(areas, weights)[0]
            created = random_moment(rng, start, now)
            is_done = i < completed_target
            task = Task.objects.create(
                user=user,
                title=rng.choice(TASK_TITLES[area]),
                difficulty=rng.choice(DIFFICULTIES),
                area=area,
                completed=is_done,
                rewarded=is_done,
                due_date=(timezone.localtime(created) + timedelta(days=rng.randint(1, 7))).date().isoformat(),
            )
            completed_at = random_moment(rng, created, now) if is_done else None
            Task.objects.filter(pk=task.pk).update(created_at=created, completed_at=completed_at)
            tasks.append(task)

        # Pomodoros completados
        done_tasks = [t for t in tasks if t.completed]
        sessions = rng.randint(5, 30)
        focus_seconds = 0
        for _ in range(sessions):
            minutes = rng.choice(POMODORO_MINUTES)
            started = random_moment(rng, start, now - timedelta(minutes=minutes))
            linked = rng.choice(done_tasks) if done_tasks and rng.random() < 0.6 else None
            PomodoroSession.objects.create(
                user=user,
                task_id=linked.pk if linked else None,
                label=linked.title if linked else 'Sesión de enfoque',
                planned_minutes=minutes,
                status=PomodoroSession.Status.COMPLETED,
                started_at=started,
                accumulated_seconds=minutes * 60,
                finished_at=started + timedelta(minutes=minutes),
                xp_earned=xp_for(minutes),
            )
            focus_seconds += minutes * 60

        # Nivel del avatar
        get_profile(user)
        avatar = AvatarProfile.objects.get(user=user)
        avatar.level = rng.randint(2, 9)
        avatar.xp = rng.randint(0, xp_needed(avatar.level) - 1)
        avatar.vida = rng.randint(60, 100)
        avatar.alimento = rng.randint(60, 100)
        avatar.carino = rng.randint(60, 100)
        avatar.save()
        unlock_items(user, avatar.level)

        # Cuestionario de la Rueda de la Vida (0–10 por área, enteros como en el cuestionario real)
        profile = UserProfile.objects.get(user=user)
        profile.wheel = normalize_wheel([
            {'key': key, 'value': rng.choices(range(2, 11), [1, 2, 3, 4, 5, 5, 4, 3, 2])[0]}
            for key, _ in WHEEL_AREAS
        ])
        profile.wheel_initial = profile.wheel
        profile.wheel_quiz_completed = True
        profile.wheel_decayed_at = timezone.localdate()
        profile.save(update_fields=['wheel', 'wheel_initial', 'wheel_quiz_completed', 'wheel_decayed_at'])
        WheelSnapshot.objects.filter(user=user).delete()
        record_snapshot(profile, 'initial', profile.wheel, user.date_joined)

        return {
            'tasks': total,
            'completed': completed_target,
            'pomodoros': sessions,
            'focus': focus_seconds // 60,
            'level': avatar.level,
            'wheel': ' '.join(str(int(a['value'])) for a in profile.wheel),
        }
