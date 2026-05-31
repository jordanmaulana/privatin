"""Owner-scoped ViewSets for the teacher-facing CRUD resources.

Every queryset is narrowed to `request.user`, so another teacher's row reads as
404 (never 403 — existence is not revealed). `owner` is forced server-side on
create; clients cannot set it. SessionLog list supports `?enrollment=` and
`?period=` filters. MonthlyPayment is read-only CRUD: the ledger is materialized
by `ensure_month_payments`, and paid state is toggled via custom actions.
"""

from datetime import timedelta

from django.db import IntegrityError
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from api.v1._common import parse_period
from api.v1.serializers_domain import (
    ClassSerializer,
    EnrollmentSerializer,
    MonthlyPaymentSerializer,
    SessionLogSerializer,
    StudentSerializer,
)
from classes.models import Class, Enrollment, MonthlyPayment, SessionLog
from classes.queries import ensure_month_payments
from students.models import Student


class OwnerScopedModelViewSet(viewsets.ModelViewSet):
    """Base: scope reads to the owner and force the owner on writes."""

    def get_queryset(self):
        return self.queryset.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class StudentViewSet(OwnerScopedModelViewSet):
    serializer_class = StudentSerializer
    queryset = Student.objects.all()


class ClassViewSet(OwnerScopedModelViewSet):
    serializer_class = ClassSerializer
    queryset = Class.objects.all()


class EnrollmentViewSet(OwnerScopedModelViewSet):
    serializer_class = EnrollmentSerializer
    queryset = Enrollment.objects.select_related("student", "lesson_class")

    def perform_create(self, serializer):
        try:
            serializer.save(owner=self.request.user)
        except IntegrityError as exc:
            raise ValidationError({"detail": "Student already enrolled in this class."}) from exc


class SessionLogViewSet(OwnerScopedModelViewSet):
    serializer_class = SessionLogSerializer
    queryset = SessionLog.objects.select_related("enrollment__student", "enrollment__lesson_class")
    # No update: a held lesson is created or removed, not edited.
    http_method_names = ["get", "post", "delete"]

    def get_queryset(self):
        qs = super().get_queryset()
        enrollment = self.request.query_params.get("enrollment")
        if enrollment:
            qs = qs.filter(enrollment_id=enrollment)
        period = self.request.query_params.get("period") or self.request.query_params.get("month")
        if period:
            start = parse_period(self.request)
            next_month = (start.replace(day=28) + timedelta(days=4)).replace(day=1)
            qs = qs.filter(held_on__gte=start, held_on__lt=next_month)
        return qs.order_by("-held_on")


class MonthlyPaymentViewSet(OwnerScopedModelViewSet):
    """Read-only ledger + mark-paid/unpaid actions (no client-side create/edit)."""

    serializer_class = MonthlyPaymentSerializer
    queryset = MonthlyPayment.objects.select_related(
        "enrollment__student", "enrollment__lesson_class"
    )
    http_method_names = ["get", "post"]

    def list(self, request, *args, **kwargs):
        period = parse_period(request)
        ensure_month_payments(request.user, period)
        qs = self.get_queryset().filter(period=period).order_by("enrollment__student__name")
        return Response(self.get_serializer(qs, many=True).data)

    @action(detail=True, methods=["post"], url_path="mark-paid")
    def mark_paid(self, request, pk=None):
        payment = self.get_object()
        payment.is_paid = True
        payment.paid_on = timezone.now()
        payment.save(update_fields=["is_paid", "paid_on", "updated_on"])
        return Response(self.get_serializer(payment).data)

    @action(detail=True, methods=["post"], url_path="mark-unpaid")
    def mark_unpaid(self, request, pk=None):
        payment = self.get_object()
        payment.is_paid = False
        payment.paid_on = None
        payment.save(update_fields=["is_paid", "paid_on", "updated_on"])
        return Response(self.get_serializer(payment).data)
