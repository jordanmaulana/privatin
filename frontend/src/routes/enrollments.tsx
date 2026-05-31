import { createFileRoute } from "@tanstack/react-router";

import { EnrollmentsPage } from "@/features/enrollments/components/enrollments-page";

export const Route = createFileRoute("/enrollments")({
  component: EnrollmentsPage,
});
