alter table reviewer_private.practice
  add column delivery_format text not null default 'multiple_choice',
  add column practice_context jsonb not null default '{}',
  add column model_answer text,
  add column exact_value text,
  drop constraint practice_check,
  drop constraint practice_check1,
  drop constraint practice_ready_answer_check;

alter table reviewer_private.practice add constraint practice_format_check check (
  delivery_format in ('multiple_choice','self_check','short_answer_math')
  and jsonb_typeof(options) = 'array'
  and (
    (delivery_format = 'multiple_choice' and model_answer is null and exact_value is null
      and (source_answer is not null) = (status = 'source_answer_available')
      and (source_answer is null or options @> jsonb_build_array(jsonb_build_object('label', source_answer))))
    or
    (delivery_format <> 'multiple_choice' and options = '[]' and source_answer is null
      and nullif(btrim(model_answer),'') is not null
      and (delivery_format = 'short_answer_math') = (exact_value is not null))
  )
);
alter table reviewer_private.practice add constraint practice_ready_answer_check check (
  not answer_ready or (status = 'source_answer_available' and answer_evidence is not null)
);

create function public.hybrid_practice_context(question_id text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform reviewer_private.assert_member();
  return coalesce((select p.practice_context from reviewer_private.practice p
    where p.id=question_id and p.active and p.answer_ready), '{}'::jsonb);
end $$;
revoke all on function public.hybrid_practice_context(text) from public,anon,authenticated;
grant execute on function public.hybrid_practice_context(text) to authenticated;

create or replace function public.hybrid_answer(question_id text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  perform reviewer_private.assert_member();
  select jsonb_build_object('answer',p.source_answer,'status',p.status,'explanation',p.source_explanation,
    'answer_text',p.model_answer,'exact_value',p.exact_value)
    into result from reviewer_private.practice p where p.id=question_id and p.active and p.answer_ready;
  if found then return result; end if;
  select jsonb_build_object('answer',v.answer,'explanation',v.explanation,'status','independently_verified')
    into result from reviewer_private.questions v where v.id=question_id;
  if not found then raise exception 'Question unavailable' using errcode='22023'; end if;
  return result;
end $$;
