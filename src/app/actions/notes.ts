"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sanitizeNoteHtml } from "@/lib/note-html";
import { purgeExpiredTrashForCurrentUser } from "@/lib/trash";

function revalidateNotes() {
  revalidatePath("/notes");
  revalidatePath("/dashboard");
  revalidatePath("/trash");
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function purgeExpiredTrash() {
  await purgeExpiredTrashForCurrentUser();
  revalidateNotes();
}

export async function createNote(formData: FormData) {
  const { supabase, user } = await requireUser();

  const title = String(formData.get("title") ?? "Untitled").trim() || "Untitled";
  const body = sanitizeNoteHtml(String(formData.get("body") ?? ""));
  const color = String(formData.get("color") ?? "#fef9c3");
  const mode = String(formData.get("saveMode") ?? "quick");
  let category_id: string | null = null;

  if (mode === "category") {
    const existingId = String(formData.get("categoryId") ?? "").trim();
    const newName = String(formData.get("newCategoryName") ?? "").trim();
    const newColor = String(formData.get("newCategoryColor") ?? color);

    if (existingId) {
      category_id = existingId;
    } else if (newName) {
      const { data: maxRow } = await supabase
        .from("notepad_categories")
        .select("sort_order")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();

      const sort_order = (maxRow?.sort_order ?? -1) + 1;
      const { data: created, error } = await supabase
        .from("notepad_categories")
        .insert({
          user_id: user.id,
          name: newName,
          color: newColor,
          sort_order,
        })
        .select("id")
        .single();

      if (error) throw new Error(error.message);
      category_id = created.id;
    }
  }

  await supabase.from("notepad_notes").insert({
    user_id: user.id,
    title,
    body,
    color,
    category_id,
  });

  revalidateNotes();
}

export async function reorderCategories(orderedIds: string[]) {
  const { supabase, user } = await requireUser();

  await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("notepad_categories")
        .update({ sort_order: index })
        .eq("id", id)
        .eq("user_id", user.id)
        .is("deleted_at", null),
    ),
  );

  revalidateNotes();
}

export async function updateNote(id: string, formData: FormData) {
  const { supabase, user } = await requireUser();

  const title = String(formData.get("title") ?? "");
  const body = sanitizeNoteHtml(String(formData.get("body") ?? ""));
  const color = String(formData.get("color") ?? "#fef9c3");
  const isPinned = formData.get("isPinned") === "on";
  const categoryRaw = String(formData.get("categoryId") ?? "");
  const category_id = categoryRaw || null;

  await supabase
    .from("notepad_notes")
    .update({ title, body, color, is_pinned: isPinned, category_id })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null);

  revalidateNotes();
}

export async function deleteNote(id: string) {
  const { supabase, user } = await requireUser();

  await supabase
    .from("notepad_notes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidateNotes();
}

export async function restoreNote(id: string) {
  const { supabase, user } = await requireUser();

  await supabase
    .from("notepad_notes")
    .update({ deleted_at: null })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidateNotes();
}

export async function permanentlyDeleteNote(id: string) {
  const { supabase, user } = await requireUser();

  await supabase
    .from("notepad_notes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  revalidateNotes();
}

export async function createCategory(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "#fef9c3");
  if (!name) return;

  const { data: maxRow } = await supabase
    .from("notepad_categories")
    .select("sort_order")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from("notepad_categories").insert({
    user_id: user.id,
    name,
    color,
    sort_order: (maxRow?.sort_order ?? -1) + 1,
  });

  revalidateNotes();
}

export async function updateCategory(id: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "#fef9c3");
  if (!name) return;

  await supabase
    .from("notepad_categories")
    .update({ name, color })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null);

  revalidateNotes();
}

export async function deleteCategory(id: string) {
  const { supabase, user } = await requireUser();
  const now = new Date().toISOString();

  await supabase
    .from("notepad_categories")
    .update({ deleted_at: now })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidateNotes();
}

export async function restoreCategory(id: string) {
  const { supabase, user } = await requireUser();

  await supabase
    .from("notepad_categories")
    .update({ deleted_at: null })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidateNotes();
}

export async function permanentlyDeleteCategory(id: string) {
  const { supabase, user } = await requireUser();

  await supabase
    .from("notepad_notes")
    .update({ category_id: null })
    .eq("category_id", id)
    .eq("user_id", user.id);

  await supabase
    .from("notepad_categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  revalidateNotes();
}
