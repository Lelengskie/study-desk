alter table reviewer_private.practice add column answer_ready boolean not null default false,
  add column source_explanation text, add column answer_evidence jsonb,
  add constraint practice_ready_answer_check check (not answer_ready or (
    status = 'source_answer_available' and source_answer is not null
    and source_explanation is not null and length(btrim(source_explanation)) > 0
    and answer_evidence is not null));
create or replace function public.hybrid_practice(q text default '', subject_filter text default null,
  topic_filter text default null, level_filter text default null, status_filter text default null,
  after_id text default '', random_count int default null, saved_only boolean default false)
returns table(id text,stem text,options jsonb,status text,subject text,topic text,saved boolean)
language plpgsql volatile security definer set search_path = '' as $$
declare learner uuid := reviewer_private.assert_member();
begin
  return query
  with pool as (
    select p.id,p.stem,p.options,p.status,p.subject,p.topic,p.levels,p.searchable,b.user_id is not null as saved
    from reviewer_private.practice p
    left join reviewer_private.practice_bookmarks b on b.question_id=p.id and b.user_id=learner
    where p.active and p.answer_ready and p.status = 'source_answer_available'
    union all
    select v.id,v.stem,v.options,'independently_verified',m.track,v.topic_id,m.levels,
      to_tsvector('simple',v.stem),b.user_id is not null
    from reviewer_private.questions v join reviewer_private.modules m on m.id=v.topic_id
    left join reviewer_private.practice_bookmarks b on b.question_id=v.id and b.user_id=learner
  )
  select p.id,p.stem,p.options,p.status,p.subject,p.topic,p.saved from pool p
  where (random_count is not null or p.id > after_id)
    and (not saved_only or p.saved)
    and (subject_filter is null or p.subject=subject_filter)
    and (topic_filter is null or p.topic=topic_filter)
    and (level_filter is null or p.levels = '{}' or level_filter=any(p.levels))
    and (status_filter is null or p.status=status_filter)
    and (trim(q)='' or p.searchable @@ websearch_to_tsquery('simple',left(q,200)))
  order by case when random_count is not null then random() end,p.id
  limit case when random_count is null then 25 else greatest(1,least(random_count,100)) end;
end $$;

create or replace function public.hybrid_answer(question_id text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  perform reviewer_private.assert_member();
  select jsonb_build_object('answer',p.source_answer,'status',p.status,'explanation',p.source_explanation)
    into result from reviewer_private.practice p where p.id=question_id and p.active and p.answer_ready;
  if found then return result; end if;
  select jsonb_build_object('answer',v.answer,'explanation',v.explanation,'status','independently_verified')
    into result from reviewer_private.questions v where v.id=question_id;
  if not found then raise exception 'Question unavailable' using errcode='22023'; end if;
  return result;
end $$;

create function public.hybrid_topic_counts(exam_level text)
returns table(topic text, answer_ready bigint, verified bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform reviewer_private.assert_member();
  return query
  with counts as (
    select p.topic as id, count(*) as n, 0::bigint as v from reviewer_private.practice p
    where p.active and p.answer_ready and p.topic is not null
      and (p.levels = '{}' or exam_level = any(p.levels)) group by p.topic
    union all
    select q.topic_id, count(*), count(*) from reviewer_private.questions q
    join reviewer_private.modules m on m.id=q.topic_id where exam_level=any(m.levels)
    group by q.topic_id
  ) select id,sum(n)::bigint,sum(v)::bigint from counts group by id;
end $$;
revoke all on function public.hybrid_topic_counts(text) from public,anon,authenticated;
grant execute on function public.hybrid_topic_counts(text) to authenticated;

