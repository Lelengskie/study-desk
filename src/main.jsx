import { AnswerChoices, AnswerFeedback } from './AnswerFeedback'
import MathText from './MathText'

import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { client, rpc, tutor } from './api'
import Hybrid from './Hybrid'
import CuratedSkill from './CuratedSkill'
import ConceptTest from './ConceptTest'
import VerifiedLearnTest from './VerifiedLearnTest'
import LearningPractice from './LearningPractice'
import CurriculumPrimer, { hasPrimer } from './CurriculumPrimer'
import { conceptLabel } from './concept-labels.mjs'
import ConceptLab from './ConceptLab'
import MathPath from './MathPath'
import Journey from './Journey'
import { curatedTitles, extraSkills } from './curriculum.mjs'
import { analyticalConcepts, mathPath } from './math-path.mjs'
import { conceptState, dailyConcepts } from './concept-progress.mjs'
import './style.css'

const stages = [
  { id: 'today', title: 'Home', icon: '☀' },
  { id: 'learn', title: 'Learn', icon: '▤' },
  { id: 'tutor', title: 'AI Tutor', icon: '✦' },
  { id: 'master', title: 'Progress', icon: '◉' },
  { id: 'library', title: 'Library', icon: '▥' }
]
const assessedSkills = new Set(['grammar','data-interpretation','constitution','clerical','filipino'])
const linkedConcepts = {
  'word-meaning': ['synonyms','antonyms','context','filipino'],
  grammar: ['grammar','sentence-completion'],
  'reading-order': ['reading','paragraphs'],
  'number-patterns': ['sequence'],
  arithmetic: ['arithmetic','signed','order','fractions','decimals','percent','ratio','average','factors'],
  'word-problems': ['linear','age','work','speed','discount','commission','interest'],
  logic: ['analogies','assumptions','conclusions','letter-patterns','arrangement','syllogism','sufficiency'],
  'data-interpretation': ['data-interpretation'],
  clerical: ['filing'],
  spelling: ['spelling'],
}
const googleSignInReady = import.meta.env.VITE_STUDY_GOOGLE_SIGN_IN === 'true'
const labels = { professional: 'Professional', subprofessional: 'Subprofessional' }
const emptyProgress = { completed: [], mastery: {}, reviews: [] }
const dateLabel = (value) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))

function Brand() {
  return <div className="brand"><span className="brand-mark" aria-hidden="true">S</span><div><strong>Study Desk</strong><small>Civil Service Exam</small></div></div>
}

function SignIn({ blocked }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    try {
      const { error } = await client.auth.signInWithPassword({
        email: String(form.get('email')).trim(), password: String(form.get('password'))
      })
      if (error) throw error
    } catch (problem) { setError(problem.message) }
    finally { setBusy(false) }
  }
  async function signInWithGoogle() {
    setBusy(true)
    setError('')
    try {
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google', options: { redirectTo: new URL(import.meta.env.BASE_URL, window.location.href).href },
      })
      if (error) throw error
    } catch (problem) { setError(problem.message); setBusy(false) }
  }
  return <main className="gate">
    <Brand />
    <section className="gate-card">
      <div className="eyebrow">PRIVATE STUDY ROOM</div>
      <h1>Make time to study.</h1>
      {blocked ? <>
        <p>Your account is signed in. The study desk owner needs to approve your access.</p>
        <button className="primary" onClick={() => client.auth.signOut()}>Sign out</button>
      </> : client ? <>
        <p>Sign in with your approved account to access lessons and pick up where you left off.</p>
        <form onSubmit={submit}>
          <label>Email<input name="email" type="email" autoComplete="username" required /></label>
          <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
          {error && <p role="alert" className="notice error">{error}</p>}
          <button className="primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        {googleSignInReady && <button className="secondary" disabled={busy} onClick={signInWithGoogle}>Continue with Google</button>}
      </> : <p role="status">Supabase setup is required before you can sign in. See the project setup guide.</p>}
    </section>
  </main>
}

