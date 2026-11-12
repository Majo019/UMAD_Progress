from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, Q, Sum
from django.db.models.functions import TruncDate
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from authentication.models import AdminProfile, Role
from authentication.wheel import apply_decay
from authentication.permissions import IsAdminRole
from authentication.roles import ensure_admin_profile, get_role, set_role
from authentication.serializers import UserDetailSerializer
from gamification.models import AvatarProfile
from pomodoro.models import PomodoroSession
from social.models import Friendship
from tasks.models import Task

from .serializers import (
    AdminProfileSerializer,
    AdminTaskSerializer,
    AdminUserListSerializer,
    AdminUserUpdateSerializer,
)

User = get_user_model()

MAX_PAGE_SIZE = 100


def _paginate(request, queryset):
    """Paginación simple por ?page=&page_size= que devuelve (items, meta)."""
    try:
        page = max(int(request.query_params.get('page', 1)), 1)
    except ValueError:
        page = 1
    try:
        page_size = min(max(int(request.query_params.get('page_size', 20)), 1), MAX_PAGE_SIZE)
    except ValueError:
        page_size = 20
    total = queryset.count()
    start = (page - 1) * page_size
    items = queryset[start:start + page_size]
    return items, {
        'count': total,
        'page': page,
        'page_size': page_size,
        'pages': max((total + page_size - 1) // page_size, 1),
    }


def _users_queryset():
    return (
        User.objects.select_related('profile', 'avatar')
        .annotate(
            tasks_total=Count('tasks', distinct=True),
            tasks_completed=Count('tasks', filter=Q(tasks__completed=True), distinct=True),
        )
        .order_by('-date_joined')
    )


def _admin_count():
    return User.objects.filter(profile__role=Role.ADMIN, is_active=True).count()


# ------------------------------------------------------------------
# Perfil del administrador
# ------------------------------------------------------------------

@api_view(['GET', 'PATCH'])
@permission_classes([IsAdminRole])
def admin_profile_view(request):
    """GET/PATCH /api/admin/profile/ — perfil del administrador autenticado."""
    admin_profile = ensure_admin_profile(request.user)

    if request.method == 'PATCH':
        serializer = AdminProfileSerializer(admin_profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

    return Response(AdminProfileSerializer(admin_profile).data)


# ------------------------------------------------------------------
# Estadísticas generales
# ------------------------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAdminRole])
def stats_view(request):
    """GET /api/admin/stats/ — métricas globales de la plataforma."""
    now = timezone.now()
    week_ago = now - timedelta(days=7)

    students = User.objects.exclude(profile__role=Role.ADMIN)
    tasks = Task.objects.all()
    tasks_total = tasks.count()
    tasks_completed = tasks.filter(completed=True).count()

    completed_pomodoros = PomodoroSession.objects.filter(status=PomodoroSession.Status.COMPLETED)
    focus_seconds = completed_pomodoros.aggregate(total=Sum('accumulated_seconds'))['total'] or 0

    # Altas de los últimos 7 días (incluye días sin registros con 0)
    today = timezone.localdate()
    first_day = today - timedelta(days=6)
    signups_raw = dict(
        User.objects.filter(date_joined__date__gte=first_day)
        .annotate(day=TruncDate('date_joined'))
        .values('day')
        .annotate(total=Count('id'))
        .values_list('day', 'total')
    )
    signups = []
    for offset in range(6, -1, -1):
        day = today - timedelta(days=offset)
        signups.append({'date': day.isoformat(), 'count': signups_raw.get(day, 0)})

    tasks_by_area = list(
        tasks.values('area').annotate(total=Count('id'), completed=Count('id', filter=Q(completed=True))).order_by('-total')
    )
    tasks_by_difficulty = list(tasks.values('difficulty').annotate(total=Count('id')).order_by('difficulty'))

    top_users = (
        AvatarProfile.objects.select_related('user', 'user__profile')
        .exclude(user__profile__role=Role.ADMIN)
        .order_by('-level', '-xp')[:5]
    )

    return Response({
        'users': {
            'total': students.count(),
            'active': students.filter(is_active=True).count(),
            'inactive': students.filter(is_active=False).count(),
            'new_last_7_days': students.filter(date_joined__gte=week_ago).count(),
            'admins': User.objects.filter(profile__role=Role.ADMIN).count(),
            'wheel_completed': students.filter(profile__wheel_quiz_completed=True).count(),
        },
        'tasks': {
            'total': tasks_total,
            'completed': tasks_completed,
            'pending': tasks_total - tasks_completed,
            'completion_rate': round(tasks_completed * 100 / tasks_total, 1) if tasks_total else 0,
            'by_area': tasks_by_area,
            'by_difficulty': tasks_by_difficulty,
        },
        'pomodoro': {
            'completed_sessions': completed_pomodoros.count(),
            'focus_minutes': focus_seconds // 60,
        },
        'gamification': {
            'average_level': round(
                AvatarProfile.objects.exclude(user__profile__role=Role.ADMIN)
                .aggregate(avg=Avg('level'))['avg'] or 1,
                1,
            ),
        },
        'social': {
            'friendships': Friendship.objects.filter(status=Friendship.Status.ACCEPTED).count(),
        },
        'signups_last_7_days': signups,
        'top_users': [
            {
                'id': a.user.id,
                'email': a.user.email,
                'name': (getattr(a.user, 'profile', None) and a.user.profile.name) or a.user.username,
                'level': a.level,
                'xp': a.xp,
            }
            for a in top_users
        ],
        'recent_users': AdminUserListSerializer(_users_queryset()[:5], many=True).data,
    })


# ------------------------------------------------------------------
# Gestión de usuarios
# ------------------------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAdminRole])
def users_list_view(request):
    """
    GET /api/admin/users/?search=&role=user|admin&status=active|inactive&page=&page_size=
    """
    qs = _users_queryset()

    search = request.query_params.get('search', '').strip()
    if search:
        qs = qs.filter(
            Q(email__icontains=search) | Q(username__icontains=search)
            | Q(first_name__icontains=search) | Q(last_name__icontains=search)
            | Q(profile__name__icontains=search) | Q(profile__career__icontains=search)
        )

    role = request.query_params.get('role')
    if role == Role.ADMIN:
        qs = qs.filter(profile__role=Role.ADMIN)
    elif role == Role.USER:
        qs = qs.exclude(profile__role=Role.ADMIN)

    state = request.query_params.get('status')
    if state == 'active':
        qs = qs.filter(is_active=True)
    elif state == 'inactive':
        qs = qs.filter(is_active=False)

    items, meta = _paginate(request, qs)
    return Response({**meta, 'results': AdminUserListSerializer(items, many=True).data})


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAdminRole])
def user_detail_view(request, user_id):
    """
    GET    /api/admin/users/<id>/ — detalle completo del usuario
    PATCH  /api/admin/users/<id>/ — cambiar rol o activar/desactivar
    DELETE /api/admin/users/<id>/ — eliminar cuenta
    """
    user = get_object_or_404(_users_queryset(), pk=user_id)
    is_self = user.pk == request.user.pk

    profile = getattr(user, 'profile', None)
    if profile is not None:
        apply_decay(profile)  # el admin ve la rueda con la baja diaria al día

    if request.method == 'DELETE':
        if is_self:
            return Response({'detail': 'No puedes eliminar tu propia cuenta.'}, status=status.HTTP_400_BAD_REQUEST)
        if get_role(user) == Role.ADMIN and _admin_count() <= 1:
            return Response({'detail': 'No puedes eliminar al último administrador.'}, status=status.HTTP_400_BAD_REQUEST)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    if request.method == 'PATCH':
        serializer = AdminUserUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        current_role = get_role(user)

        demoting = 'role' in data and data['role'] != Role.ADMIN and current_role == Role.ADMIN
        deactivating = data.get('is_active') is False and user.is_active
        if is_self and (demoting or deactivating):
            return Response(
                {'detail': 'No puedes quitarte el rol de administrador ni desactivar tu propia cuenta.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if current_role == Role.ADMIN and (demoting or deactivating) and _admin_count() <= 1:
            return Response({'detail': 'Debe existir al menos un administrador activo.'}, status=status.HTTP_400_BAD_REQUEST)

        if 'role' in data and data['role'] != current_role:
            set_role(user, data['role'])
        if 'is_active' in data and data['is_active'] != user.is_active:
            user.is_active = data['is_active']
            user.save(update_fields=['is_active'])
            if not user.is_active:
                # Cerrar sesiones abiertas de la cuenta desactivada
                Token.objects.filter(user=user).delete()

        user = _users_queryset().get(pk=user.pk)

    # Detalle (GET y respuesta de PATCH)
    avatar = getattr(user, 'avatar', None)
    user_tasks = Task.objects.filter(user=user)
    pomodoros = PomodoroSession.objects.filter(user=user, status=PomodoroSession.Status.COMPLETED)
    admin_profile = AdminProfile.objects.filter(user=user).first()

    return Response({
        **AdminUserListSerializer(user).data,
        'profile': UserDetailSerializer(user).data,
        'admin_profile': AdminProfileSerializer(admin_profile).data if admin_profile else None,
        'avatar': {
            'level': avatar.level,
            'xp': avatar.xp,
            'vida': avatar.vida,
            'alimento': avatar.alimento,
            'carino': avatar.carino,
        } if avatar else None,
        'pomodoro': {
            'completed_sessions': pomodoros.count(),
            'focus_minutes': (pomodoros.aggregate(total=Sum('accumulated_seconds'))['total'] or 0) // 60,
        },
        'friends_count': Friendship.objects.filter(
            Q(from_user=user) | Q(to_user=user), status=Friendship.Status.ACCEPTED
        ).count(),
        'recent_tasks': AdminTaskSerializer(user_tasks.order_by('-created_at')[:10], many=True).data,
    })


# ------------------------------------------------------------------
# Supervisión de tareas
# ------------------------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAdminRole])
def tasks_list_view(request):
    """GET /api/admin/tasks/?search=&status=completed|pending&difficulty=&area=&user=&page="""
    qs = Task.objects.select_related('user', 'user__profile').order_by('-created_at')

    search = request.query_params.get('search', '').strip()
    if search:
        qs = qs.filter(
            Q(title__icontains=search) | Q(description__icontains=search)
            | Q(user__email__icontains=search) | Q(user__profile__name__icontains=search)
        )

    state = request.query_params.get('status')
    if state == 'completed':
        qs = qs.filter(completed=True)
    elif state == 'pending':
        qs = qs.filter(completed=False)

    difficulty = request.query_params.get('difficulty')
    if difficulty:
        qs = qs.filter(difficulty=difficulty)

    area = request.query_params.get('area')
    if area:
        qs = qs.filter(area=area)

    user_id = request.query_params.get('user')
    if user_id and user_id.isdigit():
        qs = qs.filter(user_id=int(user_id))

    items, meta = _paginate(request, qs)
    return Response({**meta, 'results': AdminTaskSerializer(items, many=True).data})


@api_view(['DELETE'])
@permission_classes([IsAdminRole])
def task_detail_view(request, task_id):
    """DELETE /api/admin/tasks/<id>/ — moderación: eliminar una tarea."""
    task = get_object_or_404(Task, pk=task_id)
    task.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
