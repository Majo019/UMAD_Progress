from django.contrib import admin

from .models import AdminProfile, UserProfile, WheelSnapshot


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'role', 'career', 'semester')
    list_filter = ('role',)
    search_fields = ('user__email', 'user__username', 'name')


@admin.register(AdminProfile)
class AdminProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'display_name', 'position', 'department')
    search_fields = ('user__email', 'display_name')


@admin.register(WheelSnapshot)
class WheelSnapshotAdmin(admin.ModelAdmin):
    list_display = ('user', 'kind', 'created_at')
    list_filter = ('kind',)
    search_fields = ('user__email', 'user__username')
