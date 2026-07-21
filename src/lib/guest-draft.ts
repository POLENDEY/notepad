export const GUEST_DRAFT_KEY = "notepad-guest-draft";

export type GuestDraft = {
  title: string;
  body: string;
  color: string;
};

export function saveGuestDraft(draft: GuestDraft) {
  try {
    localStorage.setItem(GUEST_DRAFT_KEY, JSON.stringify(draft));
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
    return parsed;
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
