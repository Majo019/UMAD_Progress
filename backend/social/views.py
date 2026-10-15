from django.shortcuts import render

# Create your views here.




from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CalendarEvent, Friendship
from .serializers import (CalendarEventSerializer, CalendarSyncSerializer,
                          FriendRequestSerializer, FriendUserSerializer)

User = get_user_model()
ACCEPTED = Friendship.Status.ACCEPTED
PENDING = Friendship.Status.PENDING


# ---------- CALENDARIO ----------

class CalendarEventViewSet(viewsets.ModelViewSet):
    """CRUD de eventos. Filtros opcionales: ?from=2026-10-01&to=2026-10-31"""
    serializer_class = CalendarEventSerializer

    def get_queryset(self):
        qs = CalendarEvent.objects.filter(user=self.request.user)
        date_from = self.request.query_params.get('from')
        date_to = self.request.query_params.get('to')
        if date_from:
            qs = qs.filter(start__date__gte=date_from)
        if date_to:
            qs = qs.filter(start__date__lte=date_to)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CalendarSyncView(APIView):
    """
    POST {events: [...], deleted_external_ids: [...], last_sync: "ISO"}
    Sube los cambios del cliente y devuelve los cambios del servidor desde last_sync.
    """
    @transaction.atomic
    def post(self, request):
        s = CalendarSyncSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        data = s.validated_data

        created = updated = 0
        pushed_ids = []
        for ev in data.get('events', []):
            ext_id = ev.pop('external_id')
            _, was_created = CalendarEvent.objects.update_or_create(
                user=request.user, external_id=ext_id, defaults=ev
            )
            created += was_created
            updated += not was_created
            pushed_ids.append(ext_id)

        deleted, _ = CalendarEvent.objects.filter(
            user=request.user, external_id__in=data.get('deleted_external_ids', [])
        ).delete()

        server_changes = CalendarEvent.objects.filter(user=request.user).exclude(external_id__in=pushed_ids)
        if data.get('last_sync'):
            server_changes = server_changes.filter(updated_at__gt=data['last_sync'])

        return Response({
            'created': created,
            'updated': updated,
            'deleted': deleted,
            'server_time': timezone.now(),
            'events': CalendarEventSerializer(server_changes, many=True).data,
        })


# ---------- AMIGOS ----------

def _friend_ids(user):
    rows = Friendship.objects.filter(status=ACCEPTED).filter(Q(from_user=user) | Q(to_user=user))
    return {r.to_user_id if r.from_user_id == user.id else r.from_user_id for r in rows}


@api_view(['GET'])
def friends_list(request):
    users = User.objects.filter(id__in=_friend_ids(request.user)).select_related('avatar')
    return Response(FriendUserSerializer(users, many=True).data)


@api_view(['GET'])
def search_users(request):
    q = request.query_params.get('q', '').strip()
    if len(q) < 2:
        return Response([])
    friends = _friend_ids(request.user)
    users = User.objects.filter(username__icontains=q).exclude(id=request.user.id).select_related('avatar')[:20]
    data = FriendUserSerializer(users, many=True).data
    for row in data:
        row['is_friend'] = row['id'] in friends
    return Response(data)


@api_view(['GET'])
def recommendations(request):
    related = Friendship.objects.filter(Q(from_user=request.user) | Q(to_user=request.user))
    excluded = {request.user.id}
    for r in related:
        excluded.update([r.from_user_id, r.to_user_id])
    users = (User.objects.exclude(id__in=excluded).select_related('avatar')
             .order_by('-avatar__level', 'username')[:10])
    return Response(FriendUserSerializer(users, many=True).data)


@api_view(['POST'])
def send_request(request):
    username = str(request.data.get('username', '')).strip()
    target = User.objects.filter(username__iexact=username).first()
    if not target:
        return Response({'detail': 'Usuario no encontrado.'}, status=404)
    if target == request.user:
        return Response({'detail': 'No puedes agregarte a ti mismo.'}, status=400)

    existing = Friendship.objects.filter(
        Q(from_user=request.user, to_user=target) | Q(from_user=target, to_user=request.user)
    ).first()
    if existing:
        if existing.status == ACCEPTED:
            return Response({'detail': 'Ya son amigos.'}, status=400)
        if existing.from_user_id == target.id:  # él ya te había invitado: se acepta directo
            existing.status = ACCEPTED
            existing.save()
            return Response({'detail': 'Solicitud aceptada, ahora son amigos.'})
        return Response({'detail': 'Ya enviaste una solicitud.'}, status=400)

    Friendship.objects.create(from_user=request.user, to_user=target)
    return Response({'detail': 'Solicitud enviada.'}, status=201)


@api_view(['GET'])
def pending_requests(request):
    qs = Friendship.objects.filter(to_user=request.user, status=PENDING).select_related('from_user__avatar')
    return Response(FriendRequestSerializer(qs, many=True).data)


@api_view(['POST'])
def accept_request(request, pk):
    fr = get_object_or_404(Friendship, pk=pk, to_user=request.user, status=PENDING)
    fr.status = ACCEPTED
    fr.save()
    return Response({'detail': 'Solicitud aceptada.'})


@api_view(['POST'])
def reject_request(request, pk):
    fr = get_object_or_404(Friendship, pk=pk, to_user=request.user, status=PENDING)
    fr.delete()
    return Response({'detail': 'Solicitud rechazada.'})


@api_view(['DELETE'])
def remove_friend(request, user_id):
    Friendship.objects.filter(
        Q(from_user=request.user, to_user_id=user_id) | Q(from_user_id=user_id, to_user=request.user),
        status=ACCEPTED,
    ).delete()
    return Response(status=204)