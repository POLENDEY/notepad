"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type DragEvent,
} from "react";
import type { Note, NoteCategory } from "@/lib/types";
import {
  autosaveNote,
  createNote,
  deleteCategory,
  deleteNote,
  reorderCategories,
  updateCategory,
} from "@/app/actions/notes";
import { ColorWheel } from "@/components/color-wheel";
import { SavedNotesLightbox } from "@/components/saved-notes-lightbox";
import { AuthRequiredModal } from "@/components/auth-required-modal";
import { contrastStyle, isDarkBackground } from "@/lib/contrast";
import {
  clearGuestDraft,
  readGuestDraft,
  saveGuestDraft,
} from "@/lib/guest-draft";
import { isNoteBodyEmpty } from "@/lib/note-html";
import { NoteEditor } from "@/components/note-editor";
import { NoteExportMenu } from "@/components/note-export-menu";

type SaveMode = "quick" | "category" | null;

export function NotesBoard({
  notes,
  categories: initialCategories,
  initialLibraryOpen = false,
  isLoggedIn = false,
}: {
  notes: Note[];
  categories: NoteCategory[];
  initialLibraryOpen?: boolean;
  isLoggedIn?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<string>("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [color, setColor] = useState("#fef3c7");
  const [saveMode, setSaveMode] = useState<SaveMode>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#dbeafe");
  const [draftCategories, setDraftCategories] = useState<NoteCategory[] | null>(
    null,
  );
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(initialLibraryOpen);
  const [libraryProp, setLibraryProp] = useState(initialLibraryOpen);
  const dragIdRef = useRef<string | null>(null);
  const restoredRef = useRef(false);
  const [autoNoteId, setAutoNoteId] = useState<string | null>(null);
  const creatingRef = useRef(false);

  if (initialLibraryOpen !== libraryProp) {
    setLibraryProp(initialLibraryOpen);
    if (initialLibraryOpen) setLibraryOpen(true);
  }

  const categories = draftCategories ?? initialCategories;

  useEffect(() => {
    if (restoredRef.current) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled || restoredRef.current) return;
      const draft = readGuestDraft();
      if (!draft) return;
      restoredRef.current = true;
      setTitle(draft.title);
      setBody(draft.body);
      setColor(draft.color || "#fef3c7");
      if (isLoggedIn) {
        clearGuestDraft();
        setSaveMode("quick");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  function resetComposer() {
    setTitle("");
    setBody("");
    setColor("#fef3c7");
    setSaveMode(null);
    setCategoryId("");
    setNewCategoryName("");
    setNewCategoryColor("#dbeafe");
    setAutoNoteId(null);
    creatingRef.current = false;
    clearGuestDraft();
  }

  const bodyEmpty = isNoteBodyEmpty(body);

  // Autosave draft locally (including spaces) for guests and logged-in compose
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!title.trim() && bodyEmpty) {
        clearGuestDraft();
        return;
      }
      saveGuestDraft({ title, body, color });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [title, body, color, bodyEmpty]);

  // Logged-in: also persist compose draft to the server
  useEffect(() => {
    if (!isLoggedIn) return;
    if (!title.trim() && bodyEmpty) return;

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          if (!autoNoteId) {
            if (creatingRef.current) return;
            creatingRef.current = true;
            const fd = new FormData();
            fd.set("title", title.trim() || "Untitled");
            fd.set("body", body);
            fd.set("color", color);
            fd.set("saveMode", "quick");
            const id = await createNote(fd);
            setAutoNoteId(id);
            creatingRef.current = false;
            return;
          }
          await autosaveNote(autoNoteId, {
            title: title.trim() || "Untitled",
            body,
            color,
            categoryId: null,
          });
        } catch {
          creatingRef.current = false;
        }
      })();
    }, 700);

    return () => window.clearTimeout(timer);
  }, [isLoggedIn, title, body, color, bodyEmpty, autoNoteId]);

  function requestSave() {
    if (!title.trim() && bodyEmpty) return;
    if (!isLoggedIn) {
      saveGuestDraft({ title, body, color });
      setAuthOpen(true);
      return;
    }
    setSaveMode("quick");
  }

  function submitSave(mode: "quick" | "category") {
    if (!isLoggedIn) {
      saveGuestDraft({ title, body, color });
      setSaveMode(null);
      setAuthOpen(true);
      return;
    }
    if (!title.trim() && bodyEmpty) return;

    startTransition(async () => {
      // Autosave already created a note — finalize instead of duplicating
      if (autoNoteId && mode === "quick") {
        await autosaveNote(autoNoteId, {
          title: title.trim() || "Untitled",
          body,
          color,
          categoryId: null,
        });
        resetComposer();
        return;
      }

      if (autoNoteId && mode === "category") {
        if (categoryId) {
          await autosaveNote(autoNoteId, {
            title: title.trim() || "Untitled",
            body,
            color,
            categoryId,
          });
          resetComposer();
          return;
        }
        if (newCategoryName.trim()) {
          const fd = new FormData();
          fd.set("title", title.trim() || "Untitled");
          fd.set("body", body);
          fd.set("saveMode", "category");
          fd.set("newCategoryName", newCategoryName);
          fd.set("newCategoryColor", newCategoryColor);
          fd.set("color", newCategoryColor);
          const newId = await createNote(fd);
          if (newId !== autoNoteId) await deleteNote(autoNoteId);
          resetComposer();
          return;
        }
      }

      const fd = new FormData();
      fd.set("title", title.trim() || "Untitled");
      fd.set("body", body);
      fd.set("saveMode", mode);
      if (mode === "category") {
        fd.set("categoryId", categoryId);
        fd.set("newCategoryName", newCategoryName);
        fd.set("newCategoryColor", newCategoryColor);
        fd.set(
          "color",
          categoryId ? color : newCategoryName ? newCategoryColor : color,
        );
      } else {
        fd.set("color", color);
      }
      await createNote(fd);
      resetComposer();
    });
  }

  function handleDragStart(e: DragEvent, id: string) {
    dragIdRef.current = id;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    // Improve drag image UX
    if (e.currentTarget instanceof HTMLElement) {
      e.dataTransfer.setDragImage(e.currentTarget, 20, 16);
    }
  }

  function handleDragOver(e: DragEvent, overId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const dragId = dragIdRef.current;
    if (!dragId || dragId === overId) return;
    setDragOverId(overId);

    setDraftCategories((prev) => {
      const base = prev ?? initialCategories;
      const from = base.findIndex((c) => c.id === dragId);
      const to = base.findIndex((c) => c.id === overId);
      if (from < 0 || to < 0 || from === to) return prev ?? base;
      const next = [...base];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    finishReorder();
  }

  function handleDragEnd() {
    finishReorder();
  }

  function finishReorder() {
    if (!dragIdRef.current && !draftCategories) {
      setDragOverId(null);
      return;
    }
    const ids = (draftCategories ?? initialCategories).map((c) => c.id);
    const serverIds = initialCategories.map((c) => c.id);
    dragIdRef.current = null;
    setDragOverId(null);
    if (ids.join() === serverIds.join()) return;
    startTransition(async () => {
      await reorderCategories(ids);
    });
  }

  const noteCount = useMemo(() => notes.length, [notes.length]);

  return (
    <div className="space-y-10 pb-24 lg:pb-10">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-100 via-white to-amber-50 p-6 shadow-sm ring-1 ring-stone-200/70 dark:from-stone-900 dark:via-stone-950 dark:to-stone-900 dark:ring-stone-800">
        <div className="mb-4">
          <p className="text-xs font-medium tracking-[0.14em] text-stone-500 uppercase">
            Write
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            Draft a note
          </h2>
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full border-0 bg-transparent text-2xl font-semibold text-stone-900 outline-none placeholder:text-stone-400 dark:text-stone-50"
        />
        <NoteEditor
          value={body}
          onChange={setBody}
          placeholder="Start writing…"
          className="mt-3"
          maxHeightClass="max-h-[18rem]"
          editorClassName="text-base leading-relaxed text-stone-700 dark:text-stone-200"
        />

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-stone-200/80 pt-4 dark:border-stone-800">
          <label className="inline-flex items-center gap-2 text-xs text-stone-600 dark:text-stone-300">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded-md border-0 bg-transparent p-0"
            />
            Card color
          </label>
          <NoteExportMenu
            className="ml-auto"
            title={title}
            bodyHtml={body}
            disabled={bodyEmpty && !title.trim()}
          />
          <button
            type="button"
            disabled={pending || (!title.trim() && bodyEmpty)}
            onClick={requestSave}
            className="btn-primary"
          >
            Save note
          </button>
        </div>

        {!isLoggedIn ? (
          <p className="mt-3 text-xs text-stone-400">
            Guests can write freely. Sign in is only required to save.
          </p>
        ) : null}

        {saveMode ? (
          <div className="absolute inset-0 z-10 flex items-end bg-stone-900/25 p-4 backdrop-blur-[2px] sm:items-center sm:justify-center">
            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-stone-950">
              <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
                How do you want to save?
              </h3>
              <p className="mt-1 text-sm text-stone-500">
                Quick save goes to General. Or save with a category (create one
                here if you need it).
              </p>

              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => submitSave("quick")}
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 text-left transition hover:border-stone-400 dark:border-stone-700"
                >
                  <span className="block text-sm font-semibold text-stone-900 dark:text-stone-50">
                    Quick save
                  </span>
                  <span className="mt-0.5 block text-xs text-stone-500">
                    Saves to General notes (no category)
                  </span>
                </button>

                <div className="rounded-xl border border-stone-200 p-4 dark:border-stone-700">
                  <p className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                    Save with category
                  </p>
                  <p className="mt-0.5 text-xs text-stone-500">
                    Use an existing category or create one now.
                  </p>

                  {categories.length > 0 ? (
                    <select
                      value={categoryId}
                      onChange={(e) => {
                        setCategoryId(e.target.value);
                        if (e.target.value) setNewCategoryName("");
                      }}
                      className="field mt-3"
                    >
                      <option value="">Choose existing…</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  ) : null}

                  <div className="mt-3 space-y-2">
                    <p className="text-[11px] font-medium tracking-wide text-stone-400 uppercase">
                      Or create category
                    </p>
                    <input
                      value={newCategoryName}
                      onChange={(e) => {
                        setNewCategoryName(e.target.value);
                        if (e.target.value) setCategoryId("");
                      }}
                      placeholder="New category name"
                      className="field"
                    />
                    <label className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-300">
                      <input
                        type="color"
                        value={newCategoryColor}
                        onChange={(e) => setNewCategoryColor(e.target.value)}
                        className="h-8 w-8 cursor-pointer rounded-md border-0 bg-transparent p-0"
                      />
                      Category color
                    </label>
                  </div>

                  <button
                    type="button"
                    disabled={
                      pending || (!categoryId && !newCategoryName.trim())
                    }
                    onClick={() => submitSave("category")}
                    className="btn-primary mt-3 w-full"
                  >
                    Save with category
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSaveMode(null)}
                className="mt-4 w-full text-sm text-stone-500 hover:text-stone-800"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-[0.14em] text-stone-500 uppercase">
              Organize
            </p>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
              Categories
            </h2>
          </div>
          <p className="text-xs text-stone-400">Drag the ⋮⋮ handle to rearrange</p>
        </div>

        <div
          className="flex flex-wrap gap-2"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`chip ${filter === "all" ? "chip-active" : "chip-idle"}`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter("general")}
            className={`chip ${filter === "general" ? "chip-active" : "chip-idle"}`}
          >
            General
          </button>

          {categories.map((cat) => (
            <div
              key={cat.id}
              onDragOver={(e) => handleDragOver(e, cat.id)}
              className={`group flex items-center gap-0.5 rounded-full border pr-1 transition ${
                dragOverId === cat.id
                  ? "border-indigo-500 ring-2 ring-indigo-300"
                  : "border-transparent"
              }`}
              style={contrastStyle(cat.color)}
            >
              <span
                draggable
                onDragStart={(e) => handleDragStart(e, cat.id)}
                onDragEnd={handleDragEnd}
                title="Drag to rearrange"
                className="cursor-grab select-none px-2 py-1.5 text-xs tracking-tighter opacity-70 active:cursor-grabbing"
                aria-label={`Drag ${cat.name}`}
              >
                ⋮⋮
              </span>
              <button
                type="button"
                onClick={() => setFilter(cat.id)}
                className={`rounded-full px-2.5 py-1.5 text-sm font-medium ${
                  filter === cat.id ? "underline decoration-2 underline-offset-4" : ""
                } ${isDarkBackground(cat.color) ? "text-stone-50" : "text-stone-800"}`}
              >
                {cat.name}
              </button>
              <details className="relative">
                <summary
                  className={`cursor-pointer list-none px-2 text-[11px] opacity-70 transition group-hover:opacity-100 ${
                    isDarkBackground(cat.color) ? "text-stone-200" : "text-stone-600"
                  }`}
                >
                  ···
                </summary>
                <form
                  action={(fd) =>
                    startTransition(() => updateCategory(cat.id, fd))
                  }
                  className="absolute right-0 z-20 mt-1 w-52 space-y-2 rounded-xl border border-stone-200 bg-white p-3 shadow-lg dark:border-stone-700 dark:bg-stone-950"
                >
                  <input
                    name="name"
                    defaultValue={cat.name}
                    className="w-full rounded-md border border-stone-200 px-2 py-1 text-sm dark:border-stone-600 dark:bg-stone-900"
                  />
                  <ColorWheel name="color" defaultValue={cat.color} />
                  <button
                    type="submit"
                    className="btn-primary w-full py-1 text-xs"
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    className="w-full text-xs text-red-600"
                    onClick={() =>
                      startTransition(() => deleteCategory(cat.id))
                    }
                  >
                    Move to trash
                  </button>
                </form>
              </details>
            </div>
          ))}
        </div>
        {categories.length === 0 ? (
          <p className="mt-2 text-sm text-stone-400">
            Categories appear when you save a note with a new category.
          </p>
        ) : null}
      </section>

      {/* Desktop FAB — signed-in only */}
      {isLoggedIn ? (
        <button
          type="button"
          onClick={() => setLibraryOpen(true)}
          className="btn-primary fixed right-5 bottom-5 z-40 hidden h-14 w-14 p-0 lg:flex"
          aria-label="Open saved notes"
          title="Saved notes"
        >
          <span className="text-lg font-semibold">
            {noteCount > 99 ? "99+" : noteCount}
          </span>
        </button>
      ) : null}

      {isLoggedIn ? (
        <p className="text-center text-xs text-stone-400 lg:hidden">
          Open saved notes from the{" "}
          <span className="font-medium">Saved</span> item in the menu.
        </p>
      ) : null}

      <SavedNotesLightbox
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        notes={notes}
        categories={categories}
        filter={filter}
        onFilterChange={setFilter}
      />

      <AuthRequiredModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        nextPath="/notes"
      />
    </div>
  );
}
