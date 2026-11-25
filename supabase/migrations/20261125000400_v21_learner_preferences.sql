create table reviewer_private.learner_preferences (
  user_id uuid primary key references auth.users(id),
  weekly_goal smallint not null check (weekly_goal between 2 and 7)
);
alter table reviewer_private.learner_preferences enable row level security;
revoke all on reviewer_private.learner_preferences from public,anon,authenticated;

create function public.v21_weekly_goal(new_goal integer default null)
returns integer language plpgsql security definer set search_path='' as $$
declare learner uuid := reviewer_private.assert_member();
begin
  if new_goal is not null then
    if new_goal not between 2 and 7 then raise exception 'Invalid weekly goal' using errcode='22023'; end if;
    insert into reviewer_private.learner_preferences(user_id,weekly_goal) values (learner,new_goal)
      on conflict(user_id) do update set weekly_goal=excluded.weekly_goal;
  end if;
  return (select p.weekly_goal from reviewer_private.learner_preferences p where p.user_id=learner);
end $$;
revoke all on function public.v21_weekly_goal(integer) from public,anon,authenticated;
grant execute on function public.v21_weekly_goal(integer) to authenticated;
