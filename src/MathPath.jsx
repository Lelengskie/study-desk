import React, { useCallback, useEffect, useState } from 'react'
import { rpc } from './api'
import { mathPath } from './math-path.mjs'
import { equivalentNumber, rational } from './practice-response.mjs'
import { conceptState, dailyConcepts } from './concept-progress.mjs'

export default function MathPath() {
  const [concept, choose] = useState('signed')
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
  const prerequisite = entry.prerequisite && mathPath[entry.prerequisite]
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
      {daily.length > 0 && <div className="actions" aria-label="Recommended today">
        {daily.map(key => <button type="button" className="secondary" key={key} onClick={() => choose(key)}>
          {mathPath[key].title}
        </button>)}
      </div>}
      {state.unused.length === 0 && <p>All tracked variations have been tried. You can revisit them for practice.</p>}
    </>}
    {sync !== 'loading' && <Variation key={concept} concept={concept} entry={entry} state={state}
      sync={sync} refresh={refresh} />}
  </section>
}

function Variation({ concept, entry, state, sync, refresh }) {
  const [variant, next] = useState(() => state.unused[0] ?? 2)
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
    <p>{problem.question}</p>
    <form onSubmit={check}>
      <label>Your calculation <input required disabled={busy} value={response} onChange={event => { change(event.target.value); show('') }} /></label>
      <div className="actions">
        <button className="primary" disabled={busy}>Check my calculation</button>
        <button type="button" className="secondary" disabled={busy || revealed >= problem.steps.length}
          onClick={() => reveal(revealed + 1)}>{revealed ? 'Next step' : 'Show hint'}</button>
        <button type="button" className="quiet" disabled={busy} onClick={() => {
          next(state.unused.find(n => n > variant) ?? state.unused.find(n => n !== variant) ?? (variant === 9 ? 2 : variant + 1))
          change(''); show(''); reveal(0)
        }}>Try a new calculation</button>
      </div>
    </form>
    <p role="status">{feedback}</p>
    {revealed > 0 && <ol>{problem.steps.slice(0, revealed).map(step => <li key={step}>{step}</li>)}</ol>}
    {revealed === problem.steps.length && <p>{problem.mistake}</p>}
  </>
}
