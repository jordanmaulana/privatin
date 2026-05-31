import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog";
import {
  useDeleteEnrollment,
  useEnrollments,
} from "@/features/enrollments/hooks";
import type { Enrollment } from "@/features/enrollments/types";
import { EnrollmentFormDialog } from "./enrollment-form-dialog";
import { EnrollmentTable } from "./enrollment-table";

export function EnrollmentsPage() {
  const { data: enrollments, isLoading, error } = useEnrollments();
  const del = useDeleteEnrollment();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Enrollment | null>(null);
  const [deleting, setDeleting] = useState<Enrollment | null>(null);

  useEffect(() => {
    if (error) toast.error(error instanceof Error ? error.message : "Gagal memuat");
  }, [error]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(enrollment: Enrollment) {
    setEditing(enrollment);
    setFormOpen(true);
  }

  function confirmDelete() {
    if (!deleting) return;
    del.mutate(deleting.id, {
      onSuccess: () => {
        toast.success("Pendaftaran dihapus");
        setDeleting(null);
      },
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Gagal menghapus"),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pendaftaran</h1>
          <p className="text-sm text-muted-foreground">
            Pasangan murid &amp; kelas, dengan target sesi dan harga.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus />
          Daftarkan murid
        </Button>
      </div>

      <Card>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : enrollments && enrollments.length > 0 ? (
            <EnrollmentTable
              enrollments={enrollments}
              onEdit={openEdit}
              onDelete={setDeleting}
            />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Belum ada pendaftaran. Tambahkan murid dan kelas dulu, lalu
              daftarkan di sini.
            </p>
          )}
        </CardContent>
      </Card>

      <EnrollmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
      />
      <DeleteConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Hapus pendaftaran?"
        description={
          deleting
            ? `${deleting.student_name} — ${deleting.lesson_class_name} akan dihapus.`
            : undefined
        }
        onConfirm={confirmDelete}
        pending={del.isPending}
      />
    </div>
  );
}
