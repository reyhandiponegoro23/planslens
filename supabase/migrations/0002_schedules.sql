-- PlantLens AI: farm schedule (Jadwal & pengingat). Standalone: run this file on its own in the
-- Supabase SQL editor; it does not need 0001_init.sql.

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  -- tanam | pupuk | semprot | siram | panen | lainnya
  activity text not null default 'lainnya'
    check (activity in ('tanam', 'pupuk', 'semprot', 'siram', 'panen', 'lainnya')),
  field text check (char_length(field) <= 80),        -- lahan / tanaman, free text
  due_date date not null,
  repeat_days integer check (repeat_days between 1 and 365), -- null = no repeat
  note text check (char_length(note) <= 1000),
  done_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists schedules_user_due_idx on public.schedules (user_id, done_at, due_date);

alter table public.schedules enable row level security;

-- Each user sees and changes only their own schedule.
drop policy if exists "own schedules" on public.schedules;
create policy "own schedules" on public.schedules for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
