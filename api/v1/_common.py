from datetime import date, datetime

from django.utils import timezone
from rest_framework.exceptions import ValidationError

from classes.queries import month_start


def parse_period(request) -> date:
    """Resolve the month period from `?period=` / `?month=` query params.

    Accepts `YYYY-MM` (also tolerates a full `YYYY-MM-DD`). Defaults to the
    current month in the project timezone (Asia/Jakarta via USE_TZ + TIME_ZONE).
    Always normalized to day-1. Raises a 400 on malformed input.
    """
    raw = request.query_params.get("period") or request.query_params.get("month")
    if not raw:
        return month_start(timezone.localdate())
    for fmt in ("%Y-%m", "%Y-%m-%d"):
        try:
            return month_start(datetime.strptime(raw, fmt).date())
        except ValueError:
            continue
    raise ValidationError({"detail": "Invalid period, expected YYYY-MM"})
