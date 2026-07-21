-- Notepad app tables only (does not modify or drop any existing tables)

create table if not exists public.notepad_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  pin_set_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notepad_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '',
  body text not null default '',
  color text not null default '#fef9c3',
  is_pinned boolean not null default false,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notepad_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text not null default '',
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notepad_calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text not null default '',
  start_at timestamptz not null,
  end_at timestamptz,
  all_day boolean not null default false,
  color text not null default '#6366f1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notepad_notes_user_updated_idx on public.notepad_notes (user_id, updated_at desc);
create index if not exists notepad_tasks_user_status_idx on public.notepad_tasks (user_id, status, due_date);
create index if not exists notepad_calendar_user_start_idx on public.notepad_calendar_events (user_id, start_at);

alter table public.notepad_profiles enable row level security;
alter table public.notepad_notes enable row level security;
alter table public.notepad_tasks enable row level security;
alter table public.notepad_calendar_events enable row level security;

create policy "notepad_profiles_select_own"
  on public.notepad_profiles for select
  using (auth.uid() = id);

create policy "notepad_profiles_insert_own"
  on public.notepad_profiles for insert
  with check (auth.uid() = id);

create policy "notepad_profiles_update_own"
  on public.notepad_profiles for update
  using (auth.uid() = id);

create policy "notepad_notes_all_own"
  on public.notepad_notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "notepad_tasks_all_own"
  on public.notepad_tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "notepad_calendar_all_own"
  on public.notepad_calendar_events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.notepad_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notepad_notes_updated_at on public.notepad_notes;
create trigger notepad_notes_updated_at
  before update on public.notepad_notes
  for each row execute function public.notepad_set_updated_at();

drop trigger if exists notepad_tasks_updated_at on public.notepad_tasks;
create trigger notepad_tasks_updated_at
  before update on public.notepad_tasks
  for each row execute function public.notepad_set_updated_at();

drop trigger if exists notepad_calendar_updated_at on public.notepad_calendar_events;
create trigger notepad_calendar_updated_at
  before update on public.notepad_calendar_events
  for each row execute function public.notepad_set_updated_at();

drop trigger if exists notepad_profiles_updated_at on public.notepad_profiles;
create trigger notepad_profiles_updated_at
  before update on public.notepad_profiles
  for each row execute function public.notepad_set_updated_at();
