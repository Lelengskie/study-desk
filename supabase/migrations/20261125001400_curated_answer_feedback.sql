create or replace function public.curated_next(skill_id text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare member_id uuid := reviewer_private.assert_member(); material jsonb; stage_no integer;
 p reviewer_private.curated_progress; item jsonb;
begin
 select kit into material from reviewer_private.curated_skills where id=skill_id;
 if not found then raise exception 'Unknown skill' using errcode='22023'; end if;
 select * into p from reviewer_private.curated_progress where learner=member_id and skill=skill_id;
 stage_no:=coalesce(p.stage,0);
 item:=case when stage_no=5 and p.due_at>now() then null else material->'rows'->stage_no end;
 return jsonb_build_object('stage',stage_no,'independent_passes',coalesce((select count(*) from jsonb_each(p.first_attempts) e where e.value='true'::jsonb),0),'due',p.due_at,'mastered',coalesce(p.mastered,false),
   'title',material->>'title','lesson',material->>'lesson','example',material->>'example','prompt',item->>0,
   'options',case when item is null then null else jsonb_build_array(item->>1,item->>2) end);
end $$;
create or replace function public.curated_submit(skill_id text, expected_stage integer, chosen integer, used_example boolean default false)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare member_id uuid := reviewer_private.assert_member(); p reviewer_private.curated_progress;
 item jsonb; correct boolean; first_try boolean;
begin
 if chosen is null or chosen not between 0 and 1 or expected_stage is null or expected_stage not between 0 and 5 then
   raise exception 'Invalid assessment response' using errcode='22023'; end if;
 insert into reviewer_private.curated_progress(learner,skill) values(member_id,skill_id) on conflict do nothing;
 select * into p from reviewer_private.curated_progress where learner=member_id and skill=skill_id for update;
 if p.stage<>expected_stage or (p.stage=5 and p.due_at>now()) then
   raise exception 'The next question has changed or is not due' using errcode='22023'; end if;
 select kit->'rows'->expected_stage into item from reviewer_private.curated_skills where id=skill_id;
 correct:=(item->>3)::int=chosen;
 first_try:=not (p.first_attempts ? expected_stage::text);
 update reviewer_private.curated_progress c set
   first_attempts=case when first_try then c.first_attempts||jsonb_build_object(expected_stage::text,correct and not coalesce(used_example,true))
     else c.first_attempts end,
   stage=case when correct then expected_stage+1
     when expected_stage=5 then 5 else greatest(0,expected_stage-1) end,
   due_at=case when expected_stage=4 and correct or expected_stage=5 and not correct
      then now()+interval '1 day' else null end,
   mastered=expected_stage=5 and correct and first_try and not coalesce(used_example,true) and (c.first_attempts->>'4')::boolean is true
     and (select count(*) from jsonb_each(c.first_attempts) e where e.value='true'::jsonb)>=4
 where learner=member_id and skill=skill_id;
 return jsonb_build_object('correct',correct,'feedback',item->>4,'correct_choice',(item->>3)::int);
end $$;
