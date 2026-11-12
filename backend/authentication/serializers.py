from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import UserProfile
from .roles import get_role
from .wheel import normalize_wheel

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['name', 'career', 'semester', 'goals', 'interests', 'wheel_quiz_completed', 'wheel', 'avatar_look']


class UserDetailSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    career = serializers.SerializerMethodField()
    semester = serializers.SerializerMethodField()
    goals = serializers.SerializerMethodField()
    interests = serializers.SerializerMethodField()
    wheel = serializers.SerializerMethodField()
    wheel_quiz_completed = serializers.SerializerMethodField()
    avatar_look = serializers.SerializerMethodField()
    level = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'name', 'career', 'semester',
            'goals', 'interests', 'wheel', 'wheel_quiz_completed', 'avatar_look', 'level', 'role'
        ]

    def _profile(self, obj):
        return getattr(obj, 'profile', None)

    def get_name(self, obj):
        p = self._profile(obj)
        return p.name if p and p.name else (obj.get_full_name() or obj.username)

    def get_career(self, obj):
        p = self._profile(obj)
        return p.career if p else ''

    def get_semester(self, obj):
        p = self._profile(obj)
        return p.semester if p else 1

    def get_goals(self, obj):
        p = self._profile(obj)
        return p.goals if p else ''

    def get_interests(self, obj):
        p = self._profile(obj)
        return p.interests if p else []

    def get_wheel(self, obj):
        p = self._profile(obj)
        if not p or not p.wheel_quiz_completed:
            return []
        return normalize_wheel(p.wheel)

    def get_wheel_quiz_completed(self, obj):
        p = self._profile(obj)
        return p.wheel_quiz_completed if p else False

    def get_avatar_look(self, obj):
        p = self._profile(obj)
        return p.avatar_look if p and p.avatar_look else {}

    def get_level(self, obj):
        avatar = getattr(obj, 'avatar', None)
        return avatar.level if avatar else 1

    def get_role(self, obj):
        return get_role(obj)


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=4)
    name = serializers.CharField(required=False, allow_blank=True, default='')
    career = serializers.CharField(required=False, allow_blank=True, default='')
    semester = serializers.IntegerField(required=False, default=1)
    goals = serializers.CharField(required=False, allow_blank=True, default='')
    interests = serializers.ListField(child=serializers.CharField(), required=False, default=list)


class LoginSerializer(serializers.Serializer):
    email = serializers.CharField()
    password = serializers.CharField(write_only=True)

