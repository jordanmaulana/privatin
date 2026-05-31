import { api } from "@/lib/api";
import type { Student, StudentInput } from "@/features/students/types";

export function listStudents(): Promise<Student[]> {
  return api<Student[]>("/students/");
}

export function createStudent(input: StudentInput): Promise<Student> {
  return api<Student>("/students/", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateStudent(
  id: string,
  input: StudentInput,
): Promise<Student> {
  return api<Student>(`/students/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteStudent(id: string): Promise<void> {
  return api<void>(`/students/${id}/`, { method: "DELETE" });
}
