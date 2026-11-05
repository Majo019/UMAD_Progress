from django.db import transaction

from .models import AvatarItem, AvatarProfile, UserItem

STAT_MIN, STAT_MAX = 0, 100


def xp_needed(level):
    """XP necesaria para pasar del nivel `level` al siguiente."""
    return 100 + (level - 1) * 50


def _clamp(value):
    return max(STAT_MIN, min(STAT_MAX, value))


def unlock_items(user, level):
    for item in AvatarItem.objects.filter(required_level__lte=level):
        UserItem.objects.get_or_create(user=user, item=item)


def get_profile(user):
    profile, created = AvatarProfile.objects.get_or_create(user=user)
    if created:
        unlock_items(user, profile.level)
    return profile


@transaction.atomic
def apply_reward(user, vida=0, alimento=0, carino=0, xp=0):
    get_profile(user)
    profile = AvatarProfile.objects.select_for_update().get(user=user)

    profile.vida = _clamp(profile.vida + vida)
    profile.alimento = _clamp(profile.alimento + alimento)
    profile.carino = _clamp(profile.carino + carino)

    leveled_up = False
    profile.xp += max(xp, 0)
    while profile.xp >= xp_needed(profile.level):
        profile.xp -= xp_needed(profile.level)
        profile.level += 1
        leveled_up = True
    profile.save()

    if leveled_up:
        unlock_items(user, profile.level)
    return profile, leveled_up


@transaction.atomic
def equip_item(user, item_id):
    """Equipa un item (solo uno por slot). Lanza UserItem.DoesNotExist si no lo tiene."""
    owned = UserItem.objects.select_related('item').get(user=user, item_id=item_id)
    UserItem.objects.filter(user=user, item__slot=owned.item.slot).update(equipped=False)
    owned.equipped = True
    owned.save()
    return owned