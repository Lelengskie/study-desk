import React, { useEffect, useState } from 'react'
import { conceptLabel } from './concept-labels.mjs'
import SubjectIcon from './SubjectIcon'
import { curriculum, curriculumEntry } from './curriculum.mjs'
import { rpc } from './api'
import { analyticalConcepts as analytical, mathPath } from './math-path.mjs'
import { activeStudyDays, journeyRewards } from './journey-progress.mjs'

const subjects = {
  'Verbal Ability': { color: 'verbal', intro: 'Read for meaning and choose clear, precise language.' },
  'Numerical Ability': { color: 'numerical', intro: 'Build confidence with numbers before tackling word problems.' },
  'Analytical Ability': { color: 'analytical', intro: 'Find patterns, test conclusions, and reason from evidence.' },
  Filipino: { color: 'filipino', intro: 'Pag-aralan ang talasalitaan, paggamit ng wika, at pagbasa.' },
  'Clerical Ability': { color: 'clerical', intro: 'Practice accurate sorting, spelling, and transcription.' },
  'General Information': { color: 'information', intro: 'Learn core principles of government, rights, and public service.' },
}
// Reviewer prerequisites are suggestions. Every lesson stays available.
const reviewerPath = {
  'word-meaning': { stage: 0 },
  grammar: { stage: 1 },
  'reading-order': { stage: 2, parent: 'word-meaning' },
  arithmetic: { stage: 0 },
  'number-patterns': { stage: 1, parent: 'arithmetic' },
  'word-problems': { stage: 2, parent: 'arithmetic' },
  logic: { stage: 0 },
  'data-interpretation': { stage: 1 },
  spelling: { stage: 0 },
  clerical: { stage: 1, parent: 'spelling' },
  constitution: { stage: 0 },
  'human-rights': { stage: 1, parent: 'constitution' },
  ethics: { stage: 1, parent: 'constitution' },
  environment: { stage: 2 },
}
const progression = ['Foundation', 'Develop', 'Apply']
const dayLabel = new Intl.DateTimeFormat(undefined, { weekday: 'short', timeZone: 'UTC' })
const fullDayLabel = new Intl.DateTimeFormat(undefined, { dateStyle: 'long', timeZone: 'UTC' })
const weeklyGoals = [2, 3, 4, 5, 6, 7]

function conceptDepth(id) {
  const parent = mathPath[id].prerequisite
  return parent ? 1 + conceptDepth(parent) : 0
}

function SubjectProgress({ label, count, total }) {
  return <label className="journey-meter">
    <span>{label} <strong>{count}/{total}</strong></span>
    <progress value={count} max={Math.max(1, total)} />
  </label>
}

