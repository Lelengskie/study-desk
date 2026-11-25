import assert from 'node:assert/strict'
import test from 'node:test'
import { reviewerExplanation } from '../src/reviewer-explanations.mjs'

test('explains checked numerical answers with the method required by the prompt', () => {
  const cases = [
    ['10/17 − 6/17 =', '4/17', 'fraction_sum', /common denominator/],
    ['¾ ÷ 1/8 = ____', '6', 'fraction_product', /reciprocal/],
    ['3/9 x 2/3 =', '2/9', 'fraction_product', /Cancel common factors/],
    ['40 % of 5 is equal to', '2', 'percent', /1%/],
    ['120% of what number is 72?', '60', 'percent', /recover the whole/],
    ['850 is 40% of what number?', '2,125', 'percent', /2,125/],
    ['Find the highest common factor of 36 and 84. [RRB]', '12', 'common_factor', /84 = 36 × 2 \+ 12/],
  ]
  for (const [prompt, expected, method, evidence] of cases) {
    const result = reviewerExplanation(prompt, expected)
    assert.equal(result?.method, method, prompt)
    assert.match([result.explanation,result.shortcut].join(' '), evidence)
  }
})

test('explains explicit filing and fixed-step letter tasks', () => {
  assert.match(reviewerExplanation('Numerical: (1) 0.5 (2) 0.55 (3) 0.05', '3, 1, 2').explanation, /0.05 < 0.5 < 0.55/)
  assert.match(reviewerExplanation('Which comes next? Z, X, V, T, ___', 'R').explanation, /decrease by 2/)
  assert.match(reviewerExplanation('What is the plural of sheep?', 'sheep').explanation, /one sheep, five sheep/)
})

test('abstains when the supplied answer disagrees or the prompt falls outside a supported form', () => {
  assert.equal(reviewerExplanation('2/5 + 2/5 =', '8/10')?.method, 'fraction_sum')
  for (const [prompt, answer] of [
    ['20% of 50', '25'], ['15% of 300', '4,5'], ['0% of what number is 7?', '700'],
    ['3/4 ÷ 0/8 =', '1'], ['2/5 + 2/5 =', '4/10'], ['What is the plural of sheep?', 'sheeps'],
    ['Numerical: (1) 0.05 (2) 0.050 (3) 0.5', '1, 2, 3'],
    ['A, C, F, J, ...', 'O'], ['What is 20% of the amount shown?', '20'],
  ]) {
    assert.equal(reviewerExplanation(prompt, answer), null, prompt)
  }
})
