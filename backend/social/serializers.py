from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import CalendarEvent, Friendship

User = get_user_model()


class CalendarEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalendarEvent
        fields = ['id', 'external_id', 'title', 'description', 'category',
                  'start', 'end', 'all_day', 'updated_at']
        read_only_fields = ['updated_at']


class SyncEventSerializer(CalendarEventSerializer):
    external_id = serializers.CharField(max_length=100)  # obligatorio al sincronizar


class CalendarSyncSerializer(serializers.Serializer):
    events = SyncEventSerializer(many=True, required=False)
    deleted_external_ids = serializers.ListField(child=serializers.CharField(), required=False)
    last_sync = serializers.DateTimeField(required=False)


class FriendUserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    career = serializers.SerializerMethodField()
    semester = serializers.SerializerMethodField()
    interests = serializers.SerializerMethodField()
    level = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'name', 'career', 'semester', 'interests', 'level']

    @staticmethod
    def _profile(obj):
        return getattr(obj, 'profile', None)

    def get_name(self, obj):
        p = self._profile(obj)
        return (p.name if p else '') or obj.get_full_name() or obj.username

    def get_career(self, obj):
        p = self._profile(obj)
        return p.career if p else ''

    def get_semester(self, obj):
        p = self._profile(obj)
        return p.semester if p else None

    def get_interests(self, obj):
        p = self._profile(obj)
        return list(p.interests) if p and isinstance(p.interests, list) else []

    def get_level(self, obj):
        avatar = getattr(obj, 'avatar', None)
        return avatar.level if avatar else 1


class FriendRequestSerializer(serializers.ModelSerializer):
    """Solicitud recibida: incluye a quien la envió."""
    from_user = FriendUserSerializer(read_only=True)

    class Meta:
        model = Friendship
        fields = ['id', 'from_user', 'created_at']


class SentFriendRequestSerializer(serializers.ModelSerializer):
    """Solicitud enviada: incluye a quien se le envió."""
    to_user = FriendUserSerializer(read_only=True)

    class Meta:
        model = Friendship
        fields = ['id', 'to_user', 'created_at']