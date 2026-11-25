create function public.curated_status()
returns table(skill text, mastered boolean, due boolean)
language plpgsql stable security definer set search_path='' as $$
declare member_id uuid := reviewer_private.assert_member();
begin
  return query select p.skill, p.mastered, coalesce(p.stage = 5 and p.due_at <= now(), false)
  from reviewer_private.curated_progress p
  where p.learner = member_id;
end;
$$;
revoke all on function public.curated_status() from public,anon,authenticated;
grant execute on function public.curated_status() to authenticated;
