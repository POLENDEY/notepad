"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { Note } from "@/lib/types";
import { updateNote } from "@/app/actions/notes";
import { ColorWheel } from "@/components/color-wheel";
import { contrastStyle, contrastTextClass } from "@/lib/contrast";

type FloatingNoteProps = {
  note: Note;
  onClose: () => void;
  zIndex: number;
  onFocus: () => void;
};

export function FloatingNote({
  note,
  onClose,
  zIndex,
  onFocus,
}: FloatingNoteProps) {
  const [pending, startTransition] = useTransition();
  const [pos, setPos] = useState({
    x: 80 + (zIndex % 5) * 28,
    y: 72 + (zIndex % 5) * 28,
  });
  const drag = useRef<{ ox: number; oy: number; sx: number; sy: number } | null>(
    null,
  );
  const tx = contrastTextClass(note.color);
  const surface = contrastStyle(note.color);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!drag.current) return;
      setPos({
        x: drag.current.sx + (e.clientX - drag.current.ox),
        y: drag.current.sy + (e.clientY - drag.current.oy),
      });
    };
    const onUp = () => {
      drag.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-label={note.title || "Note"}
      onMouseDown={onFocus}
      className="fixed flex w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/10"
      style={{
        ...surface,
        left: pos.x,
        top: pos.y,
        zIndex: 50 + zIndex,
        height: 460,
      }}
    >
      <div
        className="flex cursor-grab items-center gap-2 px-3 py-2 active:cursor-grabbing"
        style={{ backgroundColor: "var(--note-faint)" }}
        onPointerDown={(e) => {
          onFocus();
          drag.current = {
            ox: e.clientX,
            oy: e.clientY,
            sx: pos.x,
            sy: pos.y,
          };
        }}
      >
        <span className={`text-xs font-medium ${tx.muted}`}>Note</span>
        <button
          type="button"
          onClick={onClose}
          className={`ml-auto rounded-md px-2 py-0.5 text-xs hover:opacity-80 ${tx.muted}`}
        >
          Close
        </button>
      </div>
      <form
        action={(fd) => startTransition(() => updateNote(note.id, fd))}
        className="flex min-h-0 flex-1 flex-col gap-2 p-4"
      >
        <input type="hidden" name="categoryId" value={note.category_id ?? ""} />
        <input
          name="title"
          defaultValue={note.title}
          placeholder="Title"
          className={`bg-transparent text-xl font-semibold outline-none placeholder:opacity-40 ${tx.title}`}
        />
        <textarea
          name="body"
          defaultValue={note.body}
          placeholder="Write…"
          className={`min-h-0 flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:opacity-40 ${tx.body}`}
        />
        <div
          className="flex items-center gap-2 pt-2"
          style={{ borderTop: "1px solid var(--note-line)" }}
        >
          <ColorWheel name="color" defaultValue={note.color} />
          <label className={`flex items-center gap-1 text-xs ${tx.muted}`}>
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
            className="btn-primary ml-auto px-3 py-1.5 text-xs"
          >
            {pending ? "…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
