"use client";

import { useEffect, useMemo, useState } from "react";
import type { Note } from "@/lib/types";
import { toPlainNoteBody } from "@/lib/note-plain-text";
import {
  autosaveLabel,
  useNoteAutosave,
} from "@/lib/use-note-autosave";
import { useNoteFontSize } from "@/lib/use-note-font-size";
import { NoteFontSizeControls } from "@/components/note-font-size-controls";

/** Standalone OS window — plain note, autosave, no chrome clutter. */
export function NotePopout({ note }: { note: Note }) {
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(() => toPlainNoteBody(note.body));
  const { fontSize, setFontSize, shrink, grow } = useNoteFontSize();

  const patch = useMemo(
    () => ({ title, body: toPlainNoteBody(body) }),
    [title, body],
  );
  const { status: saveStatus } = useNoteAutosave(note.id, patch, true, 400);

  useEffect(() => {
    document.title = note.title || "Note";
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [note.title]);

  return (
    <div className="flex h-dvh max-h-dvh flex-col bg-[var(--background)]">
      <div className="flex shrink-0 items-center gap-2 border-b border-stone-200/80 px-3 py-1.5 dark:border-stone-800">
        <NoteFontSizeControls
          fontSize={fontSize}
          onChange={setFontSize}
          onShrink={shrink}
          onGrow={grow}
        />
        <span className="ml-auto text-[11px] text-stone-400" aria-live="polite">
          {autosaveLabel(saveStatus) || "Ready"}
        </span>
      </div>
      <div
        className="flex min-h-0 flex-1 cursor-text flex-col px-4 py-3"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            (
              e.currentTarget.querySelector("textarea") as HTMLTextAreaElement | null
            )?.focus();
          }
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full shrink-0 border-0 bg-transparent font-semibold outline-none placeholder:text-stone-400"
          style={{ fontSize: "14px", lineHeight: 1.3 }}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write…"
          className="mt-2 min-h-0 w-full flex-1 resize-none border-0 bg-transparent outline-none placeholder:text-stone-400"
          style={{
            fontSize: `${fontSize}pt`,
            lineHeight: 1.15,
            whiteSpace: "pre-wrap",
          }}
          autoFocus
        />
      </div>
    </div>
  );
}
