import { Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRupiah } from "@/lib/format";
import type { Enrollment } from "@/features/enrollments/types";

interface EnrollmentTableProps {
  enrollments: Enrollment[];
  onEdit: (enrollment: Enrollment) => void;
  onDelete: (enrollment: Enrollment) => void;
}

export function EnrollmentTable({
  enrollments,
  onEdit,
  onDelete,
}: EnrollmentTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Murid</TableHead>
          <TableHead>Kelas</TableHead>
          <TableHead className="text-right">Target sesi</TableHead>
          <TableHead className="text-right">Harga</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-24 text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {enrollments.map((e) => (
          <TableRow key={e.id}>
            <TableCell className="font-medium">{e.student_name}</TableCell>
            <TableCell>{e.lesson_class_name}</TableCell>
            <TableCell className="text-right">{e.target_sessions}</TableCell>
            <TableCell className="text-right">{formatRupiah(e.price)}</TableCell>
            <TableCell>
              <Badge variant={e.active ? "default" : "secondary"}>
                {e.active ? "Aktif" : "Nonaktif"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onEdit(e)}
                  aria-label="Edit"
                >
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onDelete(e)}
                  aria-label="Hapus"
                >
                  <Trash2 />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
