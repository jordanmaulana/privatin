import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog";
import { useDeleteStudent, useStudents } from "@/features/students/hooks";
import type { Student } from "@/features/students/types";
import { StudentFormDialog } from "./student-form-dialog";
import { StudentTable } from "./student-table";

export function StudentsPage() {
  const { data: students, isLoading, error } = useStudents();
  const del = useDeleteStudent();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState<Student | null>(null);

  useEffect(() => {
    if (error) toast.error(error instanceof Error ? error.message : "Gagal memuat");
  }, [error]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(student: Student) {
    setEditing(student);
    setFormOpen(true);
  }

  function confirmDelete() {
    if (!deleting) return;
    del.mutate(deleting.id, {
      onSuccess: () => {
        toast.success("Murid dihapus");
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
          <h1 className="text-2xl font-semibold">Murid</h1>
          <p className="text-sm text-muted-foreground">Kelola daftar murid Anda.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus />
          Tambah murid
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
          ) : students && students.length > 0 ? (
            <StudentTable
              students={students}
              onEdit={openEdit}
              onDelete={setDeleting}
            />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Belum ada murid. Klik “Tambah murid” untuk mulai.
            </p>
          )}
        </CardContent>
      </Card>

      <StudentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
      />
      <DeleteConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Hapus murid?"
        description={
          deleting
            ? `${deleting.name} akan dihapus permanen beserta data terkait.`
            : undefined
        }
        onConfirm={confirmDelete}
        pending={del.isPending}
      />
    </div>
  );
}
