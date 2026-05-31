import { api } from "@/lib/api";
import type { ClassInput, LessonClass } from "@/features/classes/types";

export function listClasses(): Promise<LessonClass[]> {
  return api<LessonClass[]>("/classes/");
}

export function createClass(input: ClassInput): Promise<LessonClass> {
  return api<LessonClass>("/classes/", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateClass(
  id: string,
  input: ClassInput,
): Promise<LessonClass> {
  return api<LessonClass>(`/classes/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteClass(id: string): Promise<void> {
  return api<void>(`/classes/${id}/`, { method: "DELETE" });
}
