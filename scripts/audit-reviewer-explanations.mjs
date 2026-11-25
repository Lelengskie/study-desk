import { readFile, writeFile } from 'node:fs/promises'
import { reviewerExplanation } from '../src/reviewer-explanations.mjs'

const [snapshot, checkpoint] = process.argv.slice(2)
if (!snapshot || !checkpoint) throw new Error('Supply a private snapshot and private checkpoint path.')
const { rows } = JSON.parse((await readFile(snapshot, 'utf8')).replace(/^\uFEFF/, ''))
if (!Array.isArray(rows) || new Set(rows.map(row => row.id)).size !== rows.length)
  throw new Error('Expected a snapshot with distinct question IDs.')

const subjectStats = {}
const runtime = []
const missing = []
const duplicates = new Map()
const mapped = { subject:0, concept:0, difficulty:0, independentlyVerified:0 }
for (const row of rows) {
  const subject = row.subject === 'Verbal Ability' && row.concept === 'filipino' ? 'Filipino' : row.subject ?? 'Unclassified'
  const counts = subjectStats[subject] ??= { total:0, stored:0, checked:0, sourceOnly:0, runtime:0, combined:0, missing:0 }
  const option = row.options?.find(choice => (choice.id ?? choice.label) === row.source_answer)
  const answer = row.exact_value ?? row.model_answer ?? option?.text
  const checked = Boolean(row.checked_explanation?.trim())
  const source = Boolean(row.source_explanation?.trim())
  const stored = checked || source
  const generated = reviewerExplanation(row.stem, answer)
  counts.total++
  counts.checked += Number(checked)
  counts.sourceOnly += Number(!checked && source)
  counts.stored += Number(stored)
  counts.runtime += Number(Boolean(generated))
  counts.combined += Number(stored || Boolean(generated))
  counts.missing += Number(!stored && !generated)
  mapped.subject += Number(Boolean(row.subject))
  mapped.concept += Number(Boolean(row.concept))
  mapped.difficulty += Number(Boolean(row.learning_band))
  mapped.independentlyVerified += Number(row.reliability === 'independently_verified')
  if (generated) runtime.push({ id:row.id, subject, method:generated.method, stored })
  if (!stored && !generated) missing.push(row.id)
  const normalized = row.stem.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim()
  const key = JSON.stringify([subject, normalized, (row.options ?? []).map(choice => choice.text.trim().toLowerCase()).sort()])
  const ids = duplicates.get(key) ?? []
  ids.push(row.id)
  duplicates.set(key, ids)
}
const duplicateCandidates = [...duplicates.values()].filter(ids => ids.length > 1)
const summary = { rows:rows.length, mapped, subjectStats, duplicateCandidateGroups:duplicateCandidates.length }
await writeFile(checkpoint, JSON.stringify({ ...summary, runtime, missing, duplicateCandidates }, null, 2) + '\n')
console.log(JSON.stringify(summary, null, 2))
