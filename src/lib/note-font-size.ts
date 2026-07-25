/** Word-like pt sizes for the whole note body. */
export const NOTE_FONT_SIZES = [
  8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72,
] as const;

export const DEFAULT_NOTE_FONT_SIZE = 11;
export const MIN_NOTE_FONT_SIZE = 8;
export const MAX_NOTE_FONT_SIZE = 72;
export const NOTE_FONT_SIZE_KEY = "notepad-font-size";

export function clampNoteFontSize(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_NOTE_FONT_SIZE;
  return Math.min(MAX_NOTE_FONT_SIZE, Math.max(MIN_NOTE_FONT_SIZE, Math.round(n)));
}

/** Move to the next smaller Word size (or −1pt if between steps). */
export function shrinkNoteFontSize(current: number): number {
  const size = clampNoteFontSize(current);
  for (let i = NOTE_FONT_SIZES.length - 1; i >= 0; i--) {
    if (NOTE_FONT_SIZES[i]! < size) return NOTE_FONT_SIZES[i]!;
  }
  return MIN_NOTE_FONT_SIZE;
}

/** Move to the next larger Word size (or +1pt if between steps). */
export function growNoteFontSize(current: number): number {
  const size = clampNoteFontSize(current);
  for (const step of NOTE_FONT_SIZES) {
    if (step > size) return step;
  }
  return MAX_NOTE_FONT_SIZE;
}

export function readStoredNoteFontSize(): number {
  try {
    const raw = localStorage.getItem(NOTE_FONT_SIZE_KEY);
    if (!raw) return DEFAULT_NOTE_FONT_SIZE;
    return clampNoteFontSize(Number(raw));
  } catch {
    return DEFAULT_NOTE_FONT_SIZE;
  }
}

export function writeStoredNoteFontSize(size: number) {
  try {
    localStorage.setItem(NOTE_FONT_SIZE_KEY, String(clampNoteFontSize(size)));
  } catch {
    /* ignore */
  }
}
