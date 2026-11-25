import React, { useState } from 'react'
import { mathPath } from './math-path.mjs'
import { equivalentNumber } from './practice-response.mjs'

export default function MathPath() {
  const [concept, choose] = useState('signed')
  const entry = mathPath[concept]
  return <section className="surface concept-lab">
    <h2>Math foundations</h2>
    <label>Concept <select value={concept} onChange={event => choose(event.target.value)}>
      {Object.entries(mathPath).map(([id, lesson]) => <option key={id} value={id}>{lesson.title}</option>)}
    </select></label>
    {entry.prerequisite && <button className="quiet" onClick={() => choose(entry.prerequisite)}>
      Review {mathPath[entry.prerequisite].title.toLowerCase()}
    </button>}
    <Variation key={concept} entry={entry} />
  </section>
}

function Variation({ entry }) {
  const [variant, next] = useState(2)
  const [response, change] = useState('')
  const [feedback, show] = useState('')
  const [revealed, reveal] = useState(0)
  const problem = entry.generate(variant)
  return <>
    <p>{problem.question}</p>
    <form onSubmit={event => {
      event.preventDefault()
      show(equivalentNumber(response, problem.answer) ? 'Correct.' : 'Try the first hint, then work through the calculation again.')
    }}>
      <label>Your calculation <input required value={response} onChange={event => { change(event.target.value); show('') }} /></label>
      <div className="actions">
        <button className="primary">Check my calculation</button>
        <button type="button" className="secondary" disabled={revealed >= problem.steps.length}
          onClick={() => reveal(revealed + 1)}>{revealed ? 'Next step' : 'Show hint'}</button>
        <button type="button" className="quiet" onClick={() => {
          next(variant === 9 ? 2 : variant + 1); change(''); show(''); reveal(0)
        }}>Try a new calculation</button>
      </div>
    </form>
    <p role="status">{feedback}</p>
    {revealed > 0 && <ol>{problem.steps.slice(0, revealed).map(step => <li key={step}>{step}</li>)}</ol>}
    {revealed === problem.steps.length && <p>{problem.mistake}</p>}
  </>
}
