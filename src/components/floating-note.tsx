"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Note } from "@/lib/types";
import { NoteEditor } from "@/components/note-editor";
import { contrastStyle, contrastTextClass } from "@/lib/contrast";
import { autosaveLabel, useNoteAutosave } from "@/lib/use-note-autosave";

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
  const [pos, setPos] = useState({
    x: 80 + (zIndex % 5) * 28,
    y: 72 + (zIndex % 5) * 28,
  });
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const [color, setColor] = useState(note.color);
  const [isPinned, setIsPinned] = useState(note.is_pinned);
  const drag = useRef<{ ox: number; oy: number; sx: number; sy: number } | null>(
    null,
  );
  const tx = contrastTextClass(color);
  const surface = contrastStyle(color);

  const patch = useMemo(
    () => ({
      title,
      body,
      color,
      isPinned,
      categoryId: note.category_id,
    }),
    [title, body, color, isPinned, note.category_id],
  );
  const saveStatus = useNoteAutosave(note.id, patch, true, 450);

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
        <span className={`text-[10px] ${tx.muted}`} aria-live="polite">
          {autosaveLabel(saveStatus)}
        </span>
        <button
          type="button"
          onClick={onClose}
          className={`ml-auto rounded-md px-2 py-0.5 text-xs hover:opacity-80 ${tx.muted}`}
        >
          Close
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 p-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className={`bg-transparent text-xl font-semibold outline-none placeholder:opacity-40 ${tx.title}`}
        />
        <NoteEditor
          value={body}
          onChange={setBody}
          placeholder="Write…"
          className="min-h-0 flex-1"
          minHeightClass="min-h-[8rem]"
          maxHeightClass="max-h-none"
          editorClassName={`text-sm ${tx.body}`}
        />
        <div
          className="flex items-center gap-2 pt-2"
          style={{ borderTop: "1px solid var(--note-line)" }}
        >
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
            aria-label="Color"
          />
          <label className={`flex items-center gap-1 text-xs ${tx.muted}`}>
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
            />
            Pin
          </label>
        </div>
      </div>
    </div>
  );
}
