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
