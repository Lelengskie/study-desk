create table reviewer_private.concept_test_items (
  skill text primary key references reviewer_private.curated_skills(id),
  prompt text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 2),
  correct integer not null check (correct in (0,1)),
  explanation text not null
);
create table reviewer_private.concept_test_runs (
  id uuid primary key default gen_random_uuid(),
  learner uuid not null references auth.users(id),
  skills text[] not null,
  snapshot jsonb not null,
  opened_at timestamptz not null default now(),
  submitted_at timestamptz,
  responses jsonb,
  result jsonb
);
create index concept_test_learner_opened on reviewer_private.concept_test_runs(learner,opened_at desc);
alter table reviewer_private.concept_test_items enable row level security;
alter table reviewer_private.concept_test_runs enable row level security;
revoke all on reviewer_private.concept_test_items,reviewer_private.concept_test_runs from public,anon,authenticated;

insert into reviewer_private.concept_test_items(skill,prompt,options,correct,explanation) values
 ('verbal-evidence','Which detail supports the claim that an e-form reduces missing entries?',
  '["The e-form background is pale blue.","After introduction, forms with blank required fields fell from 20 to 3 per week."]',1,
  'A change in missing entries directly tests the claim. The background color describes appearance. For a causal conclusion, also check whether staff training or submission volume changed.'),
 ('verbal-context','“The device is portable, so the team can carry it from room to room.” Which meaning follows from the clue?',
  '["Easy to move","Fast to recharge"]',0,
  'Carrying it between rooms illustrates movement. The sentence gives no information about how it charges. That consequence is the clue to portable.'),
 ('verbal-tenses','“By the time the courier arrived, Lina ___ the labels.” Which phrase shows that labeling had finished before arrival?',
  '["will have printed","had printed"]',1,
  'Arrived fixes the reference point in the past. Had printed puts the completed work earlier than that point. Will have printed belongs with a future reference point.'),
 ('analytical-analogy','Wheel is to bicycle as blade is to …',
  '["fan","wind"]',0,
  'A wheel is a component of a bicycle. A blade is a component of a fan. Wind is movement of air, which a fan can create.'),
 ('analytical-classification','A parcel qualifies if it is sealed and either prepaid or collected in person. Which parcel qualifies?',
  '["Unsealed, prepaid and collected in person","Sealed, unpaid and collected in person"]',1,
  'First require a seal. Then one of the other two conditions is sufficient. The second parcel is sealed and collected in person. The prepaid parcel fails the seal requirement.'),
 ('analytical-evidence','An office changed its hours and introduced online booking in the same week. Wait times fell. What conclusion fits the evidence?',
  '["The decline followed two changes, so their individual effects are uncertain.","Online booking alone caused the decline."]',0,
  'The wait times are an observation. The two simultaneous changes are competing explanations. To isolate one effect, compare a similar group or period where only that factor changes.'),
 ('filipino-reading','“Napuno ang silid kaya inilabas ni Ria ang dagdag na upuan.” Ano ang ipinahihiwatig ng pangungusap?',
  '["Nagsara na ang silid.","Kailangan ng dagdag na mauupuan."]',1,
  'Ang pagkapuno ng silid ay dahilan ng paglabas ng dagdag na upuan. Walang sinabing isinara ang silid. Ang salitang kaya ang nag-uugnay ng sanhi at bunga.'),
 ('clerical-secondary','Sort by year ascending, then office alphabetically, then ID descending. Which record goes first?',
  '["2026 · HR · 42","2026 · HR · 17"]',0,
  'The records tie on year and office. The third key applies first to resolve this tie. Descending ID means the greater number, 42, precedes 17.');

create function public.learn_open_concept_test(skill_ids text[])
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  member_id uuid := reviewer_private.assert_member();
  test_id uuid;
  items jsonb;
begin
  if coalesce(cardinality(skill_ids),0) not between 1 and 25
     or (select count(*) from reviewer_private.concept_test_items where skill=any(skill_ids)) <> cardinality(skill_ids)
    then raise exception 'Invalid assessment selection' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(member_id::text,1900));
  select r.id,r.snapshot into test_id,items from reviewer_private.concept_test_runs r
    where r.learner=member_id and r.skills=skill_ids and r.submitted_at is null
      and r.opened_at>now()-interval '30 days'
    order by r.opened_at desc limit 1;
  if not found then
    if (select count(*) from reviewer_private.concept_test_runs r where r.learner=member_id
        and r.opened_at>now()-interval '1 day')>=30 then
      raise exception 'Daily test limit reached' using errcode='22023';
    end if;
    select jsonb_agg(to_jsonb(q) order by s.ordinality) into items
      from unnest(skill_ids) with ordinality s(skill,ordinality)
      join reviewer_private.concept_test_items q using(skill);
    insert into reviewer_private.concept_test_runs(learner,skills,snapshot)
      values(member_id,skill_ids,items) returning id into test_id;
  end if;
  return jsonb_build_object('id',test_id,'items',(
    select jsonb_agg(item - 'correct' - 'explanation' order by ordinality)
    from jsonb_array_elements(items) with ordinality entries(item,ordinality)
  ));
end $$;

create function public.learn_grade_concept_test(test_id uuid, selections jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  member_id uuid := reviewer_private.assert_member();
  existing reviewer_private.concept_test_runs;
  feedback jsonb;
begin
  select * into existing from reviewer_private.concept_test_runs
    where id=test_id and learner=member_id for update;
  if not found then raise exception 'Assessment unavailable' using errcode='42501'; end if;
  if existing.submitted_at is not null then
    if existing.responses is distinct from selections then raise exception 'Assessment already submitted' using errcode='22023'; end if;
    return existing.result;
  end if;
  if selections is null or jsonb_typeof(selections) <> 'object' then
    raise exception 'Submit an answer for each question' using errcode='22023';
  end if;
  if (select count(*) from jsonb_each(selections)) <> cardinality(existing.skills)
     or exists (select 1 from unnest(existing.skills) s(skill)
       where selections->s.skill is null or selections->s.skill not in ('0'::jsonb,'1'::jsonb)) then
    raise exception 'Submit an answer for each question' using errcode='22023';
  end if;
  select jsonb_agg(jsonb_build_object('skill',item->>'skill',
      'correct',(selections->>(item->>'skill'))::integer=(item->>'correct')::integer,
      'correct_choice',(item->>'correct')::integer,'explanation',item->>'explanation') order by ordinality)
    into feedback from jsonb_array_elements(existing.snapshot) with ordinality entries(item,ordinality);
  update reviewer_private.concept_test_runs
    set submitted_at=now(), responses=selections, result=feedback where id=test_id;
  return feedback;
end $$;
revoke all on function public.learn_open_concept_test(text[]),public.learn_grade_concept_test(uuid,jsonb)
  from public,anon,authenticated;
grant execute on function public.learn_open_concept_test(text[]),public.learn_grade_concept_test(uuid,jsonb) to authenticated;
