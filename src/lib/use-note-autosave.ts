"use client";

import { useEffect, useRef, useState } from "react";
import {
  autosaveNote,
  type NoteAutosavePatch,
} from "@/app/actions/notes";

export type AutosaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

/**
 * Debounced note autosave. Fires on every change (including spaces).
 * Skips route revalidation so the editor cursor stays stable.
 */
export function useNoteAutosave(
  noteId: string | null | undefined,
  patch: NoteAutosavePatch | null,
  enabled = true,
  delayMs = 500,
) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const lastSavedRef = useRef<string | null>(null);
  const patchRef = useRef(patch);
  const trackedNoteId = useRef(noteId);

  const patchKey = patch
    ? JSON.stringify([
        patch.title,
        patch.body,
        patch.color,
        patch.isPinned ?? null,
        patch.categoryId ?? null,
      ])
    : "";

  useEffect(() => {
    patchRef.current = patch;
  }, [patch]);

  useEffect(() => {
    if (trackedNoteId.current === noteId) return;
    trackedNoteId.current = noteId;
    lastSavedRef.current = null;
    queueMicrotask(() => setStatus("idle"));
  }, [noteId]);

  useEffect(() => {
    if (!enabled || !noteId || !patchKey) return;

    // Seed baseline so opening a note does not immediately write
    if (lastSavedRef.current === null) {
      lastSavedRef.current = patchKey;
      return;
    }
    if (patchKey === lastSavedRef.current) return;

    setStatus("pending");
    const timer = window.setTimeout(() => {
      const current = patchRef.current;
      if (!current) return;
      setStatus("saving");
      const snapshot = patchKey;
      void autosaveNote(noteId, current)
        .then(() => {
          lastSavedRef.current = snapshot;
          setStatus("saved");
        })
        .catch(() => setStatus("error"));
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [enabled, noteId, patchKey, delayMs]);

  return status;
}

export function autosaveLabel(status: AutosaveStatus): string {
  switch (status) {
    case "pending":
    case "saving":
      return "Saving…";
    case "saved":
      return "Saved";
    case "error":
      return "Save failed";
    default:
      return "";
  }
}
