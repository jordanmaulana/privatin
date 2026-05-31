import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createClass,
  deleteClass,
  listClasses,
  updateClass,
} from "@/features/classes/api";
import type { ClassInput } from "@/features/classes/types";

export const classKeys = { all: ["classes"] as const };

export function useClasses() {
  return useQuery({ queryKey: classKeys.all, queryFn: listClasses });
}

export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createClass,
    onSuccess: () => qc.invalidateQueries({ queryKey: classKeys.all }),
  });
}

export function useUpdateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ClassInput }) =>
      updateClass(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: classKeys.all }),
  });
}

export function useDeleteClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteClass,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: classKeys.all });
      qc.invalidateQueries({ queryKey: ["enrollments"] });
    },
  });
}
