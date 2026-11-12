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

from authentication.models import Role

from .models import CalendarEvent, Friendship
from .serializers import (CalendarEventSerializer, CalendarSyncSerializer,
                          FriendRequestSerializer, FriendUserSerializer,
                          SentFriendRequestSerializer)

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


def _students(user):
    """Usuarios activos que no son administradores (sin incluir al usuario actual)."""
    return (
        User.objects.filter(is_active=True)
        .exclude(id=user.id)
        .exclude(profile__role=Role.ADMIN)
        .exclude(is_superuser=True, profile__isnull=True)  # superusuarios sin perfil cuentan como admin
        .select_related('avatar', 'profile')
    )


def _interest_set(user):
    profile = getattr(user, 'profile', None)
    interests = profile.interests if profile and isinstance(profile.interests, list) else []
    return {str(i).strip().lower() for i in interests}


def _is_admin_user(user):
    profile = getattr(user, 'profile', None)
    if profile is not None:
        return profile.role == Role.ADMIN
    return user.is_superuser


@api_view(['GET'])
def friends_list(request):
    users = User.objects.filter(id__in=_friend_ids(request.user)).select_related('avatar', 'profile')
    return Response(FriendUserSerializer(users, many=True).data)


@api_view(['GET'])
def search_users(request):
    """GET /api/friends/search/?q= — busca por usuario, correo, nombre o carrera e indica la relación."""
    q = request.query_params.get('q', '').strip()
    if len(q) < 2:
        return Response([])
    me = request.user
    users = (
        _students(me)
        .filter(
            Q(username__icontains=q) | Q(email__icontains=q)
            | Q(first_name__icontains=q) | Q(last_name__icontains=q)
            | Q(profile__name__icontains=q) | Q(profile__career__icontains=q)
        )
        .distinct()
        .order_by('username')[:20]
    )

    friends = _friend_ids(me)
    sent = dict(Friendship.objects.filter(from_user=me, status=PENDING).values_list('to_user_id', 'id'))
    received = dict(Friendship.objects.filter(to_user=me, status=PENDING).values_list('from_user_id', 'id'))

    data = FriendUserSerializer(users, many=True).data
    for row in data:
        uid = row['id']
        row['is_friend'] = uid in friends
        row['request_sent'] = uid in sent
        row['request_received'] = uid in received
        row['request_id'] = received.get(uid) or sent.get(uid)
    return Response(data)


@api_view(['GET'])
def recommendations(request):
    """Alumnos sin relación con el usuario, priorizando intereses en común y luego nivel."""
    me = request.user
    related = Friendship.objects.filter(Q(from_user=me) | Q(to_user=me))
    excluded = set()
    for r in related:
        excluded.update([r.from_user_id, r.to_user_id])

    candidates = list(
        _students(me).exclude(id__in=excluded).order_by('-avatar__level', 'username')[:100]
    )
    mine = _interest_set(me)
    # sort es estable: el orden por nivel/username se conserva como desempate
    candidates.sort(key=lambda u: len(mine & _interest_set(u)), reverse=True)
    return Response(FriendUserSerializer(candidates[:10], many=True).data)


@api_view(['POST'])
def send_request(request):
    """POST {user_id} o {username}."""
    user_id = request.data.get('user_id')
    target = None
    if user_id not in (None, ''):
        if str(user_id).isdigit():
            target = User.objects.filter(pk=int(user_id)).first()
    else:
        username = str(request.data.get('username', '')).strip()
        if username:
            target = User.objects.filter(username__iexact=username).first()

    if not target or not target.is_active or _is_admin_user(target):
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
            return Response({'detail': 'Solicitud aceptada, ahora son amigos.', 'status': ACCEPTED})
        return Response({'detail': 'Ya enviaste una solicitud.'}, status=400)

    fr = Friendship.objects.create(from_user=request.user, to_user=target)
    return Response({'detail': 'Solicitud enviada.', 'status': PENDING, 'id': fr.id}, status=201)


@api_view(['GET'])
def pending_requests(request):
    """Solicitudes recibidas pendientes."""
    qs = (Friendship.objects.filter(to_user=request.user, status=PENDING)
          .select_related('from_user__avatar', 'from_user__profile'))
    return Response(FriendRequestSerializer(qs, many=True).data)


@api_view(['GET'])
def sent_requests(request):
    """Solicitudes enviadas por mí que siguen pendientes."""
    qs = (Friendship.objects.filter(from_user=request.user, status=PENDING)
          .select_related('to_user__avatar', 'to_user__profile'))
    return Response(SentFriendRequestSerializer(qs, many=True).data)


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
def cancel_request(request, pk):
    fr = get_object_or_404(Friendship, pk=pk, from_user=request.user, status=PENDING)
    fr.delete()
    return Response(status=204)


@api_view(['DELETE'])
def remove_friend(request, user_id):
    Friendship.objects.filter(
        Q(from_user=request.user, to_user_id=user_id) | Q(from_user_id=user_id, to_user=request.user),
        status=ACCEPTED,
    ).delete()
    return Response(status=204)
