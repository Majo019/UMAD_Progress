from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from gamification.services import apply_reward
from authentication.models import UserProfile
from authentication.wheel import add_points

from .models import Task
from .serializers import TaskSerializer


# Recompensa del personaje por completar una tarea (debe coincidir con TASK_REWARD del frontend)
TASK_REWARD = {'vida': 5, 'alimento': 5, 'carino': 5, 'xp': 10}


def award_task(task):
    """Recompensa del avatar + puntos en la rueda según la dificultad. Solo la primera vez."""
    if not task.rewarded:
        try:
            apply_reward(task.user, **TASK_REWARD)
            task.rewarded = True
            task.save(update_fields=['rewarded'])
        except Exception:
            pass
    if task.wheel_points:
        return
    profile = UserProfile.objects.filter(user=task.user, wheel_quiz_completed=True).first()
    if profile:
        task.wheel_points = add_points(profile, task.area, task.difficulty)
        if task.wheel_points:
            task.save(update_fields=['wheel_points'])


class TaskViewSet(viewsets.ModelViewSet):
    """
    CRUD completo para las tareas de los alumnos:
    - GET /api/tasks/ : lista de tareas del usuario autenticado
    - POST /api/tasks/ : crear nueva tarea
    - GET /api/tasks/{id}/ : detalle de una tarea
    - PUT/PATCH /api/tasks/{id}/ : actualizar tarea
    - DELETE /api/tasks/{id}/ : eliminar tarea
    - POST /api/tasks/{id}/complete/ : marcar tarea completada (+ recompensa y puntos en la rueda)
    - POST /api/tasks/{id}/reopen/ : reabrir tarea
    """
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        was_completed = serializer.instance.completed
        task = serializer.save()
        if not was_completed and task.completed:
            if not task.completed_at:
                task.completed_at = timezone.now()
                task.save(update_fields=['completed_at'])
            award_task(task)
        elif was_completed and not task.completed:
            task.completed_at = None
            task.save(update_fields=['completed_at'])

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        task = self.get_object()
        if not task.completed:
            task.completed = True
            task.completed_at = timezone.now()
            task.save(update_fields=['completed', 'completed_at'])
            award_task(task)
        return Response(TaskSerializer(task).data)

    @action(detail=True, methods=['post'])
    def reopen(self, request, pk=None):
        task = self.get_object()
        if task.completed:
            task.completed = False
            task.completed_at = None
            task.save(update_fields=['completed', 'completed_at'])
        return Response(TaskSerializer(task).data)

