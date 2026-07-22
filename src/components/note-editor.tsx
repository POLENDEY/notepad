"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { Fragment, Slice } from "@tiptap/pm/model";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { TextStyle } from "@tiptap/extension-text-style";
import { FontSize } from "@tiptap/extension-text-style/font-size";
import { contrastForeground } from "@/lib/contrast";
import { ContrastHighlight } from "@/lib/contrast-highlight";
import { encodeNoteHtmlSpaces, noteBodyToEditorHtml } from "@/lib/note-html";

const DEFAULT_SIZE = 16;
const MIN_SIZE = 10;
const MAX_SIZE = 72;
const DEFAULT_HIGHLIGHT = "#fde68a";

function sameNoteHtml(a: string, b: string) {
  const norm = (html: string) =>
    html
      .replace(/\u00a0/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  return norm(a) === norm(b);
}

type NoteEditorProps = {
  value?: string;
  defaultValue?: string;
  onChange?: (html: string) => void;
  name?: string;
  placeholder?: string;
  className?: string;
  editorClassName?: string;
  minHeightClass?: string;
  maxHeightClass?: string;
  hideToolbar?: boolean;
};

export function NoteEditor({
  value,
  defaultValue = "",
  onChange,
  name,
  placeholder = "Start writing…",
  className = "",
  editorClassName = "",
  minHeightClass = "min-h-[9rem]",
  maxHeightClass = "max-h-[16rem]",
  hideToolbar = false,
}: NoteEditorProps) {
  const sizeInputId = useId();
  const highlightId = useId();
  const [highlightColor, setHighlightColor] = useState(DEFAULT_HIGHLIGHT);
  const [sizeDraft, setSizeDraft] = useState(String(DEFAULT_SIZE));
  const lastEmittedRef = useRef<string>("");

  const initial = useMemo(
    () => noteBodyToEditorHtml(value ?? defaultValue),
    // Mount content only; external resets use the controlled `value` effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        code: false,
      }),
      Underline,
      ContrastHighlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
          class: "note-link",
        },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TextStyle,
      FontSize,
      Placeholder.configure({ placeholder }),
    ],
    content: initial,
    editorProps: {
      attributes: {
        class: `note-editor-prose outline-none min-h-full ${minHeightClass} ${editorClassName}`,
      },
      handlePaste(view, event) {
        const text = event.clipboardData?.getData("text/plain");
        if (text == null) return false;

        const html = event.clipboardData?.getData("text/html") ?? "";
        event.preventDefault();

        let normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        if (html.trim()) {
          normalized = normalized.replace(/\n{2,}/g, "\n");
        }
        normalized = normalized.replace(/^\n+|\n+$/g, "");

        const { schema } = view.state;
        const lines = normalized.length ? normalized.split("\n") : [""];
        const nodes = lines.map((line) => {
          if (!line) return schema.nodes.paragraph.create();
          return schema.nodes.paragraph.create(null, schema.text(line));
        });

        const slice = Slice.maxOpen(Fragment.fromArray(nodes));
        view.dispatch(view.state.tr.replaceSelection(slice).scrollIntoView());
        return true;
      },
      transformPastedText(text) {
        return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      },
      clipboardTextParser(text, $context) {
        const schema = $context.doc.type.schema;
        let normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        normalized = normalized.replace(/\n{2,}/g, "\n").replace(/^\n+|\n+$/g, "");
        const lines = normalized.length ? normalized.split("\n") : [""];
        const nodes = lines.map((line) => {
          if (!line) return schema.nodes.paragraph.create();
          return schema.nodes.paragraph.create(null, schema.text(line));
        });
        return Slice.maxOpen(Fragment.fromArray(nodes));
      },
    },
    onUpdate: ({ editor: ed }) => {
      // Emit raw HTML while typing — encoding nbsp on every keystroke
      // rewrote controlled `value` and reset the cursor (broken spacebar).
      const html = ed.getHTML();
      lastEmittedRef.current = html;
      onChange?.(html);
    },
    onSelectionUpdate: ({ editor: ed }) => {
      const sizeAttr = ed.getAttributes("textStyle").fontSize as
        | string
        | undefined;
      const parsed = sizeAttr ? parseInt(sizeAttr, 10) : DEFAULT_SIZE;
      if (!Number.isNaN(parsed)) {
        setSizeDraft((prev) =>
          prev === String(parsed) ? prev : String(parsed),
        );
      }

      const markColor = ed.getAttributes("highlight").color as
        | string
        | undefined;
      if (markColor) {
        setHighlightColor((prev) => (prev === markColor ? prev : markColor));
      }
    },
  });

  useEffect(() => {
    if (!editor || value === undefined) return;
    if (value === lastEmittedRef.current) return;
    const current = editor.getHTML();
    if (value === current || sameNoteHtml(value, current)) return;
    const next = noteBodyToEditorHtml(value);
    if (next === current || sameNoteHtml(next, current)) return;
    editor.commands.setContent(next || "", { emitUpdate: false });
    lastEmittedRef.current = next;
  }, [editor, value]);

  function applyFontSize(raw: string) {
    if (!editor) return;
    const n = Number.parseInt(raw, 10);
    if (Number.isNaN(n)) return;
    const clamped = Math.min(MAX_SIZE, Math.max(MIN_SIZE, n));
    setSizeDraft(String(clamped));
    editor.chain().focus().setFontSize(`${clamped}px`).run();
  }

  function applyHighlight(color: string) {
    if (!editor) return;
    setHighlightColor(color);
    editor.chain().focus().setHighlight({ color }).run();
  }

  function setLink() {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    const trimmed = url.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: trimmed })
      .run();
  }

  const formHtml = encodeNoteHtmlSpaces(editor?.getHTML() ?? initial);
  const highlightActive = !!editor?.isActive("highlight");

  return (
    <div className={`note-editor flex min-h-0 flex-col ${className}`}>
      {name ? (
        <input type="hidden" name={name} value={formHtml} readOnly />
      ) : null}

      {!hideToolbar ? (
      <div
        className="note-editor-toolbar flex shrink-0 flex-wrap items-center gap-x-0.5 gap-y-1.5 border-b border-stone-200/70 pb-2 dark:border-stone-800"
        role="toolbar"
        aria-label="Text formatting"
      >
        <ToolBtn
          label="Bold"
          active={!!editor?.isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          B
        </ToolBtn>
        <ToolBtn
          label="Italic"
          active={!!editor?.isActive("italic")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className="italic"
        >
          I
        </ToolBtn>
        <ToolBtn
          label="Underline"
          active={!!editor?.isActive("underline")}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          className="underline"
        >
          U
        </ToolBtn>

        <span className="inline-flex items-center gap-1">
          <ToolBtn
            label="Highlight"
            active={highlightActive}
            onClick={() => {
              if (!editor) return;
              if (highlightActive) {
                editor.chain().focus().unsetHighlight().run();
              } else {
                editor
                  .chain()
                  .focus()
                  .setHighlight({ color: highlightColor })
                  .run();
              }
            }}
          >
            <span
              className="rounded-sm px-0.5 text-[11px] font-semibold"
              style={{
                backgroundColor: highlightColor,
                color: contrastForeground(highlightColor),
              }}
            >
              H
            </span>
          </ToolBtn>
          <label
            htmlFor={highlightId}
            className="inline-flex cursor-pointer items-center"
            title="Highlight color"
          >
            <span className="sr-only">Highlight color</span>
            <input
              id={highlightId}
              type="color"
              value={highlightColor}
              onChange={(e) => applyHighlight(e.target.value)}
              className="h-6 w-6 cursor-pointer rounded-md border border-stone-300 bg-transparent p-0 dark:border-stone-600"
            />
          </label>
        </span>

        <Sep />

        <label
          htmlFor={sizeInputId}
          className="inline-flex items-center gap-1 text-[12px] text-stone-500 dark:text-stone-400"
          title="Font size"
        >
          <span className="sr-only">Font size</span>
          <span aria-hidden>Size</span>
          <input
            id={sizeInputId}
            type="number"
            min={MIN_SIZE}
            max={MAX_SIZE}
            step={1}
            value={sizeDraft}
            onChange={(e) => setSizeDraft(e.target.value)}
            onBlur={(e) => applyFontSize(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyFontSize((e.target as HTMLInputElement).value);
              }
            }}
            className="w-12 rounded-md border-0 bg-stone-100/80 px-1.5 py-0.5 text-center text-[12px] font-medium text-stone-800 outline-none focus:ring-1 focus:ring-stone-300 dark:bg-stone-800 dark:text-stone-100 dark:focus:ring-stone-600"
          />
        </label>

        <Sep />

        <ToolBtn
          label="Bullet list"
          active={!!editor?.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <IconBulletList />
        </ToolBtn>
        <ToolBtn
          label="Numbered list"
          active={!!editor?.isActive("orderedList")}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <IconOrderedList />
        </ToolBtn>
        <ToolBtn
          label="Checklist"
          active={!!editor?.isActive("taskList")}
          onClick={() => editor?.chain().focus().toggleTaskList().run()}
        >
          <IconTaskList />
        </ToolBtn>
        <ToolBtn
          label="Decrease indent"
          active={false}
          onClick={() => {
            if (!editor) return;
            const type = editor.isActive("taskItem") ? "taskItem" : "listItem";
            editor.chain().focus().liftListItem(type).run();
          }}
        >
          <IconOutdent />
        </ToolBtn>
        <ToolBtn
          label="Increase indent"
          active={false}
          onClick={() => {
            if (!editor) return;
            const type = editor.isActive("taskItem") ? "taskItem" : "listItem";
            editor.chain().focus().sinkListItem(type).run();
          }}
        >
          <IconIndent />
        </ToolBtn>

        <Sep />

        <ToolBtn
          label="Link"
          active={!!editor?.isActive("link")}
          onClick={setLink}
        >
          Link
        </ToolBtn>
      </div>
      ) : null}

      <div
        className={`note-editor-scroll min-h-0 flex-1 cursor-text overflow-y-auto overflow-x-hidden pr-1 ${
          hideToolbar ? "mt-0" : "mt-3"
        } ${maxHeightClass}`}
        onMouseDown={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest(".ProseMirror")) return;
          e.preventDefault();
          editor?.chain().focus("end").run();
        }}
      >
        <EditorContent editor={editor} className="h-full min-h-full" />
      </div>
    </div>
  );
}

