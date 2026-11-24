create table reviewer_private.library (
  id text primary key, title text not null, format text not null, role text,
  subject text, topic text, levels text[] not null, editions text[] not null,
  sources jsonb not null, drive_file_id text check (drive_file_id ~ '^[A-Za-z0-9_-]+$'),
  searchable tsvector not null,
  active boolean not null default false,
  check (not active or drive_file_id is not null)
);
create table reviewer_private.practice (
  id text primary key, stem text not null, options jsonb not null, subject text, topic text,
  levels text[] not null, provenance jsonb not null, active boolean not null default false,
  status text not null check (status in ('source_answer_available','answer_unavailable','conflicting_answer')),
  source_answer text, content_key text not null unique, ai_allowed boolean not null default false,
  searchable tsvector generated always as (to_tsvector('simple', stem)) stored,
  check ((source_answer is not null) = (status = 'source_answer_available')),
  check (source_answer is null or options @> jsonb_build_array(jsonb_build_object('label', source_answer)))
);
create index hybrid_library_search on reviewer_private.library using gin(searchable) where active;
create index hybrid_library_filters on reviewer_private.library(subject,topic,id) where active;
create index hybrid_practice_search on reviewer_private.practice using gin(searchable) where active;
create index hybrid_practice_filters on reviewer_private.practice(subject,topic,status,id) where active;
create table reviewer_private.practice_bookmarks (
  user_id uuid references reviewer_private.members, question_id text,
  primary key (user_id, question_id)
);
create table reviewer_private.practice_reports (
  user_id uuid references reviewer_private.members, question_id text,
  reason text not null check (char_length(reason) between 1 and 500),
  updated_at timestamptz not null default now(), primary key (user_id, question_id)
);
alter table reviewer_private.library enable row level security;
alter table reviewer_private.practice enable row level security;
alter table reviewer_private.practice_bookmarks enable row level security;
alter table reviewer_private.practice_reports enable row level security;

create function public.hybrid_library(q text default '', subject_filter text default null,
  topic_filter text default null, level_filter text default null, source_filter text default '',
  after_id text default '')
returns table(id text,title text,format text,role text,subject text,topic text,levels text[],
  editions text[],drive_file_id text)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform reviewer_private.assert_member();
  return query select d.id,d.title,d.format,d.role,d.subject,d.topic,d.levels,d.editions,d.drive_file_id
  from reviewer_private.library d where d.active and d.id > after_id
    and (subject_filter is null or d.subject=subject_filter)
    and (topic_filter is null or d.topic=topic_filter)
    and (level_filter is null or d.levels = '{}' or level_filter=any(d.levels))
    and (trim(q)='' or d.searchable @@ websearch_to_tsquery('simple',left(q,200)))
    and (trim(source_filter)='' or exists (
      select 1 from jsonb_array_elements(d.sources) s
      where strpos(lower(coalesce(s->>'title','') || ' ' || coalesce(s->>'member_path','')),lower(left(source_filter,200)))>0
    ))
  order by d.id limit 25;
end $$;

create function public.hybrid_practice(q text default '', subject_filter text default null,
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
    where p.active
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

create function public.hybrid_answer(question_id text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  perform reviewer_private.assert_member();
  select jsonb_build_object('answer',p.source_answer,'status',p.status) into result
    from reviewer_private.practice p where p.id=question_id and p.active;
  if found then return result; end if;
  select jsonb_build_object('answer',v.answer,'explanation',v.explanation,'status','independently_verified')
    into result from reviewer_private.questions v where v.id=question_id;
  if not found then raise exception 'Question unavailable' using errcode='22023'; end if;
  return result;
end $$;

create function public.hybrid_feedback(question_id text, bookmark boolean default null, report text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare learner uuid := reviewer_private.assert_member();
begin
  if not exists (select 1 from reviewer_private.practice p where p.id=question_id and p.active)
    and not exists (select 1 from reviewer_private.questions v where v.id=question_id) then
    raise exception 'Question unavailable' using errcode='22023';
  end if;
  if bookmark is true then
    insert into reviewer_private.practice_bookmarks values (learner,question_id) on conflict do nothing;
  elsif bookmark is false then
    delete from reviewer_private.practice_bookmarks b where b.user_id=learner and b.question_id=hybrid_feedback.question_id;
  end if;
  if report is not null then
    insert into reviewer_private.practice_reports values (learner,question_id,trim(report),now())
      on conflict on constraint practice_reports_pkey do update
      set reason=excluded.reason,updated_at=excluded.updated_at;
  end if;
end $$;

revoke all on function public.hybrid_library(text,text,text,text,text,text),
  public.hybrid_practice(text,text,text,text,text,text,int,boolean), public.hybrid_answer(text),
  public.hybrid_feedback(text,boolean,text) from public,anon,authenticated;
grant execute on function public.hybrid_library(text,text,text,text,text,text),
  public.hybrid_practice(text,text,text,text,text,text,int,boolean), public.hybrid_answer(text),
  public.hybrid_feedback(text,boolean,text) to authenticated;

create table reviewer_private.practice_ai_cache (
  question_id text references reviewer_private.practice,
  revision text not null, model_key text not null,
  explanation text not null check (length(explanation) between 40 and 2000),
  primary key(question_id,revision,model_key)
);
alter table reviewer_private.practice_ai_cache enable row level security;
create function public.hybrid_tutor_prepare(learner uuid, question text, model_key text, user_cap int, project_cap int)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  item reviewer_private.practice;
  cached text;
  today date := (now() at time zone 'America/Los_Angeles')::date;
begin
  if not exists (select 1 from reviewer_private.members m where m.user_id=learner and m.active) then
    raise exception 'Membership required' using errcode='42501';
  end if;
  select * into item from reviewer_private.practice p where p.id=question and p.active;
  if not found or not item.ai_allowed then return jsonb_build_object('status','unavailable'); end if;
  perform pg_advisory_xact_lock(739901);
  select c.explanation into cached from reviewer_private.practice_ai_cache c
    where c.question_id=question and c.revision=item.content_key and c.model_key=hybrid_tutor_prepare.model_key;
  if found then return jsonb_build_object('status','ai','explanation',cached); end if;
  if coalesce((select calls from reviewer_private.tutor_usage where day=today and subject=learner::text),0)
    >= greatest(0,least(user_cap,5))
    or coalesce((select calls from reviewer_private.tutor_usage where day=today and subject='project'),0)
    >= greatest(0,least(project_cap,12)) then return jsonb_build_object('status','daily_limit'); end if;
  delete from reviewer_private.tutor_usage where day<today-2;
  insert into reviewer_private.tutor_usage(day,subject,calls)
    values (today,'project',1),(today,learner::text,1)
    on conflict(day,subject) do update set calls=reviewer_private.tutor_usage.calls+1;
  return jsonb_build_object('status','ready','stem',item.stem,'options',item.options,'revision',item.content_key);
end $$;
create function public.hybrid_tutor_cache(question text, revision text, model_key text, explanation text)
returns void language sql security definer set search_path = '' as $$
  insert into reviewer_private.practice_ai_cache
  select p.id,revision,model_key,explanation from reviewer_private.practice p
    where p.id=question and p.active and p.ai_allowed and p.content_key=revision
  on conflict on constraint practice_ai_cache_pkey do nothing;
$$;
revoke all on function public.hybrid_tutor_prepare(uuid,text,text,int,int),
  public.hybrid_tutor_cache(text,text,text,text) from public,anon,authenticated;
grant execute on function public.hybrid_tutor_prepare(uuid,text,text,int,int),
  public.hybrid_tutor_cache(text,text,text,text) to service_role;
