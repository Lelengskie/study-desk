import test from 'node:test'
import assert from 'node:assert/strict'
import { mathSegments } from '../src/math-segments.mjs'

test('math spans preserve prose, grouped fractions, powers and roots', () => {
  const text = 'Divide (1/2)/(3/4). Then compare 2.5^3, 1 1/2 and √9.'
  const pieces = mathSegments(text)
  assert.deepEqual(pieces.filter(piece=>piece.math).map(piece=>piece.text), ['(1/2)/(3/4)','2.5^3','1 1/2','√9'])
  assert.equal(pieces.map(piece=>piece.text).join(''),text)
})

test('dates, URLs, path-like strings and ordinary slashes remain intact', () => {
  const text = 'Issued on 3/4. See 12/31/2027, 2027/12, and https://example.com/1/2. Use yes/no.'
  assert.deepEqual(mathSegments(text), [{text, math:false}])
})
