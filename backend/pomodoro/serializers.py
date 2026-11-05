from rest_framework import serializers

from .models import PomodoroSession


class PomodoroSerializer(serializers.ModelSerializer):
    elapsed_seconds = serializers.SerializerMethodField()
    remaining_seconds = serializers.SerializerMethodField()

    class Meta:
        model = PomodoroSession
        fields = ['id', 'task_id', 'label', 'planned_minutes', 'status', 'started_at',
                  'finished_at', 'elapsed_seconds', 'remaining_seconds', 'xp_earned']

    def get_elapsed_seconds(self, obj):
        return obj.elapsed_seconds()

    def get_remaining_seconds(self, obj):
        return max(obj.planned_minutes * 60 - obj.elapsed_seconds(), 0)


class StartPomodoroSerializer(serializers.Serializer):
    planned_minutes = serializers.IntegerField(min_value=1, max_value=180, default=25)
    task_id = serializers.IntegerField(required=False, allow_null=True)
    label = serializers.CharField(required=False, allow_blank=True, max_length=120)