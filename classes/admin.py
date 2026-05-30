from django.contrib import admin

from classes.models import Class, Enrollment, MonthlyPayment, SessionLog


@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    list_display = ("name", "price", "default_sessions_per_month", "owner")
    search_fields = ("name",)
    list_filter = ("owner",)


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ("student", "lesson_class", "target_sessions", "price", "active", "owner")
    list_filter = ("owner", "active", "lesson_class")
    search_fields = ("student__name", "lesson_class__name")
    autocomplete_fields = ("student", "lesson_class")


@admin.register(MonthlyPayment)
class MonthlyPaymentAdmin(admin.ModelAdmin):
    list_display = ("enrollment", "period", "amount", "is_paid", "paid_on", "owner")
    list_filter = ("owner", "is_paid", "period")
    search_fields = ("enrollment__student__name",)
    date_hierarchy = "period"


@admin.register(SessionLog)
class SessionLogAdmin(admin.ModelAdmin):
    list_display = ("enrollment", "held_on", "owner")
    list_filter = ("owner",)
    search_fields = ("enrollment__student__name",)
    date_hierarchy = "held_on"
