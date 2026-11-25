import assert from 'node:assert/strict'
import test from 'node:test'
import { conceptState, dailyConcepts } from '../src/concept-progress.mjs'
import { mathPath } from '../src/math-path.mjs'

const day = 86_400_000
const base = Date.UTC(2026, 10, 25)
const attempt = (variant, days, correct = true, independent = true, concept = 'signed') => ({
  concept, variant, correct, independent, attempted_at: new Date(base + days * day).toISOString(),
})

test('mastery needs different independent attempts and a delayed check', () => {
  const rows = [2, 3, 4, 5].map(n => attempt(n, 0))
  assert.equal(conceptState(rows, 'signed', base).mastery, false)
  rows.push(attempt(6, 1))
  assert.equal(conceptState(rows, 'signed', base + day).mastery, true)
  assert.equal(conceptState(rows, 'signed', base + day).due, base + 4 * day)
  rows.push(attempt(7, 4), attempt(8, 11))
  assert.equal(conceptState(rows, 'signed', base + 11 * day).due, base + 25 * day)
  rows.push(attempt(9, 25, false))
  const afterMistake = conceptState(rows, 'signed', base + 25 * day)
  assert.equal(afterMistake.mastery, false)
  assert.equal(afterMistake.everMastered, true)
  assert.equal(afterMistake.bestRetained, 3)

})

test('a hint or mistake resets retention and a weak topic recommends the prerequisite', () => {
  const rows = [attempt(2, 0, true, false, 'percent'), attempt(3, 1, false, true, 'percent')]
  const state = conceptState(rows, 'percent', base + 2 * day)
  assert.equal(state.independent, 1)
  assert.equal(state.retained, 0)
  assert.equal(state.weak, true)
  assert.equal(state.dueNow, true)
  assert.deepEqual(dailyConcepts(rows, mathPath, base + 2 * day).slice(0, 2), ['percent', 'decimals'])
})
