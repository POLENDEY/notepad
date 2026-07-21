import {
  noteBodyToPlainText,
  sanitizeNoteHtml,
} from "@/lib/note-html";

function safeFilename(title: string, ext: string) {
  const base = (title.trim() || "note")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
  return `${base || "note"}.${ext}`;
}

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function htmlToMarkdown(html: string): string {
  const clean = sanitizeNoteHtml(html);
  return clean
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<p[^>]*>/gi, "")
    .replace(/<\/?(strong|b)>/gi, "**")
    .replace(/<\/?(em|i)>/gi, "_")
    .replace(/<\/?u>/gi, "")
    .replace(/<mark[^>]*>/gi, "==")
    .replace(/<\/mark>/gi, "==")
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/?(ul|ol)>/gi, "\n")
    .replace(/<span[^>]*>/gi, "")
    .replace(/<\/span>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function exportNoteTxt(title: string, bodyHtml: string) {
  const text = [title.trim() || "Untitled", "", noteBodyToPlainText(bodyHtml)]
    .join("\n")
    .trim();
  downloadBlob(safeFilename(title, "txt"), text, "text/plain;charset=utf-8");
}

export function exportNoteMarkdown(title: string, bodyHtml: string) {
  const md = `# ${title.trim() || "Untitled"}\n\n${htmlToMarkdown(bodyHtml)}\n`;
  downloadBlob(safeFilename(title, "md"), md, "text/markdown;charset=utf-8");
}

export function exportNoteHtml(title: string, bodyHtml: string) {
  const safeTitle = escapeHtml(title.trim() || "Untitled");
  const body = sanitizeNoteHtml(bodyHtml);
  const doc = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${safeTitle}</title>
<style>
  body { font-family: Georgia, "Times New Roman", serif; max-width: 40rem; margin: 2rem auto; padding: 0 1.25rem; line-height: 1.65; color: #1c1917; }
  h1 { font-family: system-ui, sans-serif; font-size: 1.75rem; }
  mark { border-radius: 0.15em; padding: 0 0.15em; }
  ul, ol { padding-left: 1.25rem; }
  a { color: #1d4ed8; }
</style>
</head>
<body>
<h1>${safeTitle}</h1>
${body}
</body>
</html>`;
  downloadBlob(safeFilename(title, "html"), doc, "text/html;charset=utf-8");
}

/** Opens a print dialog so the user can Save as PDF. */
export function exportNotePdf(title: string, bodyHtml: string) {
  const safeTitle = escapeHtml(title.trim() || "Untitled");
  const body = sanitizeNoteHtml(bodyHtml);
  const w = window.open("", "_blank", "noopener,noreferrer,width=800,height=900");
  if (!w) {
    window.alert("Allow pop-ups to export PDF.");
    return;
  }
  w.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${safeTitle}</title>
<style>
  @page { margin: 18mm; }
  body { font-family: Georgia, "Times New Roman", serif; color: #1c1917; line-height: 1.65; margin: 0; padding: 1.5rem; }
  h1 { font-family: system-ui, sans-serif; font-size: 1.6rem; margin: 0 0 1rem; }
  mark { border-radius: 0.15em; padding: 0 0.15em; }
  ul, ol { padding-left: 1.25rem; }
</style>
</head>
<body>
<h1>${safeTitle}</h1>
${body}
<script>window.onload = function () { window.focus(); window.print(); };<\/script>
</body>
</html>`);
  w.document.close();
}

export type NoteExportFormat = "txt" | "md" | "html" | "pdf";

export function exportNote(
  format: NoteExportFormat,
  title: string,
  bodyHtml: string,
) {
  switch (format) {
    case "txt":
      exportNoteTxt(title, bodyHtml);
      break;
    case "md":
      exportNoteMarkdown(title, bodyHtml);
      break;
    case "html":
      exportNoteHtml(title, bodyHtml);
      break;
    case "pdf":
      exportNotePdf(title, bodyHtml);
      break;
  }
}
