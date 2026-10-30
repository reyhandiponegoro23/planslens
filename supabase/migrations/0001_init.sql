-- PlantLens AI schema: profiles, consultations, messages, private image bucket. RLS on everything.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  preferred_language text check (preferred_language in ('id', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.consultations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  -- Language fixed when the consultation starts; follow-ups keep it.
  language text not null check (language in ('id', 'en')),
  image_path text,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references public.consultations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index messages_consultation_idx on public.messages (consultation_id, created_at);
create index consultations_user_idx on public.consultations (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.consultations enable row level security;
alter table public.messages enable row level security;

create policy "own profile read" on public.profiles for select using (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);

create policy "own consultations" on public.consultations for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own messages" on public.messages for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.consultations c where c.id = consultation_id and c.user_id = auth.uid())
  );

-- Create a profile on sign-up, taking the language the user had chosen as a guest.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, preferred_language)
  values (
    new.id,
    case when new.raw_user_meta_data ->> 'preferred_language' in ('id', 'en')
         then new.raw_user_meta_data ->> 'preferred_language' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Private bucket; files stored under <user_id>/...
insert into storage.buckets (id, name, public) values ('plant-images', 'plant-images', false);

create policy "own images read" on storage.objects for select
  using (bucket_id = 'plant-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own images write" on storage.objects for insert
  with check (bucket_id = 'plant-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own images delete" on storage.objects for delete
  using (bucket_id = 'plant-images' and (storage.foldername(name))[1] = auth.uid()::text);
