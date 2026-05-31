import { createFileRoute } from "@tanstack/react-router";

import { StudentsPage } from "@/features/students/components/students-page";

export const Route = createFileRoute("/students")({
  component: StudentsPage,
});
