-- PriorityFirst: recurring tasks, checklists, and Plan My Day working hours.
-- Run in the Supabase SQL Editor after the earlier migrations. Safe to run more than once.

-- Repeat rule for a task: none, daily, weekdays, weekly, monthly
alter table public.tasks add column if not exists recurrence text not null default 'none';
alter table public.tasks drop constraint if exists tasks_recurrence_valid;
alter table public.tasks add constraint tasks_recurrence_valid
  check (recurrence in ('none', 'daily', 'weekdays', 'weekly', 'monthly'));

-- Checklist items: [{ "id": "...", "text": "...", "done": false }], at most 20
alter table public.tasks add column if not exists subtasks jsonb not null default '[]'::jsonb;
alter table public.tasks drop constraint if exists tasks_subtasks_valid;
alter table public.tasks add constraint tasks_subtasks_valid
  check (jsonb_typeof(subtasks) = 'array' and jsonb_array_length(subtasks) <= 20);

-- Plan My Day: working window and break between tasks
alter table public.user_settings add column if not exists day_start time not null default '08:00';
alter table public.user_settings add column if not exists day_end time not null default '18:00';
alter table public.user_settings add column if not exists break_minutes smallint not null default 10;
alter table public.user_settings drop constraint if exists user_settings_planner_valid;
alter table public.user_settings add constraint user_settings_planner_valid
  check (day_end > day_start and break_minutes between 0 and 60);

notify pgrst, 'reload schema';
