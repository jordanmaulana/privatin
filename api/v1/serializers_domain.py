"""Domain serializers for the teacher-facing API.

Money fields use `coerce_to_string=False` so Rupiah amounts serialize as JSON
numbers (e.g. 150000), not strings. FK fields that reference owner-scoped rows
have their querysets narrowed to `request.user` in `__init__` so a reference to
another teacher's row fails lookup with a clean 400 (and never leaks existence).
"""

from rest_framework import serializers

from classes.models import Class, Enrollment, MonthlyPayment, SessionLog
from profiles.models import UserProfile
from students.models import Student


def _money(**kwargs):
    return serializers.DecimalField(
        max_digits=10, decimal_places=0, coerce_to_string=False, **kwargs
    )


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ["id", "name", "phone_number", "created_on"]
        read_only_fields = ["id", "created_on"]


class ClassSerializer(serializers.ModelSerializer):
    price = _money()

    class Meta:
        model = Class
        fields = ["id", "name", "price", "default_sessions_per_month", "created_on"]
        read_only_fields = ["id", "created_on"]


class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.name", read_only=True)
    lesson_class_name = serializers.CharField(source="lesson_class.name", read_only=True)
    monthly_price = _money(required=False, allow_null=True)
    # Resolved fallback properties (read-only).
    target_sessions = serializers.IntegerField(read_only=True)
    price = _money(read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            "id",
            "student",
            "student_name",
            "lesson_class",
            "lesson_class_name",
            "monthly_target_sessions",
            "monthly_price",
            "active",
            "target_sessions",
            "price",
        ]
        read_only_fields = ["id"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request is not None:
            self.fields["student"].queryset = Student.objects.filter(owner=request.user)
            self.fields["lesson_class"].queryset = Class.objects.filter(owner=request.user)


class SessionLogSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="enrollment.student.name", read_only=True)
    lesson_class_name = serializers.CharField(source="enrollment.lesson_class.name", read_only=True)

    class Meta:
        model = SessionLog
        fields = ["id", "enrollment", "student_name", "lesson_class_name", "held_on", "note"]
        read_only_fields = ["id"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request is not None:
            self.fields["enrollment"].queryset = Enrollment.objects.filter(owner=request.user)


class MonthlyPaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="enrollment.student.name", read_only=True)
    lesson_class_name = serializers.CharField(source="enrollment.lesson_class.name", read_only=True)
    amount = _money(read_only=True)

    class Meta:
        model = MonthlyPayment
        fields = [
            "id",
            "enrollment",
            "student_name",
            "lesson_class_name",
            "period",
            "amount",
            "is_paid",
            "paid_on",
        ]
        read_only_fields = fields


class IncompleteEnrollmentSerializer(serializers.Serializer):
    """Read-only shape for `incomplete_schedule_this_month` (annotated objects)."""

    enrollment_id = serializers.CharField(source="id", read_only=True)
    student_name = serializers.CharField(source="student.name", read_only=True)
    lesson_class_name = serializers.CharField(source="lesson_class.name", read_only=True)
    held_count = serializers.IntegerField(read_only=True)
    target_sessions = serializers.IntegerField(read_only=True)
    price = _money(read_only=True)


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            "id",
            "full_name",
            "phone_number",
            "subscription_status",
            "subscription_until",
        ]
        read_only_fields = ["id", "subscription_status", "subscription_until"]
