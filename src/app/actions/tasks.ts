"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TaskPriority, TaskStatus } from "@/lib/types";

export async function createTask(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const description = String(formData.get("description") ?? "");
  const priority = (formData.get("priority") as TaskPriority) || "medium";
  const dueRaw = String(formData.get("dueDate") ?? "");
  const due_date = dueRaw || null;

  await supabase.from("notepad_tasks").insert({
    user_id: user.id,
    title,
    description,
    priority,
    due_date,
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await supabase
    .from("notepad_tasks")
    .update({ status })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function deleteTask(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await supabase
    .from("notepad_tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}
