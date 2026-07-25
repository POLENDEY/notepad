"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { autosaveNote, type NoteAutosavePatch } from "@/app/actions/notes";

export type AutosaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

export function useNoteAutosave(
  noteId: string | null | undefined,
  patch: NoteAutosavePatch | null,
  enabled = true,
  delayMs = 400,
) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const lastSavedRef = useRef<string | null>(null);
  const patchRef = useRef(patch);
  const trackedNoteId = useRef(noteId);
  const savingRef = useRef<Promise<void> | null>(null);

  const patchKey = patch
    ? JSON.stringify([patch.title, patch.body])
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

  const saveNow = useCallback(async (id: string, current: NoteAutosavePatch) => {
    const snapshot = JSON.stringify([current.title, current.body]);
    setStatus("saving");
    const job = autosaveNote(id, current)
      .then(() => {
        lastSavedRef.current = snapshot;
        setStatus("saved");
      })
      .catch(() => {
        setStatus("error");
      })
      .finally(() => {
        if (savingRef.current === job) savingRef.current = null;
      });
    savingRef.current = job;
    await job;
  }, []);

  useEffect(() => {
    if (!enabled || !noteId || !patchKey) return;

    if (lastSavedRef.current === null) {
      lastSavedRef.current = patchKey;
      return;
    }
    if (patchKey === lastSavedRef.current) return;

    setStatus("pending");
    const timer = window.setTimeout(() => {
      const current = patchRef.current;
      if (!current) return;
      void saveNow(noteId, current);
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [enabled, noteId, patchKey, delayMs, saveNow]);

  const flush = useCallback(async () => {
    if (!enabled || !noteId) return;
    if (savingRef.current) await savingRef.current;
    const current = patchRef.current;
    if (!current) return;
    const snapshot = JSON.stringify([current.title, current.body]);
    if (snapshot === lastSavedRef.current) return;
    await saveNow(noteId, current);
  }, [enabled, noteId, saveNow]);

  const isDirty =
    !!enabled &&
    !!noteId &&
    !!patchKey &&
    lastSavedRef.current !== null &&
    patchKey !== lastSavedRef.current;

  return { status, flush, isDirty };
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
