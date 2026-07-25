/** Convert legacy TipTap HTML note bodies to plain text for the textarea UI. */
export function toPlainNoteBody(raw: string | null | undefined): string {
  const s = raw ?? "";
  if (!s) return "";
  // Already plain text — keep as-is (preserve intentional whitespace).
  if (!/<[a-z][\s\S]*>/i.test(s)) return s;

  const text = s
    .replace(/\r\n?/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text;
}

export function isPlainNoteBodyEmpty(raw: string | null | undefined): boolean {
  return !toPlainNoteBody(raw);
}
