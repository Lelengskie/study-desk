import React, { useEffect, useState } from 'react'
import { client, rpc } from './api'
import PracticeResponse from './PracticeResponse'
import MathText from './MathText'
import { conceptLabel } from './concept-labels.mjs'
import { equivalentNumber } from './practice-response.mjs'

const statuses = {
  independently_verified: 'Independently verified',
  source_answer_available: 'Source answer · not independently verified',
  answer_unavailable: 'Answer unavailable',
  conflicting_answer: 'Conflicting answers · under review'
}

export default function Hybrid({ library, track, modules, initialTopic = '', initialSubject = '', conceptCounts = [] }) {
  const [filters, setFilters] = useState({ q: '', subject: initialSubject, topic: initialTopic, source: '', status: '', level: track })
  const [query, setQuery] = useState(filters)
  const [page, setPage] = useState({ rows: [], after: '', previous: [] })
  const [count, setCount] = useState(10)
  const [session, setSession] = useState(null)
  const [savedOnly, setSavedOnly] = useState(false)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const endpoint = library ? 'hybrid_library' : 'hybrid_practice'
  const parameters = {
    q: query.q, subject_filter: query.subject || null, topic_filter: query.topic || null,
    level_filter: query.level || null,
    ...(library ? { source_filter: query.source } : { status_filter: query.status || null, saved_only: savedOnly })
  }
  useEffect(() => {
    let active = true
    setBusy(true)
    setError('')
    rpc(endpoint, { ...parameters, after_id: page.after }).then(rows => {
      if (active) setPage(previous => ({ ...previous, rows }))
    }).catch(problem => {
      if (active) {
        setError(problem.message)
        setPage(previous => ({ ...previous, rows: [] }))
      }
    }).finally(() => { if (active) setBusy(false) })
    return () => { active = false }
  }, [endpoint, query, savedOnly, page.after])

  function change(key, value) {
    setFilters(current => ({ ...current, [key]: value, ...(key === 'subject' ? { topic: '' } : {}) }))
  }
  function search(event) {
    event.preventDefault()
    setSession(null)
    setPage({ rows: [], after: '', previous: [] })
    setQuery({ ...filters })
  }
  async function randomize() {
    setBusy(true)
    setError('')
    try {
      const rows = await rpc(endpoint, { ...parameters, random_count: count })
      if (rows.length) setSession({ rows, index: 0 })
      else setError('No practice questions match these filters.')
    } catch (problem) { setError(problem.message) }
    finally { setBusy(false) }
  }
  function updateSaved(id, saved) {
    const update = rows => rows.map(row => row.id === id ? { ...row, saved } : row)
    setPage(current => ({ ...current, rows: savedOnly && !saved
      ? current.rows.filter(row => row.id !== id) : update(current.rows) }))
    setSession(current => current && ({ ...current, rows: update(current.rows) }))
  }
  const subjects = [...new Set(modules.map(module => module.track))]
  return <>
    <header className="page-head"><h1>{library ? 'Reviewer Library' : 'Practice Pool'}</h1>
      {!library && <p>Browse or start a randomized session. Practice here does not affect your scores or mastery.</p>}</header>
    <form className="surface hybrid-filters" onSubmit={search}>
      <label>Search <input value={filters.q} maxLength={200} onChange={event => change('q', event.target.value)} /></label>
      <label>Subject <select value={filters.subject} onChange={event => change('subject', event.target.value)}>
        <option value="">All subjects</option>{subjects.map(subject => <option key={subject}>{subject}</option>)}
      </select></label>
      <label>Topic <select value={filters.topic} onChange={event => change('topic', event.target.value)}>
        <option value="">All topics</option>{modules.filter(module => !filters.subject || module.track === filters.subject)
          .map(module => <option key={module.id} value={module.id}>{module.title}</option>)}
        {!library && filters.subject && conceptCounts.filter(row => row.subject === filters.subject)
          .map(row => <option key={row.concept} value={'concept:' + row.concept}>{conceptLabel(row.concept)} · {row.imported}</option>)}
      </select></label>
      <label>Track <select value={filters.level} onChange={event => change('level', event.target.value)}>
        <option value="">All tracks</option><option value="professional">Professional</option>
        <option value="subprofessional">Subprofessional</option></select></label>
      {library ? <label>Source <input value={filters.source} maxLength={200} onChange={event => change('source', event.target.value)} /></label> :
        <label>Answer status <select value={filters.status} onChange={event => change('status', event.target.value)}>
          <option value="">All answer-ready questions</option>
          {['independently_verified', 'source_answer_available'].map(key => <option key={key} value={key}>{statuses[key]}</option>)}
        </select></label>}
      <button className="primary" type="submit">Search</button>
    </form>
    {!library && <div className="actions hybrid-actions">
      <label>Questions per session <input type="number" min="1" max="100" value={count}
        onChange={event => setCount(event.target.value === '' ? '' : Number(event.target.value))} /></label>
      <button className="secondary" disabled={busy || count < 1 || count > 100} onClick={randomize}>Start random practice</button>
      <label><input type="checkbox" checked={savedOnly} onChange={event => {
        setSession(null)
        setPage({ rows: [], after: '', previous: [] })
        setSavedOnly(event.target.checked)
      }} /> Bookmarks only</label>
    </div>}
    {error && <p className="notice error" role="alert">{error}</p>}
    {busy && <p role="status">Loading…</p>}
    {session ? <>
      <div className="actions hybrid-actions">
        <span>Question {session.index + 1} of {session.rows.length}</span>
        <button className="quiet" onClick={() => setSession(null)}>End practice</button>
      </div>
      <PracticeCard key={session.rows[session.index].id} item={session.rows[session.index]} updateSaved={updateSaved} />
      <button className="secondary hybrid-actions" onClick={() => setSession(current =>
        current.index + 1 === current.rows.length ? null : { ...current, index: current.index + 1 })}>
        {session.index + 1 === session.rows.length ? 'Finish practice' : 'Next question'}
      </button>
    </> : <div className="hybrid-results">
      {!busy && !error && !page.rows.length && <p>No results match these filters.</p>}
      {page.rows.map(item => library ? <article className="surface hybrid-card" key={item.id}>
        <h2>{item.title}</h2>
        <p>{[item.role?.replaceAll('_', ' ') || 'Reviewer material', item.format.toUpperCase(), item.subject, ...item.editions].filter(Boolean).join(' · ')}</p>
        <a href={'https://drive.google.com/open?id=' + encodeURIComponent(item.drive_file_id)}
          target="_blank" rel="noopener noreferrer">{item.role?.includes('archive download')
            ? 'Open source ZIP in Drive' : 'Open in Google Drive'}</a>
      </article> : <details className="surface hybrid-card" key={item.id}>
        <summary>{item.subject === 'Numerical Ability' ? <MathText text={item.stem} /> : item.stem} <small>{statuses[item.status]}</small></summary>
        <PracticeCard item={item} updateSaved={updateSaved} />
      </details>)}
      <div className="actions">
        <button className="secondary" disabled={busy || !page.previous.length} onClick={() => setPage(current => ({
          rows: [], after: current.previous.at(-1), previous: current.previous.slice(0, -1)
        }))}>Previous page</button>
        <button className="secondary" disabled={busy || page.rows.length !== 25} onClick={() => setPage(current => ({
          rows: [], after: current.rows.at(-1).id, previous: [...current.previous, current.after]
        }))}>Next page</button>
      </div>
    </div>}
  </>
}

