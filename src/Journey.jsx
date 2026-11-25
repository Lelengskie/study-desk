import React, { useState } from 'react'
import { mathPath } from './math-path.mjs'
import { activeStudyDays, journeyRewards } from './journey-progress.mjs'

const subjects = {
  'Verbal Ability': { icon: 'Aa', color: 'verbal', intro: 'Read for meaning and choose clear, precise language.' },
  'Numerical Ability': { icon: '∑', color: 'numerical', intro: 'Build confidence with numbers before tackling word problems.' },
  'Analytical Ability': { icon: '∴', color: 'analytical', intro: 'Find patterns, test conclusions, and reason from evidence.' },
  'Clerical Ability': { icon: 'A–Z', color: 'clerical', intro: 'Practice accurate sorting, spelling, and transcription.' },
  'General Information': { icon: '§', color: 'information', intro: 'Learn core principles of government, rights, and public service.' },
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
const analytical = new Set(['sequence', 'venn', 'syllogism', 'arrangement', 'sufficiency'])
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
  profileId, groups, modules, progress, attempts, topicCounts, states, recommendations, subject, chooseSubject, openLesson, openPath, openQuiz, openPractice,
}) {
  const goalKey = 'study-desk:weekly-goal:' + profileId
  const [goal, setGoal] = useState(() => {
    try {
      const saved = Number(localStorage.getItem(goalKey))
      return weeklyGoals.includes(saved) ? saved : 3
    } catch { return 3 }
  })
  const activity = activeStudyDays(attempts)
  const rewards = journeyRewards(attempts, states, progress.completed.length,
    Object.values(progress.mastery).filter(stat => stat.mastered).length)

  function subjectData(name) {
    const lessons = modules.filter(module => module.track === name)
      .sort((a, b) => (reviewerPath[a.id]?.stage ?? 0) - (reviewerPath[b.id]?.stage ?? 0))
    const concepts = Object.keys(mathPath).filter(id => name === 'Analytical Ability' ? analytical.has(id)
      : name === 'Numerical Ability' && !analytical.has(id))
    const nextConcept = recommendations.find(id => concepts.includes(id))
      ?? concepts.find(id => !states[id].mastery && (!mathPath[id].prerequisite || states[mathPath[id].prerequisite].mastery))
      ?? concepts.find(id => !states[id].mastery)
    const nextLesson = lessons.find(module => !progress.completed.includes(module.id)) ?? lessons[0]
    return {
      lessons, concepts, nextConcept, nextLesson,
      completed: lessons.filter(module => progress.completed.includes(module.id)).length,
      mastered: lessons.filter(module => progress.mastery[module.id]?.mastered).length
        + concepts.filter(id => states[id].mastery).length,
    }
  }

  if (subject && subjects[subject] && groups.includes(subject)) {
    const theme = subjects[subject]
    const { lessons, concepts, nextConcept, nextLesson } = subjectData(subject)
    return <section className={'journey-roadmap journey-' + theme.color}>
      <button className="quiet" onClick={() => chooseSubject(null)}>Back to subjects</button>
      <header className="journey-banner surface">
        <span className="journey-icon" aria-hidden="true">{theme.icon}</span>
        <div><h2>{subject}</h2><p>{theme.intro}</p></div>
      </header>
      {concepts.length > 0 && progression.map((stage, index) => {
        const entries = concepts.filter(id => Math.min(2, Math.floor(conceptDepth(id) / 3)) === index)
        return entries.length > 0 && <section key={stage} className="journey-stage">
          <h3>{stage}</h3>
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
        </section>
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
                  <small>{topicCounts[module.id]?.answer_ready ?? module.quiz_ids.length} answer-ready</small>
                </div>
                <button className="secondary" aria-label={'Open lesson: ' + module.title} onClick={() => openLesson(module)}>Open lesson</button>
              </li>
            })}</ol>
          </section>
        })}
      </section>
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
    <section className="journey-subjects" aria-labelledby="journey-subjects">
      <h2 id="journey-subjects">Explore subjects</h2>
      <div className="journey-grid">{groups.filter(name => subjects[name]).map(name => {
        const theme = subjects[name]
        const data = subjectData(name)
        return <article className={'surface journey-subject journey-' + theme.color} key={name}>
          <span aria-hidden="true" className="journey-icon">{theme.icon}</span>
          <h3>{name}</h3><p>{theme.intro}</p>
          <SubjectProgress label="Reviewer lessons completed" count={data.completed} total={data.lessons.length} />
          <SubjectProgress label="Topics and concepts mastered" count={data.mastered} total={data.lessons.length + data.concepts.length} />
          {(data.nextConcept || data.nextLesson) && <p className="journey-next">Next: {data.nextConcept ? mathPath[data.nextConcept].title : data.nextLesson.title}</p>}
          <div className="actions">
            <button className="primary" aria-label={'Continue learning ' + name}
              onClick={() => data.nextConcept ? openPath(data.nextConcept) : openLesson(data.nextLesson)}>Continue learning</button>
            <button className="quiet" aria-label={'Open ' + name + ' roadmap'} onClick={() => chooseSubject(name)}>Roadmap</button>
          </div>
        </article>
      })}</div>
    </section>
    <section className="surface journey-activity">
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
      <label className="journey-goal">Weekly goal <select value={goal} onChange={event => {
        const choice = Number(event.target.value)
        setGoal(choice)
        try { localStorage.setItem(goalKey, String(choice)) } catch { /* preference remains valid for this view */ }
      }}>{weeklyGoals.map(number => <option value={number} key={number}>{number} study days</option>)}</select></label>
      <div><h3>Achievements</h3>
        {rewards.badges.length ? <ul className="journey-badges">{rewards.badges.map(name => <li key={name}>{name}</li>)}</ul>
          : <p>Complete a lesson or solve a guided exercise independently to earn your first milestone.</p>}
      </div>
    </section>
  </>
}
