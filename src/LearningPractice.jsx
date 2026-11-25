import React, { useEffect, useRef, useState } from 'react'
import { useQuestionEvents } from './question-events'
import { rpc } from './api'
import { PracticeCard } from './Hybrid'

export default function LearningPractice({ subject, track, topics, onFinish, onCheckpoint, band, exactScope = false, onEmpty, hideWhenEmpty = false }) {
  const [item, setItem] = useState(null)
  const [result, setResult] = useState(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const mounted = useRef(false)
  const loading = useRef(false)
  const concept = topics.find(topic=>topic?.startsWith('concept:'))?.slice(8)
  const events = useQuestionEvents(exactScope ? item?.id : null,'original',concept,item?.learning_band,'concept_match')

  async function next(completed = null) {
    if (loading.current) return
    loading.current = true
    setBusy(true)
    setError('')
    try {
      const row = await rpc(exactScope ? 'learning_next_scoped' : 'learning_next', { study_subject: subject, exam_level: track,
        study_topics: topics.filter(Boolean), completed_id: completed, study_band: band ?? 'beginner' })
      if (!mounted.current) return
      if (!row && onEmpty) {onEmpty(); return}
      setItem(row)
      setResult(row ? null : 'finished')
    } catch {
      if (mounted.current) setError('The next question could not load. Try again.')
    } finally {
      loading.current = false
      if (mounted.current) setBusy(false)
    }
  }

  async function finishItem(transition) {
    setBusy(true)
    setError('')
    try {
      await rpc('learning_finish', { completed_id: item.id })
      events.record('completed')
      transition()
    } catch {
      setError('Your progress could not be saved. Try again.')
    } finally {
      if (mounted.current) setBusy(false)
    }
  }

  useEffect(() => {
    mounted.current = true
    void next()
    return () => { mounted.current = false }
  }, [])

  if (hideWhenEmpty && result === 'finished') return null
  const checkpoint = result === true && correctCount >= 2 && onCheckpoint
  return <section className="surface concept-lab">
    <h2>Apply what you learned</h2>
    {busy && <p role="status">Finding the next question…</p>}
    {item && <div ref={events.element}><p className="small muted">Original CSE Reviewer · Unscored learning practice</p><p>{item.related ? 'Related subject practice' : 'Practice for this lesson'}</p>
      <PracticeCard key={item.id} item={item}
        updateSaved={(id,saved) => setItem(current => current?.id === id ? { ...current, saved } : current)}
        onResult={value => {
          if (result === null) events.record('submitted')
          if (result === null && value === true) setCorrectCount(count => count+1)
          setResult(previous => previous ?? value)
        }} /></div>}
    {error && <p role="alert">{error}</p>}
    {(error || result !== null && (result !== 'finished' || onFinish)) && <button className="primary" disabled={busy} onClick={() => {
      if (error && item && (checkpoint || result === false && onFinish))
        void finishItem(checkpoint ? onCheckpoint : onFinish)
      else if (error) void next(result !== null ? item?.id : null)
      else if (result === 'finished' && onFinish) onFinish()
      else if (checkpoint || result === false && onFinish) {
        void finishItem(checkpoint ? onCheckpoint : onFinish)
      } else if (result !== 'finished') {events.record('completed');void next(item?.id)}
    }}>{error ? 'Try again' : result === false && onFinish ? 'Review and try a simpler exercise'
      : result === 'finished' && onFinish ? 'Continue learning' : checkpoint ? 'Continue to a verified check' : 'Next question'}</button>}
    {exactScope && item && result===null && !busy && <button className="secondary" onClick={()=>{
      events.record('skipped'); void next(item.id)
    }}>Skip reviewer question</button>}
    {result === 'finished' && <p>You’ve reached the end of the available questions for this path.</p>}
  </section>
}
