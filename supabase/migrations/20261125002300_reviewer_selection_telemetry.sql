create table reviewer_private.learn_question_funnel (
 learner uuid not null references auth.users(id),
 presentation uuid not null,
 source text not null check (source in ('original','generated')),
 concept text,
 difficulty text,
 selection_reason text,
 selected_at timestamptz,
 displayed_at timestamptz,
 submitted_at timestamptz,
 completed_at timestamptz,
 skipped_at timestamptz,
 primary key (learner,presentation)
);
alter table reviewer_private.learn_question_funnel enable row level security;
revoke all on reviewer_private.learn_question_funnel from public,anon,authenticated;

create function public.learn_record_question_event(
 presentation_id uuid, question_source text, scope_concept text, scope_difficulty text,
 reason text, transition text
)
returns void language plpgsql security definer set search_path='' as $$
declare member_id uuid := reviewer_private.assert_member();
begin
 if presentation_id is null or question_source is null or question_source not in ('original','generated')
    or transition is null or transition not in ('selected','displayed','submitted','completed','skipped')
    or (scope_concept is not null and scope_concept !~ '^[a-z0-9-]{1,64}$')
    or (scope_difficulty is not null and scope_difficulty not in ('foundation','beginner','intermediate','advanced','examination'))
    or (reason is not null and reason not in ('concept_match','no_exact_unused_reviewer','independent_check','selected_guided'))
 then raise exception 'Invalid learning event' using errcode='22023'; end if;

 insert into reviewer_private.learn_question_funnel(learner,presentation,source,concept,difficulty,selection_reason,
   selected_at,displayed_at,submitted_at,completed_at,skipped_at)
 values(member_id,presentation_id,question_source,scope_concept,scope_difficulty,reason,
   case when transition='selected' then now() end,
   case when transition='displayed' then now() end,
   case when transition='submitted' then now() end,
   case when transition='completed' then now() end,
   case when transition='skipped' then now() end)
 on conflict (learner,presentation) do update set
   selected_at=coalesce(learn_question_funnel.selected_at,excluded.selected_at),
   displayed_at=coalesce(learn_question_funnel.displayed_at,excluded.displayed_at),
   submitted_at=coalesce(learn_question_funnel.submitted_at,excluded.submitted_at),
   completed_at=coalesce(learn_question_funnel.completed_at,case when learn_question_funnel.skipped_at is null then excluded.completed_at end),
   skipped_at=coalesce(learn_question_funnel.skipped_at,case when learn_question_funnel.completed_at is null then excluded.skipped_at end)
 where learn_question_funnel.source=question_source;
end $$;
revoke all on function public.learn_record_question_event(uuid,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.learn_record_question_event(uuid,text,text,text,text,text) to authenticated;
