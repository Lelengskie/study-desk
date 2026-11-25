alter table reviewer_private.practice
  add column concept text,
  add constraint practice_concept_format check (concept is null or concept ~ '^[a-z][a-z0-9-]{0,47}$');
create index practice_concept_ready on reviewer_private.practice(subject,concept,id)
  where active and answer_ready and concept is not null;

create or replace function public.hybrid_practice(q text default '', subject_filter text default null,
  topic_filter text default null, level_filter text default null, status_filter text default null,
  after_id text default '', random_count int default null, saved_only boolean default false)
returns table(id text,stem text,options jsonb,status text,subject text,topic text,saved boolean)
language plpgsql volatile security definer set search_path = '' as $$
declare learner uuid := reviewer_private.assert_member();
begin
  return query
  with pool as (
    select p.id,p.stem,p.options,p.status,p.subject,p.topic,p.concept,p.levels,p.searchable,b.user_id is not null as saved
    from reviewer_private.practice p
    left join reviewer_private.practice_bookmarks b on b.question_id=p.id and b.user_id=learner
    where p.active and p.answer_ready and p.status = 'source_answer_available'
    union all
    select v.id,v.stem,v.options,'independently_verified',m.track,v.topic_id,null::text,m.levels,
      to_tsvector('simple',v.stem),b.user_id is not null
    from reviewer_private.questions v join reviewer_private.modules m on m.id=v.topic_id
    left join reviewer_private.practice_bookmarks b on b.question_id=v.id and b.user_id=learner
  )
  select p.id,p.stem,p.options,p.status,p.subject,p.topic,p.saved from pool p
  where (random_count is not null or p.id > after_id)
    and (not saved_only or p.saved)
    and (subject_filter is null or p.subject=subject_filter)
    and (topic_filter is null or case when left(topic_filter,8)='concept:'
      then p.concept=substring(topic_filter from 9) else p.topic=topic_filter end)
    and (level_filter is null or p.levels = '{}' or level_filter=any(p.levels))
    and (status_filter is null or p.status=status_filter)
    and (trim(q)='' or p.searchable @@ websearch_to_tsquery('simple',left(q,200)))
  order by case when random_count is not null then random() end,p.id
  limit case when random_count is null then 25 else greatest(1,least(random_count,100)) end;
end $$;

create function public.v21_concept_counts(exam_level text)
returns table(subject text, concept text, imported bigint)
language plpgsql stable security definer set search_path='' as $$
begin
  perform reviewer_private.assert_member();
  return query select p.subject,p.concept,count(*) from reviewer_private.practice p
   where p.active and p.answer_ready and p.status='source_answer_available' and p.concept is not null
     and (p.levels='{}' or exam_level=any(p.levels))
   group by p.subject,p.concept;
end $$;
revoke all on function public.v21_concept_counts(text) from public,anon,authenticated;
grant execute on function public.v21_concept_counts(text) to authenticated;
