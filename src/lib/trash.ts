import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/data";

const TRASH_DAYS = 30;

export async function purgeExpiredTrashForCurrentUser() {
  const user = await getSessionUser();
  if (!user) return;

  const supabase = await createClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - TRASH_DAYS);
  const iso = cutoff.toISOString();

  await Promise.all([
    supabase
      .from("notepad_notes")
      .delete()
      .eq("user_id", user.id)
      .not("deleted_at", "is", null)
      .lt("deleted_at", iso),
    supabase
      .from("notepad_categories")
      .delete()
      .eq("user_id", user.id)
      .not("deleted_at", "is", null)
      .lt("deleted_at", iso),
  ]);
}
