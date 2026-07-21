# Rich Text Note Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline; user requested immediate implementation).

**Goal:** Add TipTap rich text (bold, italic, underline, highlight, font size, lists, links) to compose, library edit, and pop-out while keeping minimalist UI.

**Architecture:** Shared `NoteEditor` stores sanitized HTML in existing `body` column. Server sanitizes on create/update. Previews use plain-text excerpts.

**Tech Stack:** TipTap React, `sanitize-html`, existing Next.js server actions.

## Global Constraints

- No DB migration; `body` remains text/HTML
- Minimal toolbar (not pill buttons)
- Surfaces: compose + lightbox + pop-out only
- Features: bold, italic, underline, highlight, S/M/L size, lists, links
- Sanitize on server; never unsanitized `dangerouslySetInnerHTML`

---

### Task 1: Dependencies + HTML helpers

**Files:**
- Modify: `package.json`
- Create: `src/lib/note-html.ts`

- [ ] Install TipTap packages + `sanitize-html` (+ types)
- [ ] Implement `isNoteBodyEmpty`, `noteBodyToPlainText`, `sanitizeNoteHtml`

### Task 2: NoteEditor component

**Files:**
- Create: `src/components/note-editor.tsx`
- Modify: `src/app/globals.css`

- [ ] TipTap editor + minimal toolbar
- [ ] Props: `value`, `onChange`, `placeholder`, `className`, `minHeight` / `variant`

### Task 3: Wire surfaces + sanitize actions

**Files:**
- Modify: `src/components/notes-board.tsx`
- Modify: `src/components/saved-notes-lightbox.tsx`
- Modify: `src/components/note-popout.tsx`
- Modify: `src/app/actions/notes.ts`

- [ ] Replace textareas with `NoteEditor`
- [ ] Sanitize body in create/update
- [ ] Use empty helpers for Save disabled / guest draft
- [ ] Plain-text excerpts on cards

### Task 4: Verify

- [ ] Lint / typecheck
- [ ] Manual sanity via existing patterns
