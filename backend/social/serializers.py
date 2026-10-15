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
    level = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'level']

    def get_level(self, obj):
        avatar = getattr(obj, 'avatar', None)
        return avatar.level if avatar else 1


class FriendRequestSerializer(serializers.ModelSerializer):
    from_user = FriendUserSerializer(read_only=True)

    class Meta:
        model = Friendship
        fields = ['id', 'from_user', 'created_at']