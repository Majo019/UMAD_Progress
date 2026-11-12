import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from authentication.models import Role, UserProfile
from authentication.roles import ensure_admin_profile, set_role
from gamification.services import get_profile

User = get_user_model()

# Cuenta inicial de administrador. Las contraseñas se pueden cambiar con variables de entorno.
SEED_USERS = [
    {
        'role': Role.ADMIN,
        'email': os.environ.get('SEED_ADMIN_EMAIL', 'admin@umad.edu.mx'),
        'password_env': 'SEED_ADMIN_PASSWORD',
        'default_password': 'Admin123!',
        'name': 'Administrador UMAD',
        'admin_profile': {
            'position': 'Administrador de la plataforma',
            'department': 'Bienestar estudiantil',
            'bio': 'Cuenta de administración de UMAD Progress.',
        },
    },
]


class Command(BaseCommand):
    help = (
        'Crea (o actualiza) la cuenta inicial de administrador con su perfil. '
        'Es seguro ejecutarlo varias veces.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset-passwords',
            action='store_true',
            help='Vuelve a asignar la contraseña aunque la cuenta ya exista.',
        )

    @transaction.atomic
    def handle(self, *args, reset_passwords=False, **options):
        for seed in SEED_USERS:
            email = seed['email'].strip().lower()
            password = os.environ.get(seed['password_env'], seed['default_password'])
            first, _, last = seed['name'].partition(' ')

            user = User.objects.filter(email__iexact=email).first()
            created = user is None
            if created:
                user = User.objects.create_user(
                    username=email, email=email, password=password, first_name=first, last_name=last,
                )
            elif reset_passwords:
                user.set_password(password)
                user.save(update_fields=['password'])

            profile, _ = UserProfile.objects.get_or_create(user=user, defaults={'name': seed['name']})
            if created:
                for field, value in seed.get('profile', {}).items():
                    setattr(profile, field, value)
                profile.save()

            set_role(user, seed['role'])

            if seed['role'] == Role.ADMIN:
                admin_profile = ensure_admin_profile(user)
                if created:
                    admin_profile.display_name = seed['name']
                    for field, value in seed['admin_profile'].items():
                        setattr(admin_profile, field, value)
                    admin_profile.save()
            else:
                get_profile(user)  # avatar nivel 1 + objetos iniciales

            if created:
                state = 'creado'
            elif reset_passwords:
                state = 'actualizado (contraseña restablecida)'
            else:
                state = 'ya existía'
            from_env = bool(os.environ.get(seed['password_env']))
            pwd_hint = f' · contraseña: {password}' if (created or reset_passwords) and not from_env else ''
            self.stdout.write(self.style.SUCCESS(f'[{seed["role"]}] {email} {state}{pwd_hint}'))
