"""N+1 regression tests for the teacher-facing API.

These do NOT assert a hardcoded query count (brittle against unrelated auth/middleware
changes). Instead they use the **scale-invariance** check: run each read path against a
fixture of N rows, then against 2*N rows, and assert the query count is *identical*. A flat
count proves the path issues O(1) queries; a per-row query (a dropped select_related, a
count SerializerMethodField, a .count() inside a loop) makes the 2*N count grow and fails.
"""

from datetime import date

from django.contrib.auth.models import User
from django.db import connection
from django.test import TestCase
from django.test.utils import CaptureQueriesContext
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from classes.models import Class, Enrollment, MonthlyPayment, SessionLog
from classes.queries import ensure_month_payments, incomplete_schedule_this_month
from students.models import Student

PERIOD = date(2026, 5, 1)


class ApiQueryTestMixin:
    """Builds an authenticated teacher + a seed() factory, and a flat-count asserter."""

    def make_teacher(self, email):
        user = User.objects.create_user(username=email, email=email)
        token = Token.objects.create(user=user)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        return user, client

    def seed(self, owner, n, *, with_payments=False, with_sessions=False):
        """Create n students/classes/enrollments owned by `owner`.

        Half the enrollments carry per-pair overrides and half fall back to the class
        defaults, so the `target_sessions`/`price` property branches are both exercised.
        """
        for i in range(n):
            student = Student.objects.create(owner=owner, name=f"Student {i}")
            lesson_class = Class.objects.create(
                owner=owner, name=f"Class {i}", price=100000, default_sessions_per_month=4
            )
            override = i % 2 == 0
            enr = Enrollment.objects.create(
                owner=owner,
                student=student,
                lesson_class=lesson_class,
                monthly_target_sessions=8 if override else None,
                monthly_price=150000 if override else None,
            )
            if with_sessions:
                # One enrollment ends up below target, the next at/over — exercises the filter.
                held = 2 if i % 2 == 0 else 10
                SessionLog.objects.bulk_create(
                    SessionLog(owner=owner, enrollment=enr, held_on=date(2026, 5, 3 + j))
                    for j in range(held)
                )
            if with_payments:
                MonthlyPayment.objects.create(
                    owner=owner, enrollment=enr, period=PERIOD, amount=enr.price, is_paid=False
                )

    def assert_flat_queries(self, action, *, n=3, **seed_kwargs):
        """Assert `action(owner, client)` issues the same #queries at N and 2N rows.

        `action` receives (owner, client) and performs the read under test.
        """
        owner_a, client_a = self.make_teacher("a@example.com")
        self.seed(owner_a, n, **seed_kwargs)
        with CaptureQueriesContext(connection) as small:
            action(owner_a, client_a)

        owner_b, client_b = self.make_teacher("b@example.com")
        self.seed(owner_b, n * 2, **seed_kwargs)
        with CaptureQueriesContext(connection) as large:
            action(owner_b, client_b)

        self.assertEqual(
            len(small.captured_queries),
            len(large.captured_queries),
            msg=(
                f"Query count grew with row count ({len(small.captured_queries)} at {n} rows "
                f"vs {len(large.captured_queries)} at {n * 2}) — N+1 regression.\n\n"
                + "\n".join(q["sql"] for q in large.captured_queries)
            ),
        )


class EndpointNoNPlusOneTests(ApiQueryTestMixin, TestCase):
    def test_enrollments_list_is_flat(self):
        self.assert_flat_queries(
            lambda owner, client: self.assertEqual(
                client.get("/api/v1/enrollments/").status_code, 200
            )
        )

    def test_sessions_list_is_flat(self):
        self.assert_flat_queries(
            lambda owner, client: self.assertEqual(
                client.get("/api/v1/sessions/").status_code, 200
            ),
            with_sessions=True,
        )

    def test_payments_list_is_flat(self):
        # MonthlyPaymentViewSet.list materializes the ledger via ensure_month_payments.
        self.assert_flat_queries(
            lambda owner, client: self.assertEqual(
                client.get("/api/v1/payments/?period=2026-05").status_code, 200
            )
        )

    def test_dashboard_unpaid_is_flat(self):
        self.assert_flat_queries(
            lambda owner, client: self.assertEqual(
                client.get("/api/v1/dashboard/unpaid/?period=2026-05").status_code, 200
            )
        )

    def test_dashboard_incomplete_is_flat(self):
        self.assert_flat_queries(
            lambda owner, client: self.assertEqual(
                client.get("/api/v1/dashboard/incomplete/?period=2026-05").status_code, 200
            ),
            with_sessions=True,
        )


class QueryFunctionNoNPlusOneTests(ApiQueryTestMixin, TestCase):
    """Direct (no-HTTP) guards on the core domain logic in classes/queries.py."""

    def _count(self, owner, fn):
        with CaptureQueriesContext(connection) as ctx:
            fn(owner)
        return len(ctx.captured_queries)

    def _assert_flat(self, fn, *, with_sessions=False):
        owner_a = User.objects.create_user(username="qa", email="qa@example.com")
        self.seed(owner_a, 3, with_sessions=with_sessions)
        owner_b = User.objects.create_user(username="qb", email="qb@example.com")
        self.seed(owner_b, 6, with_sessions=with_sessions)
        self.assertEqual(self._count(owner_a, fn), self._count(owner_b, fn))

    def test_incomplete_schedule_is_flat(self):
        # Force evaluation of the returned list (the Python filter touches a property).
        self._assert_flat(
            lambda owner: list(incomplete_schedule_this_month(owner, PERIOD)),
            with_sessions=True,
        )

    def test_ensure_month_payments_is_flat(self):
        # `amount=enr.price` reads the lesson_class fallback for every active enrollment.
        self._assert_flat(lambda owner: ensure_month_payments(owner, PERIOD))
