import { api } from "@/lib/api";
import type { Profile, ProfileUpdate } from "@/features/profile/types";

export function getProfile(): Promise<Profile> {
  return api<Profile>("/profile/");
}

export function updateProfile(body: ProfileUpdate): Promise<Profile> {
  return api<Profile>("/profile/", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
