import { Pencil, Trash2 } from "lucide-react";

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
import type { LessonClass } from "@/features/classes/types";

interface ClassTableProps {
  classes: LessonClass[];
  onEdit: (lessonClass: LessonClass) => void;
  onDelete: (lessonClass: LessonClass) => void;
}

export function ClassTable({ classes, onEdit, onDelete }: ClassTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama</TableHead>
          <TableHead className="text-right">Harga / bulan</TableHead>
          <TableHead className="text-right">Sesi / bulan</TableHead>
          <TableHead className="w-24 text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {classes.map((c) => (
          <TableRow key={c.id}>
            <TableCell className="font-medium">{c.name}</TableCell>
            <TableCell className="text-right">{formatRupiah(c.price)}</TableCell>
            <TableCell className="text-right">
              {c.default_sessions_per_month}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onEdit(c)}
                  aria-label="Edit"
                >
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onDelete(c)}
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
