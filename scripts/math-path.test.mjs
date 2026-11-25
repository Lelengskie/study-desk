import assert from 'node:assert/strict'
import test from 'node:test'
import { firstSeed, lastSeed, mathPath } from '../src/math-path.mjs'
import { equivalentNumber } from '../src/practice-response.mjs'

const expected = {
  'whole-subtract': n => (n+2+n%8)-(2+n%8),
  'factor-pairs': n => ((2+n%7)*n)/(2+n%7),
  'gcf-lcm': n => n%2 ? (3*n)*(5*n)/n : n,
  'fraction-decimal': n => n%2 ? `${n}/100` : `${n*10}/100`,
  'algebra-expression': n => Array(2+n%4).fill(n).reduce((sum, value) => sum+value,3),
  'counting-pairs': n => Array(n).fill(2+n%5).reduce((sum,value)=>sum+value,0),
  'whole-multiply': n => Array(n).fill(2+n%8).reduce((sum, size) => sum+size, 0),
  'whole-divide': n => (n*(2+n%9))/(2+n%9),
  'percent-change': n => 100*n + (n%2 ? 5*n : -5*n),
  'compound-interest': n => n*(10000+(n%2 ? 201 : 404)),
  'multi-equation': n => (((n+4)*(2+n%5)-3)+3)/(2+n%5)-4,
  volume: n => Array(2+n%5).fill(3*n).reduce((sum, layer) => sum+layer, 0),
  'measurement-conversion': n => n%2 ? Math.round(n/0.01) : Math.round(100*n*0.01),
  'simple-probability': n => `${n*3}/${3*(n+2+n%7)}`,
  'basic-arithmetic': n => n+18-7,
  'fraction-understanding': n => `${2*n}/${2*n+6}`,
  'fraction-equivalent': n => (3*n+3)/(n+1)*n,
  'fraction-simplify': n => 2*n/2,
  'fraction-common-denominator': n => 4*n+2,
  'fraction-subtract': n => `${6*n-2}/${8*n}`,
  'fraction-multiply': n => `${4*n}/${6*n+6}`,
  'fraction-divide': n => `${6*n}/${2*n+4}`,
  'fraction-mixed': n => `${10*n+4}/10`,
  'fraction-word': n => (4*n+4)/4*3,
  'fraction-review': n => `${6*n+(n%2===0?4:-4)}/${10*n}`,
  'deductive-counterexample': n => 1+Math.trunc(n/10),
  signed: n => -n, order: n => n + 2 * 3, fractions: n => `${2 * n + 2}/${4 * n}`,
  decimals: n => `0.${n}5`, percent: n => 4 * n / 4, ratio: n => 2 * n / 2 * 3,
  linear: n => (3 * n + 4 - 4) / 3, average: n => (n + (n + 2) + (n + 7)) / 3,
  speed: n => n < 10 ? 35*n : (1+(n-10)%12)*(40+Math.floor((n-10)/12)), sequence: n => n + 3 * 4, age: n => n < 10 ? n : 10+(n-10)%40,
  work: n => `${2*n}/2`, discount: n => 100 * n - 100 * n / 10,
  interest: n => 100 * n / 100 * 5 * 2, area: n => n + n + n,
  commission: n => 100*n/20, perimeter: n => n+3+n+3, venn: n => 6+n+4,
  syllogism: n => n, arrangement: n => n+1, sufficiency: n => n%2 ? 3 : 2,
}

for (const [id, lesson] of Object.entries(mathPath)) {
  test(lesson.title, () => {
    const questions = new Set()
    for (let n = firstSeed; n <= lastSeed; n++) {
      const problem = lesson.generate(n)
      assert.ok(equivalentNumber(problem.answer, expected[id](n)), problem.question)
      assert.ok(problem.steps.length >= 3)
      assert.ok(problem.mistake)
      questions.add(problem.question)
    }
    assert.equal(questions.size, lastSeed - firstSeed + 1)
    const visited = new Set([id])
    for (let parent = lesson.prerequisite; parent; parent = mathPath[parent].prerequisite) {
      assert.ok(mathPath[parent] && !visited.has(parent))
      visited.add(parent)
    }
  })
}
