export interface LessonClass {
  id: string;
  name: string;
  price: number;
  default_sessions_per_month: number;
  created_on: string;
}

export interface ClassInput {
  name: string;
  price: number;
  default_sessions_per_month: number;
}