export default function Journey({
  view, profileId, groups, modules, progress, attempts, topicCounts, subjectCounts, conceptCounts, states, recommendations, subject, chooseSubject, openLearn, openLesson, openPath, openQuiz, openPractice, curated, openCurated, startTest,
}) {
  const goalKey = 'study-desk:weekly-goal:' + profileId
  const [goal, setGoal] = useState(() => {
    try {
      const saved = Number(localStorage.getItem(goalKey))
      return weeklyGoals.includes(saved) ? saved : 3
    } catch { return 3 }
  })
  const [savingGoal, setSavingGoal] = useState(true)
  const [goalNotice, setGoalNotice] = useState('')
  useEffect(() => {
    let active = true
    rpc('v21_weekly_goal').then(value => {
      if (active && weeklyGoals.includes(value)) setGoal(value)
    }).catch(() => {
      if (active) setGoalNotice('Account sync is unavailable. Your browser goal is still available.')
    }).finally(() => { if (active) setSavingGoal(false) })
    return () => { active = false }
  }, [profileId])

  async function changeGoal(event) {
    const choice = Number(event.target.value)
    setGoal(choice)
    setSavingGoal(true)
    setGoalNotice('')
    try {
      await rpc('v21_weekly_goal', { new_goal: choice })
    } catch {
      setGoalNotice('Goal saved in this browser. Account sync is unavailable.')
    } finally {
      try { localStorage.setItem(goalKey, String(choice)) } catch { /* optional browser copy */ }
      setSavingGoal(false)
    }
  }

  const activity = activeStudyDays(attempts)
  const rewards = journeyRewards(attempts, states, progress.completed.length,
    Object.values(progress.mastery).filter(stat => stat.mastered).length)

  const applicable = [...new Set([...groups, ...(groups.includes('Verbal Ability') ? ['Filipino'] : [])])]
  function requiredTopics(name) {
    return Object.entries(curriculum[name] ?? {}).map(([topic, keys]) => [
      topic, keys.map(key => curriculumEntry(key, states, curated ?? {})),
    ])
  }
  function subjectData(name) {
    const lessons = modules.filter(module => module.track === name)
      .sort((a, b) => (reviewerPath[a.id]?.stage ?? 0) - (reviewerPath[b.id]?.stage ?? 0))
    const concepts = Object.keys(mathPath).filter(id => name === 'Analytical Ability' ? analytical.has(id)
      : name === 'Numerical Ability' && !analytical.has(id))
    const nextConcept = recommendations.find(id => concepts.includes(id))
      ?? concepts.find(id => !states[id].mastery && (!mathPath[id].prerequisite || states[mathPath[id].prerequisite].mastery))
      ?? concepts.find(id => !states[id].mastery)
    const nextLesson = lessons.find(module => !progress.completed.includes(module.id)) ?? lessons[0]
    const entries = requiredTopics(name).flatMap(([, items]) => items)
    return { lessons, concepts, nextConcept, nextLesson, entries,
      mastered: entries.filter(item => item.mastered).length }

  }

  if (subject && subjects[subject] && applicable.includes(subject)) {
    const theme = subjects[subject]
    const { lessons, concepts, nextConcept, nextLesson, entries, mastered } = subjectData(subject)
    return <section className={'journey-roadmap journey-' + theme.color}>
      <button className="quiet" onClick={() => chooseSubject(null)}>Back to subjects</button>
      <header className="journey-banner surface">
        <SubjectIcon subject={theme.color} />
        <div><h2>{subject}</h2><p>{theme.intro}</p></div>
      </header>
      {lessons.some(module => module.quiz_ids.length) && <button className="primary"
        onClick={() => startTest(subject + ' verified test', lessons)}>Take verified subject test</button>}
      <SubjectProgress label="Curriculum mastery" count={mastered} total={entries.length} />
      <section className="journey-stage">
        <h3>Required curriculum</h3>
        {requiredTopics(subject).map(([topic, items]) => <details key={topic} className="journey-stage" open={items.some(item => item.due)}>
          <summary>{topic} · {items.filter(item => item.mastered).length}/{items.length} mastered</summary>
          <SubjectProgress label={topic + ' mastery'} count={items.filter(item => item.mastered).length} total={items.length} />
          <ol className="journey-steps">{items.map(item => <li key={item.id}>
            <SubjectProgress label={item.title + ' mastery'} count={Number(item.mastered)} total={1} />
            {item.kind === 'pending' ? <small>Mastery assessment pending</small> :
              <button className="secondary" onClick={() => item.kind === 'guided' ? openPath(item.id) : openCurated(item.id)}>
                {item.due ? 'Review' : 'Study'}<span className="sr-only"> {item.title}</span>
              </button>}
          </li>)}</ol>
        </details>)}
      </section>
      {concepts.length > 0 && progression.map((stage, index) => {
        const entries = concepts.filter(id => Math.min(2, Math.floor(conceptDepth(id) / 3)) === index)
        return entries.length > 0 && <details key={stage} open={index === 0 || entries.includes(nextConcept)} className="journey-stage">
          <summary><strong>{stage}</strong> · {entries.length} concepts</summary>
          <ol className="journey-steps">{entries.map(id => {
            const item = mathPath[id]
            const state = states[id]
            return <li className="surface" key={id}>
              <div><strong>{item.title}</strong>
                <p>{state.dueNow ? 'Review due' : state.mastery ? 'Mastered' : id === nextConcept ? 'Recommended' : state.weak ? 'Practice again' : 'Guided practice'}</p>
                {item.prerequisite && <small>Builds on {mathPath[item.prerequisite].title.toLowerCase()}</small>}
              </div>
              <button className="secondary" onClick={() => openPath(id)}>{state.dueNow ? 'Review' : 'Study'}<span className="sr-only"> {item.title}</span></button>
            </li>
          })}</ol>
        </details>
      })}
      <section className="journey-stage">
        {concepts.length > 0 && <h3>Reviewer lessons</h3>}
        {progression.map((stage, index) => {
          const stageLessons = lessons.filter(module => (reviewerPath[module.id]?.stage ?? 0) === index)
          return stageLessons.length > 0 && <section key={stage}>
            {concepts.length ? <h4>{stage}</h4> : <h3>{stage}</h3>}
            <ol className="journey-steps">{stageLessons.map(module => {
              const parent = lessons.find(item => item.id === reviewerPath[module.id]?.parent)
              const status = progress.mastery[module.id]?.mastered ? 'Mastered'
                : progress.completed.includes(module.id) ? 'Completed'
                  : module === nextLesson ? 'Recommended lesson' : 'Available lesson'
              return <li className="surface" key={module.id}>
                <div><strong>{module.title}</strong><p>{status}</p>
                  {parent && <small className="journey-prerequisite">Builds on {parent.title.toLowerCase()}</small>}
                  <small>{Math.max(0,(topicCounts[module.id]?.answer_ready ?? module.quiz_ids.length)-(topicCounts[module.id]?.verified ?? module.quiz_ids.length))} linked imports · {module.quiz_ids.length} verified</small>
                </div>
                <button className="secondary" aria-label={'Open lesson: ' + module.title} onClick={() => openLesson(module)}>Open lesson</button>
                {!!module.quiz_ids.length && <button className="secondary"
                  onClick={() => startTest(module.title + ' verified test',[module])}>Take topic test</button>}
              </li>
            })}</ol>
          </section>
        })}
      </section>
      {conceptCounts.some(row => row.subject === subject) && <section className="journey-stage">
        <h3>Imported practice by concept</h3>
        <ol className="journey-steps">{conceptCounts.filter(row => row.subject === subject)
          .sort((a, b) => conceptLabel(a.concept).localeCompare(conceptLabel(b.concept)))
          .map(row => <li className="surface" key={row.concept}>
            <div><strong>{conceptLabel(row.concept)}</strong><p>{row.imported} answer-ready</p></div>
            <button className="secondary" onClick={() => openPractice(row.subject, row.concept)}>
              Practice <span className="sr-only">{conceptLabel(row.concept)}</span>
            </button>
          </li>)}</ol>
      </section>}
      <section className="surface journey-banner">
        <div><h3>Examination practice</h3><p>Apply what you learned with verified topic questions or answer-ready reviewer practice.</p></div>
        <div className="actions">
          <button className="secondary" onClick={openQuiz}>Verified topic quizzes</button>
          <button className="secondary" onClick={() => openPractice(subject)}>Browse practice</button>
        </div>
      </section>
    </section>
  }

  return <>
    {view === 'learn' && <section className="journey-subjects" aria-labelledby="journey-subjects">
      <h2 id="journey-subjects">Explore subjects</h2>
      <div className="journey-grid">{applicable.filter(name => subjects[name]).map(name => {
        const theme = subjects[name]
        const data = subjectData(name)
        const coverage = subjectCounts?.find(row => row.subject === name)
        return <article className={'surface journey-subject journey-' + theme.color} key={name}>
          <SubjectIcon subject={theme.color} />
          <h3>{name}</h3><p>{theme.intro}</p>
          {coverage && <details><summary>Reviewer resources</summary><p>{coverage.imported} imported · {coverage.verified} verified</p>
          {coverage?.subject_only > 0 && <small>{coverage.subject_only} available in subject practice while topic mapping is reviewed</small>}
          {coverage?.imported > 0 && <button className="quiet" onClick={() => openPractice(name)}>Practice {name.toLowerCase()}</button>}</details>}
          <SubjectProgress label={name + " curriculum mastery"} count={data.mastered} total={data.entries.length} />
          <p className="small muted">{data.entries.length - data.mastered} concepts remaining</p>
          {(data.nextConcept || data.nextLesson) && <p className="journey-next">Next: {data.nextConcept ? mathPath[data.nextConcept].title : data.nextLesson.title}</p>}
          <div className="actions">
            <button className="primary" aria-label={'Continue learning ' + name}
              onClick={() => data.nextConcept ? openPath(data.nextConcept) : data.nextLesson ? openLesson(data.nextLesson) : openCurated('filipino')}>Continue learning</button>
            <button className="quiet" aria-label={'Open ' + name + ' roadmap'} onClick={() => chooseSubject(name)}>Roadmap</button>
          </div>
        </article>
      })}</div>
      {subjectCounts?.some(row => !subjects[row.subject] && row.imported > 0) && <div className="surface journey-banner">
        <p>Additional answer-ready questions are available in All subjects while their classification is reviewed.</p>
      </div>}
    </section>}
    {view === 'today' && <section className="surface journey-overview">
      <h2>Curriculum progress</h2>
      {(() => {
        const entries = applicable.flatMap(name => subjectData(name).entries)
        return <SubjectProgress label="Overall mastery" count={entries.filter(item => item.mastered).length} total={entries.length} />
      })()}
      <div className="journey-overview-grid">{applicable.map(name => {
        const theme = subjects[name]
        const data = subjectData(name)
        return <div className={'journey-' + theme.color} key={name}>
          <SubjectProgress label={name} count={data.mastered} total={data.entries.length} />
        </div>
      })}</div>
      <button className="secondary" onClick={openLearn}>Explore subjects</button>
    </section>}
    {view !== 'learn' && <section className="surface journey-activity">
      <div><h2>Your study rhythm</h2><p>Guided practice activity over the last seven days.</p></div>
      <ol className="journey-week">{activity.week.map(({ date, active }) =>
        <li key={date.valueOf()} data-active={active} aria-label={fullDayLabel.format(date) + (active ? ', studied' : ', no guided practice')}>
          <span>{dayLabel.format(date)}</span><span aria-hidden="true">{active ? '✓' : '·'}</span>
        </li>)}</ol>
      <div className="journey-metrics">
        <p><strong>{rewards.xp} XP</strong> <span>Level {rewards.level}</span></p>
        <p><strong>{activity.streak} days</strong> <span>Current streak</span></p>
        <p><strong>{activity.weeklyDays}/{goal}</strong> <span>Study-day goal</span></p>
      </div>
      <label className="journey-goal">Weekly goal <select value={goal} disabled={savingGoal} onChange={changeGoal}>
        {weeklyGoals.map(number => <option value={number} key={number}>{number} study days</option>)}
      </select></label>
      {goalNotice && <p role="status">{goalNotice}</p>}
      <div><h3>Achievements</h3>
        {rewards.badges.length ? <ul className="journey-badges">{rewards.badges.map(name => <li key={name}>{name}</li>)}</ul>
          : <p>Complete a lesson or solve a guided exercise independently to earn your first milestone.</p>}
      </div>
    </section>}
  </>
}
