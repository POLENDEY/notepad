"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Note } from "@/lib/types";
import {
  archiveNotes,
  createNote,
  deleteNotes,
  restoreNotes,
} from "@/app/actions/notes";
import { AuthRequiredModal } from "@/components/auth-required-modal";
import { openNoteOutsideBrowser } from "@/lib/open-note-window";
import {
  clearGuestDraft,
  readGuestDraft,
  saveGuestDraft,
} from "@/lib/guest-draft";
import {
  isPlainNoteBodyEmpty,
  toPlainNoteBody,
} from "@/lib/note-plain-text";
import {
  autosaveLabel,
  useNoteAutosave,
} from "@/lib/use-note-autosave";
import { useNoteFontSize } from "@/lib/use-note-font-size";
import { NoteFontSizeControls } from "@/components/note-font-size-controls";
import {
  MinimalNoteEditor,
  type MinimalNoteEditorHandle,
} from "@/components/minimal-note-editor";
import { sanitizeNoteHtml } from "@/lib/note-html";

function RefreshIcon({ spinning }: { spinning?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={spinning ? "animate-spin" : undefined}
    >
      <path d="M21 12a9 9 0 1 1-2.6-6.3" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

type LibraryTab = "active" | "archive";

export function NotesWorkspace({
  notes: initialNotes,
  archivedNotes: initialArchived = [],
  isLoggedIn = false,
  initialShowSaved = false,
}: {
  notes: Note[];
  archivedNotes?: Note[];
  isLoggedIn?: boolean;
  initialShowSaved?: boolean;
}) {
  const router = useRouter();
  const [notesProp, setNotesProp] = useState(initialNotes);
  const [archivedProp, setArchivedProp] = useState(initialArchived);
  const [notes, setNotes] = useState(initialNotes);
  const [archived, setArchived] = useState(initialArchived);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [showSaved, setShowSaved] = useState(initialShowSaved);
  const [libraryTab, setLibraryTab] = useState<LibraryTab>("active");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const bodyRef = useRef<MinimalNoteEditorHandle>(null);
  const creatingRef = useRef(false);
  const activeIdRef = useRef<string | null>(null);
  const syncActiveAfterRefreshRef = useRef(false);
  const [refreshing, setRefreshing] = useState(false);
  const { fontSize, setFontSize, shrink, grow } = useNoteFontSize();

  activeIdRef.current = activeId;

  const patch = useMemo(
    () => ({ title, body }),
    [title, body],
  );

  const { status: saveStatus, flush: flushAutosave, isDirty } = useNoteAutosave(
    isLoggedIn ? activeId : null,
    patch,
    isLoggedIn && !!activeId,
  );

  if (initialNotes !== notesProp || initialArchived !== archivedProp) {
    setNotesProp(initialNotes);
    setArchivedProp(initialArchived);
    setNotes(initialNotes);
    setArchived(initialArchived);
    if (syncActiveAfterRefreshRef.current) {
      syncActiveAfterRefreshRef.current = false;
      const id = activeIdRef.current;
      if (id) {
        const fresh = initialNotes.find((n) => n.id === id);
        if (fresh) {
          setTitle(fresh.title);
          setBody(sanitizeNoteHtml(fresh.body));
        }
      }
    }
  }

  const list = libraryTab === "active" ? notes : archived;
  const selectedCount = useMemo(
    () => list.filter((n) => selected.has(n.id)).length,
    [list, selected],
  );
  const allSelected = list.length > 0 && selectedCount === list.length;

  const clearSelection = useCallback(() => {
    setSelected(new Set());
  }, []);

  const handleRefresh = useCallback(async () => {
    if (!isLoggedIn || refreshing) return;
    setRefreshing(true);
    try {
      await flushAutosave();
      syncActiveAfterRefreshRef.current = true;
      router.refresh();
      setShowSaved(true);
      clearSelection();
    } finally {
      window.setTimeout(() => setRefreshing(false), 500);
    }
  }, [isLoggedIn, refreshing, flushAutosave, router, clearSelection]);

  // Avoid SSR/client mismatches (localStorage + browser extensions mutating inputs).
  useEffect(() => {
    setMounted(true);
    if (isLoggedIn) return;
    const draft = readGuestDraft();
    if (!draft) return;
    setTitle(draft.title);
    setBody(sanitizeNoteHtml(draft.body));
  }, [isLoggedIn]);

  // Guest / pre-create local draft
  useEffect(() => {
    if (!mounted) return;
    const t = window.setTimeout(() => {
      if (!title.trim() && isPlainNoteBodyEmpty(body)) {
        clearGuestDraft();
        return;
      }
      saveGuestDraft({ title, body: sanitizeNoteHtml(body), color: "#fef9c3" });
    }, 300);
    return () => window.clearTimeout(t);
  }, [mounted, title, body]);

  // Logged-in: create note on first content, then autosave hook takes over
  useEffect(() => {
    if (!mounted) return;
    if (!isLoggedIn || activeId || creatingRef.current) return;
    if (!title.trim() && isPlainNoteBodyEmpty(body)) return;

    const t = window.setTimeout(() => {
      void (async () => {
        if (creatingRef.current || activeId) return;
        creatingRef.current = true;
        setCreating(true);
        try {
          const plain = sanitizeNoteHtml(body);
          const id = await createNote(title.trim() || "Untitled", plain);
          setActiveId(id);
          setBody(plain);
          setNotes((prev) => [
            {
              id,
              user_id: "",
              title: title.trim() || "Untitled",
              body: plain,
              color: "#fef9c3",
              is_pinned: false,
              deleted_at: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            ...prev,
          ]);
          clearGuestDraft();
          router.refresh();
        } catch {
          /* ignore */
        } finally {
          creatingRef.current = false;
          setCreating(false);
        }
      })();
    }, 500);

    return () => window.clearTimeout(t);
  }, [mounted, isLoggedIn, activeId, title, body, router]);

  const startNew = useCallback(() => {
    setActiveId(null);
    setTitle("");
    setBody("");
    creatingRef.current = false;
    clearGuestDraft();
    queueMicrotask(() => bodyRef.current?.focus());
  }, []);

  const openNote = useCallback((note: Note) => {
    if (note.deleted_at) return;
    setActiveId(note.id);
    setTitle(note.title);
    setBody(sanitizeNoteHtml(note.body));
    setShowSaved(false);
    clearSelection();
    queueMicrotask(() => bodyRef.current?.focus());
  }, [clearSelection]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) {
      clearSelection();
      return;
    }
    setSelected(new Set(list.map((n) => n.id)));
  }

  function selectedIds() {
    return list.filter((n) => selected.has(n.id)).map((n) => n.id);
  }

  async function handleBulkArchive() {
    const ids = selectedIds();
    if (!ids.length || bulkBusy) return;
    setBulkBusy(true);
    try {
      await archiveNotes(ids);
      const moved = notes.filter((n) => ids.includes(n.id));
      setNotes((prev) => prev.filter((n) => !ids.includes(n.id)));
      setArchived((prev) => [
        ...moved.map((n) => ({
          ...n,
          deleted_at: new Date().toISOString(),
        })),
        ...prev,
      ]);
      if (activeId && ids.includes(activeId)) startNew();
      clearSelection();
      router.refresh();
    } finally {
      setBulkBusy(false);
    }
  }

  async function handleBulkRestore() {
    const ids = selectedIds();
    if (!ids.length || bulkBusy) return;
    setBulkBusy(true);
    try {
      await restoreNotes(ids);
      const moved = archived.filter((n) => ids.includes(n.id));
      setArchived((prev) => prev.filter((n) => !ids.includes(n.id)));
      setNotes((prev) => [
        ...moved.map((n) => ({ ...n, deleted_at: null })),
        ...prev,
      ]);
      clearSelection();
      router.refresh();
    } finally {
      setBulkBusy(false);
    }
  }

  async function handleBulkDelete() {
    const ids = selectedIds();
    if (!ids.length || bulkBusy) return;
    const label =
      libraryTab === "archive"
        ? `Permanently delete ${ids.length} note${ids.length === 1 ? "" : "s"}?`
        : `Delete ${ids.length} note${ids.length === 1 ? "" : "s"} permanently?`;
    if (!window.confirm(label)) return;
    setBulkBusy(true);
    try {
      await deleteNotes(ids);
      setNotes((prev) => prev.filter((n) => !ids.includes(n.id)));
      setArchived((prev) => prev.filter((n) => !ids.includes(n.id)));
      if (activeId && ids.includes(activeId)) startNew();
      clearSelection();
      router.refresh();
    } finally {
      setBulkBusy(false);
    }
  }

  function requestPersist() {
    if (isLoggedIn) return;
    saveGuestDraft({ title, body: sanitizeNoteHtml(body), color: "#fef9c3" });
    setAuthOpen(true);
  }

  const status = refreshing
    ? "Refreshing…"
    : creating || saveStatus === "pending" || saveStatus === "saving"
      ? "Saving…"
      : isDirty
        ? "Unsaved"
        : saveStatus === "saved"
          ? "Saved"
          : !isLoggedIn && (title.trim() || !isPlainNoteBodyEmpty(body))
            ? "Draft"
            : autosaveLabel(saveStatus);

  const refreshButton = (key: string) =>
    isLoggedIn ? (
      <button
        key={key}
        type="button"
        onClick={() => void handleRefresh()}
        disabled={refreshing}
        className="inline-flex size-8 items-center justify-center rounded-md text-stone-500 hover:bg-stone-200/70 disabled:opacity-50 dark:hover:bg-stone-800"
        title="Refresh notes"
        aria-label="Refresh notes"
      >
        <RefreshIcon spinning={refreshing} />
      </button>
    ) : null;

  if (!mounted) {
    return (
      <div
        className="relative flex h-[calc(100dvh-0px)] min-h-0 flex-1 flex-col"
        aria-hidden
      >
        <div className="h-11 shrink-0 border-b border-stone-200/80 dark:border-stone-800" />
      </div>
    );
  }

  return (
    <div className="relative flex h-[calc(100dvh-0px)] min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center gap-2 border-b border-stone-200/80 px-3 py-2 dark:border-stone-800">
        <button
          type="button"
          onClick={() => {
            setShowSaved((v) => !v);
            clearSelection();
          }}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
            showSaved
              ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
              : "text-stone-500 hover:bg-stone-200/70 dark:hover:bg-stone-800"
          }`}
          aria-pressed={showSaved}
        >
          Saved
        </button>
        <button
          type="button"
          onClick={startNew}
          className="rounded-md px-2.5 py-1 text-xs font-medium text-stone-500 hover:bg-stone-200/70 dark:hover:bg-stone-800"
        >
          New
        </button>
        {refreshButton("header-refresh")}
        {activeId && isLoggedIn ? (
          <button
            type="button"
            onClick={() => openNoteOutsideBrowser(activeId)}
            className="rounded-md px-2.5 py-1 text-xs font-medium text-stone-500 hover:bg-stone-200/70 dark:hover:bg-stone-800"
          >
            Open window
          </button>
        ) : null}
        <NoteFontSizeControls
          fontSize={fontSize}
          onChange={setFontSize}
          onShrink={shrink}
          onGrow={grow}
        />
        <span className="ml-auto text-[11px] text-stone-400" aria-live="polite">
          {status}
        </span>
        {!isLoggedIn ? (
          <button
            type="button"
            onClick={requestPersist}
            className="rounded-md px-2.5 py-1 text-xs font-medium text-stone-600 hover:bg-stone-200/70 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            Sign in to sync
          </button>
        ) : (
          <Link
            href="/settings"
            className="rounded-md px-2.5 py-1 text-xs font-medium text-stone-500 hover:bg-stone-200/70 dark:hover:bg-stone-800"
          >
            Settings
          </Link>
        )}
      </header>

      <div
        className="flex min-h-0 flex-1 cursor-text flex-col px-4 py-3 sm:px-6"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            bodyRef.current?.focus();
          }
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full shrink-0 border-0 bg-transparent font-semibold text-stone-900 outline-none placeholder:text-stone-400 dark:text-stone-50"
          style={{ fontSize: "14px", lineHeight: 1.3 }}
        />
        <MinimalNoteEditor
          ref={bodyRef}
          noteKey={activeId}
          content={body}
          onChange={setBody}
          fontSizePt={fontSize}
          placeholder="Start writing…"
          className="mt-2 text-stone-800 dark:text-stone-100"
          autoFocus
        />
      </div>

      {showSaved ? (
        <aside
          className="absolute inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col border-l border-stone-200 bg-[var(--background)] shadow-xl dark:border-stone-800"
          role="dialog"
          aria-label="Saved notes"
        >
          <div className="flex items-center gap-1 border-b border-stone-200 px-2 py-2 dark:border-stone-800">
            <p className="px-1 text-sm font-semibold text-stone-900 dark:text-stone-50">
              Library
            </p>
            <div className="ml-auto flex items-center gap-0.5">
              {refreshButton("library-refresh")}
              <button
                type="button"
                onClick={() => {
                  setShowSaved(false);
                  clearSelection();
                }}
                className="rounded-md px-2 py-1 text-xs text-stone-500 hover:bg-stone-200/70 dark:hover:bg-stone-800"
              >
                Close
              </button>
            </div>
          </div>

          <div className="flex gap-1 border-b border-stone-200 px-2 py-1.5 dark:border-stone-800">
            <button
              type="button"
              onClick={() => {
                setLibraryTab("active");
                clearSelection();
              }}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                libraryTab === "active"
                  ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                  : "text-stone-500 hover:bg-stone-200/70 dark:hover:bg-stone-800"
              }`}
            >
              Notes ({notes.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setLibraryTab("archive");
                clearSelection();
              }}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                libraryTab === "archive"
                  ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                  : "text-stone-500 hover:bg-stone-200/70 dark:hover:bg-stone-800"
              }`}
            >
              Archive ({archived.length})
            </button>
          </div>

          {isLoggedIn && list.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 px-3 py-2 dark:border-stone-800">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-stone-600 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="size-3.5 accent-stone-800"
                />
                {selectedCount > 0 ? `${selectedCount} selected` : "Select all"}
              </label>
              {selectedCount > 0 ? (
                <div className="ml-auto flex flex-wrap gap-1.5">
                  {libraryTab === "active" ? (
                    <button
                      type="button"
                      disabled={bulkBusy}
                      onClick={() => void handleBulkArchive()}
                      className="rounded-md px-2 py-1 text-[11px] font-medium text-stone-600 hover:bg-stone-200/70 disabled:opacity-50 dark:text-stone-300 dark:hover:bg-stone-800"
                    >
                      Archive
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={bulkBusy}
                      onClick={() => void handleBulkRestore()}
                      className="rounded-md px-2 py-1 text-[11px] font-medium text-stone-600 hover:bg-stone-200/70 disabled:opacity-50 dark:text-stone-300 dark:hover:bg-stone-800"
                    >
                      Restore
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={bulkBusy}
                    onClick={() => void handleBulkDelete()}
                    className="rounded-md px-2 py-1 text-[11px] font-medium text-red-600/90 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/40"
                  >
                    Delete
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="note-editor-scroll min-h-0 flex-1 overflow-y-auto p-2">
            {!isLoggedIn ? (
              <p className="px-2 py-6 text-center text-xs text-stone-500">
                Sign in to see synced notes.
              </p>
            ) : list.length === 0 ? (
              <p className="px-2 py-6 text-center text-xs text-stone-500">
                {libraryTab === "archive"
                  ? "Archive is empty."
                  : "No saved notes yet. Just start typing."}
              </p>
            ) : (
              <ul className="space-y-1">
                {list.map((note) => {
                  const isChecked = selected.has(note.id);
                  return (
                    <li
                      key={note.id}
                      className={`rounded-lg ${
                        isChecked
                          ? "bg-stone-200/70 dark:bg-stone-800"
                          : activeId === note.id && libraryTab === "active"
                            ? "bg-stone-200/50 dark:bg-stone-800/70"
                            : ""
                      }`}
                    >
                      <div className="flex items-start gap-2 px-2 py-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(note.id)}
                          className="mt-1 size-3.5 shrink-0 accent-stone-800"
                          aria-label={`Select ${note.title || "Untitled"}`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (libraryTab === "archive") {
                              toggleSelect(note.id);
                              return;
                            }
                            openNote(note);
                          }}
                          className="min-w-0 flex-1 rounded-md px-1 py-0.5 text-left transition hover:bg-stone-200/50 dark:hover:bg-stone-800"
                        >
                          <p className="truncate text-sm font-medium text-stone-900 dark:text-stone-50">
                            {note.title || "Untitled"}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-[11px] text-stone-500">
                            {toPlainNoteBody(note.body) || "Empty"}
                          </p>
                        </button>
                      </div>
                      {libraryTab === "active" ? (
                        <div className="flex gap-2 px-3 pb-2 pl-9">
                          <button
                            type="button"
                            className="text-[11px] text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                            onClick={() => openNoteOutsideBrowser(note.id)}
                          >
                            Window
                          </button>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
      ) : null}

      <AuthRequiredModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