function PracticeCard({ item, updateSaved }) {
  const [choice, setChoice] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [answer, setAnswer] = useState(null)
  const [ai, setAi] = useState([])
  const [tutorLanguage, chooseTutorLanguage] = useState('en')
  const [tutorStyle, chooseTutorStyle] = useState('explain')
  const [allowance, setAllowance] = useState(null)
  const [clock, setClock] = useState(Date.now)
  const [report, setReport] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [context, setContext] = useState(null)
  const options = item.options ?? []
  const typed = options.length === 0
  useEffect(() => {
    if (!typed) return
    let active = true
    rpc('hybrid_practice_context', { question_id: item.id }).then(data => {
      if (active) setContext(data)
    }).catch(problem => { if (active) setError(problem.message) })
    return () => { active = false }
  }, [item.id, typed])
  async function act(action) {
    setBusy(true)
    setError('')
    setMessage('')
    try { await action() } catch (problem) { setError(problem.message) }
    finally { setBusy(false) }
  }
  async function checkAllowance() {
    const { data, error: problem } = await client.functions.invoke('tutor', { body: { mode: 'allowance' } })
    if (problem || !data?.resets_at) throw new Error('Application allowance is unavailable.')
    setClock(Date.now())
    setAllowance(data)
  }
  useEffect(() => {
    if (!allowance) return
    const timer = setInterval(() => setClock(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [allowance])
  const resetSeconds = allowance ? Math.max(0, Math.ceil((Date.parse(allowance.resets_at) - clock)/1000)) : 0
  const countdown = [Math.floor(resetSeconds/3600), Math.floor(resetSeconds/60)%60, resetSeconds%60]
    .map(n => String(n).padStart(2,'0')).join(':')
  const verified = item.status === 'independently_verified'
  const modelAnswer = answer?.answer_text ?? answer?.answer
  const present = text => item.subject === 'Numerical Ability' ? <MathText text={text} /> : text
  return <article className="hybrid-practice-card">
    <h2>{item.subject === 'Numerical Ability' ? <MathText text={item.stem} /> : item.stem}</h2><p>{statuses[item.status]}</p>
    {typed ? (context ? <PracticeResponse item={context} math={item.subject === 'Numerical Ability'} response={choice} change={setChoice} /> :
      <p role="status">Loading question context…</p>) :
      <fieldset className="hybrid-options"><legend>Choose an answer</legend>
      {options.map(option => <label key={option.id ?? option.label}>
        <input type="radio" name={'practice-' + item.id} checked={choice === (option.id ?? option.label)}
          onChange={() => setChoice(option.id ?? option.label)} /> {item.subject === 'Numerical Ability' ? <MathText text={option.text} /> : option.text}
      </label>)}</fieldset>}
    <div className="actions hybrid-actions">
      <button className="secondary" disabled={!choice.trim() || busy || (typed && !context)} onClick={() => act(async () => {
        const result = await rpc('hybrid_answer', { question_id: item.id })
        setSubmitted(choice)
        setAnswer(result)
      })}>{typed ? 'Compare with the answer' : 'Check answer availability'}</button>
      <button className="quiet" disabled={busy} onClick={() => act(async () => {
        await rpc('hybrid_feedback', { question_id: item.id, bookmark: !item.saved })
        updateSaved(item.id, !item.saved)
      })}>{item.saved ? 'Remove bookmark' : 'Bookmark'}</button>
    </div>
    {!verified && <section className="concept-worked" aria-label="AI tutor">
      <div className="actions">
        <label>Tutor language <select value={tutorLanguage} onChange={event => chooseTutorLanguage(event.target.value)}>
          <option value="en">English</option><option value="fil">Filipino</option><option value="taglish">Taglish</option>
        </select></label>
        <label>Tutor help <select value={tutorStyle} onChange={event => chooseTutorStyle(event.target.value)}>
          <option value="explain">Explain</option><option value="simpler">Explain more simply</option>
          <option value="steps">Explain each calculation</option><option value="example">Give another example</option>
          <option value="hint">Give a hint</option>
        </select></label>
        <button className="secondary" disabled={busy} onClick={() => act(checkAllowance)}>Check application allowance</button>
      </div>
      {allowance && <p>{allowance.used} used · {allowance.remaining} remaining in the application allowance · resets in {countdown}.
        Cached explanations can still be available. Provider-wide quota is not reported here.</p>}
      <button className="secondary" disabled={busy || !choice} onClick={() => act(async () => {
        const { data, error: problem } = await client.functions.invoke('tutor', {
          body: { question_id: item.id, mode: 'hybrid', use_ai: true, language: tutorLanguage, style: tutorStyle }
        })
        if (problem) throw new Error((await problem.context?.json?.().catch(() => null))?.error || 'AI explanation unavailable.')
        setAi(history => [...history.slice(-5),data])
        if (allowance) {
          try { await checkAllowance() } catch { setAllowance(null) }
        }
      })}>Request AI explanation</button>
      </section>}

    {answer && <div role="status">
      {modelAnswer && <p>{typed ? (answer.exact_value != null
        ? equivalentNumber(submitted, answer.exact_value) ? 'Correct · ' : 'Try again · '
        : 'Self-check · ') : submitted === answer.answer ? 'Correct · ' : 'Incorrect · '}Your answer: {
        options.find(option => (option.id ?? option.label) === submitted)?.text ?? submitted
      }</p>}
      <p>{modelAnswer ? <>Answer: {present(options.find(option =>
        (option.id ?? option.label) === answer.answer)?.text ?? modelAnswer)}</>
        : statuses[answer.status]}{answer.explanation && <> · {present(answer.explanation)}</>}</p>
    </div>}
    {ai.map((turn,index) => <p key={index} role="status">{turn.explanation
      ? <>AI-generated suggestion · {present(turn.explanation)}</>
      : turn.status === 'daily_limit' ? 'Daily tutor allowance reached. Your stored explanation is still available.'
        : 'AI explanation unavailable.'}</p>)}
    <form className="hybrid-report" onSubmit={event => {
      event.preventDefault()
      void act(async () => {
        await rpc('hybrid_feedback', { question_id: item.id, report })
        setReport('')
        setMessage('Report saved.')
      })
    }}><label>Report a problem <input value={report} maxLength={500} onChange={event => setReport(event.target.value)} /></label>
      <button className="quiet" disabled={busy || !report.trim()}>Send report</button></form>
    {message && <p role="status">{message}</p>}
    {error && <p role="alert">{error}</p>}
  </article>
}
