import { toPlainNoteBody } from "@/lib/note-plain-text";

export const GUEST_DRAFT_KEY = "notepad-guest-draft";

export type GuestDraft = {
  title: string;
  body: string;
  color: string;
};

export function saveGuestDraft(draft: GuestDraft) {
  try {
    const cleaned: GuestDraft = {
      title: draft.title,
      body: toPlainNoteBody(draft.body),
      color: draft.color,
    };
    if (!cleaned.title.trim() && !cleaned.body) {
      localStorage.removeItem(GUEST_DRAFT_KEY);
      return;
    }
    localStorage.setItem(GUEST_DRAFT_KEY, JSON.stringify(cleaned));
  } catch {
    /* ignore quota / private mode */
  }
}

export function readGuestDraft(): GuestDraft | null {
  try {
    const raw = localStorage.getItem(GUEST_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestDraft;
    if (typeof parsed?.title !== "string") return null;
    const body = toPlainNoteBody(
      typeof parsed.body === "string" ? parsed.body : "",
    );
    // Drop stale TipTap-only drafts like "<p></p>"
    if (!parsed.title.trim() && !body) {
      localStorage.removeItem(GUEST_DRAFT_KEY);
      return null;
    }
    return {
      title: parsed.title,
      body,
      color: typeof parsed.color === "string" ? parsed.color : "#fef9c3",
    };
  } catch {
    return null;
  }
}

export function clearGuestDraft() {
  try {
    localStorage.removeItem(GUEST_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}
