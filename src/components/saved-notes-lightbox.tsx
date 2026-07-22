"use client";

import { useMemo, useState, useTransition } from "react";
import type { Note, NoteCategory } from "@/lib/types";
import { deleteNote } from "@/app/actions/notes";
import { NoteEditor } from "@/components/note-editor";
import { NoteExportMenu } from "@/components/note-export-menu";
import { openNoteOutsideBrowser } from "@/lib/open-note-window";
import { noteBodyToPlainText } from "@/lib/note-html";
import {
  contrastStyle,
  contrastTextClass,
  isDarkBackground,
} from "@/lib/contrast";
import { autosaveLabel, useNoteAutosave } from "@/lib/use-note-autosave";

export function SavedNotesLightbox({
  open,
  onClose,
  notes,
  categories,
  filter,
  onFilterChange,
}: {
  open: boolean;
  onClose: () => void;
  notes: Note[];
  categories: NoteCategory[];
  filter: string;
  onFilterChange: (filter: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);

  const categoryMap = useMemo(() => {
    const map = new Map<string, NoteCategory>();
    for (const c of categories) map.set(c.id, c);
    return map;
  }, [categories]);

  const filtered = useMemo(() => {
    if (filter === "all") return notes;
    if (filter === "general") return notes.filter((n) => !n.category_id);
    return notes.filter((n) => n.category_id === filter);
  }, [notes, filter]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-stone-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Saved notes"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col rounded-t-3xl bg-[#faf9f7] shadow-2xl dark:bg-stone-900 sm:max-h-[85vh] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center gap-3 border-b border-stone-200 px-5 py-4 dark:border-stone-800">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium tracking-[0.14em] text-stone-500 uppercase">
              Library
            </p>
            <h2 className="truncate text-lg font-semibold text-stone-900 dark:text-stone-50">
              Saved notes
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-200/70 dark:hover:bg-stone-800"
          >
            Close
          </button>
        </header>

        <div className="flex flex-wrap gap-2 border-b border-stone-200 px-5 py-3 dark:border-stone-800">
          <FilterChip
            active={filter === "all"}
            onClick={() => onFilterChange("all")}
            label="All"
          />
          <FilterChip
            active={filter === "general"}
            onClick={() => onFilterChange("general")}
            label="General"
          />
          {categories.map((c) => (
            <FilterChip
              key={c.id}
              active={filter === c.id}
              onClick={() => onFilterChange(c.id)}
              label={c.name}
              color={c.color}
            />
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <p className="mb-3 text-xs text-stone-500">
            {filtered.length} note{filtered.length === 1 ? "" : "s"}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((note) => {
              const cat = note.category_id
                ? categoryMap.get(note.category_id)
                : null;
              const isEditing = editingId === note.id;
              const tx = contrastTextClass(note.color);
              return (
                <article
                  key={note.id}
                  className="flex min-h-[160px] flex-col rounded-2xl p-4 shadow-sm ring-1 ring-black/5"
                  style={contrastStyle(note.color)}
                >
                  {isEditing ? (
                    <LightboxNoteEditor
                      key={note.id}
                      note={note}
                      onDone={() => setEditingId(null)}
                    />
                  ) : (
                    <>
                      <span
                        className="w-fit rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase"
                        style={{
                          backgroundColor: "var(--note-faint)",
                          color: "var(--note-muted)",
                        }}
                      >
                        {cat?.name ?? "General"}
                      </span>
                      <h3 className={`mt-2 text-lg font-semibold ${tx.title}`}>
                        {note.title || "Untitled"}
                      </h3>
                      <p
                        className={`mt-1 line-clamp-4 flex-1 text-sm whitespace-pre-wrap ${tx.body}`}
                      >
                        {noteBodyToPlainText(note.body) || "Empty note"}
                      </p>
                      <div
                        className="mt-3 flex flex-wrap gap-2 pt-2"
                        style={{ borderTop: "1px solid var(--note-line)" }}
                      >
                        <button
                          type="button"
                          className={`text-xs font-medium underline-offset-2 hover:underline ${tx.muted}`}
                          onClick={() => setEditingId(note.id)}
                        >
                          Edit
                        </button>
                        <NoteExportMenu
                          title={note.title}
                          bodyHtml={note.body}
                          className="[&>button]:border-0 [&>button]:bg-transparent [&>button]:px-0 [&>button]:py-0 [&>button]:text-[inherit] [&>button]:opacity-80 [&>button]:hover:bg-transparent [&>button]:hover:underline"
                        />
                        <button
                          type="button"
                          className={`text-xs font-medium underline-offset-2 hover:underline ${tx.muted}`}
                          onClick={() => openNoteOutsideBrowser(note.id)}
                        >
                          Open window
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          className="ml-auto text-xs hover:underline"
                          style={{ color: "var(--note-danger)" }}
                          onClick={() =>
                            startTransition(() => deleteNote(note.id))
                          }
                        >
                          Trash
                        </button>
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </div>
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-stone-500">
              No saved notes in this filter.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function LightboxNoteEditor({
  note,
  onDone,
}: {
  note: Note;
  onDone: () => void;
}) {
  const tx = contrastTextClass(note.color);
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const [color, setColor] = useState(note.color);
  const [isPinned, setIsPinned] = useState(note.is_pinned);

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

  return (
    <div className="flex flex-1 flex-col gap-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={`bg-transparent text-lg font-semibold outline-none ${tx.title}`}
      />
      <NoteEditor
        value={body}
        onChange={setBody}
        placeholder="Write…"
        className="flex-1"
        minHeightClass="min-h-[6rem]"
        maxHeightClass="max-h-[14rem]"
        editorClassName={`text-sm ${tx.body}`}
      />
      <div className="flex flex-wrap items-center gap-2">
        <label className={`inline-flex items-center gap-1 text-xs ${tx.muted}`}>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
          />
          Color
        </label>
        <label className={`flex items-center gap-1 text-xs ${tx.muted}`}>
          <input
            type="checkbox"
            checked={isPinned}
            onChange={(e) => setIsPinned(e.target.checked)}
          />
          Pin
        </label>
        <span className={`text-[11px] ${tx.muted}`} aria-live="polite">
          {autosaveLabel(saveStatus)}
        </span>
        <button
          type="button"
          onClick={onDone}
          className={`ml-auto text-xs ${tx.muted}`}
        >
          Done
        </button>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: string;
}) {
  const dark = color ? isDarkBackground(color) : false;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`chip ${active ? "chip-active" : color ? "" : "chip-idle"}`}
      style={
        !active && color
          ? {
              backgroundColor: color,
              color: dark ? "#fafaf9" : "#1c1917",
            }
          : undefined
      }
    >
      {label}
    </button>
  );
}
