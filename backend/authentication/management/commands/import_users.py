import random
from datetime import date, datetime, time, timedelta
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from authentication.models import UserProfile
from gamification.services import get_profile

User = get_user_model()


def parse_registros(path):
    """
    Lee una tabla de texto con columnas separadas por '|':
    No. | Nombre | Correo | Contraseña | Carrera | Sem. | Intereses
    Ignora encabezados, comentarios (#) y separadores.
    """
    rows = []
    for line_no, line in enumerate(Path(path).read_text(encoding='utf-8').splitlines(), start=1):
        parts = [p.strip() for p in line.split('|')]
        if len(parts) < 7 or not parts[0].isdigit():
            continue
        _, name, email, password, career, semester, interests = parts[:7]
        if not email or '@' not in email or not password:
            raise CommandError(f'Línea {line_no}: correo o contraseña inválidos.')
        rows.append({
            'name': ' '.join(name.split()),
            'email': email.lower(),
            'password': password,
            'career': career,
            'semester': int(semester) if semester.isdigit() else 1,
            'interests': [i.strip() for i in interests.split(',') if i.strip()],
        })
    return rows


def spread_dates(count, start, end, seed):
    """Reparte `count` fechas entre start y end (inclusive), en orden, entre 8:00 y 22:59."""
    days = (end - start).days + 1
    rng = random.Random(seed)
    tz = timezone.get_current_timezone()
    per_day = [[] for _ in range(days)]
    for i in range(count):
        per_day[i * days // count].append(i)
    result = [None] * count
    for day_index, indexes in enumerate(per_day):
        day = start + timedelta(days=day_index)
        seconds = sorted(rng.randint(8 * 3600, 23 * 3600 - 1) for _ in indexes)
        for i, sec in zip(indexes, seconds):
            naive = datetime.combine(day, time()) + timedelta(seconds=sec)
            result[i] = timezone.make_aware(naive, tz)
    return result


class Command(BaseCommand):
    help = (
        'Registra alumnos desde un archivo de texto (ver registros.txt) con perfil, avatar y '
        'fecha de alta repartida entre --start y --end. Omite los correos que ya existen.'
    )

    def add_arguments(self, parser):
        parser.add_argument('file', help='Ruta del archivo con los registros.')
        parser.add_argument('--start', default='2026-11-05', help='Primer día (AAAA-MM-DD).')
        parser.add_argument('--end', default='2026-11-11', help='Último día (AAAA-MM-DD).')
        parser.add_argument('--seed', type=int, default=2026, help='Semilla para que las horas sean reproducibles.')
        parser.add_argument('--dry-run', action='store_true', help='Solo muestra lo que haría, sin guardar.')

    def handle(self, *args, file, start, end, seed, dry_run, **options):
        try:
            start_date, end_date = date.fromisoformat(start), date.fromisoformat(end)
        except ValueError as exc:
            raise CommandError(f'Fecha inválida: {exc}')
        if end_date < start_date:
            raise CommandError('--end debe ser igual o posterior a --start.')

        rows = parse_registros(file)
        if not rows:
            raise CommandError('No se encontró ningún registro en el archivo.')
        emails = [r['email'] for r in rows]
        duplicated = {e for e in emails if emails.count(e) > 1}
        if duplicated:
            raise CommandError(f'Correos repetidos en el archivo: {", ".join(sorted(duplicated))}')

        joined = spread_dates(len(rows), start_date, end_date, seed)
        existing = set(User.objects.filter(email__in=emails).values_list('email', flat=True))

        created = 0
        with transaction.atomic():
            for row, when in zip(rows, joined):
                if row['email'] in existing:
                    self.stdout.write(self.style.WARNING(f'Ya existe, se omite: {row["email"]}'))
                    continue
                if dry_run:
                    self.stdout.write(f'{timezone.localtime(when):%Y-%m-%d %H:%M}  {row["email"]}  ({row["name"]})')
                    created += 1
                    continue

                first, _, last = row['name'].partition(' ')
                user = User.objects.create_user(
                    username=row['email'],
                    email=row['email'],
                    password=row['password'],
                    first_name=first[:150],
                    last_name=last[:150],
                )
                user.date_joined = when
                user.save(update_fields=['date_joined'])

                UserProfile.objects.create(
                    user=user,
                    name=row['name'],
                    career=row['career'],
                    semester=row['semester'],
                    interests=row['interests'],
                )
                get_profile(user)  # avatar nivel 1 + objetos iniciales
                created += 1

            if dry_run:
                transaction.set_rollback(True)

        verb = 'se crearían' if dry_run else 'creados'
        self.stdout.write(self.style.SUCCESS(
            f'{created} usuarios {verb}, {len(existing)} omitidos. '
            f'Fechas de alta entre {start_date} y {end_date}.'
        ))
