"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  exportNote,
  type NoteExportFormat,
} from "@/lib/export-note";

const FORMATS: { id: NoteExportFormat; label: string; hint: string }[] = [
  { id: "txt", label: "Text (.txt)", hint: "Plain text" },
  { id: "md", label: "Markdown (.md)", hint: "Lightweight markup" },
  { id: "html", label: "HTML (.html)", hint: "Web page" },
  { id: "pdf", label: "PDF", hint: "Print / Save as PDF" },
];

export function NoteExportMenu({
  title,
  bodyHtml,
  className = "",
  disabled = false,
}: {
  title: string;
  bodyHtml: string;
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center rounded-full border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:bg-stone-200/70 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800 disabled:opacity-40"
      >
        Export
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 bottom-full z-40 mb-2 min-w-[11rem] overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg dark:border-stone-700 dark:bg-stone-950"
        >
          {FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="menuitem"
              className="flex w-full flex-col px-3 py-2 text-left transition hover:bg-stone-100 dark:hover:bg-stone-900"
              onClick={() => {
                exportNote(f.id, title, bodyHtml);
                setOpen(false);
              }}
            >
              <span className="text-sm font-medium text-stone-900 dark:text-stone-50">
                {f.label}
              </span>
              <span className="text-[11px] text-stone-500">{f.hint}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
