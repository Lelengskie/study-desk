import MathText from './MathText'
import React, { useEffect, useState } from 'react'
import { rpc } from './api'

const labels = ['Foundation', 'Beginner', 'Intermediate', 'Advanced', 'Examination', 'Retention']

export default function CuratedSkill({ skill, continuePractice, onProgress }) {
  const [item,setItem] = useState(null)
  const [result,setResult] = useState(null)
  const [round,setRound] = useState(0)
  const [assisted,setAssisted] = useState(false)
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState('')
  async function load() {
    setBusy(true)
    setError('')
    try { setItem(await rpc('curated_next',{skill_id:skill})); setResult(null); setAssisted(false); setRound(value => value+1) }
    catch { setError('The assessment could not load.'); }
    finally { setBusy(false) }
  }
  useEffect(() => { void load() },[skill])
  const waiting = item?.stage === 5 && Date.parse(item.due) > Date.now()
  async function answer(choice) {
    setBusy(true)
    setError('')
    try { setResult(await rpc('curated_submit',{skill_id:skill, expected_stage:item.stage, chosen:choice, used_example:assisted})); void onProgress?.() }
    catch { setError('The activity changed or could not be saved. Load the current question again.') }
    finally { setBusy(false) }
  }
  return <section className="surface concept-lab">
    <h2>{item?.title ?? 'Skill progression'}</h2>
    {busy && <p role="status">Loading activity…</p>}
    {error && <><p role="alert">{error}</p><button onClick={load}>Reload activity</button></>}
    {item && !error && <>
      <p><MathText text={item.lesson} /></p>
      <details key={round} className="concept-worked" onToggle={event => {if(event.currentTarget.open) setAssisted(true)}}><summary>Worked example</summary><p><MathText text={item.example} /></p></details>
      {item.stage < 6 && <p>{labels[item.stage]}</p>}
      {waiting && <p>Retention check available {new Date(item.due).toLocaleString()}.</p>}
      {item.stage === 6 && <p>{item.mastered ? 'Skill mastered after an independent retention check.' :
        'Path completed. More independent assessment evidence is needed for mastery.'}</p>}
      {!waiting && item.options && <fieldset disabled={busy || !!result}>
        <legend><MathText text={item.prompt} /></legend>
        {item.options.map((option,index) => <button className="secondary" key={option} onClick={() => answer(index)}><MathText text={option} /></button>)}
      </fieldset>}
      {result && <><p role="status"><MathText text={result.feedback} /></p><button className="primary" disabled={busy} onClick={load}>
        {result.correct ? 'Continue learning' : 'Review and try an easier activity'}</button></>}
      {(waiting || item.stage === 6) && <button className="primary" onClick={continuePractice}>Continue with reviewer practice</button>}
    </>}
  </section>
}
