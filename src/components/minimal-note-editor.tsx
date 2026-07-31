"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
} from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { noteHtmlForEditor, sanitizeNoteHtml } from "@/lib/note-html";

export type MinimalNoteEditorHandle = {
  focus: () => void;
};

type Props = {
  content: string;
  onChange: (html: string) => void;
  fontSizePt: number;
  placeholder?: string;
  /** Remount / sync when switching notes */
  noteKey?: string | null;
  className?: string;
  autoFocus?: boolean;
};

const bubbleBtn =
  "inline-flex size-7 items-center justify-center rounded text-[12px] font-medium text-stone-600 transition hover:bg-stone-200/80 data-[active=true]:bg-stone-900 data-[active=true]:text-white dark:text-stone-300 dark:hover:bg-stone-700 dark:data-[active=true]:bg-stone-100 dark:data-[active=true]:text-stone-900";

export const MinimalNoteEditor = forwardRef<MinimalNoteEditorHandle, Props>(
  function MinimalNoteEditor(
    {
      content,
      onChange,
      fontSizePt,
      placeholder = "Start writing…",
      noteKey = null,
      className = "",
      autoFocus = false,
    },
    ref,
  ) {
    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: false,
          blockquote: false,
          codeBlock: false,
          horizontalRule: false,
          bulletList: false,
          orderedList: false,
          listItem: false,
          code: false,
        }),
        Underline,
        Highlight.configure({ multicolor: false }),
        Placeholder.configure({ placeholder }),
      ],
      content: noteHtmlForEditor(content),
      editorProps: {
        attributes: {
          class:
            "note-paper-prose min-h-full w-full outline-none focus:outline-none",
        },
      },
      onUpdate: ({ editor: ed }) => {
        onChange(sanitizeNoteHtml(ed.getHTML()));
      },
    });

    useImperativeHandle(
      ref,
      () => ({
        focus: () => editor?.commands.focus("end"),
      }),
      [editor],
    );

    useEffect(() => {
      if (!editor) return;
      const next = noteHtmlForEditor(content);
      const current = sanitizeNoteHtml(editor.getHTML());
      if (current === sanitizeNoteHtml(next)) return;
      editor.commands.setContent(next, { emitUpdate: false });
      // eslint-disable-next-line react-hooks/exhaustive-deps -- sync only when note switches
    }, [editor, noteKey]);

    useEffect(() => {
      if (autoFocus && editor) {
        queueMicrotask(() => editor.commands.focus("end"));
      }
    }, [autoFocus, editor]);

    if (!editor) {
      return (
        <div
          className={`min-h-0 flex-1 ${className}`}
          style={{ fontSize: `${fontSizePt}pt`, lineHeight: 1.15 }}
        />
      );
    }

    return (
      <div
        className={`note-editor-scroll relative min-h-0 flex-1 overflow-y-auto ${className}`}
        style={{ fontSize: `${fontSizePt}pt`, lineHeight: 1.15 }}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            editor.commands.focus("end");
          }
        }}
      >
        <BubbleMenu
          editor={editor}
          options={{ placement: "top", offset: 8 }}
          className="note-format-bubble flex items-center gap-0.5 rounded-lg border border-stone-200/90 bg-[var(--background)]/95 px-1 py-0.5 shadow-md backdrop-blur-sm dark:border-stone-700"
        >
          <button
            type="button"
            className={bubbleBtn}
            data-active={editor.isActive("bold") ? "true" : "false"}
            onClick={() => editor.chain().focus().toggleBold().run()}
            aria-label="Bold"
            title="Bold (Ctrl+B)"
          >
            <span className="font-bold">B</span>
          </button>
          <button
            type="button"
            className={bubbleBtn}
            data-active={editor.isActive("italic") ? "true" : "false"}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            aria-label="Italic"
            title="Italic (Ctrl+I)"
          >
            <span className="italic">I</span>
          </button>
          <button
            type="button"
            className={bubbleBtn}
            data-active={editor.isActive("underline") ? "true" : "false"}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            aria-label="Underline"
            title="Underline (Ctrl+U)"
          >
            <span className="underline">U</span>
          </button>
          <button
            type="button"
            className={bubbleBtn}
            data-active={editor.isActive("highlight") ? "true" : "false"}
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            aria-label="Highlight"
            title="Highlight"
          >
            <span className="rounded-sm bg-amber-200/90 px-0.5 text-[11px] dark:bg-amber-500/40">
              A
            </span>
          </button>
        </BubbleMenu>
        <EditorContent editor={editor} className="min-h-full" />
      </div>
    );
  },
);
