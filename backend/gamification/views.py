from django.shortcuts import render

# Create your views here.



from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AvatarItem, UserItem
from .serializers import AvatarSerializer, ItemSerializer, RewardSerializer
from .services import apply_reward, equip_item, get_profile


class AvatarView(APIView):
    def get(self, request):
        return Response(AvatarSerializer(get_profile(request.user)).data)


class RewardView(APIView):
    """Para recompensas de tareas, etc. (el Pomodoro aplica la suya en el servidor)."""
    def post(self, request):
        s = RewardSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        profile, leveled_up = apply_reward(request.user, **s.validated_data)
        data = AvatarSerializer(profile).data
        data['leveled_up'] = leveled_up
        return Response(data)


class ItemListView(APIView):
    def get(self, request):
        get_profile(request.user)
        owned = {u.item_id: u.equipped for u in UserItem.objects.filter(user=request.user)}
        data = []
        for item in AvatarItem.objects.order_by('required_level', 'id'):
            row = ItemSerializer(item).data
            row['owned'] = item.id in owned
            row['equipped'] = owned.get(item.id, False)
            data.append(row)
        return Response(data)


class EquipView(APIView):
    def post(self, request):
        try:
            equip_item(request.user, request.data.get('item_id'))
        except UserItem.DoesNotExist:
            return Response({'detail': 'Item no desbloqueado.'}, status=403)
        return Response(AvatarSerializer(get_profile(request.user)).data)