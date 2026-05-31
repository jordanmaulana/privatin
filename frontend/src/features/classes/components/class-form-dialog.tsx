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
import { useCreateClass, useUpdateClass } from "@/features/classes/hooks";
import type { LessonClass } from "@/features/classes/types";

interface ClassFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: LessonClass | null;
}

export function ClassFormDialog({
  open,
  onOpenChange,
  initial,
}: ClassFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit kelas" : "Tambah kelas"}</DialogTitle>
        </DialogHeader>
        {open && (
          <ClassForm initial={initial} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ClassForm({
  initial,
  onDone,
}: {
  initial?: LessonClass | null;
  onDone: () => void;
}) {
  const create = useCreateClass();
  const update = useUpdateClass();
  const editing = !!initial;
  const pending = create.isPending || update.isPending;

  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [sessions, setSessions] = useState(
    initial ? String(initial.default_sessions_per_month) : "",
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama kelas wajib diisi");
      return;
    }
    const priceNum = Number(price);
    const sessionsNum = Number(sessions);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      toast.error("Harga tidak valid");
      return;
    }
    if (!Number.isInteger(sessionsNum) || sessionsNum <= 0) {
      toast.error("Jumlah sesi tidak valid");
      return;
    }
    const input = {
      name: name.trim(),
      price: priceNum,
      default_sessions_per_month: sessionsNum,
    };
    const onSuccess = () => {
      toast.success(editing ? "Kelas diperbarui" : "Kelas ditambahkan");
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
        <Label htmlFor="class-name">Nama kelas</Label>
        <Input
          id="class-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="class-price">Harga / bulan (Rp)</Label>
        <Input
          id="class-price"
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="150000"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="class-sessions">Sesi / bulan</Label>
        <Input
          id="class-sessions"
          type="number"
          min={1}
          value={sessions}
          onChange={(e) => setSessions(e.target.value)}
          placeholder="8"
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
