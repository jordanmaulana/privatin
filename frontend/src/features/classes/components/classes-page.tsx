import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog";
import { useClasses, useDeleteClass } from "@/features/classes/hooks";
import type { LessonClass } from "@/features/classes/types";
import { ClassFormDialog } from "./class-form-dialog";
import { ClassTable } from "./class-table";

export function ClassesPage() {
  const { data: classes, isLoading, error } = useClasses();
  const del = useDeleteClass();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LessonClass | null>(null);
  const [deleting, setDeleting] = useState<LessonClass | null>(null);

  useEffect(() => {
    if (error) toast.error(error instanceof Error ? error.message : "Gagal memuat");
  }, [error]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(lessonClass: LessonClass) {
    setEditing(lessonClass);
    setFormOpen(true);
  }

  function confirmDelete() {
    if (!deleting) return;
    del.mutate(deleting.id, {
      onSuccess: () => {
        toast.success("Kelas dihapus");
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
          <h1 className="text-2xl font-semibold">Kelas</h1>
          <p className="text-sm text-muted-foreground">
            Jenis les beserta harga dan target sesi bulanan.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus />
          Tambah kelas
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
          ) : classes && classes.length > 0 ? (
            <ClassTable
              classes={classes}
              onEdit={openEdit}
              onDelete={setDeleting}
            />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Belum ada kelas. Klik “Tambah kelas” untuk mulai.
            </p>
          )}
        </CardContent>
      </Card>

      <ClassFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
      />
      <DeleteConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Hapus kelas?"
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
