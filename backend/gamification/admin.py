from django.contrib import admin

# Register your models here.



from django.contrib import admin

from .models import AvatarItem, AvatarProfile, UserItem

admin.site.register(AvatarProfile)
admin.site.register(AvatarItem)
admin.site.register(UserItem)