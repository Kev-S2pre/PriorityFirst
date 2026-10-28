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
