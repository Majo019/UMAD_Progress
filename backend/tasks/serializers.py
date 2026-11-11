from rest_framework import serializers
from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    dueDate = serializers.CharField(source='due_date', required=False, allow_blank=True)
    completedAt = serializers.DateTimeField(source='completed_at', required=False, allow_null=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Task
        fields = [
            'id',
            'title',
            'description',
            'priority',
            'area',
            'completed',
            'due_date',
            'dueDate',
            'completed_at',
            'completedAt',
            'created_at',
            'createdAt',
        ]
        read_only_fields = ['id', 'created_at', 'createdAt']

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'dueDate' in data and 'due_date' not in data:
            data['due_date'] = data['dueDate']
        if 'completedAt' in data and 'completed_at' not in data:
            data['completed_at'] = data['completedAt']
        return super().to_internal_value(data)

