import { useState } from "react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateStudent, useUpdateStudent } from "@/features/students/hooks";
import type { Student } from "@/features/students/types";

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Student | null;
}

export function StudentFormDialog({
  open,
  onOpenChange,
  initial,
}: StudentFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit murid" : "Tambah murid"}</DialogTitle>
        </DialogHeader>
        {open && (
          <StudentForm initial={initial} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function StudentForm({
  initial,
  onDone,
}: {
  initial?: Student | null;
  onDone: () => void;
}) {
  const create = useCreateStudent();
  const update = useUpdateStudent();
  const editing = !!initial;
  const pending = create.isPending || update.isPending;

  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone_number ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama wajib diisi");
      return;
    }
    const input = { name: name.trim(), phone_number: phone.trim() };
    const onSuccess = () => {
      toast.success(editing ? "Murid diperbarui" : "Murid ditambahkan");
      onDone();
    };
    const onError = (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");

    if (editing && initial) {
      update.mutate({ id: initial.id, input }, { onSuccess, onError });
    } else {
      create.mutate(input, { onSuccess, onError });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="student-name">Nama</Label>
        <Input
          id="student-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="student-phone">Nomor HP</Label>
        <Input
          id="student-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="08xxxxxxxxxx"
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan"}
        </Button>
      </DialogFooter>
    </form>
  );
}
