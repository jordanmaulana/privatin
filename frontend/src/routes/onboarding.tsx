import { createFileRoute } from "@tanstack/react-router";

import { OnboardingForm } from "@/features/profile/components/onboarding-form";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingForm,
});
