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
