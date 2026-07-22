"use client";

import { useEffect, useMemo, useState } from "react";
import type { Note } from "@/lib/types";
import { NoteEditor } from "@/components/note-editor";
import { NoteExportMenu } from "@/components/note-export-menu";
import { contrastStyle, contrastTextClass } from "@/lib/contrast";
import {
  autosaveLabel,
  useNoteAutosave,
} from "@/lib/use-note-autosave";

const FULL_VIEW_KEY = "notepad-popout-full-view";

/** Standalone note window — full viewport, note content only. */
export function NotePopout({ note }: { note: Note }) {
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const [isPinned, setIsPinned] = useState(note.is_pinned);
  const [fullView, setFullView] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(FULL_VIEW_KEY) === "1";
    } catch {
      return false;
    }
  });
  const tx = contrastTextClass(note.color);

  const patch = useMemo(
    () => ({
      title,
      body,
      color: note.color,
      isPinned,
      categoryId: note.category_id,
    }),
    [title, body, note.color, isPinned, note.category_id],
  );

  const saveStatus = useNoteAutosave(note.id, patch, true, 450);
  const statusText = autosaveLabel(saveStatus);

  useEffect(() => {
    document.title = note.title || "Note";
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [note.title]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && fullView) {
        e.preventDefault();
        setFullView(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullView]);

  useEffect(() => {
    try {
      localStorage.setItem(FULL_VIEW_KEY, fullView ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [fullView]);

  function toggleFullView() {
    setFullView((v) => !v);
  }

  return (
    <div
      className="relative flex h-dvh max-h-dvh flex-col overflow-hidden"
      style={contrastStyle(note.color)}
    >
      <div
        className={`mx-auto flex h-full min-h-0 w-full flex-1 flex-col ${
          fullView
            ? "max-w-none gap-0 px-5 py-5 sm:px-8 sm:py-6"
            : "max-w-2xl gap-4 px-6 py-6"
        }`}
      >
        {!fullView ? (
          <div className="flex shrink-0 items-start gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className={`min-w-0 flex-1 bg-transparent text-3xl font-semibold outline-none placeholder:opacity-40 ${tx.title}`}
            />
            <button
              type="button"
              onClick={toggleFullView}
              title="Full view"
              aria-label="Enter full view"
              className={`mt-1 shrink-0 rounded-lg p-2 opacity-70 transition hover:opacity-100 ${tx.muted}`}
            >
              <IconEnterFullView />
            </button>
          </div>
        ) : null}

        <NoteEditor
          value={body}
          onChange={setBody}
          placeholder="Write…"
          className="min-h-0 flex-1"
          minHeightClass="min-h-0"
          maxHeightClass="max-h-full"
          hideToolbar={fullView}
          editorClassName={`${tx.body} ${
            fullView ? "text-xl sm:text-2xl" : "text-lg"
          }`}
        />

        {!fullView ? (
          <div
            className="flex shrink-0 items-center gap-3 pt-4"
            style={{ borderTop: "1px solid var(--note-line)" }}
          >
            <label className={`flex items-center gap-1 text-sm ${tx.muted}`}>
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
              />
              Pin
            </label>
            <span className={`text-xs ${tx.muted}`} aria-live="polite">
              {statusText}
            </span>
            <NoteExportMenu className="ml-auto" title={title} bodyHtml={body} />
          </div>
        ) : (
          <p
            className={`pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] opacity-50 ${tx.muted}`}
            aria-live="polite"
          >
            {statusText}
          </p>
        )}
      </div>

      {fullView ? (
        <button
          type="button"
          onClick={toggleFullView}
          title="Exit full view (Esc)"
          aria-label="Exit full view"
          className={`absolute top-3 right-3 z-20 rounded-lg p-2 opacity-40 transition hover:opacity-100 ${tx.muted}`}
        >
          <IconExitFullView />
        </button>
      ) : null}
    </div>
  );
}

function IconEnterFullView() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M3.5 7V3.5H7M11 3.5h3.5V7M14.5 11v3.5H11M7 14.5H3.5V11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconExitFullView() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M7 3.5V7H3.5M14.5 7H11V3.5M11 14.5V11h3.5M3.5 11H7v3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
