import { api } from "@/lib/api";
import type { Enrollment, EnrollmentInput } from "@/features/enrollments/types";

export function listEnrollments(): Promise<Enrollment[]> {
  return api<Enrollment[]>("/enrollments/");
}

export function createEnrollment(input: EnrollmentInput): Promise<Enrollment> {
  return api<Enrollment>("/enrollments/", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateEnrollment(
  id: string,
  input: EnrollmentInput,
): Promise<Enrollment> {
  return api<Enrollment>(`/enrollments/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteEnrollment(id: string): Promise<void> {
  return api<void>(`/enrollments/${id}/`, { method: "DELETE" });
}
