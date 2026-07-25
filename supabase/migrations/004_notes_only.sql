-- Notes-only cleanup: drop unused modules. Does not touch non-notepad tables.

-- Clear category FKs before dropping categories
alter table if exists public.notepad_notes
  drop constraint if exists notepad_notes_category_id_fkey;

alter table if exists public.notepad_notes
  drop column if exists category_id;

drop table if exists public.notepad_categories cascade;
drop table if exists public.notepad_tasks cascade;
drop table if exists public.notepad_calendar_events cascade;
