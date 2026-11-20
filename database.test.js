
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'
import { createPractice, practiceIds, studentPractice } from '../supabase/functions/tutor/practice.mjs'

const member = '10000000-0000-4000-8000-000000000001'
const other = '10000000-0000-4000-8000-000000000002'
const unapproved = '10000000-0000-4000-8000-000000000003'
const firstSession = '20000000-0000-4000-8000-000000000001'
const secondSession = '20000000-0000-4000-8000-000000000002'

test('Postgres enforces membership, verified grading, sync, review intervals and tutor privacy', async (t) => {
  const db = new PGlite()
  t.after(() => db.close())
  await db.exec(
    "create role anon; create role authenticated; create role service_role; " +
    "create schema auth; create table auth.users (id uuid primary key); " +
    "create function auth.uid() returns uuid language sql stable as " +
    "$$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;"
  )
  await db.exec(await readFile(new URL('../supabase/migrations/20261121000100_reviewer.sql', import.meta.url), 'utf8'))
  for (const id of [member, other, unapproved]) await db.query('insert into auth.users values ($1)', [id])
  for (const id of [member, other]) await db.query('insert into reviewer_private.members(user_id) values ($1)', [id])
  await db.exec("insert into reviewer_private.modules values ('math',0,'Math','Numerical Ability',array['professional'],'Lesson');")
  const opts = [{ id: '1', text: 'Verified' }, { id: '2', text: 'Distractor' }]
  for (const id of ['arithmetic-06', 'arithmetic-08', 'arithmetic-10']) {
    await db.query(
      "insert into reviewer_private.questions values ($1,'math',0,'en','foundation',$1,$2,'1','Worked solution','[]','independently_checked','test')",
      [id, JSON.stringify(opts)]
    )
  }
  const signAs = async (role, id = '') => {
    await db.exec('reset role')
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id])
    await db.exec('set role ' + role)
  }
  const call = async (name, ...args) => {
    const placeholders = args.map((_, i) => '$' + (i + 1)).join(',')
    return (await db.query('select public.' + name + '(' + placeholders + ') as result', args)).rows[0].result
  }
  const submit = async (id, option, request, session = firstSession, mode = 'quiz') =>
    call('study_submit', id, option, '30000000-0000-4000-8000-' + String(request).padStart(12, '0'), session, mode)

  await signAs('anon')
  await assert.rejects(call('study_catalog'), /permission denied/)
  await signAs('authenticated', unapproved)
  await assert.rejects(call('study_catalog'), /not approved/)
  await signAs('authenticated', member)
  assert.equal((await call('study_catalog')).modules[0].quiz_ids.length, 3)
  await assert.rejects(db.query('select answer from reviewer_private.questions'), /permission denied/)
  await assert.rejects(call('tutor_reserve', member, 'arithmetic-06', 5, 12), /permission denied/)
  assert.equal((await call('study_question', 'arithmetic-06')).stem, 'arithmetic-06')
  assert.equal('answer' in await call('study_question', 'arithmetic-06'), false)
  await assert.rejects(submit('held-item', '1', 1), /unavailable/)
  await call('study_complete', 'math')
  const first = await submit('arithmetic-06', '1', 1)
  assert.equal(first.correct, true)
  assert.deepEqual(await submit('arithmetic-06', '1', 1), first)
  await assert.rejects(submit('arithmetic-06', '2', 1), /already been used/)
  await assert.rejects(submit('arithmetic-06', '1', 4, firstSession, 'repeat'), /not due/)
  await submit('arithmetic-08', '1', 2)
  assert.equal((await call('study_progress')).mastery.math.mastered, false)
  await submit('arithmetic-10', '1', 3, secondSession)
  const stats = await call('study_progress')
  assert.equal(stats.mastery.math.attempts, 3)
  assert.equal(stats.mastery.math.mastered, true)
  assert.deepEqual(stats.completed, ['math'])
  await db.exec('reset role')
  await db.exec("update reviewer_private.review set due_at=now()-interval '1 hour'")
  await signAs('authenticated', member)
  assert.equal((await call('study_progress')).reviews.filter((r) => r.is_due).length, 3)
  await submit('arithmetic-06', '1', 4, secondSession, 'repeat')
  await submit('arithmetic-08', '2', 5, secondSession, 'repeat')
  const reviews = (await call('study_progress')).reviews
  assert.equal(reviews.find((r) => r.question_id === 'arithmetic-06').step, 2)
  assert.equal(reviews.find((r) => r.question_id === 'arithmetic-08').step, 1)

  await signAs('service_role')
  assert.equal(await call('tutor_reserve', member, 'arithmetic-06', 1, 2), true)
  assert.equal(await call('tutor_reserve', member, 'arithmetic-06', 1, 2), false)
  const round = await call('tutor_open', member, 'arithmetic-06', JSON.stringify(createPractice('arithmetic-06')))
  await assert.rejects(call('tutor_open', other, 'arithmetic-06', '{}'), /Finish/)
  await signAs('authenticated', other)
  assert.deepEqual(await call('study_progress'), { completed: [], mastery: {}, reviews: [] })
  await assert.rejects(call('tutor_answer', round, '1'), /unavailable/)
  await signAs('authenticated', member)
  const tutorResult = await call('tutor_answer', round, '2')
  assert.equal(tutorResult.correct, false)
  assert.equal(tutorResult.answer_option_id, '1')
  await assert.rejects(call('tutor_answer', round, '1'), /already been answered/)
  assert.equal((await call('study_progress')).mastery.math.attempts, 5)
  await db.exec('reset role')
  await db.query('update reviewer_private.members set active=false where user_id=$1', [member])
  await signAs('authenticated', member)
  await assert.rejects(call('study_catalog'), /not approved/)
  await signAs('service_role')
  await assert.rejects(call('tutor_open', member, 'arithmetic-06', '{}'), /Finish/)
})

test('tutor practice returns 44 distinct exercise mappings without shipping answers in its student projection', () => {
  assert.equal(new Set(practiceIds).size, 44)
  for (const id of practiceIds) {
    const practice = createPractice(id, () => 0.5)
    assert.ok(practice.feedback.length > 20)
    assert.ok(practice.stem.length > 12)
    assert.equal(new Set(practice.options.map((option) => option.text)).size, 4)
    assert.equal(practice.options.filter((option) => option.id === practice.answer).length, 1)
    assert.deepEqual(Object.keys(studentPractice(practice)), ['stem', 'options'])
  }
  assert.equal(createPractice('__proto__'), null)
})
