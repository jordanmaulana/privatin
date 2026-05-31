import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getProfile, updateProfile } from "@/features/profile/api";

export const profileKeys = { all: ["profile"] as const };

export function useProfile() {
  return useQuery({ queryKey: profileKeys.all, queryFn: getProfile });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}
