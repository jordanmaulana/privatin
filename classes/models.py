from django.contrib.auth.models import User
from django.db import models

from core.models import BaseModel


class Class(BaseModel):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="classes_owned")
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=0, default=0)
    default_sessions_per_month = models.PositiveIntegerField(default=4)
    students = models.ManyToManyField(
        "students.Student", through="Enrollment", related_name="classes"
    )

    class Meta:
        app_label = "classes"

    def __str__(self):
        return self.name


class Enrollment(BaseModel):
    """Links a student to a class. Holds per-pair monthly target + price overrides."""

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="enrollments")
    student = models.ForeignKey(
        "students.Student", on_delete=models.CASCADE, related_name="enrollments"
    )
    # 'class' is a reserved keyword, so the FK is named lesson_class.
    lesson_class = models.ForeignKey("Class", on_delete=models.CASCADE, related_name="enrollments")
    monthly_target_sessions = models.PositiveIntegerField(null=True, blank=True)
    monthly_price = models.DecimalField(max_digits=10, decimal_places=0, null=True, blank=True)
    active = models.BooleanField(default=True)

    class Meta:
        app_label = "classes"
        unique_together = [("student", "lesson_class")]

    @property
    def target_sessions(self) -> int:
        if self.monthly_target_sessions is not None:
            return self.monthly_target_sessions
        return self.lesson_class.default_sessions_per_month

    @property
    def price(self):
        return self.monthly_price if self.monthly_price is not None else self.lesson_class.price

    def __str__(self):
        return f"{self.student} @ {self.lesson_class}"


class MonthlyPayment(BaseModel):
    """One row per enrollment per month. Teacher marks paid/unpaid manually."""

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="payments")
    enrollment = models.ForeignKey("Enrollment", on_delete=models.CASCADE, related_name="payments")
    period = models.DateField()  # normalized to the first day of the month
    amount = models.DecimalField(max_digits=10, decimal_places=0, default=0)
    is_paid = models.BooleanField(default=False)
    paid_on = models.DateTimeField(null=True, blank=True)

    class Meta:
        app_label = "classes"
        unique_together = [("enrollment", "period")]
        indexes = [models.Index(fields=["owner", "period", "is_paid"])]

    def __str__(self):
        return f"{self.enrollment} {self.period:%Y-%m} {'paid' if self.is_paid else 'unpaid'}"


class SessionLog(BaseModel):
    """One row per lesson actually held. Completion = count vs enrollment target."""

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sessions")
    enrollment = models.ForeignKey("Enrollment", on_delete=models.CASCADE, related_name="sessions")
    held_on = models.DateField()
    note = models.TextField(null=True, blank=True)

    class Meta:
        app_label = "classes"
        indexes = [models.Index(fields=["owner", "held_on"])]

    def __str__(self):
        return f"{self.enrollment} {self.held_on:%Y-%m-%d}"
