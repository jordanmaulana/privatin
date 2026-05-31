import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createEnrollment,
  deleteEnrollment,
  listEnrollments,
  updateEnrollment,
} from "@/features/enrollments/api";
import type { EnrollmentInput } from "@/features/enrollments/types";

export const enrollmentKeys = { all: ["enrollments"] as const };

export function useEnrollments() {
  return useQuery({ queryKey: enrollmentKeys.all, queryFn: listEnrollments });
}

export function useCreateEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createEnrollment,
    onSuccess: () => qc.invalidateQueries({ queryKey: enrollmentKeys.all }),
  });
}

export function useUpdateEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EnrollmentInput }) =>
      updateEnrollment(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: enrollmentKeys.all }),
  });
}

export function useDeleteEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteEnrollment,
    onSuccess: () => qc.invalidateQueries({ queryKey: enrollmentKeys.all }),
  });
}
