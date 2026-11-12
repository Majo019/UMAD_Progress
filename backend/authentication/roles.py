from django.db import transaction

from .models import AdminProfile, Role, UserProfile


def get_role(user):
    """Rol efectivo del usuario. Los superusuarios sin perfil se consideran admin."""
    profile = getattr(user, 'profile', None)
    if profile is not None:
        return profile.role
    return Role.ADMIN if user.is_superuser else Role.USER


def is_admin(user):
    return get_role(user) == Role.ADMIN


def ensure_admin_profile(user):
    admin_profile, _ = AdminProfile.objects.get_or_create(
        user=user,
        defaults={'display_name': user.get_full_name() or user.username},
    )
    return admin_profile


@transaction.atomic
def set_role(user, role):
    """Cambia el rol del usuario y mantiene sincronizados `is_staff` y el AdminProfile."""
    if role not in Role.values:
        raise ValueError(f'Rol inválido: {role}')

    profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={'name': user.get_full_name() or user.username},
    )
    profile.role = role
    profile.save(update_fields=['role'])

    if role == Role.ADMIN:
        ensure_admin_profile(user)
        if not user.is_staff:
            user.is_staff = True
            user.save(update_fields=['is_staff'])
    elif user.is_staff and not user.is_superuser:
        user.is_staff = False
        user.save(update_fields=['is_staff'])
    return profile
