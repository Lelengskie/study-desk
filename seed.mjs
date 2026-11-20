
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const input = resolve(process.argv[2] ?? resolve(root, '..'))
const destination = resolve(process.argv[3] ?? resolve(root, '.private/seed.sql'))
const read = async (name) => JSON.parse(await readFile(resolve(input, name), 'utf8'))
const [packageData, manifest, held] = await Promise.all([
  read('reviewer-content.json'), read('source-manifest.json'), read('review-queue.json')
])
const { release, curriculum, questions } = packageData
if (packageData.schema_version !== 1 || curriculum.length !== 14 || questions.length !== 44 || held.length !== 5) {
  throw new Error('Expected the reviewed v1 package with 14 modules, 44 questions and five held items.')
}
const heldIds = new Set(held.map((q) => q.id))
const manifestFiles = new Map(manifest.files.map((entry) => [entry.id, entry]))
const sourceLabels = (q) => q.provenance.map(({ source_id, locator }) => {
  const file = manifestFiles.get(source_id)
  if (!file || !locator) throw new Error('Invalid source reference for ' + q.id)
  return { title: file.member_path ?? file.name, locator }
})
const unique = new Set()
const questionMap = new Map(questions.map((q) => [q.id, q]))
const questionRows = curriculum.flatMap((module) => module.quiz_ids.map((id, position) => {
  const q = questionMap.get(id)
  if (!q || unique.has(id) || heldIds.has(id) || q.topic_id !== module.id || !q.eligible_for_scoring
    || q.confidence !== 'high' || !q.options.some((o) => o.id === q.answer_option_id)
    || !['independently_checked', 'primary_reference_checked'].includes(q.verification)) {
    throw new Error('Unverified, duplicated or missing question: ' + id)
  }
  unique.add(id)
  return {
    id, position, topic_id: q.topic_id, stem: q.stem, language: q.language, difficulty: q.difficulty,
    options: q.options, answer: q.answer_option_id, explanation: q.explanation,
    sources: sourceLabels(q), verification: q.verification, release
  }
}))
if (unique.size !== questions.length) throw new Error('The module/question mapping is incomplete.')
const moduleRows = curriculum.map((module, position) => ({
  id: module.id, position, track: module.track, title: module.title, levels: module.levels, lesson: module.learn.text
}))

// Encode the JSON as UTF-8 hex so content cannot alter SQL quoting.
const jsonb = (rows) => "convert_from(decode('" + Buffer.from(JSON.stringify(rows)).toString('hex')
  + "', 'hex'), 'UTF8')::jsonb"
const sql = [
  '-- Private admin import. Never commit or deploy this seed file.',
  'begin;',
  'insert into reviewer_private.modules select * from jsonb_populate_recordset(null::reviewer_private.modules, '
    + jsonb(moduleRows) + ') on conflict (id) do nothing;',
  'insert into reviewer_private.questions select * from jsonb_populate_recordset(null::reviewer_private.questions, '
    + jsonb(questionRows) + ') on conflict (id) do nothing;',
  'commit;', ''
].join('\n')
await mkdir(dirname(destination), { recursive: true })
await writeFile(destination, sql)
console.log('Prepared a private seed for ' + moduleRows.length + ' modules and ' + questionRows.length + ' verified questions.')
