from rest_framework import serializers

from .models import AvatarItem, AvatarProfile, UserItem
from .services import xp_needed


class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = AvatarItem
        fields = ['id', 'name', 'slot', 'required_level', 'image']


class AvatarSerializer(serializers.ModelSerializer):
    xp_needed = serializers.SerializerMethodField()
    equipped = serializers.SerializerMethodField()

    class Meta:
        model = AvatarProfile
        fields = ['level', 'xp', 'xp_needed', 'vida', 'alimento', 'carino', 'equipped']

    def get_xp_needed(self, obj):
        return xp_needed(obj.level)

    def get_equipped(self, obj):
        owned = UserItem.objects.filter(user=obj.user, equipped=True).select_related('item')
        return ItemSerializer([o.item for o in owned], many=True).data


class RewardSerializer(serializers.Serializer):
    # Topes para que el cliente no se regale XP infinita
    vida = serializers.IntegerField(required=False, default=0, min_value=-100, max_value=100)
    alimento = serializers.IntegerField(required=False, default=0, min_value=-100, max_value=100)
    carino = serializers.IntegerField(required=False, default=0, min_value=-100, max_value=100)
    xp = serializers.IntegerField(required=False, default=0, min_value=0, max_value=50)