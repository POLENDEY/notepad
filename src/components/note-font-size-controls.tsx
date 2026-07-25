"use client";

import { useEffect, useId, useState } from "react";
import {
  MAX_NOTE_FONT_SIZE,
  MIN_NOTE_FONT_SIZE,
  NOTE_FONT_SIZES,
} from "@/lib/note-font-size";

const btn =
  "rounded px-1.5 py-0.5 text-xs font-medium text-stone-500 hover:bg-stone-200/70 disabled:opacity-40 dark:hover:bg-stone-800";

/** Word-style grow / size / shrink for the whole note body. */
export function NoteFontSizeControls({
  fontSize,
  onChange,
  onShrink,
  onGrow,
}: {
  fontSize: number;
  onChange: (size: number) => void;
  onShrink: () => void;
  onGrow: () => void;
}) {
  const reactId = useId();
  const inputId = `${reactId}-size`;
  const listId = `${reactId}-options`;
  const [draft, setDraft] = useState(String(fontSize));

  useEffect(() => {
    setDraft(String(fontSize));
  }, [fontSize]);

  function commitDraft() {
    const n = Number(draft);
    if (!Number.isFinite(n)) {
      setDraft(String(fontSize));
      return;
    }
    onChange(n);
  }

  return (
    <div
      className="flex items-center gap-0.5 rounded-md border border-stone-200/80 px-0.5 dark:border-stone-700"
      role="group"
      aria-label="Font size"
    >
      <button
        type="button"
        className={btn}
        onClick={onShrink}
        disabled={fontSize <= MIN_NOTE_FONT_SIZE}
        title="Decrease font size (Ctrl+[)"
        aria-label="Decrease font size"
      >
        A−
      </button>
      <label className="sr-only" htmlFor={inputId}>
        Font size
      </label>
      <input
        id={inputId}
        list={listId}
        inputMode="numeric"
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
        onBlur={commitDraft}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commitDraft();
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="w-9 border-0 bg-transparent py-0.5 text-center text-xs text-stone-700 outline-none dark:text-stone-200"
        aria-label="Font size in points"
      />
      <datalist id={listId}>
        {NOTE_FONT_SIZES.map((size) => (
          <option key={size} value={size} />
        ))}
      </datalist>
      <button
        type="button"
        className={btn}
        onClick={onGrow}
        disabled={fontSize >= MAX_NOTE_FONT_SIZE}
        title="Increase font size (Ctrl+])"
        aria-label="Increase font size"
      >
        A+
      </button>
    </div>
  );
}
