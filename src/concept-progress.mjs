import { firstSeed, lastSeed } from './math-path.mjs'

const day = 86_400_000
const intervals = [1, 3, 7, 14]
const seedCount = lastSeed - firstSeed + 1
// 313 is coprime to 998, so this order visits every seed exactly once.
const seedOrder = Array.from({ length: seedCount }, (_, index) => firstSeed + (index * 313) % seedCount)

const seedPosition = new Map(seedOrder.map((seed, index) => [seed, index]))

export function advanceVariant(current, unused) {
  const pool = unused.length ? unused : seedOrder
  const position = seedPosition.get(current) ?? -1
  return pool.find(seed => seedPosition.get(seed) > position) ?? pool[0]
}

export function conceptState(rows, skill, now = Date.now()) {
  const attempts = rows.filter(row => row.concept === skill)
    .sort((a, b) => new Date(a.attempted_at) - new Date(b.attempted_at))
  const independent = attempts.filter(row => row.independent)
  const success = independent.filter(row => row.correct).length
  let retained = 0
  let bestRetained = 0
  let everMastered = false
  let independentSoFar = 0
  let successfulSoFar = 0
  let due = null
  for (const row of attempts) {
    const at = Date.parse(row.attempted_at)
    if (row.independent) {
      independentSoFar++
      if (row.correct) successfulSoFar++
    }
    if (!row.independent || !row.correct) {
      retained = 0
      due = at + day
    } else if (due === null || at >= due) {
      if (due !== null) retained = Math.min(retained + 1, intervals.length - 1)
      due = at + intervals[retained] * day
    }
    bestRetained = Math.max(bestRetained, retained)
    if (retained > 0 && independentSoFar >= 4 && successfulSoFar / independentSoFar >= .9) everMastered = true
  }
  const used = new Set(attempts.map(row => row.variant))
  return {
    independent: independent.length, success, due, retained, bestRetained, everMastered,
    weak: attempts.length > 0 && attempts.slice(-2).some(row => !row.correct || !row.independent),
    mastery: independent.length >= 4 && success / independent.length >= .9 && retained >= 1,
    unused: seedOrder.filter(n => !used.has(n)),
    dueNow: due !== null && now >= due,
  }
}

export function dailyConcepts(rows, path, now = Date.now()) {
  const keys = Object.keys(path)
  const states = Object.fromEntries(keys.map(key => [key, conceptState(rows, key, now)]))
  const weakPrerequisites = keys.filter(key => states[key].weak).map(key => path[key].prerequisite).filter(Boolean)
  const due = keys.filter(key => states[key].dueNow)
  const next = keys.filter(key => !states[key].mastery && (!path[key].prerequisite || states[path[key].prerequisite].mastery))
  return [...new Set([...due, ...weakPrerequisites, ...next])].filter(key => states[key].unused.length).slice(0, 3)
}
