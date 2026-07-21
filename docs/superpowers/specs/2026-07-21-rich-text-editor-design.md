# Rich text note editor — design

**Date:** 2026-07-21  
**Status:** Approved for implementation planning  
**App:** Notepad (`c:\notepad`)

## Goal

Let users format note bodies with bold, italic, underline, highlight, font size, lists, and links while keeping the existing minimalist UI. Formatting works in **compose**, **library lightbox edit**, and **pop-out** windows.

## Non-goals

- Full word-processor features (tables, images, comments, collaboration)
- Changing note card / color UI beyond rendering formatted content safely
- Migrating existing rows (plain text remains valid)
- Formatting titles (title stays plain text)

## Approach

**TipTap (ProseMirror) + HTML stored in `notepad_notes.body`.**

- Shared `NoteEditor` client component for all write surfaces
- Slim formatting toolbar (text controls, quiet active state — not pill buttons)
- Server-side HTML sanitization on create/update
- No database schema change (`body` stays `text`)

## Surfaces

| Surface | Behavior |
| --- | --- |
| Notes compose (`notes-board`) | Controlled TipTap; state → `createNote` FormData |
| Library lightbox edit | TipTap + hidden `body` input → `updateNote` |
| Note pop-out | Same as lightbox edit |
| Card / list previews | Plain-text excerpt derived from HTML (no raw tags) |

Guest drafts (`localStorage`) store HTML the same way as logged-in compose state.

## Formatting set

| Feature | UI | Notes |
| --- | --- | --- |
| Bold | B | Ctrl/Cmd+B |
| Italic | I | Ctrl/Cmd+I |
| Underline | U | Ctrl/Cmd+U |
| Highlight | Mark | Single soft amber highlight color |
| Font size | S / M / L | TipTap text style; not free-form px picker |
| Bullet list | • | |
| Ordered list | 1. | |
| Link | Link | Prompt for URL; `target="_blank"` + `rel="noopener noreferrer"` when rendered |

## UI

- Toolbar sits directly above the body editor (under the title).
- Compact, low-chrome controls matching the text-style nav (active = subtle weight/underline or soft fill, not rounded pills).
- Empty editor shows “Start writing…” / “Write…” placeholder.
- No floating bubble menus or heavy card chrome around the toolbar.

## Data flow

1. Editor emits HTML via `onUpdate` / `getHTML()`.
2. Compose keeps HTML in React state; save posts `body` as today.
3. Form-based editors sync HTML into a hidden `input[name=body]`.
4. `createNote` / `updateNote` sanitize HTML before insert/update.
5. Empty detection: strip tags / treat empty `<p></p>` / `<p><br></p>` as empty so Save stays disabled correctly.

## Security

- Allowlist tags: `p`, `br`, `strong`, `b`, `em`, `i`, `u`, `mark`, `ul`, `ol`, `li`, `a`, `span`.
- Allowlist attrs: `a[href]` (http/https/mailto only), `span[style]` limited to font-size.
- Strip scripts, event handlers, `javascript:` URLs.
- Never render note HTML with unsanitized `dangerouslySetInnerHTML`. Previews use plain text; if any HTML display is needed later, sanitize first.

## Backward compatibility

- Existing plain-text bodies load as a single paragraph in TipTap.
- No SQL migration.
- Reading plain text as HTML excerpt still works (identity / light strip).

## Dependencies

- `@tiptap/react`, `@tiptap/pm`
- Extensions: starter-kit (subset), underline, highlight, link, text-style, font-size (or equivalent)
- HTML sanitizer suitable for Node/server actions (e.g. `sanitize-html` or isomorphic-dompurify) — pick one small, well-maintained package at implement time

## Files (expected)

| File | Role |
| --- | --- |
| `src/components/note-editor.tsx` | Shared TipTap editor + toolbar |
| `src/lib/note-html.ts` | Empty check, plain-text excerpt, sanitize helpers (client-safe + server) |
| `src/components/notes-board.tsx` | Compose uses `NoteEditor` |
| `src/components/saved-notes-lightbox.tsx` | Edit mode uses `NoteEditor` |
| `src/components/note-popout.tsx` | Uses `NoteEditor` |
| `src/app/actions/notes.ts` | Sanitize `body` on create/update |
| `src/app/globals.css` | Minimal prose styles for editor content |
| `package.json` | TipTap + sanitizer deps |

## Testing (manual)

- Format in compose → save → reopen in lightbox → formatting preserved
- Edit in lightbox and pop-out → save → reload
- Empty editor / empty HTML disables Save
- Guest draft with formatting restores after refresh
- Paste messy HTML → only allowlisted formatting remains
- Preview cards show text without visible tags
- Keyboard shortcuts work on desktop

## Success criteria

- Users can apply the full agreed formatting set on compose + edit surfaces
- UI stays minimal and consistent with current Notepad aesthetics
- No XSS via note body
- Existing notes continue to open and save without migration
