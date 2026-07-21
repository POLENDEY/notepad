import type { CSSProperties } from "react";

function parseHex(hex: string): { r: number; g: number; b: number } {
  const raw = hex.replace("#", "").trim();
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw.padEnd(6, "0").slice(0, 6);
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return { r: 254, g: 243, b: 199 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function parseCssColor(input: string): { r: number; g: number; b: number } {
  const value = (input || "").trim();
  if (value.startsWith("#")) return parseHex(value);
  const rgb = value.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i,
  );
  if (rgb) {
    return {
      r: Number(rgb[1]),
      g: Number(rgb[2]),
      b: Number(rgb[3]),
    };
  }
  return parseHex("#fde68a");
}

/** WCAG relative luminance 0–1 */
export function relativeLuminance(color: string): number {
  const { r, g, b } = parseCssColor(color);
  const lin = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

export function isDarkBackground(color: string): boolean {
  return relativeLuminance(color) < 0.45;
}

/** Readable text color for any highlight / card background */
export function contrastForeground(background: string): string {
  return isDarkBackground(background || "#fde68a") ? "#fafaf9" : "#1c1917";
}

/** Auto light/dark text colors for a colored note/category card */
export function contrastStyle(background: string): CSSProperties {
  const dark = isDarkBackground(background || "#fef3c7");
  return {
    backgroundColor: background,
    color: dark ? "#fafaf9" : "#1c1917",
    ["--note-muted" as string]: dark
      ? "rgba(250,250,249,0.72)"
      : "rgba(28,25,23,0.62)",
    ["--note-faint" as string]: dark
      ? "rgba(255,255,255,0.14)"
      : "rgba(28,25,23,0.08)",
    ["--note-line" as string]: dark
      ? "rgba(255,255,255,0.18)"
      : "rgba(28,25,23,0.12)",
    ["--note-danger" as string]: dark ? "#fecaca" : "#b91c1c",
  };
}

export function contrastTextClass(background: string): {
  title: string;
  body: string;
  muted: string;
} {
  const dark = isDarkBackground(background || "#fef3c7");
  return dark
    ? {
        title: "text-stone-50",
        body: "text-stone-100/85",
        muted: "text-stone-200/70",
      }
    : {
        title: "text-stone-900",
        body: "text-stone-800",
        muted: "text-stone-600",
      };
}
