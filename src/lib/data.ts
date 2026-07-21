import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Note, NoteCategory } from "@/lib/types";

const NOTE_COLUMNS =
  "id,user_id,category_id,title,body,color,is_pinned,deleted_at,created_at,updated_at" as const;
const CATEGORY_COLUMNS =
  "id,user_id,name,color,sort_order,deleted_at,created_at,updated_at" as const;
const TASK_COLUMNS =
  "id,user_id,title,description,status,priority,due_date,created_at,updated_at" as const;
const EVENT_COLUMNS =
  "id,user_id,title,description,start_at,end_at,all_day,color,created_at,updated_at" as const;
const PROFILE_COLUMNS =
  "id,email,display_name,pin_set_at,created_at,updated_at" as const;

export const getSessionUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getProfile = cache(async () => {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("notepad_profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", user.id)
    .maybeSingle();
  return data;
});

export const getDashboardStats = cache(async () => {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createClient();

  const [notes, tasks, events] = await Promise.all([
    supabase
      .from("notepad_notes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("deleted_at", null),
    supabase
      .from("notepad_tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .neq("status", "done"),
    supabase
      .from("notepad_calendar_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("start_at", new Date().toISOString()),
  ]);

  return {
    notes: notes.count ?? 0,
    openTasks: tasks.count ?? 0,
    upcomingEvents: events.count ?? 0,
  };
});

export const getCategories = cache(async () => {
  const user = await getSessionUser();
  if (!user) return [] as NoteCategory[];
  const supabase = await createClient();
  const { data } = await supabase
    .from("notepad_categories")
    .select(CATEGORY_COLUMNS)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  return (data ?? []) as NoteCategory[];
});

export const getNotes = cache(async (limit?: number) => {
  const user = await getSessionUser();
  if (!user) return [] as Note[];
  const supabase = await createClient();
  let query = supabase
    .from("notepad_notes")
    .select(NOTE_COLUMNS)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data } = await query;
  return (data ?? []) as Note[];
});

export const getNoteById = cache(async (id: string) => {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("notepad_notes")
    .select(NOTE_COLUMNS)
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();
  return data as Note | null;
});

export const getTrashedNotes = cache(async () => {
  const user = await getSessionUser();
  if (!user) return [] as Note[];
  const supabase = await createClient();
  const { data } = await supabase
    .from("notepad_notes")
    .select(NOTE_COLUMNS)
    .eq("user_id", user.id)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
  return (data ?? []) as Note[];
});

export const getTrashedCategories = cache(async () => {
  const user = await getSessionUser();
  if (!user) return [] as NoteCategory[];
  const supabase = await createClient();
  const { data } = await supabase
    .from("notepad_categories")
    .select(CATEGORY_COLUMNS)
    .eq("user_id", user.id)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
  return (data ?? []) as NoteCategory[];
});

export const getTasks = cache(async () => {
  const user = await getSessionUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("notepad_tasks")
    .select(TASK_COLUMNS)
    .eq("user_id", user.id)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  return data ?? [];
});

export const getCalendarEvents = cache(async (from: string, to: string) => {
  const user = await getSessionUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("notepad_calendar_events")
    .select(EVENT_COLUMNS)
    .eq("user_id", user.id)
    .gte("start_at", from)
    .lte("start_at", to)
    .order("start_at", { ascending: true });
  return data ?? [];
});
