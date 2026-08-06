"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import HardBreak from "@tiptap/extension-hard-break";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import {
  escapeText,
  noteHtmlForEditor,
  plainTextToInlineHtml,
  sanitizeNoteHtml,
} from "@/lib/note-html";
import { toPlainNoteBody } from "@/lib/note-plain-text";

export type MinimalNoteEditorHandle = {
  focus: () => void;
};

type Props = {
  content: string;
  onChange: (html: string) => void;
  fontSizePt: number;
  placeholder?: string;
  noteKey?: string | null;
  className?: string;
  autoFocus?: boolean;
};

const bubbleBtn =
  "inline-flex size-7 items-center justify-center rounded text-[12px] font-medium text-stone-600 transition hover:bg-stone-200/80 data-[active=true]:bg-stone-900 data-[active=true]:text-white dark:text-stone-300 dark:hover:bg-stone-700 dark:data-[active=true]:bg-stone-100 dark:data-[active=true]:text-stone-900";

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      "button, input, textarea, a, label, select, .note-format-bubble",
    ),
  );
}

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
    const editorRef = useRef<Editor | null>(null);

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
          hardBreak: false,
        }),
        HardBreak.extend({
          addKeyboardShortcuts() {
            return {
              Enter: () => this.editor.commands.setHardBreak(),
              "Shift-Enter": () => this.editor.commands.splitBlock(),
            };
          },
        }),
        Underline,
        Highlight.configure({ multicolor: false }),
        Placeholder.configure({ placeholder }),
      ],
      content: noteHtmlForEditor(content),
      onCreate: ({ editor: ed }) => {
        editorRef.current = ed;
      },
      editorProps: {
        attributes: {
          class:
            "note-paper-prose tiptap min-h-full w-full outline-none focus:outline-none",
        },
        // One visual line → one `\n` when copying as plain text
        clipboardTextSerializer: (slice) =>
          slice.content.textBetween(0, slice.content.size, "\n", "\n"),
        handlePaste: (_view, event) => {
          const clip = event.clipboardData;
          if (!clip) return false;
          const html = clip.getData("text/html");
          const text = clip.getData("text/plain");
          if (!html && !text) return false;
          // Paste as inline + <br> only — never create extra paragraphs
          const plain = html
            ? toPlainNoteBody(sanitizeNoteHtml(html))
            : text.replace(/\r\n?/g, "\n");
          event.preventDefault();
          editorRef.current?.commands.insertContent(
            plainTextToInlineHtml(plain),
          );
          return true;
        },
        handleDOMEvents: {
          copy(view, event) {
            const clip = event.clipboardData;
            if (!clip || view.state.selection.empty) return false;
            const text = view.state.doc.textBetween(
              view.state.selection.from,
              view.state.selection.to,
              "\n",
              "\n",
            );
            clip.setData("text/plain", text);
            clip.setData(
              "text/html",
              `<meta charset="utf-8"><p>${escapeText(text).replace(/\n/g, "<br>")}</p>`,
            );
            event.preventDefault();
            return true;
          },
          cut(view, event) {
            const clip = event.clipboardData;
            if (!clip || view.state.selection.empty) return false;
            const text = view.state.doc.textBetween(
              view.state.selection.from,
              view.state.selection.to,
              "\n",
              "\n",
            );
            clip.setData("text/plain", text);
            clip.setData(
              "text/html",
              `<meta charset="utf-8"><p>${escapeText(text).replace(/\n/g, "<br>")}</p>`,
            );
            event.preventDefault();
            view.dispatch(view.state.tr.deleteSelection().scrollIntoView());
            return true;
          },
        },
      },
      onUpdate: ({ editor: ed }) => {
        onChange(sanitizeNoteHtml(ed.getHTML()));
      },
    });

    useEffect(() => {
      editorRef.current = editor;
    }, [editor]);

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
          className={`min-h-0 flex-1 cursor-text ${className}`}
          style={{ fontSize: `${fontSizePt}pt`, lineHeight: 1.15 }}
        />
      );
    }

    return (
      <div
        className={`note-editor-scroll relative min-h-0 flex-1 cursor-text overflow-y-auto ${className}`}
        style={{ fontSize: `${fontSizePt}pt`, lineHeight: 1.15 }}
        onMouseDown={(e) => {
          if (isInteractiveTarget(e.target)) return;
          if (e.target instanceof Element && e.target.closest(".ProseMirror")) {
            return;
          }
          e.preventDefault();
          editor.commands.focus("end");
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
        <EditorContent editor={editor} className="min-h-full h-full" />
      </div>
    );
  },
);
