import React, { useEffect, useRef, useState } from 'react'
import { rpc } from './api'
import { PracticeCard } from './Hybrid'
import { practiceScopes } from './learning-session.mjs'

export default function LearningPractice({ subject, track, topics, onFinish, onCheckpoint, profileId }) {
  const [item, setItem] = useState(null)
  const [result, setResult] = useState(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const scopes = useRef(practiceScopes(subject, topics))
  const visitKey = 'study-desk:seen:' + JSON.stringify([profileId,track,subject,topics])
  const [initialSeen] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(visitKey) || '[]') }
    catch { return [] }
  })
  const cursor = useRef({ scope: 0, after: '', page: [], seen: new Set(initialSeen) })
  const mounted = useRef(false)
  const loading = useRef(false)

  async function next() {
    if (loading.current) return
    loading.current = true
    setBusy(true)
    setError('')
    try {
      const state = cursor.current
      while (state.scope < scopes.current.length) {
        if (!state.page.length) {
          const scope = scopes.current[state.scope]
          const rows = await rpc('hybrid_practice', { subject_filter: scope.subject,
            topic_filter: scope.topic, level_filter: track,
            status_filter: 'source_answer_available', after_id: state.after })
          if (!mounted.current) return
          if (!rows.length || rows.at(-1).id <= state.after) {
            state.scope++
            state.after = ''
            continue
          }
          state.after = rows.at(-1).id
          state.page = rows.filter(row => !state.seen.has(row.id))
          if (!state.page.length) continue
        }
        const row = state.page.shift()
        state.seen.add(row.id)
        try { sessionStorage.setItem(visitKey,JSON.stringify([...state.seen].slice(-1000))) } catch { /* optional across views */ }
        setItem({ ...row, related: scopes.current[state.scope].topic === null })
        setResult(null)
        return
      }
      setItem(null)
      setResult('finished')
    } catch {
      if (mounted.current) setError('The next question could not load. Try again.')
    } finally {
      loading.current = false
      if (mounted.current) setBusy(false)
    }
  }

  useEffect(() => {
    mounted.current = true
    void next()
    return () => { mounted.current = false }
  }, [])

  const checkpoint = result === true && correctCount >= 2 && onCheckpoint
  return <section className="surface concept-lab">
    <h2>Apply what you learned</h2>
    {busy && <p role="status">Finding the next question…</p>}
    {item && <><p>{item.related ? 'Related subject practice' : 'Practice for this lesson'}</p>
      <PracticeCard key={item.id} item={item}
        updateSaved={(id,saved) => setItem(current => current?.id === id ? { ...current, saved } : current)}
        onResult={value => {
          if (result === null && value === true) setCorrectCount(count => count+1)
          setResult(previous => previous ?? value)
        }} /></>}
    {error && <p role="alert">{error}</p>}
    {(error || result !== null && (result !== 'finished' || onFinish)) && <button className="primary" disabled={busy} onClick={() => {
      if (error) void next()
      else if (checkpoint) onCheckpoint()
      else if ((result === false || result === 'finished') && onFinish) onFinish()
      else if (result !== 'finished') void next()
    }}>{error ? 'Try again' : result === false && onFinish ? 'Review and try a simpler exercise'
      : result === 'finished' && onFinish ? 'Continue learning' : checkpoint ? 'Continue to a verified check' : 'Next question'}</button>}
    {result === 'finished' && <><p>You’ve reached the end of the available questions for this path.</p>
      {!onFinish && <button className="secondary" onClick={() => {
        cursor.current = { scope: 0, after: '', page: [], seen: new Set() }
        void next()
      }}>Review these questions again</button>}</>}
  </section>
}
