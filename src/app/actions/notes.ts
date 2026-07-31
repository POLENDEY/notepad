"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sanitizeNoteHtml } from "@/lib/note-html";

function revalidateNotes() {
  revalidatePath("/notes");
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export type NoteAutosavePatch = {
  title: string;
  body: string;
};

export async function createNote(title: string, body: string): Promise<string> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("notepad_notes")
    .insert({
      user_id: user.id,
      title: title.trim() || "Untitled",
      body: sanitizeNoteHtml(body),
      color: "#fef9c3",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidateNotes();
  return data.id as string;
}

/** Debounced client saves — no revalidate so typing stays smooth. */
export async function autosaveNote(id: string, patch: NoteAutosavePatch) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("notepad_notes")
    .update({
      title: patch.title.trim() || "Untitled",
      body: sanitizeNoteHtml(patch.body),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);
}

export async function deleteNote(id: string) {
  await deleteNotes([id]);
}

export async function deleteNotes(ids: string[]) {
  if (ids.length === 0) return;
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("notepad_notes")
    .delete()
    .in("id", ids)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateNotes();
}

/** Soft-archive (sets deleted_at). */
export async function archiveNotes(ids: string[]) {
  if (ids.length === 0) return;
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("notepad_notes")
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .in("id", ids)
    .eq("user_id", user.id)
    .is("deleted_at", null);
  if (error) throw new Error(error.message);
  revalidateNotes();
}

export async function restoreNotes(ids: string[]) {
  if (ids.length === 0) return;
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("notepad_notes")
    .update({
      deleted_at: null,
      updated_at: new Date().toISOString(),
    })
    .in("id", ids)
    .eq("user_id", user.id)
    .not("deleted_at", "is", null);
  if (error) throw new Error(error.message);
  revalidateNotes();
}
