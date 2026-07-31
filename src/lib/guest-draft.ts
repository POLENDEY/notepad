import { isPlainNoteBodyEmpty } from "@/lib/note-plain-text";
import { sanitizeNoteHtml } from "@/lib/note-html";

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
      body: sanitizeNoteHtml(draft.body),
      color: draft.color,
    };
    if (!cleaned.title.trim() && isPlainNoteBodyEmpty(cleaned.body)) {
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
    const body = sanitizeNoteHtml(
      typeof parsed.body === "string" ? parsed.body : "",
    );
    if (!parsed.title.trim() && isPlainNoteBodyEmpty(body)) {
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
