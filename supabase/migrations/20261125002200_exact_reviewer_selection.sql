create function reviewer_private.learning_next_selection(
  study_subject text, exam_level text, study_topics text[], completed_id text default null, study_band text default null, exact_scope boolean default false)
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
    and (not exact_scope or (
      (p.topic=any(study_topics) or ('concept:'||p.concept)=any(study_topics))
      and strpos(p.stem,chr(65533))=0 and strpos(p.options::text,chr(65533))=0
      and not (p.subject='Numerical Ability' and p.stem ~* 'times[[:space:]]+older[[:space:]]+than')
    ))
  order by
    case when coalesce(p.topic=any(study_topics),false) or coalesce(('concept:'||p.concept)=any(study_topics),false)
      then 0 else 1 end,
    e.opened_at desc nulls last,
    case when p.answer_evidence->>'answer_reliability'='independently_verified' then 0 else 1 end,
    case when p.learning_band=study_band then 0
         when study_band='beginner' and p.learning_band='foundation' then 1
         when p.learning_band is null then 2 else 3 end,
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

revoke all on function reviewer_private.learning_next_selection(text,text,text[],text,text,boolean)
  from public,anon,authenticated;

create or replace function public.learning_next(study_subject text, exam_level text, study_topics text[],
  completed_id text default null, study_band text default null)
returns jsonb language sql volatile security definer set search_path='' as $$
  select reviewer_private.learning_next_selection(study_subject,exam_level,study_topics,completed_id,study_band,false);
$$;

create function public.learning_next_scoped(study_subject text, exam_level text, study_topics text[],
  completed_id text default null, study_band text default null)
returns jsonb language sql volatile security definer set search_path='' as $$
  select reviewer_private.learning_next_selection(study_subject,exam_level,study_topics,completed_id,study_band,true);
$$;
revoke all on function public.learning_next_scoped(text,text,text[],text,text) from public,anon,authenticated;
grant execute on function public.learning_next_scoped(text,text,text[],text,text) to authenticated;
