-- PriorityFirst full database setup: paste all of this into Supabase SQL Editor and click Run.
-- Generated from supabase/migrations (safe to run more than once).

-- PriorityFirst: real Supabase Auth profiles, private tasks, and private settings.
-- Run in the Supabase SQL Editor or with `supabase db push`.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) >= 2),
  classification text not null default 'Student' check (classification in ('Student', 'Professional', 'Worker', 'Athlete', 'Other')),
  other_description text not null default '',
  institution text not null default '',
  department text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  description text not null default '',
  category text not null default 'assignment',
  deadline_date date not null,
  deadline_time time not null default '23:59',
  difficulty smallint not null default 3 check (difficulty between 1 and 5),
  estimated_hours numeric(8,2) not null default 1 check (estimated_hours > 0),
  importance text not null default 'Medium' check (importance in ('Low', 'Medium', 'High', 'Critical')),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'overdue')),
  notes text not null default '',
  start_time time,
  end_time time,
  reminder_at timestamptz,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.user_settings (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  theme text not null default 'light' check (theme in ('light', 'dark')),
  weights jsonb not null default '{"urgency":0.4,"importance":0.25,"workload":0.2,"difficulty":0.15}'::jsonb,
  weight_preset text not null default 'balanced',
  browser_notifications_enabled boolean not null default false,
  sound_alerts_enabled boolean not null default true,
  daily_workload_limit_hours numeric(8,2) not null default 8,
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, classification, other_description, institution, department)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1)),
    case when new.raw_user_meta_data ->> 'classification' in ('Student', 'Professional', 'Worker', 'Athlete', 'Other')
      then new.raw_user_meta_data ->> 'classification' else 'Student' end,
    coalesce(new.raw_user_meta_data ->> 'other_description', ''),
    coalesce(new.raw_user_meta_data ->> 'institution', ''),
    coalesce(new.raw_user_meta_data ->> 'department', '')
  ) on conflict (id) do nothing;

  insert into public.user_settings (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
drop trigger if exists user_settings_updated_at on public.user_settings;
create trigger user_settings_updated_at before update on public.user_settings for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.user_settings enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles for select using ((select auth.uid()) = id);
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "Users manage own tasks" on public.tasks;
create policy "Users manage own tasks" on public.tasks for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own settings" on public.user_settings;
create policy "Users manage own settings" on public.user_settings for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- PriorityFirst: profile pictures and cloud auto-save support.
-- Run after 20261022_auth_and_user_data.sql (SQL Editor or `supabase db push`).

-- Profile picture, stored as a small resized JPEG data URL (~10 KB)
alter table public.profiles add column if not exists avatar text not null default '';

-- Lets the app tell which copy of a task is newest
alter table public.tasks add column if not exists updated_at timestamptz not null default now();

drop trigger if exists tasks_updated_at on public.tasks;
create trigger tasks_updated_at before update on public.tasks for each row execute procedure public.set_updated_at();

create index if not exists tasks_user_id_idx on public.tasks (user_id);

-- Allow the signed-in user to create their own profile row if the sign-up trigger missed it
drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile" on public.profiles for insert with check ((select auth.uid()) = id);

-- PriorityFirst: institutions must be picked from the verified Philippine directories.
--   Schools: official CHED list  -> institution_id like 'CHED-0105518000-sti-college-dagupan'
--   Companies / government / organizations: Wikidata -> institution_id like 'Q6714927'
-- Run in the Supabase SQL Editor after the earlier migrations. Safe to run more than once.

alter table public.profiles add column if not exists institution_id text;
alter table public.profiles add column if not exists institution_type text not null default '';

alter table public.profiles drop constraint if exists profiles_institution_type_valid;
alter table public.profiles add constraint profiles_institution_type_valid
  check (institution_type in ('', 'school', 'company', 'government', 'organization')) not valid;

-- Any institution name must come with a verified ID that matches its type.
-- NOT VALID leaves older rows alone until the user edits their profile; every new write is checked.
alter table public.profiles drop constraint if exists profiles_institution_verified;
alter table public.profiles add constraint profiles_institution_verified
  check (
    institution = ''
    or (institution_type = 'school' and institution_id ~ '^CHED-[a-z0-9-]+$')
    or (institution_type in ('company', 'government', 'organization') and institution_id ~ '^Q[0-9]+$')
  ) not valid;

-- Sign-up trigger: keep the institution only when it came with a verified ID of the right kind
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  meta jsonb := new.raw_user_meta_data;
  picked_type text := coalesce(meta ->> 'institution_type', '');
  picked_id text := nullif(trim(coalesce(meta ->> 'institution_id', '')), '');
  verified boolean;
begin
  verified := picked_id is not null and (
    (picked_type = 'school' and picked_id ~ '^CHED-[a-z0-9-]+$')
    or (picked_type in ('company', 'government', 'organization') and picked_id ~ '^Q[0-9]+$')
  );

  insert into public.profiles (id, display_name, classification, other_description, institution, institution_id, institution_type, department)
  values (
    new.id,
    coalesce(nullif(trim(meta ->> 'display_name'), ''), split_part(new.email, '@', 1)),
    case when meta ->> 'classification' in ('Student', 'Professional', 'Worker', 'Athlete', 'Other')
      then meta ->> 'classification' else 'Student' end,
    coalesce(meta ->> 'other_description', ''),
    case when verified then coalesce(meta ->> 'institution', '') else '' end,
    case when verified then picked_id else null end,
    case when verified then picked_type else '' end,
    coalesce(meta ->> 'department', '')
  ) on conflict (id) do nothing;

  insert into public.user_settings (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

-- Make the API see the new columns immediately
notify pgrst, 'reload schema';
