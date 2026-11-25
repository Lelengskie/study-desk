import assert from 'node:assert/strict'
import test from 'node:test'
import { mathPath } from '../src/math-path.mjs'
import { equivalentNumber } from '../src/practice-response.mjs'

const expected = {
  signed: n => -n, order: n => n + 2 * 3, fractions: n => `${2 * n + 2}/${4 * n}`,
  decimals: n => `0.${n}5`, percent: n => 4 * n / 4, ratio: n => 2 * n / 2 * 3,
  linear: n => (3 * n + 4 - 4) / 3, average: n => (n + (n + 2) + (n + 7)) / 3,
  speed: n => 35 * n, sequence: n => n + 3 * 4, age: n => (2 * n + 4 - 4) / 2,
  work: n => 1 / (2 / (2 * n)), discount: n => 100 * n - 100 * n / 10,
  interest: n => 100 * n / 100 * 5 * 2, area: n => n + n + n,
  commission: n => 100*n/20, perimeter: n => n+3+n+3, venn: n => 6+n+4,
}

for (const [id, lesson] of Object.entries(mathPath)) {
  test(lesson.title, () => {
    const questions = new Set()
    for (let n = 2; n <= 9; n++) {
      const problem = lesson.generate(n)
      assert.ok(equivalentNumber(problem.answer, expected[id](n)), problem.question)
      assert.equal(problem.steps.length, 3)
      assert.ok(problem.mistake)
      questions.add(problem.question)
    }
    assert.equal(questions.size, 8)
    const visited = new Set([id])
    for (let parent = lesson.prerequisite; parent; parent = mathPath[parent].prerequisite) {
      assert.ok(mathPath[parent] && !visited.has(parent))
      visited.add(parent)
    }
  })
}
