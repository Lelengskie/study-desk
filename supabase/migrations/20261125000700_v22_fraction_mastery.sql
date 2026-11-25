create or replace function public.v2_concept_attempt(skill text, variant_no smallint, numerator text, denominator text, hint_count smallint)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  n integer := variant_no;
  top integer;
  bottom integer := 1;
  correct boolean;
  hypothesis text;
begin
  perform reviewer_private.assert_member();
  if n is null or n not between 2 and 999 or hint_count is null or hint_count not between 0 and 3
    or numerator is null or numerator !~ '^-?[0-9]{1,48}$'
    or denominator is null or denominator !~ '^-?[0-9]{1,48}$' or denominator::numeric = 0 then
    raise exception 'Invalid concept response' using errcode = '22023';
  end if;
  top := case skill
    when 'basic-arithmetic' then n+11
    when 'fraction-understanding' then n
    when 'fraction-equivalent' then 3*n
    when 'fraction-simplify' then n
    when 'fraction-common-denominator' then 2*(2*n+1)
    when 'fraction-subtract' then 3*n-1
    when 'fraction-multiply' then 2*n
    when 'fraction-divide' then 3*n
    when 'fraction-mixed' then 5*n+2
    when 'fraction-word' then 3*(n+1)
    when 'fraction-review' then 3*n+case when n%2=0 then 2 else -2 end
    when 'deductive-counterexample' then 1+n/10
    when 'signed' then -n when 'order' then n+6 when 'fractions' then n+1
    when 'decimals' then 10*n+5 when 'percent' then n when 'ratio' then 3*n
    when 'linear' then n when 'average' then n+3
    when 'speed' then case when n < 10 then 35*n else (1+(n-10)%12)*(40+(n-10)/12) end
    when 'sequence' then n+12 when 'age' then case when n < 10 then n else 10+(n-10)%40 end
    when 'work' then n
    when 'discount' then 90*n when 'interest' then 10*n when 'area' then 3*n
    when 'commission' then 5*n when 'perimeter' then 2*(n+3) when 'venn' then n+10
    when 'syllogism' then n when 'arrangement' then n+1 when 'sufficiency' then 2+n%2
  end;
  if top is null then raise exception 'Unknown concept' using errcode = '22023'; end if;
  bottom := case skill when 'fractions' then 2*n
    when 'fraction-understanding' then n+3 when 'fraction-subtract' then 4*n
    when 'fraction-multiply' then 3*(n+1) when 'fraction-divide' then n+2
    when 'fraction-mixed' then 5 when 'fraction-review' then 5*n when 'decimals' then case when n < 10 then 100 when n < 100 then 1000 else 10000 end else 1 end;
  correct := numerator::numeric * bottom = denominator::numeric * top;
  if not correct and hint_count = 0 then
    hypothesis := case
      when skill = 'order' and numerator::numeric = denominator::numeric * ((n+2)*3) then 'possible_order_error'
      when skill = 'signed' and numerator::numeric = denominator::numeric * n then 'possible_sign_error'
      when skill = 'fractions' and numerator::numeric * (2+2*n) = 2 * denominator::numeric then 'possible_denominator_error'
      when skill = 'fraction-subtract' and numerator::numeric * (4*n+4) = 2 * denominator::numeric then 'possible_denominator_error'
      when skill = 'fraction-divide' and numerator::numeric * (3*(n+2)) = n * denominator::numeric then 'possible_divisor_reciprocal_error'
      when skill = 'decimals' and numerator::numeric * (bottom/10) = (n+5) * denominator::numeric then 'possible_place_value_error'
      when skill = 'percent' and numerator::numeric = 25 * denominator::numeric then 'possible_percent_as_quantity'
      when skill = 'discount' and numerator::numeric = (10*n) * denominator::numeric then 'possible_discount_amount'
      when skill = 'ratio' and numerator::numeric * 3 = 4*n * denominator::numeric then 'possible_reversed_ratio'
      when skill = 'venn' and numerator::numeric = (2*n+10) * denominator::numeric then 'possible_double_counting'
    end;
  end if;
  insert into reviewer_private.concept_attempts (user_id, concept, variant, independent, correct, hints, mistake)
    values (auth.uid(), skill, n, hint_count = 0, correct, hint_count,
      case when not correct then coalesce(hypothesis, 'incorrect_result') end)
    on conflict (user_id, concept, variant) do nothing;
  return correct;
end $$;
