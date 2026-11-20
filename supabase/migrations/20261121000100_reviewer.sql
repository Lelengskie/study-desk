
create schema if not exists reviewer_private;
revoke all on schema reviewer_private from public, anon, authenticated;

create table reviewer_private.members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active boolean not null default true
);
create table reviewer_private.modules (
  id text primary key,
  position integer not null,
  title text not null,
  track text not null,
  levels text[] not null,
  lesson text not null
);
create table reviewer_private.questions (
  id text primary key,
  topic_id text not null references reviewer_private.modules(id),
  position integer not null,
  language text not null,
  difficulty text not null,
  stem text not null,
  options jsonb not null,
  answer text not null,
  explanation text not null,
  sources jsonb not null,
  verification text not null check (verification in ('independently_checked','primary_reference_checked')),
  release text not null,
  check (jsonb_typeof(options) = 'array')
);
create table reviewer_private.completed (
  user_id uuid not null references reviewer_private.members on delete cascade,
  module_id text not null references reviewer_private.modules,
  at timestamptz not null default now(),
  primary key (user_id, module_id)
);
create table reviewer_private.attempts (
  seq bigint generated always as identity primary key,
  user_id uuid not null references reviewer_private.members on delete cascade,
  request_id uuid not null,
  study_session uuid not null,
  question_id text not null references reviewer_private.questions,
  mode text not null check (mode in ('quiz','repeat')),
  submitted_option text not null,
  correct boolean not null,
  result jsonb not null,
  attempted_at timestamptz not null default clock_timestamp(),
  unique (user_id, request_id)
);
create index reviewer_attempts_recent on reviewer_private.attempts (user_id, seq desc);
create table reviewer_private.review (
  user_id uuid not null references reviewer_private.members on delete cascade,
  question_id text not null references reviewer_private.questions,
  step smallint not null check (step between 1 and 5),
  due_at timestamptz not null,
  primary key (user_id, question_id)
);
create table reviewer_private.tutor_usage (
  day date not null,
  subject text not null,
  calls int not null default 0,
  primary key (day, subject)
);
create table reviewer_private.tutor_rounds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references reviewer_private.members on delete cascade,
  question_id text not null references reviewer_private.questions,
  practice jsonb not null,
  selected text,
  expires_at timestamptz not null default (now() + interval '2 hours')
);

alter table reviewer_private.members enable row level security;
alter table reviewer_private.modules enable row level security;
alter table reviewer_private.questions enable row level security;
alter table reviewer_private.completed enable row level security;
alter table reviewer_private.attempts enable row level security;
alter table reviewer_private.review enable row level security;
alter table reviewer_private.tutor_usage enable row level security;
alter table reviewer_private.tutor_rounds enable row level security;

create function reviewer_private.assert_member()
returns uuid language plpgsql stable set search_path = '' as $$
declare member_id uuid := auth.uid();
begin
  if member_id is null or not exists (
    select 1 from reviewer_private.members where user_id = member_id and active
  ) then raise exception 'This account is not approved for the study desk.' using errcode = '42501'; end if;
  return member_id;
end $$;

create function public.study_catalog()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform reviewer_private.assert_member();
  return jsonb_build_object(
    'modules', coalesce((
      select jsonb_agg(jsonb_build_object('id',m.id,'title',m.title,'track',m.track,'levels',m.levels,'lesson',m.lesson,
        'quiz_ids', coalesce((select jsonb_agg(q.id order by q.position)
          from reviewer_private.questions q where q.topic_id=m.id), '[]'::jsonb)) order by m.position)
      from reviewer_private.modules m), '[]'::jsonb)
  );
end $$;

