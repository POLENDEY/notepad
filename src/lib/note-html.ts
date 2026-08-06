import { toPlainNoteBody } from "@/lib/note-plain-text";

/** Allowed inline formatting for notes (bold / italic / underline / highlight). */

export function escapeText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Plain text → one paragraph with accurate `<br>` line breaks (notepad-like). */
export function plainTextToNoteHtml(raw: string): string {
  const text = (raw ?? "").replace(/\r\n?/g, "\n");
  if (!text) return "";
  const inner = escapeText(text).replace(/\n/g, "<br>");
  return `<p>${inner}</p>`;
}

/**
 * Inline fragment for paste into an existing note (no wrapping `<p>`).
 * One `\n` → one `<br>` (never doubles).
 */
export function plainTextToInlineHtml(raw: string): string {
  const text = (raw ?? "").replace(/\r\n?/g, "\n");
  return escapeText(text).replace(/\n/g, "<br>");
}

/**
 * Collapse multiple `<p>` blocks into one paragraph with `<br>` so
 * one Enter = one line (no fake double-spacing from stacked paragraphs).
 */
export function normalizeNoteLineBreaks(html: string): string {
  const matches = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)];
  if (matches.length <= 1) return html;

  let result = "";
  matches.forEach((m, i) => {
    const inner = m[1] ?? "";
    const blank =
      !inner.replace(/<br\s*\/?>/gi, "").replace(/&nbsp;/gi, " ").trim();
    if (i === 0) {
      result = blank ? "" : inner;
      return;
    }
    result += "<br>";
    if (!blank) result += inner;
  });

  return `<p>${result || "<br>"}</p>`;
}

/**
 * Keep only safe note markup. Plain text is converted to paragraphs.
 * Allows: p, br, strong/b, em/i, u, mark, s.
 */
export function sanitizeNoteHtml(raw: string | null | undefined): string {
  const input = raw ?? "";
  if (!input.trim()) return "";

  if (!/<[a-z][\s\S]*>/i.test(input)) {
    return plainTextToNoteHtml(input);
  }

  let html = input
    .replace(/<\/?(?:script|iframe|object|embed|form|input|link|meta|style|svg|math)[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/\s(href|src|xlink:href)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi, "");

  html = html.replace(/<\/?([a-z0-9]+)(\s[^>]*)?>/gi, (full, tag: string) => {
    const t = tag.toLowerCase();
    if (t === "br") return "<br>";
    if (["p", "strong", "b", "em", "i", "u", "s", "strike"].includes(t)) {
      const closing = full.startsWith("</");
      return closing ? `</${t === "b" ? "strong" : t === "i" ? "em" : t === "strike" ? "s" : t}>` : `<${t === "b" ? "strong" : t === "i" ? "em" : t === "strike" ? "s" : t}>`;
    }
    if (t === "mark") {
      return full.startsWith("</") ? "</mark>" : "<mark>";
    }
    return "";
  });

  return normalizeNoteLineBreaks(html.trim() || "");
}

export function noteHtmlForEditor(raw: string | null | undefined): string {
  const cleaned = sanitizeNoteHtml(raw);
  return cleaned || "<p></p>";
}

/** Build clipboard plain text: title + body with accurate single newlines. */
export function noteToClipboardText(title: string, bodyHtml: string): string {
  const body = toPlainNoteBody(bodyHtml);
  const t = title.trim();
  if (!t && !body) return "";
  if (!t) return body;
  if (!body) return t;
  return `${t}\n\n${body}`;
}
