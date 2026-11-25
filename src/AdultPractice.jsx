import { useQuestionEvents } from './question-events'
import React, { useState } from 'react'
import { AnswerFeedback } from './AnswerFeedback'
import { ExamTip } from './LearningPresentation'
import MathText from './MathText'
import PracticeResponse from './PracticeResponse'
import { equivalentNumber, rational } from './practice-response.mjs'

export default function AdultPractice({ concept, exercises, reason, onNextConcept }) {
  const [index,setIndex] = useState(0)
  const [response,setResponse] = useState('')
  const [result,setResult] = useState(null)
  const [message,setMessage] = useState('')
  const problem = exercises[index]
  const events = useQuestionEvents(index+1,'generated',concept,problem.level.toLowerCase(),reason)
  function next() {
    events.record(result===null ? 'skipped' : 'completed')
    setIndex(index+1);setResponse('');setResult(null)
  }
  return <div className="lesson-question" ref={events.element}>
    <div className="lesson-question-meta"><span>Practice</span><span>{problem.level}</span></div>
    <h3 className="lesson-question-title"><MathText text={problem.question} /></h3>
    {result === null && <form onSubmit={event=>{
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
    </form>}
    {result===null && index+1<exercises.length && <button className="quiet" onClick={next}>Skip question</button>}
    {message && <p role="status">{message}</p>}
    {result !== null && <>
      <AnswerFeedback correct={result} submitted={response} answer={problem.answer}>
        <h4>Worked solution</h4>
        <ol>{problem.steps.map((step,index) => <li key={index}><MathText text={step} /></li>)}</ol>
        {problem.mistake && <ExamTip><MathText text={problem.mistake} /></ExamTip>}
      </AnswerFeedback>
      <div className="actions">
        {onNextConcept && <button className={index+1 === exercises.length ? 'primary' : 'quiet'} onClick={()=>{events.record('completed');onNextConcept()}}>Next concept</button>}
        {index+1 < exercises.length && <button className="primary" onClick={next}>{result ? 'Continue learning' : 'Try a similar question'}</button>}
      </div>
    </>}
  </div>
}
