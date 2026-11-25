import test from 'node:test'
import assert from 'node:assert/strict'
import { adultExercises } from '../src/adult-exercises.mjs'
import { mathPath } from '../src/math-path.mjs'
import { activeLegacySeeds, templateQuality } from '../src/template-quality.mjs'

test('every historical template has an explicit quality decision', () => {
  assert.deepEqual(Object.keys(templateQuality).sort(),Object.keys(mathPath).sort())
  assert.equal(templateQuality['basic-arithmetic'],'retired')
  const counts = Object.entries(templateQuality).reduce((totals,[skill,kind]) => {
    totals[kind] = (totals[kind] ?? 0) + activeLegacySeeds(skill).length
    for (const seed of activeLegacySeeds(skill)) assert(seed>=2 && seed<=999)
    return totals
  }, {})
  assert.deepEqual(counts,{retired:0,foundation:63,targeted:56})
  assert.deepEqual(Object.fromEntries(Object.entries(Object.groupBy(Object.values(templateQuality),value=>value))
    .map(([value,items])=>[value,items.length])),{retired:12,foundation:21,targeted:14})
})

test('adult practice uses distinct structures and exact answers', () => {
  assert.deepEqual(adultExercises['basic-arithmetic'].map(item=>Number(item.answer)),[1250+875-368,1840+415-1972])
  assert.deepEqual(adultExercises.percent.map(item=>Number(item.answer)),[28500*88/100-6750,480000*100/40])
  assert.equal(Number(adultExercises['percent-change'][0].answer),40000*115*90/10000-40000)
  assert.equal(Number(adultExercises['whole-subtract'][0].answer),2460-1785)
  assert.equal(Number(adultExercises['whole-multiply'][0].answer),26*48)
  const exercises=Object.values(adultExercises).flat()
  assert.equal(new Set(exercises.map(item=>item.question)).size,7)
  assert.ok(exercises.every(item=>item.steps.length>=3 && item.mistake))
})
