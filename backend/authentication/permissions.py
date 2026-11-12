from rest_framework.permissions import BasePermission

from .roles import is_admin


class IsAdminRole(BasePermission):
    """Permite el acceso solo a usuarios autenticados con rol `admin`."""

    message = 'Necesitas permisos de administrador para realizar esta acción.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and is_admin(request.user))
