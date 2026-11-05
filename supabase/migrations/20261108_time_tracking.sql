-- PriorityFirst: task timer (actual time spent vs estimate).
-- Run in the Supabase SQL Editor after the earlier migrations. Safe to run more than once.

alter table public.tasks add column if not exists actual_minutes integer not null default 0;
alter table public.tasks add column if not exists timer_started_at timestamptz;
alter table public.tasks drop constraint if exists tasks_actual_minutes_valid;
alter table public.tasks add constraint tasks_actual_minutes_valid check (actual_minutes >= 0);

notify pgrst, 'reload schema';
