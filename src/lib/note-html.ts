/** Allowed inline formatting for notes (bold / italic / underline / highlight). */

export function escapeText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Plain text → minimal TipTap-friendly HTML. */
export function plainTextToNoteHtml(raw: string): string {
  const text = raw ?? "";
  if (!text.trim()) return "";
  return text
    .split(/\n{2,}/)
    .map((block) => {
      const inner = escapeText(block).replace(/\n/g, "<br>");
      return `<p>${inner || "<br>"}</p>`;
    })
    .join("");
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
    // Drop unknown tags, keep text content
    return "";
  });

  return html.trim() || "";
}

export function noteHtmlForEditor(raw: string | null | undefined): string {
  const cleaned = sanitizeNoteHtml(raw);
  return cleaned || "<p></p>";
}
