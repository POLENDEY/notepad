"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_NOTE_FONT_SIZE,
  NOTE_FONT_SIZE_KEY,
  clampNoteFontSize,
  growNoteFontSize,
  readStoredNoteFontSize,
  shrinkNoteFontSize,
  writeStoredNoteFontSize,
} from "@/lib/note-font-size";

export function useNoteFontSize() {
  const [fontSize, setFontSizeState] = useState(DEFAULT_NOTE_FONT_SIZE);

  useEffect(() => {
    setFontSizeState(readStoredNoteFontSize());

    function onStorage(e: StorageEvent) {
      if (e.key !== NOTE_FONT_SIZE_KEY || e.newValue == null) return;
      setFontSizeState(clampNoteFontSize(Number(e.newValue)));
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setFontSize = useCallback((next: number) => {
    const size = clampNoteFontSize(next);
    setFontSizeState(size);
    writeStoredNoteFontSize(size);
  }, []);

  const shrink = useCallback(() => {
    setFontSizeState((prev) => {
      const size = shrinkNoteFontSize(prev);
      writeStoredNoteFontSize(size);
      return size;
    });
  }, []);

  const grow = useCallback(() => {
    setFontSizeState((prev) => {
      const size = growNoteFontSize(prev);
      writeStoredNoteFontSize(size);
      return size;
    });
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      // Word-like: Ctrl+[ shrink, Ctrl+] grow
      if (e.key === "[" || e.code === "BracketLeft") {
        e.preventDefault();
        shrink();
      } else if (e.key === "]" || e.code === "BracketRight") {
        e.preventDefault();
        grow();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shrink, grow]);

  return { fontSize, setFontSize, shrink, grow };
}
