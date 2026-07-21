import sanitizeHtml from "sanitize-html";
import { contrastForeground } from "@/lib/contrast";

const EMPTY_HTML = /^(?:<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>|\s)*$/i;

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "mark",
  "ul",
  "ol",
  "li",
  "a",
  "span",
  "label",
  "input",
] as const;

/** Keep consecutive spaces through HTML parse/save cycles. */
export function encodeNoteHtmlSpaces(html: string): string {
  if (!html) return html;
  return html.replace(/(?<=>)([^<]*)/g, (text) =>
    text.replace(/ {2,}/g, (spaces) => "\u00A0".repeat(spaces.length)),
  );
}

export function sanitizeNoteHtml(dirty: string): string {
  return encodeNoteHtmlSpaces(
    sanitizeHtml(dirty ?? "", {
      allowedTags: [...ALLOWED_TAGS],
      allowedAttributes: {
        a: ["href", "target", "rel"],
        span: ["style"],
        mark: ["style", "data-color", "class"],
        ul: ["data-type", "class"],
        li: ["data-checked", "data-type", "class"],
        label: ["contenteditable"],
        input: ["type", "checked", "disabled"],
      },
      allowedStyles: {
        span: {
          "font-size": [/^\d+(?:\.\d+)?(?:px|rem|em)$/],
        },
        mark: {
          "background-color": [
            /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
            /^rgba?\([\d\s.,%]+\)$/,
          ],
          color: [
            /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
            /^rgba?\([\d\s.,%]+\)$/,
          ],
        },
      },
      allowedSchemes: ["http", "https", "mailto"],
      transformTags: {
        a: sanitizeHtml.simpleTransform("a", {
          target: "_blank",
          rel: "noopener noreferrer",
        }),
        mark: (tagName, attribs) => {
          const style = attribs.style ?? "";
          const fromStyle = style
            .match(/background-color:\s*([^;]+)/i)?.[1]
            ?.trim();
          const bg = attribs["data-color"] || fromStyle;
          if (!bg) return { tagName, attribs };
          const fg = contrastForeground(bg);
          return {
            tagName: "mark",
            attribs: {
              ...attribs,
              "data-color": bg,
              style: `background-color: ${bg}; color: ${fg}`,
            },
          };
        },
      },
    }),
  );
}

export function noteBodyToPlainText(html: string): string {
  if (!html) return "";
  if (!/<[a-z]/i.test(html)) return html;
  return sanitizeHtml(html, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/\u00a0/g, " ")
    .replace(/\s+\n/g, "\n")
    .trim();
}

export function isNoteBodyEmpty(html: string): boolean {
  if (!html || !html.trim()) return true;
  if (!/<[a-z]/i.test(html)) return !html.trim();
  const plain = noteBodyToPlainText(html);
  if (plain) return false;
  return EMPTY_HTML.test(html.trim());
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Convert legacy plain-text notes into TipTap-friendly HTML. */
export function noteBodyToEditorHtml(body: string): string {
  const raw = body ?? "";
  if (!raw) return "";
  if (/<(?:p|br|div|ul|ol|li|strong|b|em|i|u|mark|span|a)\b/i.test(raw)) {
    return sanitizeNoteHtml(raw);
  }
  return encodeNoteHtmlSpaces(
    raw
      .split(/\n/)
      .map((line) => `<p>${escapeHtml(line) || "<br>"}</p>`)
      .join(""),
  );
}
