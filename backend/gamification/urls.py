from django.urls import path

from .views import AvatarView, EquipView, ItemListView, RewardView

urlpatterns = [
    path('', AvatarView.as_view()),
    path('reward/', RewardView.as_view()),
    path('items/', ItemListView.as_view()),
    path('equip/', EquipView.as_view()),
]