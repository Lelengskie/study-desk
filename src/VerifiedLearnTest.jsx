import { AnswerChoices, AnswerFeedback } from './AnswerFeedback'
import MathText from './MathText'
import React, { useEffect, useRef, useState } from 'react'
import { rpc } from './api'

export default function VerifiedLearnTest({ title, modules, openLesson, finish, refresh }) {
  const [questions, setQuestions] = useState([])
  const [choices,setChoices] = useState({})
  const [results,setResults] = useState(null)
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState('')
  const [retry,setRetry] = useState(0)
  const batch = useRef(null)
  useEffect(() => {
    let active = true
    const ids = [...new Set(modules.flatMap(module => module.quiz_ids))]
    Promise.all(ids.map(id => rpc('study_question',{p_question:id}).then(question => ({ ...question,id }))))
      .then(rows => { if (active) setQuestions(rows) })
      .catch(() => { if (active) setError('The test could not load. Try again.') })
    return () => { active = false }
  }, [modules,retry])

  async function submit() {
    if (busy || questions.some(question => !choices[question.id])) return
    setBusy(true)
    setError('')
    const session = crypto.randomUUID()
    batch.current ??= questions.map(question => ({
      p_question:question.id, p_option:choices[question.id], p_request:crypto.randomUUID(), p_session:session, p_mode:'quiz',
    }))
    try {
      const feedback = []
      for (const response of batch.current) feedback.push(await rpc('study_submit',response))
      setResults(feedback)
      void refresh()
    } catch {
      setError('The test could not finish saving. Retry the same submission.')
    } finally { setBusy(false) }
  }

  const weak = results ? modules.filter(module => questions.some((question,index) =>
    module.quiz_ids.includes(question.id) && !results[index].correct)) : []
  return <section className="surface concept-lab">
    <h1>{title}</h1>
    <p>This test uses existing verified questions. The full curriculum may include skills outside this test.</p>
    {error && <p role="alert">{error}</p>}
    {!questions.length && (error ? <button onClick={() => {setError('');setRetry(retry+1)}}>Retry loading</button> :
      <p role="status">Loading verified questions…</p>)}
    {results && <div role="status">
      <h2>{results.filter(result => result.correct).length}/{results.length} correct</h2>
      {!!weak.length && <><h3>Topics to strengthen</h3>{weak.map(module => <button className="secondary" key={module.id}
        onClick={() => openLesson(module)}>Study {module.title}</button>)}</>}
    </div>}
    {questions.map((question,index) => {
      const result = results?.[index]
      return <section key={question.id}>
        <AnswerChoices name={question.id} prompt={<>{index+1}. <MathText text={question.stem} /></>}
          options={question.options} value={choices[question.id]}
          onChange={choice => setChoices(previous => ({...previous,[question.id]:choice}))}
          disabled={busy || !!batch.current} correct={result?.answer_option_id} />
        {result && <AnswerFeedback correct={result.correct} explanation={result.explanation}
          answer={question.options.find(option => option.id === result.answer_option_id)?.text} />}
      </section>
    })}
    {!!questions.length && !results && <button className="primary" disabled={busy || questions.some(question => !choices[question.id])} onClick={submit}>
      {busy ? 'Saving answers…' : error ? 'Retry submission' : 'Submit test'}
    </button>}
    {results && <button className="primary" onClick={finish}>Return to Learn</button>}
  </section>
}
