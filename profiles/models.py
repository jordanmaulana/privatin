from django.contrib.auth.models import User
from django.db import models

from core.models import BaseModel


class UserProfile(BaseModel):
    """The teacher account. Holds profile + Mayar SaaS subscription state."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    full_name = models.CharField(max_length=255, blank=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    # Mayar subscription (teacher paying for this service, not student payments)
    subscription_status = models.CharField(max_length=20, default="trial")  # trial|active|expired
    subscription_until = models.DateTimeField(null=True, blank=True)

    class Meta:
        app_label = "profiles"

    def __str__(self):
        return self.full_name or self.user.email
