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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClasses } from "@/features/classes/hooks";
import { useStudents } from "@/features/students/hooks";
import {
  useCreateEnrollment,
  useUpdateEnrollment,
} from "@/features/enrollments/hooks";
import type { Enrollment } from "@/features/enrollments/types";

interface EnrollmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Enrollment | null;
}

export function EnrollmentFormDialog({
  open,
  onOpenChange,
  initial,
}: EnrollmentFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit pendaftaran" : "Daftarkan murid"}
          </DialogTitle>
        </DialogHeader>
        {open && (
          <EnrollmentForm
            initial={initial}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function parseOptional(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

function EnrollmentForm({
  initial,
  onDone,
}: {
  initial?: Enrollment | null;
  onDone: () => void;
}) {
  const { data: students } = useStudents();
  const { data: classes } = useClasses();
  const create = useCreateEnrollment();
  const update = useUpdateEnrollment();
  const editing = !!initial;
  const pending = create.isPending || update.isPending;

  const [student, setStudent] = useState(initial?.student ?? "");
  const [lessonClass, setLessonClass] = useState(initial?.lesson_class ?? "");
  const [targetSessions, setTargetSessions] = useState(
    initial?.monthly_target_sessions != null
      ? String(initial.monthly_target_sessions)
      : "",
  );
  const [price, setPrice] = useState(
    initial?.monthly_price != null ? String(initial.monthly_price) : "",
  );
  const [active, setActive] = useState(initial?.active ?? true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!student || !lessonClass) {
      toast.error("Pilih murid dan kelas");
      return;
    }
    const input = {
      student,
      lesson_class: lessonClass,
      monthly_target_sessions: parseOptional(targetSessions),
      monthly_price: parseOptional(price),
      active,
    };
    const onSuccess = () => {
      toast.success(editing ? "Pendaftaran diperbarui" : "Murid didaftarkan");
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
        <Label>Murid</Label>
        <Select value={student} onValueChange={setStudent} disabled={editing}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih murid" />
          </SelectTrigger>
          <SelectContent>
            {students?.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Kelas</Label>
        <Select
          value={lessonClass}
          onValueChange={setLessonClass}
          disabled={editing}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih kelas" />
          </SelectTrigger>
          <SelectContent>
            {classes?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="enroll-target">
          Target sesi / bulan{" "}
          <span className="text-muted-foreground">(opsional)</span>
        </Label>
        <Input
          id="enroll-target"
          type="number"
          min={1}
          value={targetSessions}
          onChange={(e) => setTargetSessions(e.target.value)}
          placeholder="Ikuti default kelas"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="enroll-price">
          Harga / bulan{" "}
          <span className="text-muted-foreground">(opsional)</span>
        </Label>
        <Input
          id="enroll-price"
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Ikuti default kelas"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="size-4 rounded border-input"
        />
        Aktif
      </label>

      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan"}
        </Button>
      </DialogFooter>
    </form>
  );
}
