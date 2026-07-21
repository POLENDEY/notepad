-- Categories + soft-delete trash (30-day retention). Does not drop/alter finance tables.

create table if not exists public.notepad_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text not null default '#fef9c3',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notepad_notes
  add column if not exists category_id uuid references public.notepad_categories (id) on delete set null;

alter table public.notepad_notes
  add column if not exists deleted_at timestamptz;

create index if not exists notepad_categories_user_idx
  on public.notepad_categories (user_id, deleted_at, name);

create index if not exists notepad_notes_user_deleted_idx
  on public.notepad_notes (user_id, deleted_at, updated_at desc);

create index if not exists notepad_notes_category_idx
  on public.notepad_notes (category_id);

alter table public.notepad_categories enable row level security;

drop policy if exists "notepad_categories_all_own" on public.notepad_categories;
create policy "notepad_categories_all_own"
  on public.notepad_categories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists notepad_categories_updated_at on public.notepad_categories;
create trigger notepad_categories_updated_at
  before update on public.notepad_categories
  for each row execute function public.notepad_set_updated_at();
