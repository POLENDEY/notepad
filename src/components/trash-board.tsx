"use client";

import { useTransition } from "react";
import type { Note, NoteCategory } from "@/lib/types";
import { daysUntilPurge } from "@/lib/trash-utils";
import {
  permanentlyDeleteCategory,
  permanentlyDeleteNote,
  restoreCategory,
  restoreNote,
} from "@/app/actions/notes";

export function TrashBoard({
  notes,
  categories,
}: {
  notes: Note[];
  categories: NoteCategory[];
}) {
  const [pending, startTransition] = useTransition();
  const empty = notes.length === 0 && categories.length === 0;

  return (
    <div className="space-y-8">
      <p className="page-subtitle mt-0">
        Soft-deleted items stay for 30 days, then disappear for good.
      </p>

      {empty ? (
        <div className="soft-panel py-14 text-center">
          <p className="text-sm text-stone-500">Trash is empty.</p>
        </div>
      ) : null}

      {notes.length > 0 ? (
        <section>
          <p className="section-label mb-3">Notes</p>
          <ul className="soft-panel divide-y divide-stone-100 p-0 dark:divide-stone-800">
            {notes.map((note) => (
              <li
                key={note.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {note.title || "Untitled"}
                  </p>
                  <p className="mt-0.5 text-xs text-stone-500">
                    {daysUntilPurge(note.deleted_at)} days left
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    className="btn-quiet border border-stone-200 dark:border-stone-700"
                    onClick={() => startTransition(() => restoreNote(note.id))}
                  >
                    Restore
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    className="btn-quiet text-red-600"
                    onClick={() =>
                      startTransition(() => permanentlyDeleteNote(note.id))
                    }
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {categories.length > 0 ? (
        <section>
          <p className="section-label mb-3">Categories</p>
          <ul className="soft-panel divide-y divide-stone-100 p-0 dark:divide-stone-800">
            {categories.map((cat) => (
              <li
                key={cat.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{cat.name}</p>
                    <p className="text-xs text-stone-500">
                      {daysUntilPurge(cat.deleted_at)} days left
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    className="btn-quiet border border-stone-200 dark:border-stone-700"
                    onClick={() =>
                      startTransition(() => restoreCategory(cat.id))
                    }
                  >
                    Restore
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    className="btn-quiet text-red-600"
                    onClick={() =>
                      startTransition(() => permanentlyDeleteCategory(cat.id))
                    }
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
