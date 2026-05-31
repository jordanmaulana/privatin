import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRupiah } from "@/lib/format";
import { currentJakartaPeriod, recentPeriods } from "@/features/dashboard/api";
import {
  useIncomplete,
  useMarkPaid,
  useUnpaid,
} from "@/features/dashboard/hooks";

function LoadingRows() {
  return (
    <div className="flex flex-col gap-2">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  );
}

export function DashboardPage() {
  const [period, setPeriod] = useState(currentJakartaPeriod());
  const periods = useMemo(() => recentPeriods(12), []);

  const unpaid = useUnpaid(period);
  const incomplete = useIncomplete(period);
  const markPaid = useMarkPaid();

  function handleMarkPaid(id: string) {
    markPaid.mutate(id, {
      onSuccess: () => toast.success("Ditandai lunas"),
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Gagal"),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Siapa yang belum bayar dan belum lengkap sesi bulan ini.
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periods.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Belum bayar bulan ini</CardTitle>
          <CardDescription>
            {unpaid.data ? `${unpaid.data.length} tagihan belum lunas` : "—"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {unpaid.isLoading ? (
            <LoadingRows />
          ) : unpaid.data && unpaid.data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Murid</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="w-28 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unpaid.data.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {p.student_name}
                    </TableCell>
                    <TableCell>{p.lesson_class_name}</TableCell>
                    <TableCell className="text-right">
                      {formatRupiah(p.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkPaid(p.id)}
                        disabled={markPaid.isPending}
                      >
                        <Check />
                        Lunas
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Semua sudah bayar. 🎉
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Belum lengkap sesi</CardTitle>
          <CardDescription>
            {incomplete.data
              ? `${incomplete.data.length} pendaftaran belum mencapai target`
              : "—"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {incomplete.isLoading ? (
            <LoadingRows />
          ) : incomplete.data && incomplete.data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Murid</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead className="text-right">Sesi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomplete.data.map((r) => (
                  <TableRow key={r.enrollment_id}>
                    <TableCell className="font-medium">
                      {r.student_name}
                    </TableCell>
                    <TableCell>{r.lesson_class_name}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.held_count} / {r.target_sessions}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Semua sesi sudah lengkap. 🎉
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
