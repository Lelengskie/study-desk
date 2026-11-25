import assert from 'node:assert/strict'
import { curriculum, curriculumEntry } from '../src/curriculum.mjs'
import { coreNumerical } from '../src/core-numerical.mjs'
import { mathPath } from '../src/math-path.mjs'

const conditions = ['grammar','filipino','data-interpretation','constitution','clerical']
const curated = Object.fromEntries(conditions.map(id=>[id,{mastered:true,due:true}]))
const summary = {}
for (const [subject, topics] of Object.entries(curriculum)) {
  const entries = Object.values(topics).flat().map(key=>curriculumEntry(key,{},curated))
  assert.equal(new Set(entries.map(item=>item.id)).size,entries.length)
  assert(entries.every(item=>item.kind!=='pending' || !item.mastered && !item.due))
  assert(entries.every(item=>item.kind!=='curated' || item.mastered && item.due))
  summary[subject] = {topics:Object.keys(topics).length, required:entries.length,
    adaptive:entries.filter(item=>item.kind!=='pending').length}
}
for (const [id, lesson] of Object.entries(coreNumerical)) {
  assert(mathPath[lesson.prerequisite])
  const questions = new Set()
  for (let n=2;n<=999;n++) {
    const item=lesson.generate(n)
    assert.deepEqual(item,lesson.generate(n))
    assert(item.steps.length>=3 && item.mistake)
    questions.add(item.question)
  }
  assert.equal(questions.size,998,id)
}
console.log(JSON.stringify(summary,null,2))
