# Notepad (Next.js + Supabase)

Personal notepad with **sign up**, **6-digit PIN sign-in**, **notes**, **tasks**, **calendar**, and **PIN change** in Settings.

## Setup

1. Copy env (already in `.env.local` from your Supabase project):

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only, for profile creation on signup)

2. Database tables use the `notepad_*` prefix only. Migration: `supabase/migrations/001_notepad_schema.sql` (already applied if you ran the setup script; safe to re-run — no drops).

3. Run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Auth

- **Sign up**: email + 6-digit PIN (confirmed). PIN is stored as the Supabase Auth password (min length satisfied by 6 digits).
- **Sign in**: email + PIN.
- **Change PIN**: Settings → verify current PIN, set new PIN.

## Performance

- Server Components + parallel `Promise.all` on the dashboard
- React `cache()` for session/profile
- Indexed columns on user_id + sort fields
- Link prefetch on navigation
- Turbopack dev server

## Finance project

This app only creates/uses `notepad_profiles`, `notepad_notes`, `notepad_tasks`, and `notepad_calendar_events`. It does **not** drop or alter existing finance tables.
