import { AnswerChoices, AnswerFeedback } from './AnswerFeedback'
import MathText from './MathText'
import React, { useEffect, useState } from 'react'
import { rpc } from './api'

const labels = ['Foundation', 'Beginner', 'Intermediate', 'Advanced', 'Examination', 'Retention']

export default function CuratedSkill({ skill, subject, continuePractice, onProgress, onNextConcept, onPreviousConcept, onTest, reviewer }) {
  const [item,setItem] = useState(null)
  const [choice,setChoice] = useState(null)
  const [result,setResult] = useState(null)
  const [round,setRound] = useState(0)
  const [assisted,setAssisted] = useState(false)
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState('')
  async function load() {
    setBusy(true)
    setError('')
    try { setItem(await rpc('curated_next',{skill_id:skill})); setResult(null); setChoice(null); setAssisted(false); setRound(value => value+1) }
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
      <nav className="actions" aria-label="Lesson navigation">
        {onPreviousConcept && <button className="secondary" onClick={onPreviousConcept}>Previous concept</button>}
        {!result && onNextConcept && <button className="secondary" onClick={onNextConcept}>Skip concept</button>}
        {onTest && <button className="secondary" onClick={onTest}>Test my knowledge</button>}
      </nav>
      {reviewer}
      <p className="small muted">Authored learning activity</p>
      {item.stage < 6 && <p>{labels[item.stage]}</p>}
      {waiting && <p>Retention check available {new Date(item.due).toLocaleString()}.</p>}
      {item.stage === 6 && <p>{item.mastered ? 'Skill mastered after an independent retention check.' :
        'Path completed. More independent assessment evidence is needed for mastery.'}</p>}
      <div className="question-evidence">
        {subject && <span>{subject}</span>}
        <label>Mastery {item.mastered ? 'earned' : 'in progress'}<br/>
          <progress value={Number(item.mastered)} max="1" /></label>
        <small>{item.independent_passes ?? 0} independent first answers correct</small>
      </div>
      {!waiting && item.options && <>
        <AnswerChoices name={'skill-'+skill} options={item.options.map((text,id) => ({id,text}))}
          prompt={<MathText text={item.prompt} />} value={choice} onChange={setChoice}
          disabled={busy || !!result} correct={result?.correct_choice} />
        {!result && <button className="primary" disabled={busy || choice === null} onClick={() => answer(choice)}>
          {item.stage === 5 ? 'Submit retention answer' : 'Check answer'}</button>}
      </>}
      {result && <>
        <AnswerFeedback correct={result.correct} answer={item.options[result.correct_choice]} explanation={result.feedback} />
        {onNextConcept && <button className={result.correct ? 'primary' : 'secondary'} onClick={onNextConcept}>Next concept</button>}
        <button className={result.correct && onNextConcept ? 'secondary' : 'primary'} disabled={busy} onClick={load}>
          {item.stage === 5 && result.correct ? 'Complete retention review' : result.correct ?
            'Practice at the next difficulty' : item.stage === 0 || item.stage === 5 ? 'Review the concept' : 'Try an easier activity'}</button>
      </>}
      {(waiting || item.stage === 6) && <button className="primary" onClick={continuePractice}>Continue with reviewer practice</button>}
    </>}
  </section>
}
