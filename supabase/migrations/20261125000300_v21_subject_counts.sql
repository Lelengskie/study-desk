create function public.v21_subject_counts(exam_level text)
returns table(subject text, imported bigint, subject_only bigint, verified bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform reviewer_private.assert_member();
  return query with imported_counts as (
    select p.subject as name, count(*) as n,
      count(*) filter (where not exists (
        select 1 from reviewer_private.modules m where m.id=p.topic and exam_level=any(m.levels)
      )) as broad, 0::bigint as scored
    from reviewer_private.practice p
    where p.active and p.answer_ready and p.status='source_answer_available'
      and (p.levels = '{}' or exam_level=any(p.levels))
    group by p.subject
    union all
    select m.track,0::bigint,0::bigint,count(*)
    from reviewer_private.questions q join reviewer_private.modules m on m.id=q.topic_id
    where exam_level=any(m.levels) group by m.track
  ) select name,sum(n)::bigint,sum(broad)::bigint,sum(scored)::bigint from imported_counts group by name;
end $$;
revoke all on function public.v21_subject_counts(text) from public,anon,authenticated;
grant execute on function public.v21_subject_counts(text) to authenticated;
