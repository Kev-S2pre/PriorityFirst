-- PriorityFirst: general-purpose defaults now that the app is not student-only.
-- Run in the Supabase SQL Editor after the earlier migrations. Safe to run more than once.

alter table public.tasks alter column category set default 'other activities';
alter table public.profiles alter column classification set default 'Other';

-- Sign-up trigger: fall back to "Other" when no classification was sent
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
      then meta ->> 'classification' else 'Other' end,
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

-- Replacing the function restores default execute rights, so take them away again
revoke execute on function public.handle_new_user() from public, anon, authenticated;

notify pgrst, 'reload schema';