function Sep() {
  return (
    <span
      className="mx-1 h-3 w-px bg-stone-200 dark:bg-stone-700"
      aria-hidden
    />
  );
}

function ToolBtn({
  label,
  active,
  onClick,
  children,
  className = "",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex min-w-[1.65rem] items-center justify-center px-1.5 py-0.5 text-[13px] tracking-wide transition ${
        active
          ? "font-semibold text-stone-900 dark:text-stone-50"
          : "font-medium text-stone-400 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-200"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function IconBulletList() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="3" cy="4" r="1.15" fill="currentColor" />
      <circle cx="3" cy="8" r="1.15" fill="currentColor" />
      <circle cx="3" cy="12" r="1.15" fill="currentColor" />
      <path
        d="M6.5 4h7M6.5 8h7M6.5 12h7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconOrderedList() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2.2 3.2h1.3M2.8 3.2v3.2M2.2 6.4h1.3"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.2 9.1c.45-.55 1.35-.55 1.35.2 0 .7-1.35 1.05-1.35 1.9h1.55"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 4h7M6.5 8h7M6.5 12h7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconTaskList() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect
        x="2"
        y="2.5"
        width="4.5"
        height="4.5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M3.2 4.8l1.1 1.1 1.7-1.9"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 4.75h5.5M2.5 11.25h11.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconIndent() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2.5 3.5h11M8 8h5.5M2.5 12.5h11"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M2.5 8h3.2m0 0L4.2 6.5M5.7 8L4.2 9.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconOutdent() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2.5 3.5h11M8 8h5.5M2.5 12.5h11"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M5.7 8H2.5m0 0L4 6.5M2.5 8L4 9.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
