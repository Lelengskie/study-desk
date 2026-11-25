create function public.v21_tutor_allowance(learner uuid, user_cap integer, project_cap integer)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
  today date := (now() at time zone 'America/Los_Angeles')::date;
  used integer;
  project_used integer;
  cap integer := greatest(0,least(user_cap,5));
begin
  if not exists(select 1 from reviewer_private.members m where m.user_id=learner and m.active)
    then raise exception 'Membership required' using errcode='42501'; end if;
  used := coalesce((select calls from reviewer_private.tutor_usage where day=today and subject=learner::text),0);
  project_used := coalesce((select calls from reviewer_private.tutor_usage where day=today and subject='project'),0);
  return jsonb_build_object('used',used,'limit',cap,
    'remaining',greatest(0,least(cap-used,greatest(0,least(project_cap,12))-project_used)),
    'resets_at', (today+1)::timestamp at time zone 'America/Los_Angeles');
end $$;
revoke all on function public.v21_tutor_allowance(uuid,integer,integer) from public,anon,authenticated;
grant execute on function public.v21_tutor_allowance(uuid,integer,integer) to service_role;
