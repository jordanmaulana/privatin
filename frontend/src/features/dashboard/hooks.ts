import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getIncomplete,
  getUnpaid,
  markPaid,
  markUnpaid,
} from "@/features/dashboard/api";

export function useUnpaid(period: string) {
  return useQuery({
    queryKey: ["dashboard", "unpaid", period],
    queryFn: () => getUnpaid(period),
  });
}

export function useIncomplete(period: string) {
  return useQuery({
    queryKey: ["dashboard", "incomplete", period],
    queryFn: () => getIncomplete(period),
  });
}

export function useMarkPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markPaid,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["dashboard", "unpaid"] }),
  });
}

export function useMarkUnpaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markUnpaid,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["dashboard", "unpaid"] }),
  });
}
