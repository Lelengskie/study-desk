import assert from 'node:assert/strict'
import test from 'node:test'
import { activeStudyDays, journeyRewards } from '../src/journey-progress.mjs'

const day = (date, hour = 12) => new Date(2026, 10, date, hour).toISOString()
const row = (date, concept, independent = true, correct = true) => ({
  attempted_at: day(date), concept, independent, correct,
})

test('weekly goals count real local study days once and allow today to finish', () => {
  const attempts = [row(18,'signed'), row(22,'signed'), row(23,'percent'), row(24,'signed'), row(24,'order'), row(26,'order')]
  const result = activeStudyDays(attempts, new Date(day(25)))
  assert.equal(result.week.length, 7)
  assert.equal(result.weeklyDays, 3)
  assert.equal(result.streak, 3)
  assert.equal(activeStudyDays(attempts, new Date(day(27))).streak, 1)
})

test('repetition and assisted success cannot generate additional experience', () => {
  const state = { signed: { mastery: false, retained: 0, everMastered: true, bestRetained: 1 }, percent: { mastery: false, retained: 0 } }
  const first = journeyRewards([row(22,'signed'), row(24,'percent',false)], state, 1, 1)
  const repeat = journeyRewards([row(22,'signed'), row(23,'signed'), row(24,'percent',false)], state, 1, 1)
  assert.deepEqual(repeat, first)
  assert.equal(first.xp, 105)
  assert.equal(first.level, 2)
  assert.ok(first.badges.includes('Remembered after a delay'))
})
