import { api } from "@/lib/api";
import type {
  IncompleteRow,
  MonthlyPayment,
} from "@/features/dashboard/types";

export function getUnpaid(period: string): Promise<MonthlyPayment[]> {
  return api<MonthlyPayment[]>(`/dashboard/unpaid/?period=${period}`);
}

export function getIncomplete(period: string): Promise<IncompleteRow[]> {
  return api<IncompleteRow[]>(`/dashboard/incomplete/?period=${period}`);
}

export function markPaid(id: string): Promise<MonthlyPayment> {
  return api<MonthlyPayment>(`/payments/${id}/mark-paid/`, { method: "POST" });
}

export function markUnpaid(id: string): Promise<MonthlyPayment> {
  return api<MonthlyPayment>(`/payments/${id}/mark-unpaid/`, {
    method: "POST",
  });
}

/** Current month as YYYY-MM in Asia/Jakarta (avoids UTC boundary drift). */
export function currentJakartaPeriod(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((p) => p.type === "year")?.value ?? "1970";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  return `${year}-${month}`;
}

/** Last `count` months (incl. current) as { value: "YYYY-MM", label } in Jakarta. */
export function recentPeriods(count = 12): { value: string; label: string }[] {
  const current = currentJakartaPeriod();
  const [y, m] = current.split("-").map(Number);
  const names = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  const out: { value: string; label: string }[] = [];
  for (let i = 0; i < count; i++) {
    // monthIndex is 0-based; m is 1-based.
    const monthIndex = m - 1 - i;
    const date = new Date(Date.UTC(y, monthIndex, 1));
    const yy = date.getUTCFullYear();
    const mm = date.getUTCMonth();
    out.push({
      value: `${yy}-${String(mm + 1).padStart(2, "0")}`,
      label: `${names[mm]} ${yy}`,
    });
  }
  return out;
}
