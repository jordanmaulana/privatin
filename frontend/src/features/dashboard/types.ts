export interface MonthlyPayment {
  id: string;
  enrollment: string;
  student_name: string;
  lesson_class_name: string;
  period: string;
  amount: number;
  is_paid: boolean;
  paid_on: string | null;
}

export interface IncompleteRow {
  enrollment_id: string;
  student_name: string;
  lesson_class_name: string;
  held_count: number;
  target_sessions: number;
  price: number;
}
