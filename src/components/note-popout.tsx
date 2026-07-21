"use client";

import { useEffect, useTransition } from "react";
import type { Note } from "@/lib/types";
import { updateNote } from "@/app/actions/notes";
import { contrastStyle, contrastTextClass } from "@/lib/contrast";

/** Standalone note window — full viewport, note content only. */
export function NotePopout({ note }: { note: Note }) {
  const [pending, startTransition] = useTransition();
  const tx = contrastTextClass(note.color);

  useEffect(() => {
    document.title = note.title || "Note";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [note.title]);

  return (
    <div className="flex min-h-dvh flex-col" style={contrastStyle(note.color)}>
      <form
        action={(fd) => startTransition(() => updateNote(note.id, fd))}
        className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-8"
      >
        <input type="hidden" name="categoryId" value={note.category_id ?? ""} />
        <input type="hidden" name="color" value={note.color} />
        <input
          name="title"
          defaultValue={note.title}
          placeholder="Title"
          className={`w-full bg-transparent text-3xl font-semibold outline-none placeholder:opacity-40 ${tx.title}`}
        />
        <textarea
          name="body"
          defaultValue={note.body}
          placeholder="Write…"
          className={`min-h-0 w-full flex-1 resize-none bg-transparent text-lg leading-relaxed outline-none placeholder:opacity-40 ${tx.body}`}
        />
        <div
          className="flex items-center gap-3 pt-4"
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
          <button
            type="submit"
            disabled={pending}
            className="btn-primary ml-auto"
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
