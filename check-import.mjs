
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { practiceIds } from '../supabase/functions/tutor/practice.mjs'

const sourceDir = resolve(process.argv[2] ?? '..')
const seed = resolve(process.argv[3] ?? '.private/seed.sql')
const [reviewer, held] = await Promise.all(['reviewer-content.json', 'review-queue.json']
  .map(async (name) => JSON.parse(await readFile(resolve(sourceDir, name), 'utf8'))))
const db = new PGlite()
try {
  await db.exec(
    'create role anon; create role authenticated; create role service_role; ' +
    'create schema auth; create table auth.users (id uuid primary key); ' +
    'create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;'
  )
  await db.exec(await readFile('supabase/migrations/20261121000100_reviewer.sql', 'utf8'))
  const sql = await readFile(seed, 'utf8')
  await db.exec(sql)
  await db.exec(sql)
  assert.equal((await db.query('select id from reviewer_private.modules')).rows.length, 14)
  const stored = (await db.query('select id, answer, explanation, stem from reviewer_private.questions')).rows
  assert.equal(stored.length, 44)
  assert.deepEqual(new Set(stored.map((q) => q.id)), new Set(practiceIds))
  assert.ok(held.every((entry) => !stored.some((q) => q.id === entry.id)))
  for (const question of reviewer.questions) {
    const row = stored.find((storedQuestion) => storedQuestion.id === question.id)
    assert.equal(row.answer, question.answer_option_id)
    assert.equal(row.explanation, question.explanation)
    assert.equal(row.stem, question.stem)
  }
  const entries = await readdir('dist', { recursive: true, withFileTypes: true })
  const code = (await Promise.all(entries.filter((entry) => entry.isFile())
    .map((entry) => readFile(resolve(entry.parentPath, entry.name), 'utf8')))).join('\n')
  for (const question of stored) {
    if (question.stem.length >= 36) assert.equal(code.includes(question.stem), false)
    assert.equal(code.includes(question.explanation), false)
  }
  for (const marker of ['GEMINI_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'review-queue.json', 'cse-reviewer-content-package.zip']) {
    assert.equal(code.includes(marker), false)
  }
  console.log('Private import checked: all 44 keys and explanations preserved, five held items absent, and the public build contains no reviewer bank.')
} finally { await db.close() }
