import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { me } from "@/features/auth/api";
import { userAtom } from "@/features/auth/state";
import { useProfile, useUpdateProfile } from "@/features/profile/hooks";
import type { Profile } from "@/features/profile/types";

export function OnboardingForm() {
  const { data: profile, isLoading } = useProfile();

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Lengkapi profil</CardTitle>
          <CardDescription>
            Beri tahu kami nama Anda untuk mulai menggunakan Privatin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-28" />
            </div>
          ) : (
            <ProfileFields profile={profile} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileFields({ profile }: { profile?: Profile }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const setUser = useSetAtom(userAtom);
  const update = useUpdateProfile();

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone_number ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Nama lengkap wajib diisi");
      return;
    }
    update.mutate(
      { full_name: fullName.trim(), phone_number: phone.trim() },
      {
        onSuccess: async () => {
          // AuthGate reads userAtom.onboarded, which only auto-refreshes when
          // there is no user. Refetch me() and push the fresh flag so the gate
          // lets us into /dashboard instead of bouncing back here.
          const fresh = await me();
          setUser(fresh);
          await qc.invalidateQueries({ queryKey: ["auth", "me"] });
          navigate({ to: "/dashboard" });
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Gagal menyimpan"),
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="full_name">Nama lengkap</Label>
        <Input
          id="full_name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nama Anda"
          autoFocus
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone_number">Nomor HP</Label>
        <Input
          id="phone_number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="08xxxxxxxxxx"
        />
      </div>
      <Button type="submit" disabled={update.isPending} className="mt-2">
        {update.isPending ? "Menyimpan…" : "Simpan & lanjut"}
      </Button>
    </form>
  );
}
