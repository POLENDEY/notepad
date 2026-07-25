import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { toPlainNoteBody } from "@/lib/note-plain-text";
import type { Note } from "@/lib/types";

function asPlainNote(note: Note): Note {
  return { ...note, body: toPlainNoteBody(note.body) };
}

const NOTE_COLUMNS =
  "id,user_id,title,body,color,is_pinned,deleted_at,created_at,updated_at" as const;
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
  return ((data ?? []) as Note[]).map(asPlainNote);
});

export const getArchivedNotes = cache(async () => {
  const user = await getSessionUser();
  if (!user) return [] as Note[];
  const supabase = await createClient();
  const { data } = await supabase
    .from("notepad_notes")
    .select(NOTE_COLUMNS)
    .eq("user_id", user.id)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
  return ((data ?? []) as Note[]).map(asPlainNote);
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
  return data ? asPlainNote(data as Note) : null;
});
