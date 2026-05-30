from django.contrib import admin

from profiles.models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "full_name", "subscription_status", "subscription_until")
    list_filter = ("subscription_status",)
    search_fields = ("user__email", "full_name", "phone_number")
