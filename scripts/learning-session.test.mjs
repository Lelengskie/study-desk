import assert from 'node:assert/strict'
import test from 'node:test'
import { learningBand, nextLearningActivity, practiceScopes } from '../src/learning-session.mjs'

test('scheduled retention and remediation take precedence over examination application', () => {
  const standard = {due:false,weak:false,independent:2,exposed:false,hasImported:true}
  assert.equal(nextLearningActivity(standard),'application')
  assert.equal(nextLearningActivity({...standard,due:true,weak:true}),'retention')
  assert.equal(nextLearningActivity({...standard,weak:true}),'guided')
  assert.equal(nextLearningActivity({...standard,independent:1}),'foundations')
  assert.equal(nextLearningActivity({...standard,exposed:true}),'foundations')
  assert.equal(nextLearningActivity({...standard,hasImported:false}),'foundations')
})
test('practice tries exact concepts before subject-wide fallback', () => {
  assert.deepEqual(practiceScopes('Numerical Ability',['', 'concept:fractions','concept:fractions']),[
    {subject:'Numerical Ability',topic:'concept:fractions'},
    {subject:'Numerical Ability',topic:null},
  ])
})

test('difficulty falls after a mistake and requires diverse retained work for upper bands', () => {
  const clean = Array.from({length:5},()=>({correct:true,independent:true}))
  assert.equal(learningBand([],0,1),'foundation')
  assert.equal(learningBand(clean.slice(0,2),0,1),'beginner')
  assert.equal(learningBand(clean,0,1),'intermediate')
  assert.equal(learningBand(clean,2,1),'intermediate')
  assert.equal(learningBand(clean,2,2),'advanced')
  assert.equal(learningBand(clean,2,3),'examination')
  assert.equal(learningBand([...clean,{correct:false,independent:true}],2,3),'foundation')
})
