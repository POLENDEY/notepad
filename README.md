# Notepad (Next.js + Supabase)

Fast personal notes: write immediately, autosave, open in an OS window. Sign up / 6-digit PIN when you want sync.

## Setup

1. Env in `.env.local`:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or publishable key)
   - `SUPABASE_SERVICE_ROLE_KEY` (signup profile creation)

2. Apply migrations in `supabase/migrations/` (including `004_notes_only.sql` which drops tasks/calendar/categories).

3. Run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → Notes.

## Notes

- Plain textarea, **11px** default
- **Saved** panel only when toggled (no distraction while writing)
- Autosave while typing
- **Open window** for a real OS window outside the browser

## Auth

- Sign up / sign in with email + 6-digit PIN
- Change PIN in Settings

## Database

Only `notepad_profiles` and `notepad_notes`. Does **not** modify finance tables.
