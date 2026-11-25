import React from 'react'
import SubjectIcon from './SubjectIcon'

const paths = {
  today:'M3 10.8 12 3l9 7.8V21h-6v-6H9v6H3z',
  learn:'M4 4h6a2 2 0 0 1 2 2v15a5 5 0 0 0-4-2H4zm16 0h-6a2 2 0 0 0-2 2v15a5 5 0 0 1 4-2h4z',
  tutor:'m12 2 2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z',
  master:'M4 20h16M6 16v-5m6 5V5m6 11V8',
  library:'M4 4h4v16H4zm6 0h4v16h-4zm6 2 3-1 4 14-3 1z',
}
export function StageIcon({ name }) {
  return <svg className="stage-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
    strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] ?? paths.learn} /></svg>
}

export function LearningStages({ active }) {
  return <ol className="learning-stages" aria-label="Learning stages">
    {['Learn','Apply','Test','Master'].map(stage => <li key={stage} aria-current={stage===active ? 'step' : undefined}>{stage}</li>)}
  </ol>
}

const subjectIcons = {
  'Numerical Ability': 'numerical',
  'Verbal Ability': 'verbal',
  'Analytical Ability': 'analytical',
  Filipino: 'filipino',
  'General Information': 'information',
  'Clerical Ability': 'clerical',
}

export function LearningHeader({ title, subject, stage, mastery, mastered }) {
  return <header className={subjectIcons[subject] ? "learning-header journey-" + subjectIcons[subject] : "learning-header"}>
    <div className="learning-header-title">
      {subject && <span className="learning-subject-icon"><SubjectIcon subject={subjectIcons[subject]} /></span>}
      <div>{subject && <span className="learning-context">{subject}</span>}<h3>{title}</h3></div>
    </div>
    {mastery && <p className="mastery-label"><strong>Concept mastery</strong><span>{mastery}</span></p>}
    {mastered !== undefined && <progress className="mastery-meter" value={Number(mastered)} max={1} aria-label="Concept mastery" />}
    <LearningStages active={stage} />
  </header>
}
