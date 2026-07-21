-- Category drag order. Safe: only notepad_* tables.

alter table public.notepad_categories
  add column if not exists sort_order integer not null default 0;

create index if not exists notepad_categories_user_sort_idx
  on public.notepad_categories (user_id, sort_order, name);
