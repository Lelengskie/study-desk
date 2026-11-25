-- Enrollment is explicit. This migration does not change Auth provider settings.
create table reviewer_private.google_enrollment (
  email text primary key check (email = lower(btrim(email))),
  enrolled_user uuid unique references auth.users(id),
  approved_at timestamptz not null default now()
);
alter table reviewer_private.google_enrollment enable row level security;
revoke all on reviewer_private.google_enrollment from public, anon, authenticated, supabase_auth_admin;

create function public.study_before_user_created(event jsonb)
returns jsonb language plpgsql security definer stable set search_path = '' as $$
begin
  if event #>> '{user,app_metadata,provider}' = 'google'
     and exists (
       select 1 from reviewer_private.google_enrollment e
       where e.email = lower(event #>> '{user,email}') and e.enrolled_user is null
     ) then
    return '{}'::jsonb;
  end if;
  return '{"error":{"http_code":403,"message":"This Study Desk account has not been approved."}}'::jsonb;
end;
$$;
revoke all on function public.study_before_user_created(jsonb) from public, anon, authenticated;
grant execute on function public.study_before_user_created(jsonb) to supabase_auth_admin;

create function public.study_claim_google_enrollment()
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  member_id uuid := auth.uid();
  verified_email text;
  approved reviewer_private.google_enrollment;
begin
  if member_id is null then return false; end if;
  if exists (select 1 from reviewer_private.members where user_id = member_id) then
    return false;
  end if;

  select lower(u.email) into verified_email
  from auth.users u
  where u.id = member_id and u.email_confirmed_at is not null
    and exists (
      select 1 from auth.identities i
      where i.user_id = u.id and i.provider = 'google'
        and lower(i.identity_data->>'email') = lower(u.email)
        and i.identity_data->>'email_verified' = 'true'
    );
  if verified_email is null then return false; end if;

  select * into approved from reviewer_private.google_enrollment
  where email = verified_email for update;
  if not found or approved.enrolled_user is not null then return false; end if;

  insert into reviewer_private.members(user_id, active) values (member_id, true)
  on conflict do nothing;
  if not found then return false; end if;
  update reviewer_private.google_enrollment set enrolled_user = member_id where email = verified_email;
  return true;
end;
$$;
revoke all on function public.study_claim_google_enrollment() from public, anon, authenticated;
grant execute on function public.study_claim_google_enrollment() to authenticated;
