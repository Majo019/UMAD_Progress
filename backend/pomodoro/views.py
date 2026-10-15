from django.shortcuts import render

# Create your views here.



from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from gamification.serializers import AvatarSerializer
from gamification.services import apply_reward

from .models import PomodoroSession
from .serializers import PomodoroSerializer, StartPomodoroSerializer

S = PomodoroSession.Status
ACTIVE = [S.RUNNING, S.PAUSED]

COMPLETION_THRESHOLD = 0.9   # % del tiempo que hay que cumplir para contar como completado
CARINO_REWARD = 10           # coincide con applyReward({ carino: 10, xp: 15 }) del frontend


def xp_for(planned_minutes):
    return round(planned_minutes * 0.6)  # 25 min = 15 XP


class PomodoroViewSet(viewsets.ReadOnlyModelViewSet):
    """GET lista/detalle + acciones: start, pause, resume, finish, current, stats."""
    serializer_class = PomodoroSerializer

    def get_queryset(self):
        return PomodoroSession.objects.filter(user=self.request.user)

    @action(detail=False, methods=['post'])
    def start(self, request):
        if self.get_queryset().filter(status__in=ACTIVE).exists():
            return Response({'detail': 'Ya tienes un Pomodoro activo.'}, status=status.HTTP_409_CONFLICT)
        s = StartPomodoroSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        session = PomodoroSession.objects.create(
            user=request.user, last_resumed_at=timezone.now(), **s.validated_data
        )
        return Response(PomodoroSerializer(session).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        session = self.get_object()
        if session.status != S.RUNNING:
            return Response({'detail': 'El Pomodoro no está corriendo.'}, status=400)
        session.accumulated_seconds = session.elapsed_seconds()
        session.last_resumed_at = None
        session.status = S.PAUSED
        session.save()
        return Response(PomodoroSerializer(session).data)

    @action(detail=True, methods=['post'])
    def resume(self, request, pk=None):
        session = self.get_object()
        if session.status != S.PAUSED:
            return Response({'detail': 'El Pomodoro no está en pausa.'}, status=400)
        session.last_resumed_at = timezone.now()
        session.status = S.RUNNING
        session.save()
        return Response(PomodoroSerializer(session).data)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def finish(self, request, pk=None):
        session = self.get_object()
        if session.status not in ACTIVE:
            return Response({'detail': 'Este Pomodoro ya terminó.'}, status=400)

        planned = session.planned_minutes * 60
        session.accumulated_seconds = min(session.elapsed_seconds(), planned)
        session.last_resumed_at = None
        session.finished_at = timezone.now()

        completed = session.accumulated_seconds >= planned * COMPLETION_THRESHOLD
        session.status = S.COMPLETED if completed else S.CANCELLED

        avatar_data, leveled_up = None, False
        if completed:
            session.xp_earned = xp_for(session.planned_minutes)
            profile, leveled_up = apply_reward(request.user, carino=CARINO_REWARD, xp=session.xp_earned)
            avatar_data = AvatarSerializer(profile).data
        session.save()

        return Response({
            'session': PomodoroSerializer(session).data,
            'rewarded': completed,
            'leveled_up': leveled_up,
            'avatar': avatar_data,
        })

    @action(detail=False, methods=['get'])
    def current(self, request):
        session = self.get_queryset().filter(status__in=ACTIVE).first()
        if not session:
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(PomodoroSerializer(session).data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        done = self.get_queryset().filter(status=S.COMPLETED)
        today = done.filter(finished_at__date=timezone.localdate())
        seconds = today.aggregate(t=Sum('accumulated_seconds'))['t'] or 0
        return Response({
            'completed_today': today.count(),
            'minutes_today': seconds // 60,
            'total_completed': done.count(),
        })