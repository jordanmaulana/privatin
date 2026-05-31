export interface Enrollment {
  id: string;
  student: string;
  student_name: string;
  lesson_class: string;
  lesson_class_name: string;
  monthly_target_sessions: number | null;
  monthly_price: number | null;
  active: boolean;
  target_sessions: number;
  price: number;
}

export interface EnrollmentInput {
  student: string;
  lesson_class: string;
  monthly_target_sessions: number | null;
  monthly_price: number | null;
  active: boolean;
}
