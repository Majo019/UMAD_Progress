from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from authentication.models import Role
from authentication.roles import set_role

User = get_user_model()


class Command(BaseCommand):
    help = 'Crea un administrador nuevo o promueve a admin a un usuario existente (por correo).'

    def add_arguments(self, parser):
        parser.add_argument('email')
        parser.add_argument('--password', help='Obligatoria si el usuario no existe todavía.')
        parser.add_argument('--name', default='', help='Nombre a mostrar del administrador.')

    def handle(self, *args, email, password, name, **options):
        email = email.strip().lower()
        user = (
            User.objects.filter(email__iexact=email).first()
            or User.objects.filter(username__iexact=email).first()
        )

        if user is None:
            if not password:
                raise CommandError('El usuario no existe: indica --password para crearlo.')
            parts = name.strip().split(' ', 1)
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=parts[0][:150],
                last_name=parts[1][:150] if len(parts) > 1 else '',
            )
            self.stdout.write(f'Usuario {email} creado.')
        elif password:
            user.set_password(password)
            user.save(update_fields=['password'])

        set_role(user, Role.ADMIN)
        if name.strip():
            user.admin_profile.display_name = name.strip()
            user.admin_profile.save(update_fields=['display_name'])
        self.stdout.write(self.style.SUCCESS(f'{email} ahora tiene rol de administrador.'))
