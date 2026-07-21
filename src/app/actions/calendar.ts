"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createCalendarEvent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const title = String(formData.get("title") ?? "").trim();
  const startAt = String(formData.get("startAt") ?? "");
  if (!title || !startAt) return;

  const description = String(formData.get("description") ?? "");
  const endAt = String(formData.get("endAt") ?? "") || null;
  const allDay = formData.get("allDay") === "on";
  const color = String(formData.get("color") ?? "#6366f1");

  await supabase.from("notepad_calendar_events").insert({
    user_id: user.id,
    title,
    description,
    start_at: startAt,
    end_at: endAt,
    all_day: allDay,
    color,
  });

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}

export async function deleteCalendarEvent(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await supabase
    .from("notepad_calendar_events")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}