function TutorPanel({ questionId, original }) {
  const [allowAi, setAllowAi] = useState(false)
  const [round, setRound] = useState(null)
  const [selected, setSelected] = useState('')
  const [review, setReview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const statuses = {
    ai: 'Gemini explanation',
    off: 'Built-in practice · AI off',
    not_configured: 'Built-in practice · AI setup pending',
    daily_limit: 'Built-in practice · AI daily limit reached',
    unavailable: 'Built-in practice · Gemini unavailable'
  }
  async function start() {
    setBusy(true)
    setError('')
    try {
      const result = await tutor(questionId, allowAi)
      setRound(result)
      setSelected('')
      setReview(null)
    } catch (problem) { setError(problem.message) }
    finally { setBusy(false) }
  }
  async function answer() {
    setBusy(true)
    setError('')
    try { setReview(await rpc('tutor_answer', { p_round: round.round_id, p_option: selected })) }
    catch (problem) { setError(problem.message) }
    finally { setBusy(false) }
  }
  return <section className="tutor">
    <header><h3><span aria-hidden="true">✦</span> Study tutor</h3><p>Practice the same skill with a different question. Tutor practice is separate from your score.</p></header>
    {!round && <>
      <label className="check"><input type="checkbox" checked={allowAi} onChange={(event) => setAllowAi(event.target.checked)} />
        <span>Use Gemini for a walkthrough. Google may use the short skill prompt to improve its products.</span></label>
      <button className="secondary" onClick={start} disabled={busy}>{busy ? 'Preparing practice…' : 'Start tutor practice'}</button>
    </>}
    {round && <>
      <div className="eyebrow">{statuses[round.status]}</div>
      <p className="walkthrough">{round.explanation ?? (round.skill + ' ' + original)}</p>
      {round.status === 'ai' && <p className="muted small">AI walkthroughs can contain mistakes. Use the verified quiz explanation above to check them.</p>}
      <h4><MathText text={round.practice.stem} /></h4>
      <Options options={round.practice.options} value={selected} change={setSelected} name="practice" result={review} disabled={busy} />
      {review ? <AnswerFeedback correct={review.correct} answer={round.practice.options.find(option => option.id === review.answer_option_id)?.text} explanation={review.explanation} /> : <button className="primary" onClick={answer} disabled={!selected || busy}>{busy ? 'Checking…' : 'Check practice answer'}</button>}
      <button className="quiet" onClick={() => { setRound(null); setError('') }} disabled={busy}>Close practice</button>
    </>}
    {error && <p role="alert" className="notice error">{error}</p>}
  </section>
}

function Options({ options, value, change, name, result, disabled }) {
  return <AnswerChoices options={options} value={value} onChange={change} name={name} disabled={disabled || !!result}
    correct={result?.answer_option_id} />
}

function QuestionFlow({ ids, mode, title, finish, refresh }) {
  const [index, setIndex] = useState(0)
  const [question, setQuestion] = useState(null)
  const [option, setOption] = useState('')
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState([])
  const [reload, setReload] = useState(0)
  const [studySession] = useState(() => crypto.randomUUID())
  const pending = useRef(null)
  const heading = useRef(null)
  const id = ids[index]
  useEffect(() => {
    if (!id) return
    let active = true
    rpc('study_question', { p_question: id }).then((q) => {
      if (active) setQuestion(q)
    }).catch((problem) => { if (active) setError(problem.message) })
    return () => { active = false }
  }, [id, reload])
  useEffect(() => { if (question) heading.current?.focus() }, [question])

  async function submit() {
    if (busy || !option) return
    pending.current ??= { p_question: id, p_option: option, p_request: crypto.randomUUID(), p_session: studySession, p_mode: mode }
    setBusy(true)
    setError('')
    try {
      const feedback = await rpc('study_submit', pending.current)
      setResult(feedback)
      setAttempts((previous) => [...previous, feedback.correct])
      void refresh()
    } catch (problem) { setError(problem.message) }
    finally { setBusy(false) }
  }
  function next() {
    pending.current = null
    setQuestion(null)
    setOption('')
    setError('')
    setResult(null)
    setIndex(index + 1)
  }

  if (!id) return <section className="surface quiz-card">
    <div className="eyebrow">{mode === 'repeat' ? 'REVIEW COMPLETE' : 'QUIZ COMPLETE'}</div>
    <h2>{attempts.filter(Boolean).length} of {attempts.length} correct</h2>
    <p>Your attempts and review dates are saved to your account.</p>
    <button className="primary" onClick={finish}>View mastery</button>
  </section>

  return <section className="surface quiz-card">
    <div className="quiz-top"><span className="eyebrow">{title}</span><span>Question {index + 1} of {ids.length}</span></div>
    <progress value={index + (result ? 1 : 0)} max={ids.length} aria-label="Session progress" />
    {error && <p role="alert" className="notice error">{error}</p>}
    {!question && (error ? <button className="secondary" onClick={() => { setError(''); setReload(reload + 1) }}>Retry question</button> : <p role="status">Loading question…</p>)}
    {question && <>
      <h2 ref={heading} tabIndex={-1} lang={question.language}><MathText text={question.stem} /></h2>
      <Options options={question.options} value={option} change={setOption} name="quiz" result={result} disabled={busy || Boolean(pending.current)} />
      {!result ? <button className="primary" onClick={submit} disabled={!option || busy}>{busy ? 'Saving…' : error ? 'Retry answer' : 'Check answer'}</button> : <>
        <AnswerFeedback correct={result.correct} answer={question.options.find(option => option.id === result.answer_option_id)?.text} explanation={result.explanation}>
          <details><summary>Source and verification</summary><p>{result.verification === 'primary_reference_checked' ? 'Checked against a primary reference.' : 'Independently checked.'}</p>
            <ul>{result.sources.map((s, i) => <li key={i}>{s.title} · {s.locator}</li>)}</ul>
          </details>
          <p className="small muted">Next review {dateLabel(result.due_at)}</p>
        </AnswerFeedback>
        <div className="actions"><button className="primary" onClick={next}>{index + 1 === ids.length ? 'Finish session' : 'Next question'}</button></div>
        <TutorPanel key={id} questionId={id} original={result.explanation} />
      </>}
    </>}
  </section>
}

function Desk({ email, profileId, googleIdentity }) {
  const [practiceTopic, setPracticeTopic] = useState('')
  const [practiceSubject, setPracticeSubject] = useState('')
  const [journeySubject, setJourneySubject] = useState(null)
  const [topicCounts, setTopicCounts] = useState({})
  const [subjectCounts, setSubjectCounts] = useState(null)
  const [conceptCounts, setConceptCounts] = useState([])
  const [catalog, setCatalog] = useState(null)
  const [progress, setProgress] = useState(emptyProgress)
  const trackKey = 'study-desk:track:' + profileId
  const [track, setTrack] = useState(() => {
    const saved = localStorage.getItem(trackKey) ?? (googleIdentity ? null : localStorage.getItem('reviewer-track'))
    return saved === 'subprofessional' ? 'subprofessional' : 'professional'
  })
  const [tab, setTab] = useState('today')
  const [curated, setCurated] = useState({})
  const [activeSkill, setActiveSkill] = useState(null)
  const [showCurated, setShowCurated] = useState(false)
  const [adaptiveLesson, setAdaptiveLesson] = useState(false)
  const [embeddedPractice, setEmbeddedPractice] = useState(null)
  const [pathStart, setPathStart] = useState(null)
  const [conceptRows, setConceptRows] = useState([])
  const [detail, setDetail] = useState(null)
  const [conceptTest,setConceptTest] = useState(null)
  const [test, setTest] = useState(null)
  const [flow, setFlow] = useState(null)
  const [error, setError] = useState('')
  const [blocked, setBlocked] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const progressRequest = useRef(0)

  useEffect(() => {
    let active = true
    const enrollment = googleIdentity && googleSignInReady ? rpc('study_claim_google_enrollment') : Promise.resolve()
    enrollment.then(() => Promise.all([client.rpc('study_catalog'), rpc('study_progress')])).then(([result, stats]) => {
      if (!active) return
      if (result.error) throw result.error
      setCatalog(result.data.modules)
      setProgress(stats)
    }).catch((problem) => {
      if (!active) return
      if (problem.code === '42501' || /not approved/i.test(problem.message)) setBlocked(true)
      else setError(problem.message)
    })
    return () => { active = false }
  }, [loadAttempt])

  useEffect(() => {
    if (!catalog) return
    const onResume = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    document.addEventListener('visibilitychange', onResume)
    return () => document.removeEventListener('visibilitychange', onResume)
  }, [catalog])

  useEffect(() => {
    if (!catalog || pathStart || detail) return
    let active = true
    rpc('v2_concept_progress').then(rows => { if (active && Array.isArray(rows)) setConceptRows(rows) }).catch(() => {})
    return () => { active = false }
  }, [catalog, tab, pathStart, detail])

  function navigate(stage) {
    setConceptTest(null)
    setActiveSkill(null)
    setShowCurated(false)
    setEmbeddedPractice(null)
    setPathStart(null)
    setPracticeTopic('')
    setPracticeSubject('')
    setJourneySubject(null)
    setTab(stage)
    setDetail(null)
    setFlow(null)
    setTest(null)
    setError('')
    window.scrollTo(0, 0)
    void refresh()
  }

  useEffect(() => {
    let active = true
    setTopicCounts({})
    rpc('hybrid_topic_counts', { exam_level: track }).then(rows => {
      if (active) setTopicCounts(Object.fromEntries(rows.map(row => [row.topic, row])))
    }).catch(() => {})
    setSubjectCounts(null)
    setConceptCounts([])
    rpc('v21_concept_counts', { exam_level: track }).then(rows => {
      if (active && Array.isArray(rows)) setConceptCounts(rows)
    }).catch(() => {})
    rpc('v21_subject_counts', { exam_level: track }).then(rows => {
      if (active) setSubjectCounts(rows)
    }).catch(() => {})
    return () => { active = false }
  }, [track])

  async function refreshCurated() {
    try {
      const rows = await rpc('curated_status')
      setCurated(Object.fromEntries(rows.map(row => [row.skill, row])))
    } catch { /* Preserve the last loaded mastery evidence. */ }
  }

  useEffect(() => { if (catalog) void refreshCurated() }, [catalog, track])

  async function refresh() {
    void refreshCurated()
    const request = ++progressRequest.current
    try {
      const updated = await rpc('study_progress')
      if (request === progressRequest.current) setProgress(updated)
    } catch {
      if (request === progressRequest.current) setError('Progress could not refresh. Your last saved state is shown.')
    }
  }

  function start(ids, mode, title) {
    if (!ids.length) return
    setFlow({ ids, mode, title, key: crypto.randomUUID() })
    setError('')
    window.scrollTo(0, 0)
  }

  async function complete() {
    setBusy(true)
    setError('')
    try { await rpc('study_complete', { p_module: detail.id }); await refresh() }
    catch (problem) { setError(problem.message) }
    finally { setBusy(false) }
  }

  if (blocked) return <SignIn blocked />
  if (!catalog) return <main className="gate"><Brand />{error ? <section className="gate-card"><p role="alert">{error}</p><button className="primary" onClick={() => { setError(''); setLoadAttempt(loadAttempt + 1) }}>Retry loading</button><button className="quiet" onClick={() => client.auth.signOut()}>Sign out</button></section> : <p role="status">Opening your study desk…</p>}</main>

  const modules = catalog.filter((module) => module.levels.includes(track))
  const activeIds = new Set(modules.map((module) => module.id))
  const reviews = progress.reviews.filter((item) => activeIds.has(item.topic_id))
  const due = reviews.filter((item) => item.is_due)
  const groups = [...new Set(modules.map((module) => module.track))]
  const states = Object.fromEntries(Object.keys(mathPath).map(id => [id, conceptState(conceptRows, id)]))
  const recommendations = dailyConcepts(conceptRows, mathPath)
  const conceptDue = Object.keys(states).filter(id => states[id].dueNow && states[id].unused.length)
  const weak = Object.keys(states).filter(id => states[id].weak)
  function conceptCoverage(concept) {
    const subject = analyticalConcepts.has(concept) && concept !== 'sequence' ? 'Analytical Ability' : 'Numerical Ability'
    const imported = conceptCounts.find(row => row.concept === concept && row.subject === subject)?.imported ?? 0
    return { subject, imported }
  }
  function openImported(subject, concept) {
    setShowCurated(concept === 'filipino')
    setAdaptiveLesson(false)
    setEmbeddedPractice({ subject, topic: concept ? 'concept:' + concept : '' })
  }
  function openCurated(id) {
    setConceptTest(null)
    setTab('learn')
    if (extraSkills[id]) {
      setActiveSkill(id)
      setEmbeddedPractice(null)
      setDetail(null)
      window.scrollTo(0, 0)
    } else if (id === 'filipino') {
      setDetail(null)
      openImported('Verbal Ability', id)
    } else {
      const module = modules.find(row => row.id === id)
      if (module) openLesson(module)
    }
  }
  const dueSkills = Object.keys(curatedTitles).filter(id => curated[id]?.due && (id === 'filipino' || activeIds.has(id) || (extraSkills[id] && (groups.includes(extraSkills[id][0]) || extraSkills[id][0] === 'Filipino'))))
  function startConceptTest(title,skills) {
    setConceptTest({title,skills})
    window.scrollTo(0,0)
  }
  function startTest(title, testModules) {
    setTest({ title, modules: testModules })
    window.scrollTo(0, 0)
  }
  function openLesson(module) {
    setTest(null)
    setShowCurated(assessedSkills.has(module.id))
    setEmbeddedPractice(null)
    setAdaptiveLesson(false)
    setDetail(module)
    window.scrollTo(0, 0)
  }
  function continueLesson(module) {
    const pending = due.filter(review => review.topic_id === module.id)
    if (pending.length) start(pending.map(review => review.question_id),'repeat',module.title)
    else setAdaptiveLesson(true)
  }
  function chooseJourneySubject(subject) {
    setJourneySubject(subject)
    window.scrollTo(0, 0)
  }
  function openPath(id) {
    if (tab === 'today' || tab === 'master') setTab('learn')
    setEmbeddedPractice(null)
    setPathStart(id)
    window.scrollTo(0, 0)
  }
  const page = {
    tutor: ['AI Tutor', 'Open a practice question to ask for a hint, a worked explanation, or a simpler explanation.'],
    today: ['Your study plan', 'Continue a guided lesson or complete a scheduled review.'],
    learn: ['Learn by subject', 'Follow a roadmap or choose the concept you want to understand.'],
    quiz: ['Practice by topic', 'Choose a topic and get a verified explanation after each answer.'],
    master: ['Your mastery', 'A topic is mastered at 80% accuracy across at least three distinct questions and two sessions.'],
    repeat: ['Spaced review', 'Review guided concepts and verified questions when they are due.']
  }[tab]

  const lessonConcepts = detail ? conceptCounts.filter(row => row.subject === detail.track
    && linkedConcepts[detail.id]?.includes(row.concept)) : []
  const importedPanel = embeddedPractice && (tab === 'tutor'
    ? <Hybrid key={track + embeddedPractice.subject + embeddedPractice.topic} embedded track={track}
        modules={catalog} initialTopic={embeddedPractice.topic} initialSubject={embeddedPractice.subject}
        conceptCounts={conceptCounts} />
    : embeddedPractice.topic === 'concept:filipino'
      ? <div key={track + 'filipino'}>
          {showCurated && <CuratedSkill onProgress={refreshCurated} key="filipino" skill="filipino" subject="Filipino" continuePractice={() => {setShowCurated(false); setAdaptiveLesson(true)}} />}
          {adaptiveLesson && <LearningPractice track={track} subject="Verbal Ability"
            topics={['concept:filipino']} onFinish={() => setAdaptiveLesson(false)} />}
        </div>
      : <LearningPractice key={track + embeddedPractice.subject + embeddedPractice.topic} track={track}
          subject={embeddedPractice.subject || null} topics={[embeddedPractice.topic]} />)


  return <div className="desk">
    <aside className="sidebar">
      <Brand />
      <nav aria-label="Study stages">{stages.map(({ id, title, icon }) =>
        <button key={id} aria-current={(tab === id || id === 'learn' && ['quiz','practice','repeat'].includes(tab)) ? 'page' : undefined} onClick={() => navigate(id)}>
          <span aria-hidden="true">{icon}</span>{title}{id === 'repeat' && due.length > 0 && <b className="nav-count">{due.length}</b>}
        </button>)}</nav>
      <div className="account"><p title={email}>{email}</p><button className="quiet" onClick={() => client.auth.signOut()}>Sign out</button></div>
    </aside>
    <main className="workspace">
      <div className="topline">
        <span className="eyebrow">CIVIL SERVICE EXAM</span>
        <label className="track">Exam track <select value={track} onChange={(event) => {
          setTrack(event.target.value)
          localStorage.setItem(trackKey, event.target.value)
          navigate(tab)
        }}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div>
      {error && <p role="alert" className="notice error">{error}</p>}
      {conceptTest ? <>
        <button className="quiet back" onClick={() => setConceptTest(null)}>Back to Learn</button>
        <ConceptTest {...conceptTest} openSkill={openCurated} />
      </> : activeSkill ? <>
        <button className="quiet back" onClick={() => {setActiveSkill(null);setEmbeddedPractice(null)}}>Back to Learn</button>
        <CuratedSkill onProgress={refreshCurated} key={activeSkill} skill={activeSkill} subject={extraSkills[activeSkill][0]}
          continuePractice={() => openImported(extraSkills[activeSkill][0] === 'Filipino' ? 'Verbal Ability' : extraSkills[activeSkill][0], extraSkills[activeSkill][2])} />
        {activeSkill === 'government-branches' && <p><a href="https://officialgazette.gov.ph/constitutions/1987-constitution/"
          target="_blank" rel="noreferrer">Read Articles VI–VIII in the Official Gazette</a></p>}
        {embeddedPractice && <LearningPractice key={activeSkill} track={track}
          subject={embeddedPractice.subject} topics={[embeddedPractice.topic]} />}
      </> : test ? <>
        <button className="quiet back" onClick={() => setTest(null)}>Back to Learn</button>
        <VerifiedLearnTest {...test} openLesson={openLesson} finish={() => setTest(null)} refresh={refresh} />
      </> : pathStart ? <>
        <button className="quiet back" onClick={() => {setPathStart(null); setEmbeddedPractice(null)}}>Back to {tab === 'repeat' ? 'reviews' : journeySubject || 'Learn'}</button>
        <MathPath key={pathStart} initialConcept={pathStart} importedCoverage={conceptCoverage}
          renderPractice={(concept, onFinish, band) => <LearningPractice key={track + concept} track={track}
            subject={conceptCoverage(concept).subject} topics={['concept:' + concept]} band={band} onFinish={onFinish} />}
          onConceptChange={() => setEmbeddedPractice(null)} />
        {importedPanel}
      </> : flow ? <>
        <button className="quiet back" onClick={() => { setFlow(null); setError('') }}>End session</button>
        <QuestionFlow key={flow.key} {...flow} finish={() => navigate('master')} refresh={refresh} />
      </> : detail ? <>
        <button className="quiet back" onClick={() => { setDetail(null); setEmbeddedPractice(null); setError('') }}>Back to lessons</button>
        <article className="surface lesson"><div className="eyebrow">{detail.track}</div><h1>{detail.title}</h1>
          <p><MathText text={detail.lesson} /></p>
          <p>{Math.max(0,(topicCounts[detail.id]?.answer_ready ?? detail.quiz_ids.length)-(topicCounts[detail.id]?.verified ?? detail.quiz_ids.length))} linked imports · {detail.quiz_ids.length} verified assessment questions</p>
          <div className="actions">
            <button className="secondary" disabled={busy || progress.completed.includes(detail.id)} onClick={complete}>
              {progress.completed.includes(detail.id) ? 'Lesson complete' : busy ? 'Saving…' : 'Mark lesson complete'}
            </button>

            {!showCurated && !hasPrimer(detail.id) && !adaptiveLesson &&
              <button className="primary" onClick={() => continueLesson(detail)}>Continue learning</button>}
          </div>
          {lessonConcepts.length > 0 && <details className="concept-worked">
            <summary>Explore related concepts</summary>
            <ul>{lessonConcepts.map(row => <li key={row.concept}>
              <button className="quiet" onClick={() => openImported(row.subject,row.concept)}>
                {conceptLabel(row.concept)} · {row.imported} imported
              </button>
            </li>)}</ul>
          </details>}
        </article>
        {showCurated && <CuratedSkill onProgress={refreshCurated} key={detail.id} skill={detail.id} subject={detail.track}
          continuePractice={() => {setShowCurated(false); continueLesson(detail)}} />}
        {!showCurated && !assessedSkills.has(detail.id) && !adaptiveLesson && hasPrimer(detail.id) && <CurriculumPrimer key={detail.id}
          concept={detail.id} onReady={() => continueLesson(detail)} />}
        {adaptiveLesson && <LearningPractice key={track+detail.id} track={track} subject={detail.track}
          topics={[detail.id,...lessonConcepts.map(row=>'concept:'+row.concept)]}
          onFinish={() => setAdaptiveLesson(false)} />}
        <ConceptLab topic={detail.id} />
        {importedPanel}
      </> : ['library', 'practice'].includes(tab) ? <Hybrid key={tab + track + practiceTopic + practiceSubject} library={tab === 'library'} track={track} modules={catalog} initialTopic={practiceTopic} initialSubject={practiceSubject} conceptCounts={conceptCounts} /> : <>
        <header className="page-head"><h1>{page[0]}</h1><p>{page[1]}</p></header>
        {tab === 'learn' && !journeySubject && <div className="actions">
          <button className="quiet" onClick={() => openImported('',null)}>Browse all practice</button>
          {due.length + conceptDue.length > 0 && <button className="quiet" onClick={() => navigate('repeat')}>Review due</button>}
        </div>}
        {tab === 'tutor' && <button className="primary" onClick={() => openImported('',null)}>Choose an imported question</button>}
        {tab === 'today' && <section className="surface concept-lab">
          <h2>Study today</h2>
          <p>{conceptDue.length || due.length || dueSkills.length ? 'Start with a due review, then continue your learning pathway.'
            : 'Start with a short guided exercise. Use a hint whenever you need help.'}</p>
          <div className="actions">
            {recommendations.map((id, index) => <button className={index ? 'secondary' : 'primary'}
              key={id} onClick={() => openPath(id)}>{index === 0 ? 'Continue learning: ' : states[id].dueNow ? 'Review ' : 'Study '}{mathPath[id].title.toLowerCase()}</button>)}
            <button className="secondary" onClick={() => openPath('signed')}>Browse the learning pathway</button>
            {dueSkills.map(id => <button className="secondary" key={id} onClick={() => openCurated(id)}>
              Review {curatedTitles[id]}</button>)}
            {due.length > 0 && <button className="secondary" onClick={() => navigate('repeat')}>
              {due.length} verified {due.length === 1 ? 'review' : 'reviews'} due
            </button>}
          </div>
          {weak.length > 0 && <p>Focus areas: {weak.map(id => mathPath[id].title).slice(0, 3).join(', ')}</p>}
        </section>}
        {tab === 'master' && <section className="surface concept-lab">
          <h2>Adaptive learning progress</h2>
          <p>{Object.values(states).filter(state => state.mastery).length} of {Object.keys(mathPath).length} guided concepts mastered.</p>
          <p>Guided concept mastery requires 90% on independent work and a successful later review.</p>
          {weak.map(id => <button className="secondary" key={id} onClick={() => openPath(mathPath[id].prerequisite ?? id)}>
            Strengthen {mathPath[id].title.toLowerCase()}</button>)}
        </section>}
        {tab === 'repeat' && conceptDue.length > 0 && <section className="surface concept-lab">
          <h2>Guided concept reviews</h2>
          <div className="actions">{conceptDue.map(id => <button className="secondary" key={id} onClick={() => openPath(id)}>
            Review {mathPath[id].title.toLowerCase()}</button>)}</div>
        </section>}
        {['today','learn','master'].includes(tab) && <Journey view={tab} profileId={profileId} groups={groups} modules={modules} progress={progress}
          attempts={conceptRows} topicCounts={topicCounts} subjectCounts={subjectCounts} conceptCounts={conceptCounts} states={states} recommendations={recommendations} subject={journeySubject}
          curated={curated} openCurated={openCurated} startTest={startTest} startConceptTest={startConceptTest} chooseSubject={chooseJourneySubject} openLearn={() => navigate('learn')} openLesson={openLesson} openPath={openPath}
          openQuiz={() => navigate('quiz')} openPractice={openImported} />}
        {importedPanel}
        {!modules.length && <div className="surface empty"><h2>Study content is waiting to be imported</h2><p>Ask the study desk owner to finish the private import.</p></div>}
        {['quiz', 'master'].includes(tab) && groups.map(group => <section className="topic-group" key={group}>
          <h2>{group}</h2>
          <div className="topic-grid">{modules.filter(module => module.track === group).map(module => {
            const stat = progress.mastery[module.id]
            const accuracy = stat?.attempts ? Math.round(stat.correct / stat.attempts * 100) : null
            return <article className="surface topic" key={module.id}>
              <div><h3>{module.title}</h3>
                {tab === 'master' ? <>
                  <p>{accuracy === null ? 'No quiz attempts yet' : accuracy + '% · ' + stat.correct + ' of ' + stat.attempts + ' correct'}</p>
                  {accuracy !== null && <progress value={accuracy} max="100" aria-label={module.title + ' accuracy'} />}
                  <small>{stat?.mastered ? 'Mastered' : stat ? stat.distinct_items + ' distinct questions · ' + stat.sessions + ' sessions' : 'Try a topic quiz to start'}</small>
                </> : <p>{module.quiz_ids.length} verified questions</p>}
              </div>
              {tab === 'quiz' && <button className="secondary" aria-label={'Start quiz: ' + module.title}
                onClick={() => start(module.quiz_ids, 'quiz', module.title)}>Start quiz</button>}
            </article>
          })}</div>
        </section>)}
        {tab === 'repeat' && <section className="surface empty">
          <h2>{due.length ? due.length + (due.length === 1 ? ' verified question due' : ' verified questions due') : 'Verified question reviews'}</h2>
          {due.length ? <button className="primary" onClick={() => start(due.map((r) => r.question_id), 'repeat', 'Spaced review')}>Start due reviews</button>
            : <p>{reviews.length ? 'Your next review is ' + dateLabel(reviews[0].due_at) + '.' : 'Answer a quiz question to start your review schedule.'}</p>}
        </section>}
      </>}
    </main>
  </div>
}

function SetInvitedPassword() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function save(event) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const password = String(fields.get('password'))
    if (password !== fields.get('confirm')) {
      setError('The passwords do not match.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const { error } = await client.auth.updateUser({ password, data: { study_password_setup: false } })
      if (error) throw error
    } catch (problem) {
      setError(problem.message)
    } finally {
      setBusy(false)
    }
  }
  return <main className="gate">
    <Brand />
    <section className="gate-card">
      <h1>Set your Study Desk password</h1>
      <p>Choose the password you’ll use when you sign in again.</p>
      <form onSubmit={save}>
        <label>New password<input name="password" type="password" autoComplete="new-password" minLength={12} required /></label>
        <label>Confirm password<input name="confirm" type="password" autoComplete="new-password" minLength={12} required /></label>
        {error && <p role="alert">{error}</p>}
        <button className="primary" disabled={busy}>{busy ? 'Saving…' : 'Save password'}</button>
      </form>
    </section>
  </main>
}

function App() {
  const [session, setSession] = useState(undefined)
  useEffect(() => {
    if (!client) return
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, value) => setSession(value))
    return () => subscription.unsubscribe()
  }, [])
  if (client && session === undefined) return <main className="gate"><Brand /><p role="status">Checking your session…</p></main>
  if (session?.user?.user_metadata?.study_password_setup === true) return <SetInvitedPassword />
  return session?.user ? <Desk key={session.user.id} email={session.user.email} profileId={session.user.id} googleIdentity={session.user.app_metadata?.provider === 'google'} /> : <SignIn />
}

createRoot(document.getElementById('root')).render(<App />)
