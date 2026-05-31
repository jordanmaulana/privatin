import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createStudent,
  deleteStudent,
  listStudents,
  updateStudent,
} from "@/features/students/api";
import type { StudentInput } from "@/features/students/types";

export const studentKeys = { all: ["students"] as const };

export function useStudents() {
  return useQuery({ queryKey: studentKeys.all, queryFn: listStudents });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createStudent,
    onSuccess: () => qc.invalidateQueries({ queryKey: studentKeys.all }),
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: StudentInput }) =>
      updateStudent(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: studentKeys.all }),
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteStudent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentKeys.all });
      qc.invalidateQueries({ queryKey: ["enrollments"] });
    },
  });
}
