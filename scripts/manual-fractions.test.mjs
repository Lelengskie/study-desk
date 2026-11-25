import test from 'node:test'
import assert from 'node:assert/strict'
import { manualFractionExplanation } from '../src/manual-fractions.mjs'
import { mathSegments } from '../src/math-segments.mjs'

test('the actual imported question uses subtraction of numerators', () => {
  const explanation = manualFractionExplanation('10/17 - 6/17 =','4/17')
  assert.match(explanation.explanation,/\(10 − 6\)\/17 = 4\/17/)
  assert.match(explanation.explanation,/no factor greater than 1/)
  assert.doesNotMatch(explanation.explanation,/reciprocal/)
  assert.match(explanation.shortcut,/subtract the numerators/)
  assert.equal(manualFractionExplanation('10/17 - 6/17 =','6/17'),null)
})
test('least common denominator, equivalent keys, and safe fallback', () => {
  assert.match(manualFractionExplanation('Calculate 7/12 - 1/8.','22/48').explanation,/multiple, 24/)
  assert.match(manualFractionExplanation('1/6 + 1/6','1/3').explanation,/simplify to 1\/3/)
  assert.equal(manualFractionExplanation('1/6 ÷ 1/6','1'),null)
  assert.equal(manualFractionExplanation('1/0 + 1/2','1'),null)
  assert.equal(mathSegments('Subtract: (10 − 6)/17 = 4/17.').filter(part=>part.math)[0].text,'(10 − 6)/17')
})
