"use client";

import { useEffect, useState, useTransition } from "react";
import type { Note } from "@/lib/types";
import { updateNote } from "@/app/actions/notes";
import { NoteEditor } from "@/components/note-editor";
import { NoteExportMenu } from "@/components/note-export-menu";
import { contrastStyle, contrastTextClass } from "@/lib/contrast";

/** Standalone note window — full viewport, note content only. */
export function NotePopout({ note }: { note: Note }) {
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const tx = contrastTextClass(note.color);

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
    <div
      className="flex h-dvh max-h-dvh flex-col overflow-hidden"
      style={contrastStyle(note.color)}
    >
      <form
        action={(fd) => startTransition(() => updateNote(note.id, fd))}
        className="mx-auto flex h-full min-h-0 w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-6"
      >
        <input type="hidden" name="categoryId" value={note.category_id ?? ""} />
        <input type="hidden" name="color" value={note.color} />
        <input
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className={`w-full shrink-0 bg-transparent text-3xl font-semibold outline-none placeholder:opacity-40 ${tx.title}`}
        />
        <NoteEditor
          name="body"
          value={body}
          onChange={setBody}
          placeholder="Write…"
          className="min-h-0 flex-1"
          minHeightClass="min-h-0"
          maxHeightClass="max-h-full"
          editorClassName={`text-lg leading-relaxed ${tx.body}`}
        />
        <div
          className="flex shrink-0 items-center gap-3 pt-4"
          style={{ borderTop: "1px solid var(--note-line)" }}
        >
          <label className={`flex items-center gap-1 text-sm ${tx.muted}`}>
            <input
              type="checkbox"
              name="isPinned"
              defaultChecked={note.is_pinned}
            />
            Pin
          </label>
          <NoteExportMenu className="ml-auto" title={title} bodyHtml={body} />
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
