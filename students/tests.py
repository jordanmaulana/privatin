"""N+1 regression test for the student list endpoint.

Reuses the scale-invariance helpers from classes.tests. StudentViewSet intentionally does
NOT select_related("owner") — owner is filtered, never serialized — so the list must stay
flat anyway. This documents and guards that.
"""

from django.test import TestCase

from classes.tests import ApiQueryTestMixin


class StudentListNoNPlusOneTests(ApiQueryTestMixin, TestCase):
    def test_students_list_is_flat(self):
        self.assert_flat_queries(
            lambda owner, client: self.assertEqual(client.get("/api/v1/students/").status_code, 200)
        )
