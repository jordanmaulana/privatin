"""Helpers for the two questions the teacher asks every month:

1. Who hasn't paid this month?
2. Who hasn't completed their schedule this month?
"""

from datetime import date, timedelta

from django.db.models import Count, Q

from classes.models import Enrollment, MonthlyPayment


def month_start(d: date) -> date:
    """Normalize any date to the first day of its month (the payment period key)."""
    return d.replace(day=1)


def ensure_month_payments(owner, period: date):
    """Lazily create a MonthlyPayment row for every active enrollment for `period`.

    Idempotent: existing rows are left untouched. Returns the queryset for the period.
    """
    period = month_start(period)
    existing = set(
        MonthlyPayment.objects.filter(owner=owner, period=period).values_list(
            "enrollment_id", flat=True
        )
    )
    to_create = []
    enrollments = Enrollment.objects.filter(owner=owner, active=True).select_related("lesson_class")
    for enr in enrollments:
        if enr.id in existing:
            continue
        to_create.append(
            MonthlyPayment(owner=owner, enrollment=enr, period=period, amount=enr.price)
        )
    if to_create:
        MonthlyPayment.objects.bulk_create(to_create)
    return MonthlyPayment.objects.filter(owner=owner, period=period)


def unpaid_this_month(owner, period: date):
    """MonthlyPayment rows still unpaid for `period` (rows ensured first)."""
    period = month_start(period)
    ensure_month_payments(owner, period)
    return (
        MonthlyPayment.objects.filter(owner=owner, period=period, is_paid=False)
        .select_related("enrollment__student", "enrollment__lesson_class")
        .order_by("enrollment__student__name")
    )


def incomplete_schedule_this_month(owner, period: date):
    """Active enrollments whose held sessions this month are below target.

    Returns Enrollment rows annotated with `held_count`.
    """
    period = month_start(period)
    next_month = (period.replace(day=28) + timedelta(days=4)).replace(day=1)
    enrollments = (
        Enrollment.objects.filter(owner=owner, active=True)
        .select_related("student", "lesson_class")
        .annotate(
            held_count=Count(
                "sessions",
                filter=Q(sessions__held_on__gte=period, sessions__held_on__lt=next_month),
            )
        )
    )
    # target falls back to the class default when the enrollment has no override;
    # filter in Python so the property logic stays in one place.
    return [
        e for e in enrollments if e.held_count < e.target_sessions
    ]
