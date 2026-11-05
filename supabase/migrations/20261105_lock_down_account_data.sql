-- PriorityFirst: keep account data private even if a row-level security policy is ever
-- dropped or misconfigured. Run in the Supabase SQL Editor after the earlier migrations.
-- Safe to run more than once.

-- Signed-out visitors (the public "anon" key) get no access to account tables at all;
-- before this, only the RLS policies stood between them and the rows
revoke all on table public.profiles, public.tasks, public.user_settings from anon;

-- Signed-in users keep only the operations the app uses, still limited to their own rows by RLS
revoke all on table public.profiles, public.tasks, public.user_settings from authenticated;
grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.tasks to authenticated;
grant select, insert, update, delete on table public.user_settings to authenticated;

-- The sign-up trigger runs with elevated rights; nobody should be able to call it directly
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Pin the search path so the timestamp trigger cannot be redirected to another schema
alter function public.set_updated_at() set search_path = '';

notify pgrst, 'reload schema';
