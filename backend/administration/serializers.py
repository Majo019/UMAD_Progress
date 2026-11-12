from django.contrib.auth import get_user_model
from rest_framework import serializers

from authentication.models import AdminProfile, Role
from authentication.roles import get_role
from tasks.models import Task

User = get_user_model()


class AdminProfileSerializer(serializers.ModelSerializer):
    """Perfil del administrador autenticado (GET/PATCH /api/admin/profile/)."""

    id = serializers.IntegerField(source='user.id', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    role = serializers.SerializerMethodField()
    date_joined = serializers.DateTimeField(source='user.date_joined', read_only=True)
    last_login = serializers.DateTimeField(source='user.last_login', read_only=True)

    class Meta:
        model = AdminProfile
        fields = [
            'id', 'email', 'role', 'display_name', 'position', 'department',
            'phone', 'bio', 'date_joined', 'last_login', 'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_role(self, obj):
        return get_role(obj.user)


def _display_name(user):
    profile = getattr(user, 'profile', None)
    if profile and profile.name:
        return profile.name
    return user.get_full_name() or user.username


class AdminUserListSerializer(serializers.ModelSerializer):
    """Fila del listado de usuarios para el panel de administración."""

    name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    career = serializers.SerializerMethodField()
    semester = serializers.SerializerMethodField()
    level = serializers.SerializerMethodField()
    tasks_total = serializers.IntegerField(read_only=True, default=0)
    tasks_completed = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'role', 'is_active', 'career', 'semester', 'level',
            'tasks_total', 'tasks_completed', 'date_joined', 'last_login',
        ]

    def get_name(self, obj):
        return _display_name(obj)

    def get_role(self, obj):
        return get_role(obj)

    def get_career(self, obj):
        profile = getattr(obj, 'profile', None)
        return profile.career if profile else ''

    def get_semester(self, obj):
        profile = getattr(obj, 'profile', None)
        return profile.semester if profile else None

    def get_level(self, obj):
        avatar = getattr(obj, 'avatar', None)
        return avatar.level if avatar else 1


class AdminTaskSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'due_date', 'difficulty', 'area', 'completed',
            'completed_at', 'created_at', 'user_id', 'user_email', 'user_name',
        ]

    def get_user_name(self, obj):
        return _display_name(obj.user)


class AdminUserUpdateSerializer(serializers.Serializer):
    """Campos que un administrador puede modificar de otra cuenta."""

    role = serializers.ChoiceField(choices=Role.choices, required=False)
    is_active = serializers.BooleanField(required=False)
