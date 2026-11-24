import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { loadHybrid, stageHybrid } from './hybrid-import.mjs'

const db = new PGlite()
const member = '00000000-0000-4000-8000-000000000001'
const outsider = '00000000-0000-4000-8000-000000000002'
const other = '00000000-0000-4000-8000-000000000003'
const data = await loadHybrid(process.argv[2] ?? '../../outputs')
const runFile = async name => db.exec(await readFile(name, 'utf8'))
async function login(role, id = '') {
  await db.exec('reset role; set role ' + role)
  await db.query("select set_config('study.test_user',$1,false)", [id])
}

try {
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$select nullif(current_setting('study.test_user', true),'')::uuid$$;
    insert into auth.users values ('${member}'), ('${outsider}'), ('${other}');`)
  await runFile('supabase/migrations/20261121000100_reviewer.sql')
  await runFile('../private-import.sql')
  await db.exec(`
    insert into reviewer_private.members values ('${member}',true), ('${other}',true);
    insert into reviewer_private.completed(user_id,module_id)
    select '${member}',id from reviewer_private.modules order by id limit 1;`)
  const original = (await db.query('select id,answer from reviewer_private.questions order by id limit 1')).rows[0]
  await login('authenticated', member)
  await db.query("select public.study_submit($1,$2,$3,$4,'quiz')", [original.id, original.answer, outsider, other])
  await db.exec('reset role')
  const baselineSql = `select jsonb_build_object(
    'accounts',(select jsonb_agg(to_jsonb(u) order by u.id) from auth.users u),
    'questions',(select jsonb_agg(to_jsonb(q) order by q.id) from reviewer_private.questions q),
    'progress',(select jsonb_agg(to_jsonb(c) order by c.module_id) from reviewer_private.completed c),
    'attempts',(select jsonb_agg(to_jsonb(a) order by a.seq) from reviewer_private.attempts a),
    'review',(select jsonb_agg(to_jsonb(r) order by r.question_id) from reviewer_private.review r)) baseline`
  const before = (await db.query(baselineSql)).rows
  await runFile('supabase/migrations/20261124000100_hybrid.sql')
  assert.deepEqual(await stageHybrid(db, data), { library: data.library.length, practice: data.practice.length })
  assert.deepEqual(await stageHybrid(db, data), { library: 0, practice: 0 })
  const duplicate = { ...data.practice[0], id: 'duplicate-fixture' }
  await assert.rejects(stageHybrid(db, { library: [], practice: [duplicate] }), /duplicate key/)
  assert.deepEqual((await db.query(baselineSql)).rows, before)
  assert.deepEqual((await db.query(`select
    (select count(*)::int from reviewer_private.library) as library,
    (select count(*)::int from reviewer_private.practice) as practice,
    (select count(*)::int from reviewer_private.practice where active) as active`)).rows,
  [{ library: data.library.length, practice: data.practice.length, active: 0 }])
  await login('anon')
  await assert.rejects(db.query('select * from public.hybrid_library()'), /permission denied/)
  await login('authenticated', outsider)
  await assert.rejects(db.query('select * from public.hybrid_practice()'), /not approved/i)
  await login('authenticated', member)
  await assert.rejects(db.query('select * from reviewer_private.practice'), /permission denied/)
  assert.equal((await db.query('select * from public.hybrid_library()')).rows.length, 0)
  assert.equal((await db.query("select * from public.hybrid_practice(status_filter => 'answer_unavailable')")).rows.length, 0)

  await db.exec('reset role')
  await db.exec(`update reviewer_private.practice set active=true;
    update reviewer_private.library set active=true, drive_file_id='fixture-only';`)
  await db.exec('vacuum analyze reviewer_private.library,reviewer_private.practice')
  const sizes = (await db.query(`select c.relname as relation,
    pg_table_size(c.oid)::int as table_bytes,pg_indexes_size(c.oid)::int as index_bytes
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='reviewer_private' and c.relname in ('library','practice') order by 1`)).rows
  await login('authenticated', member)
  const first = (await db.query('select * from public.hybrid_practice()')).rows
  const second = (await db.query('select * from public.hybrid_practice(after_id => $1)', [first.at(-1).id])).rows
  assert.equal(first.length, 25)
  assert.equal(second.length, 25)
  assert(!first.some(item => second.some(next => next.id === item.id)))
  assert(first.every(item => !('source_answer' in item)))
  assert.equal((await db.query('select * from public.hybrid_practice(random_count => 12)')).rows.length, 12)
  assert.equal((await db.query('select * from public.hybrid_library()')).rows.length, 25)
  const question = data.practice.find(row => row.source_answer)
  const answer = (await db.query('select public.hybrid_answer($1) as data', [question.id])).rows[0].data
  assert.equal(answer.answer, question.source_answer)
  await db.query("select public.hybrid_feedback($1,true,'Synthetic report')", [question.id])
  await assert.rejects(db.query("select public.study_submit($1,$2,$3,$4,'quiz')", [
    question.id, question.source_answer, other, outsider
  ]), /Question or option unavailable/)
  assert.equal((await db.query('select * from public.hybrid_practice(saved_only => true)')).rows[0].id, question.id)
  await login('authenticated', other)
  assert.equal((await db.query('select * from public.hybrid_practice(saved_only => true)')).rows.length, 0)
  await assert.rejects(db.query('select public.hybrid_tutor_prepare($1,$2,$3,5,12)', [other,question.id,'fixture']), /permission denied/)
  await db.exec('reset role')
  assert.deepEqual((await db.query(baselineSql)).rows, before)
  await db.query('update reviewer_private.practice set ai_allowed=true where id=$1', [question.id])
  await login('service_role')
  const prepare = async learner => (await db.query(
    "select public.hybrid_tutor_prepare($1,$2,'fixture-v1',5,12) as data", [learner,question.id]
  )).rows[0].data
  await assert.rejects(prepare(outsider), /Membership required/)
  const ready = await prepare(member)
  assert.equal(ready.status, 'ready')
  const explanation = 'Synthetic fixture explanation for database cache and quota validation.'
  await db.query("select public.hybrid_tutor_cache($1,$2,'fixture-v1',$3)", [question.id, ready.revision, explanation])
  assert.deepEqual(await prepare(member), { status: 'ai', explanation })
  await db.exec('reset role')
  assert.equal((await db.query("select calls from reviewer_private.tutor_usage where subject='project'")).rows[0].calls, 1)
  console.log(JSON.stringify({ stage: { library: data.library.length, practice: data.practice.length },
    repeatAdded: 0, sizes, tests: 'passed' }, null, 2))
} finally {
  await db.close()
}
