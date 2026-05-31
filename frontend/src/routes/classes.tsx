import { createFileRoute } from "@tanstack/react-router";

import { ClassesPage } from "@/features/classes/components/classes-page";

export const Route = createFileRoute("/classes")({
  component: ClassesPage,
});
