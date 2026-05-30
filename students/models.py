from django.contrib.auth.models import User
from django.db import models

from core.models import BaseModel


class Student(BaseModel):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="students")
    name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=20, null=True, blank=True)

    class Meta:
        app_label = "students"

    def __str__(self):
        return self.name
