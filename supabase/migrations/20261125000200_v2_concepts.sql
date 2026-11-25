create table reviewer_private.concept_attempts (
  user_id uuid not null references auth.users(id),
  concept text not null,
  variant smallint not null check (variant between 2 and 9),
  independent boolean not null,
  correct boolean not null,
  hints smallint not null check (hints between 0 and 3),
  mistake text,
  attempted_at timestamptz not null default now(),
  primary key (user_id, concept, variant)
);
alter table reviewer_private.concept_attempts enable row level security;
revoke all on reviewer_private.concept_attempts from public, anon, authenticated;

create function public.v2_concept_progress()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform reviewer_private.assert_member();
  return coalesce((select jsonb_agg(to_jsonb(a) - 'user_id' order by a.attempted_at, a.concept, a.variant)
    from reviewer_private.concept_attempts a where a.user_id = auth.uid()), '[]'::jsonb);
end $$;

create function public.v2_concept_attempt(skill text, variant_no smallint, numerator text, denominator text, hint_count smallint)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  n integer := variant_no;
  top integer;
  bottom integer := 1;
  correct boolean;
begin
  perform reviewer_private.assert_member();
  if n is null or n not between 2 and 9 or hint_count is null or hint_count not between 0 and 3
    or numerator is null or numerator !~ '^-?[0-9]{1,48}$'
    or denominator is null or denominator !~ '^-?[0-9]{1,48}$' or denominator::numeric = 0 then
    raise exception 'Invalid concept response' using errcode = '22023';
  end if;
  top := case skill
    when 'signed' then -n when 'order' then n+6 when 'fractions' then n+1
    when 'decimals' then 10*n+5 when 'percent' then n when 'ratio' then 3*n
    when 'linear' then n when 'average' then n+3 when 'speed' then 35*n
    when 'sequence' then n+12 when 'age' then n when 'work' then n
    when 'discount' then 90*n when 'interest' then 10*n when 'area' then 3*n
    when 'commission' then 5*n when 'perimeter' then 2*(n+3) when 'venn' then n+10
  end;
  if top is null then raise exception 'Unknown concept' using errcode = '22023'; end if;
  bottom := case skill when 'fractions' then 2*n when 'decimals' then 100 else 1 end;
  correct := numerator::numeric * bottom = denominator::numeric * top;
  insert into reviewer_private.concept_attempts (user_id, concept, variant, independent, correct, hints, mistake)
    values (auth.uid(), skill, n, hint_count = 0, correct, hint_count,
      case when not correct then 'incorrect_result' end)
    on conflict (user_id, concept, variant) do nothing;
  return correct;
end $$;

revoke all on function public.v2_concept_progress() from public,anon,authenticated;
revoke all on function public.v2_concept_attempt(text,smallint,text,text,smallint) from public,anon,authenticated;
grant execute on function public.v2_concept_progress() to authenticated;
grant execute on function public.v2_concept_attempt(text,smallint,text,text,smallint) to authenticated;
