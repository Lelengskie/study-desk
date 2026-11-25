import React, { useCallback, useEffect, useState } from 'react'
import MathText from './MathText'
import FoundationGuide from './FoundationGuide'
import PracticeResponse from './PracticeResponse'
import { rpc } from './api'
import { firstSeed, lastSeed, mathPath } from './math-path.mjs'
import { equivalentNumber, rational } from './practice-response.mjs'
import { conceptState, dailyConcepts } from './concept-progress.mjs'

const misconceptionPrompts = {
  possible_order_error: 'Did you add before multiplying? Try grouping the repeated amount first.',
  possible_sign_error: 'Did the balance stay below zero after the deposit? Sketch the move on a number line.',
  possible_denominator_error: 'Did you add denominators? Draw equal-sized pieces before adding.',
  possible_place_value_error: 'Did you line up the decimal points? Label the place value of each digit.',
  possible_percent_as_quantity: 'Does 25 describe pesos or a share out of 100? Try expressing the percentage as a fraction.',
  possible_discount_amount: 'Did you calculate the amount saved? Subtract it from the starting price to find what you pay.',
  possible_reversed_ratio: 'Which amount is measured in cups of water? Write the units beside each quantity in the ratio.',
  possible_double_counting: 'Did you count readers in both groups twice? Place those readers in the overlap first.',
}

export default function MathPath({ initialConcept = 'signed', openImported, onConceptChange }) {
  const [concept, setConcept] = useState(initialConcept)
  function choose(id) {
    setConcept(id)
    onConceptChange?.()
  }
  const [rows, setRows] = useState([])
  const [sync, setSync] = useState('loading')
  const refresh = useCallback(async () => {
    try {
      setRows(await rpc('v2_concept_progress'))
      setSync('ready')
    } catch {
      setSync('unavailable')
    }
  }, [])
  useEffect(() => { refresh() }, [refresh])
  const entry = mathPath[concept]
  const state = conceptState(rows, concept)
  const daily = dailyConcepts(rows, mathPath)
  const last = rows.filter(row => row.concept === concept).at(-1)
  const followUp = misconceptionPrompts[last?.mistake]
  const prerequisite = entry.prerequisite && mathPath[entry.prerequisite]
  // Seed 1 is reserved for display and is outside the server's scored seed range.
  const example = entry.generate(1)
  const nextConcept = daily.find(id => id !== concept)
  return <section className="surface concept-lab">
    <h2>Math foundations</h2>
    <label>Concept <select value={concept} onChange={event => choose(event.target.value)}>
      {Object.entries(mathPath).map(([id, lesson]) => <option key={id} value={id}>{lesson.title}</option>)}
    </select></label>
    {prerequisite && <button className="quiet" onClick={() => choose(entry.prerequisite)}>
      Review {prerequisite.title.toLowerCase()}
    </button>}
    {sync === 'unavailable' && <p role="status">Progress sync is unavailable. You can keep practicing.</p>}
    {sync === 'ready' && <>
      <p>{state.success} correct on {state.independent} independent variations.
        {state.mastery ? ' Mastery demonstrated.' : state.weak ? ' Review the concept or its prerequisite.' : ''}
        {state.dueNow ? ' Review due.' : state.due && ' Next review ' + new Date(state.due).toLocaleDateString() + '.'}</p>
      {followUp && <p>{followUp}</p>}
      {daily.length > 0 && <div className="actions" aria-label="Recommended today">
        {daily.map(key => <button type="button" className="secondary" key={key} onClick={() => choose(key)}>
          {mathPath[key].title}
        </button>)}
      </div>}
      {state.unused.length === 0 && <p>All tracked variations have been tried. You can revisit them for practice.</p>}
    </>}
    <h3>{entry.title}</h3>
    <p>{lastSeed-firstSeed+1} generated practice variations</p>
    <FoundationGuide key={concept} concept={concept} />
    <details key={concept} className="concept-worked">
      <summary>Understand the concept with a worked example</summary>
      <p><MathText text={example.question} /></p>
      <ol>{example.steps.map(step => <li key={step}><MathText text={step} /></li>)}</ol>
      <p>Common mistake: {example.mistake}</p>
    </details>
    <h3>Try it independently</h3>
    {sync !== 'loading' && <Variation key={concept} concept={concept} entry={entry} state={state}
      sync={sync} refresh={refresh} />}
    <div className="actions">
      {openImported && <button className="secondary" onClick={() => openImported(concept)}>Open imported practice</button>}
      {nextConcept && <button className="secondary" onClick={() => choose(nextConcept)}>
        Continue to {mathPath[nextConcept].title.toLowerCase()}</button>}
    </div>
  </section>
}

function Variation({ concept, entry, state, sync, refresh }) {
  const [variant, next] = useState(() => state.unused[0] ?? firstSeed)
  const [response, change] = useState('')
  const [feedback, show] = useState('')
  const [revealed, reveal] = useState(0)
  const [busy, setBusy] = useState(false)
  const problem = entry.generate(variant)

  async function check(event) {
    event.preventDefault()
    const fraction = rational(response)
    if (!fraction) { show('Enter a number, decimal or fraction.'); return }
    let correct = equivalentNumber(response, problem.answer)
    let saveFailed = false
    if (sync === 'ready') {
      setBusy(true)
      try {
        correct = await rpc('v2_concept_attempt', {
          skill: concept, variant_no: variant, numerator: String(fraction[0]),
          denominator: String(fraction[1]), hint_count: revealed,
        })
        await refresh()
      } catch {
        saveFailed = true
      } finally {
        setBusy(false)
      }
    }
    if (!correct && !revealed) reveal(1)
    const result = correct ? 'Correct.' : 'Review the concept below, then continue to the worked example.'
    show(saveFailed ? result + ' Progress could not be saved.' : result)
  }

  return <>
    <p><MathText text={problem.question} /></p>
    <form onSubmit={check}>
      <fieldset disabled={busy} className="math-input-group">
        <PracticeResponse item={{}} math inputLabel="Your calculation" response={response}
          change={value => { change(value); show('') }} />
      </fieldset>
      <div className="actions">
        <button className="primary" disabled={busy}>Check my calculation</button>
        <button type="button" className="secondary" disabled={busy || revealed >= problem.steps.length}
          onClick={() => reveal(revealed + 1)}>{revealed ? 'Next step' : 'Show hint'}</button>
        <button type="button" className="quiet" disabled={busy} onClick={() => {
          next(state.unused.find(n => n !== variant) ?? (variant === lastSeed ? firstSeed : variant + 1))
          change(''); show(''); reveal(0)
        }}>Try a new calculation</button>
      </div>
    </form>
    <p role="status">{feedback}</p>
    {revealed > 0 && <ol>{problem.steps.slice(0, revealed).map(step => <li key={step}><MathText text={step} /></li>)}</ol>}
    {revealed > 0 && concept === 'syllogism' && <div className="logic-groups" aria-label="Groups in the deduction">
      Badge holders
      <div>Members <div>Volunteers</div></div>
    </div>}
    {revealed === problem.steps.length && <p>{problem.mistake}</p>}
  </>
}
