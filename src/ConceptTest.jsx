import React, { useEffect, useState } from 'react'
import { rpc } from './api'
import MathText from './MathText'
import { AnswerChoices, AnswerFeedback } from './AnswerFeedback'
import { curatedTitles } from './curriculum.mjs'

export default function ConceptTest({ title, skills, openSkill }) {
  const [test,setTest] = useState(null)
  const [answers,setAnswers] = useState({})
  const [results,setResults] = useState(null)
  const [error,setError] = useState('')
  const [busy,setBusy] = useState(false)
  const [submitted,setSubmitted] = useState(false)
  const [reload,setReload] = useState(0)
  useEffect(() => {
    let active = true
    rpc('learn_open_concept_test',{skill_ids:skills})
      .then(value => { if (active) setTest(value) })
      .catch(() => { if (active) setError('The test could not load.') })
    return () => { active = false }
  },[skills,reload])
  async function submit() {
    setBusy(true)
    setError('')
    setSubmitted(true)
    try { setResults(await rpc('learn_grade_concept_test',{test_id:test.id,selections:answers})) }
    catch { setError('Your test could not finish saving. Retry the same submission.') }
    finally { setBusy(false) }
  }

  return <section className="surface concept-lab">
    <h1>{title}</h1>
    <p>Submit the whole test to see feedback and concepts to review.</p>
    {error && <p role="alert">{error}</p>}
    {!test && (error ? <button className="secondary" onClick={() => {setError('');setReload(reload+1)}}>Retry loading</button> :
      <p role="status">Loading your test…</p>)}
    {results && <h2 role="status">{results.filter(item=>item.correct).length}/{results.length} correct</h2>}
    {test?.items.map((item,index) => {
      const result = results?.[index]
      return <section key={item.skill}>
        <h3>{curatedTitles[item.skill]}</h3>
        <AnswerChoices options={item.options.map((text,id)=>({id,text}))} value={answers[item.skill]}
          name={item.skill} prompt={<MathText text={item.prompt} />} disabled={busy || submitted}
          correct={result?.correct_choice}
          onChange={choice=>setAnswers(previous=>({...previous,[item.skill]:choice}))} />
        {result && <AnswerFeedback correct={result.correct} answer={item.options[result.correct_choice]} explanation={result.explanation} />}
        {result && !result.correct && <button className="secondary" onClick={()=>openSkill(item.skill)}>Strengthen {curatedTitles[item.skill]}</button>}
      </section>
    })}
    {test && !results && <button className="primary" disabled={busy || Object.keys(answers).length!==test.items.length} onClick={submit}>
      {busy ? 'Saving…' : submitted ? 'Retry submission' : 'Submit test'}
    </button>}
  </section>
}
