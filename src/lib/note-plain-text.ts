/** Convert note HTML to plain text with 1:1 line breaks (one break → one `\n`). */
export function toPlainNoteBody(raw: string | null | undefined): string {
  const s = raw ?? "";
  if (!s) return "";
  if (!/<[a-z][\s\S]*>/i.test(s)) {
    return s.replace(/\r\n?/g, "\n");
  }

  // Prefer paragraph → break normalization first so we don't emit extra `\n` from `</p>`
  let html = s.replace(/\r\n?/g, "\n");

  // </p><p> → single newline; lone </p> at end → nothing extra yet
  html = html.replace(/<\/p>\s*<p\b[^>]*>/gi, "\n");
  html = html.replace(/<p\b[^>]*>/gi, "");
  html = html.replace(/<\/p>/gi, "");

  html = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Do not collapse intentional blank lines (`\n\n`), only crazy runs
  return html.replace(/\n{4,}/g, "\n\n\n").replace(/^\n+|\n+$/g, "");
}

export function isPlainNoteBodyEmpty(raw: string | null | undefined): boolean {
  return !toPlainNoteBody(raw).trim();
}

/** Format note timestamps for the library list. */
export function formatNoteDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
