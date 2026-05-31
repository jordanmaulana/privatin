from django.urls import path
from rest_framework.routers import DefaultRouter

from api.v1 import auth_api, dashboard_api, payments_api, profile_api
from api.v1.viewsets import (
    ClassViewSet,
    EnrollmentViewSet,
    MonthlyPaymentViewSet,
    SessionLogViewSet,
    StudentViewSet,
)

router = DefaultRouter()
router.register("students", StudentViewSet, basename="student")
router.register("classes", ClassViewSet, basename="class")
router.register("enrollments", EnrollmentViewSet, basename="enrollment")
router.register("sessions", SessionLogViewSet, basename="session")
router.register("payments", MonthlyPaymentViewSet, basename="payment")

urlpatterns = [
    # Flat routes first so literal segments win over router detail lookups.
    path("auth/google/", auth_api.google, name="api-v1-auth-google"),
    path("auth/logout/", auth_api.logout, name="api-v1-logout"),
    path("auth/me/", auth_api.me, name="api-v1-me"),
    path("payments/mayar/webhook/", payments_api.webhook, name="api-v1-mayar-webhook"),
    path("profile/", profile_api.profile, name="api-v1-profile"),
    path("dashboard/unpaid/", dashboard_api.unpaid, name="api-v1-dashboard-unpaid"),
    path("dashboard/incomplete/", dashboard_api.incomplete, name="api-v1-dashboard-incomplete"),
]

urlpatterns += router.urls
