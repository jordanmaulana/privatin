from django.contrib import admin

from students.models import Student


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ("name", "phone_number", "owner")
    search_fields = ("name", "phone_number")
    list_filter = ("owner",)
