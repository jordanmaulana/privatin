"""The two questions the teacher asks every month."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.v1._common import parse_period
from api.v1.serializers_domain import (
    IncompleteEnrollmentSerializer,
    MonthlyPaymentSerializer,
)
from classes.queries import incomplete_schedule_this_month, unpaid_this_month


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def unpaid(request):
    """Who hasn't paid this month? (defaults to current Jakarta month)."""
    period = parse_period(request)
    rows = unpaid_this_month(request.user, period)
    return Response(MonthlyPaymentSerializer(rows, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def incomplete(request):
    """Who hasn't completed their sessions this month?"""
    period = parse_period(request)
    rows = incomplete_schedule_this_month(request.user, period)
    return Response(IncompleteEnrollmentSerializer(rows, many=True).data)