create function public.study_question(p_question text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare payload jsonb;
begin
  perform reviewer_private.assert_member();
  select jsonb_build_object('id', id, 'topic_id', topic_id, 'language', language,
    'difficulty', difficulty, 'stem', stem, 'options', options)
  into payload from reviewer_private.questions where id = p_question;
  if not found then raise exception 'Question unavailable.' using errcode = '22023'; end if;
  return payload;
end $$;

create function public.study_complete(p_module text)
returns void language plpgsql security definer set search_path = '' as $$
declare member_id uuid := reviewer_private.assert_member();
begin
  insert into reviewer_private.completed (user_id,module_id) values (member_id,p_module)
  on conflict do nothing;
end $$;

create function public.study_progress()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare member_id uuid := reviewer_private.assert_member();
begin
  return jsonb_build_object(
    'completed', coalesce((select jsonb_agg(module_id)
      from reviewer_private.completed where user_id=member_id), '[]'::jsonb),
    'reviews', coalesce((select jsonb_agg(jsonb_build_object('question_id',r.question_id,
        'topic_id',q.topic_id,'due_at',r.due_at,'step',r.step,'is_due',r.due_at<=now())
        order by r.due_at, r.question_id)
      from reviewer_private.review r join reviewer_private.questions q on q.id=r.question_id
      where r.user_id=member_id), '[]'::jsonb),
    'mastery', coalesce((
      select jsonb_object_agg(s.topic_id, jsonb_build_object('attempts',s.total,
          'correct',s.hits,'distinct_items',s.items,'sessions',s.sessions,
          'mastered',s.items>=3 and s.sessions>=2 and s.hits*5>=s.total*4))
      from (
        select topic_id, count(*) total, count(*) filter (where correct) hits,
          count(distinct question_id) items, count(distinct study_session) sessions
        from (
          select q.topic_id,a.question_id,a.study_session,a.correct,
            row_number() over(partition by q.topic_id order by a.seq desc) rank
          from reviewer_private.attempts a join reviewer_private.questions q on q.id=a.question_id
          where a.user_id=member_id
        ) recent where rank<=10 group by topic_id
      ) s
    ), '{}'::jsonb)
  );
end $$;

create function public.study_submit(
  p_question text, p_option text, p_request uuid, p_session uuid, p_mode text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  member_id uuid := reviewer_private.assert_member();
  q reviewer_private.questions;
  previous reviewer_private.attempts;
  old_step int;
  next_step int;
  due timestamptz;
  stamp timestamptz;
  is_correct boolean;
  feedback jsonb;
begin
  if p_request is null or p_session is null or p_mode is null or p_mode not in ('quiz','repeat') then
    raise exception 'Invalid attempt details.' using errcode = '22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(member_id::text, 0));
  stamp := clock_timestamp();

  select * into previous from reviewer_private.attempts where user_id=member_id and request_id=p_request;
  if found then
    if (previous.question_id, previous.submitted_option, previous.study_session, previous.mode)
        is distinct from (p_question, p_option, p_session, p_mode) then
      raise exception 'This request ID has already been used.' using errcode = '22023';
    end if;
    return previous.result;
  end if;

  select * into q from reviewer_private.questions where id=p_question;
  if not found or p_option is null or not exists (
      select 1 from jsonb_array_elements(q.options) o where o->>'id'=p_option
  ) then raise exception 'Question or option unavailable.' using errcode = '22023'; end if;

  select step, due_at into old_step, due from reviewer_private.review
    where user_id=member_id and question_id=q.id;
  if p_mode='repeat' and (due is null or due>stamp) then
    raise exception 'This review is not due yet.' using errcode = '22023';
  end if;
  is_correct := p_option=q.answer;

  if due is null or not is_correct or due<=stamp then
    next_step := case when not is_correct then 1 else least(coalesce(old_step,0)+1,5) end;
    due := stamp + make_interval(days => (array[1,3,7,14,30])[next_step]);
    insert into reviewer_private.review (user_id, question_id, step, due_at)
      values (member_id, q.id, next_step, due)
    on conflict (user_id, question_id)
      do update set step=excluded.step, due_at=excluded.due_at;
  end if;

  feedback := jsonb_build_object('correct',is_correct,'answer_option_id',q.answer,
    'explanation',q.explanation,'sources',q.sources,'verification',q.verification,
    'release',q.release,'due_at',due);
  insert into reviewer_private.attempts
    (user_id, request_id, study_session, question_id, mode, submitted_option, correct, result, attempted_at)
  values (member_id,p_request,p_session,q.id,p_mode,p_option,is_correct,feedback,stamp);
  return feedback;
end $$;

-- Only the Edge Function may reserve provider calls. Locking makes shared quotas atomic.
create function public.tutor_reserve(p_user uuid, p_question text, p_user_cap int, p_project_cap int)
returns boolean language plpgsql security definer set search_path = '' as $$
declare today date := (now() at time zone 'America/Los_Angeles')::date;
begin
  if not exists (select 1 from reviewer_private.attempts a
    join reviewer_private.members m on m.user_id=a.user_id and m.active
    where a.user_id=p_user and a.question_id=p_question) then
    raise exception 'Finish the verified question first.' using errcode = '42501';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(739901);
  delete from reviewer_private.tutor_usage where day<today-2;
  if coalesce((select calls from reviewer_private.tutor_usage where day=today and subject=p_user::text),0)
    >= greatest(0,least(p_user_cap,5))
    or coalesce((select calls from reviewer_private.tutor_usage where day=today and subject='project'),0)
    >= greatest(0,least(p_project_cap,12)) then return false;
  end if;
  insert into reviewer_private.tutor_usage(day,subject,calls)
    values (today,'project',1),(today,p_user::text,1)
    on conflict(day,subject) do update set calls=reviewer_private.tutor_usage.calls+1;
  return true;
end $$;

create function public.tutor_open(p_user uuid, p_question text, p_practice jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare round_id uuid;
begin
  if not exists (select 1 from reviewer_private.attempts a
    join reviewer_private.members m on m.user_id=a.user_id and m.active
    where a.user_id=p_user and a.question_id=p_question) then
    raise exception 'Finish the verified question first.' using errcode = '42501';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user::text, 0));
  delete from reviewer_private.tutor_rounds where user_id=p_user and expires_at<=now();
  if (select count(*) from reviewer_private.tutor_rounds where user_id=p_user)>=40 then
    raise exception 'Practice limit reached. Try again later.' using errcode = '22023';
  end if;
  insert into reviewer_private.tutor_rounds(user_id,question_id,practice)
    values (p_user,p_question,p_practice) returning id into round_id;
  return round_id;
end $$;

create function public.tutor_answer(p_round uuid, p_option text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare member_id uuid := reviewer_private.assert_member();
declare r reviewer_private.tutor_rounds;
begin
  select * into r from reviewer_private.tutor_rounds where id=p_round
    and user_id=member_id and expires_at>now() for update;
  if not found then raise exception 'This practice round has expired or is unavailable.' using errcode = '22023'; end if;
  if p_option is null or not exists (
    select 1 from jsonb_array_elements(r.practice->'options') o where o->>'id'=p_option
  ) then raise exception 'Choose a valid answer.' using errcode = '22023'; end if;
  if r.selected is distinct from p_option and r.selected is not null then
    raise exception 'This practice round has already been answered.' using errcode = '22023';
  end if;
  update reviewer_private.tutor_rounds set selected=p_option where id=r.id and selected is null;
  return jsonb_build_object('correct', p_option=r.practice->>'answer',
    'answer_option_id',r.practice->>'answer','explanation',r.practice->>'feedback');
end $$;

revoke execute on function public.study_catalog(), public.study_question(text), public.study_complete(text),
  public.study_progress(), public.study_submit(text,text,uuid,uuid,text), public.tutor_answer(uuid,text),
  public.tutor_reserve(uuid,text,int,int), public.tutor_open(uuid,text,jsonb) from public, anon, authenticated;
grant execute on function public.study_catalog(), public.study_question(text), public.study_complete(text),
  public.study_progress(), public.study_submit(text,text,uuid,uuid,text), public.tutor_answer(uuid,text) to authenticated;
grant execute on function public.tutor_reserve(uuid,text,int,int), public.tutor_open(uuid,text,jsonb) to service_role;
