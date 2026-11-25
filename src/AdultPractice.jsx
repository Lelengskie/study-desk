import { useQuestionEvents } from './question-events'
import React, { useState } from 'react'
import { AnswerFeedback } from './AnswerFeedback'
import MathText from './MathText'
import PracticeResponse from './PracticeResponse'
import { equivalentNumber, rational } from './practice-response.mjs'

export default function AdultPractice({ concept, exercises, reason, onNextConcept }) {
  const [index,setIndex] = useState(0)
  const [response,setResponse] = useState('')
  const [result,setResult] = useState(null)
  const [message,setMessage] = useState('')
  const [step,setStep] = useState(0)
  const problem = exercises[index]
  const events = useQuestionEvents(index+1,'generated',concept,problem.level.toLowerCase(),reason)
  function next() {
    events.record(result===null ? 'skipped' : 'completed')
    setIndex(index+1);setResponse('');setResult(null);setStep(0)
  }
  return <div className="concept-worked" ref={events.element}>
    <p className="small muted">Generated Learning Exercise · {problem.level} · Unscored</p>
    <h3><MathText text={problem.question} /></h3>
    <form onSubmit={event=>{
      event.preventDefault()
      if (result !== null) return
      if (!rational(response)) {setMessage('Enter a number, decimal or fraction.');return}
      setMessage('')
      events.record('submitted')
      setResult(equivalentNumber(response,problem.answer))
    }}>
      <fieldset disabled={result !== null} className="math-input-group">
        <PracticeResponse item={{}} math inputLabel="Your calculation" response={response} change={setResponse} />
      </fieldset>
      {result === null && <button className="primary">Check my calculation</button>}
    </form>
    {result===null && index+1<exercises.length && <button className="secondary" onClick={next}>Skip generated question</button>}
    {message && <p role="status">{message}</p>}
    {result !== null && <>
      <AnswerFeedback correct={result} answer={problem.answer} />
      <h4>Worked solution · Step {step+1} of {problem.steps.length}</h4>
      <p aria-live="polite"><MathText text={problem.steps[step]} /></p>
      <div className="actions">
        <button className="secondary" disabled={step===0} onClick={()=>setStep(step-1)}>Previous step</button>
        <button className="secondary" disabled={step===problem.steps.length-1} onClick={()=>setStep(step+1)}>Next step</button>
      </div>
      <p>Common mistake: <MathText text={problem.mistake} /></p>
      <div className="actions">
        {onNextConcept && <button className="primary" onClick={()=>{events.record('completed');onNextConcept()}}>Next concept</button>}
        {index+1 < exercises.length && <button className="secondary" onClick={next}>{result ? 'Practice more' : 'Try a similar question'}</button>}
      </div>
    </>}
  </div>
}
