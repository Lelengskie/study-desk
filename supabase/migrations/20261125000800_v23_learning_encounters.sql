alter table reviewer_private.practice add column learning_band text
  check (learning_band in ('foundation','beginner','intermediate','advanced','examination'));
-- A complete, independently graded numeric expression with one binary operation.
update reviewer_private.practice set learning_band='foundation'
where active and answer_ready and delivery_format='short_answer_math' and exact_value is not null
  and stem ~ '^[[:space:]]*[0-9]+[[:space:]]*[+−-][[:space:]]*[0-9]+[[:space:]]*=?[[:space:]]*$';
create table reviewer_private.learning_encounters (
  learner uuid not null references auth.users(id),
  question_id text not null references reviewer_private.practice(id),
  opened_at timestamptz not null default now(),
  finished_at timestamptz,
  primary key (learner,question_id)
);
alter table reviewer_private.learning_encounters enable row level security;
revoke all on reviewer_private.learning_encounters from public,anon,authenticated;

create function public.learning_next(
  study_subject text, exam_level text, study_topics text[], completed_id text default null, study_band text default null)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare
  member_id uuid := reviewer_private.assert_member();
  selected reviewer_private.practice%rowtype;
  was_bookmarked boolean;
begin
  if exam_level not in ('professional','subprofessional') or cardinality(study_topics)>30 then
    raise exception 'Invalid learning scope' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(hashtext(member_id::text));
  if completed_id is not null then
    update reviewer_private.learning_encounters
      set finished_at=now()
      where learner=member_id and question_id=completed_id and finished_at is null;
  end if;
  select p.* into selected
  from reviewer_private.practice p
  left join reviewer_private.learning_encounters e
    on e.learner=member_id and e.question_id=p.id
  where p.active and p.answer_ready and p.status='source_answer_available'
    and (study_subject is null or p.subject=study_subject)
    and (p.levels='{}' or exam_level=any(p.levels))
    and e.finished_at is null
  order by
    case when coalesce(p.topic=any(study_topics),false) or coalesce(('concept:'||p.concept)=any(study_topics),false)
      then 0 else 1 end,
    e.opened_at desc nulls last,
    case when study_band in ('foundation','beginner') and p.learning_band='foundation' then 0 else 1 end,
    p.id
  limit 1;
  if not found then return null; end if;
  insert into reviewer_private.learning_encounters(learner,question_id)
    values(member_id,selected.id) on conflict do nothing;
  select exists(select 1 from reviewer_private.practice_bookmarks b
    where b.user_id=member_id and b.question_id=selected.id) into was_bookmarked;
  return jsonb_build_object('id',selected.id,'stem',selected.stem,'options',selected.options,
    'status',selected.status,'subject',selected.subject,'topic',selected.topic,'saved',was_bookmarked,
    'related',not (coalesce(selected.topic=any(study_topics),false)
      or coalesce(('concept:'||selected.concept)=any(study_topics),false)));
end $$;
revoke all on function public.learning_next(text,text,text[],text,text) from public,anon,authenticated;
grant execute on function public.learning_next(text,text,text[],text,text) to authenticated;

create function public.learning_finish(completed_id text)
returns void language plpgsql volatile security definer set search_path='' as $$
declare member_id uuid := reviewer_private.assert_member();
begin
  update reviewer_private.learning_encounters set finished_at=now()
    where learner=member_id and question_id=completed_id and finished_at is null;
end $$;
revoke all on function public.learning_finish(text) from public,anon,authenticated;
grant execute on function public.learning_finish(text) to authenticated;
