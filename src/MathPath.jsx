import { AnswerFeedback } from './AnswerFeedback'
import React, { useCallback, useEffect, useState } from 'react'
import MathText from './MathText'
import { learningBand } from './learning-session.mjs'
import FoundationGuide from './FoundationGuide'
import PracticeResponse from './PracticeResponse'
import { rpc } from './api'
import { analyticalConcepts, firstSeed, lastSeed, mathPath } from './math-path.mjs'
import { equivalentNumber, rational } from './practice-response.mjs'
import { advanceVariant, conceptState, dailyConcepts } from './concept-progress.mjs'

const misconceptionPrompts = {
  possible_divisor_reciprocal_error: 'Did you multiply by one third? Count how many thirds fit. Use three as the multiplier.',
  possible_order_error: 'Did you add before multiplying? Try grouping the repeated amount first.',
  possible_sign_error: 'Did the balance stay below zero after the deposit? Sketch the move on a number line.',
  possible_denominator_error: 'Did you add denominators? Draw equal-sized pieces before adding.',
  possible_place_value_error: 'Did you line up the decimal points? Label the place value of each digit.',
  possible_percent_as_quantity: 'Does 25 describe pesos or a share out of 100? Try expressing the percentage as a fraction.',
  possible_discount_amount: 'Did you calculate the amount saved? Subtract it from the starting price to find what you pay.',
  possible_reversed_ratio: 'Which amount is measured in cups of water? Write the units beside each quantity in the ratio.',
  possible_double_counting: 'Did you count readers in both groups twice? Place those readers in the overlap first.',
}

const startingOrder = ['basic-arithmetic','whole-subtract','whole-multiply','whole-divide','signed','order']
const pathwayOrder = [...new Set([...startingOrder,...Object.keys(mathPath)])]
const difficultyOptions = ['foundation','beginner','intermediate','advanced','examination']

export default function MathPath({ initialConcept = 'signed', renderPractice, importedCoverage, onConceptChange }) {
  const [application, setApplication] = useState(false)
  const [remedy, setRemedy] = useState(false)
  const [assessment,setAssessment] = useState(false)
  const [selectedBand, setSelectedBand] = useState('')
  const [concept, setConcept] = useState(initialConcept)
  function choose(id) {
    setApplication(false)
    setAssessment(false)
    setSelectedBand('')
    setRemedy(false)
    setConcept(id)
    onConceptChange?.()
  }
  const [rows, setRows] = useState([])
  const [sync, setSync] = useState('loading')
  const refresh = useCallback(async () => {
    try {
      setRows(await rpc('v2_concept_progress'))
      setSync('ready')
    } catch {
      setSync('unavailable')
    }
  }, [])
  useEffect(() => { refresh() }, [refresh])
  const entry = mathPath[concept]
  const state = conceptState(rows, concept)
  const daily = dailyConcepts(rows, mathPath)
  const last = rows.filter(row => row.concept === concept).at(-1)
  const followUp = misconceptionPrompts[last?.mistake]
  const prerequisite = entry.prerequisite && mathPath[entry.prerequisite]
  // Seed 1 is reserved for display and is outside the server's scored seed range.
  const example = entry.generate(1)
  const currentPath = pathwayOrder.filter(id => analyticalConcepts.has(id) === analyticalConcepts.has(concept))
  const position = currentPath.indexOf(concept)
  const previousConcept = currentPath[position-1]
  const nextConcept = currentPath[position+1]
  const coverage = importedCoverage?.(concept)
  // Current generators have one or two authored structures. Never infer advanced readiness from numeric substitutions.
  const band = learningBand(rows.filter(row => row.concept === concept),state.retained,1)
  const applying = application
  function reviewFoundation() {
    setApplication(false)
    setRemedy(true)
  }
  return <section className="surface concept-lab">
    <h2>Math foundations</h2>
    <label>Concept <select value={concept} onChange={event => choose(event.target.value)}>
      {Object.entries(mathPath).map(([id, lesson]) => <option key={id} value={id}>{lesson.title}</option>)}
    </select></label>
    {prerequisite && <button className="quiet" onClick={() => choose(entry.prerequisite)}>
      Review {prerequisite.title.toLowerCase()}
    </button>}
    {sync === 'unavailable' && <p role="status">Progress sync is unavailable. You can keep practicing.</p>}
    {sync === 'ready' && <>
      <p>{state.success} correct on {state.independent} independent variations.
        {state.mastery ? ' Mastery demonstrated.' : state.weak ? ' Review the concept or its prerequisite.' : ''}
        {state.dueNow ? ' Review due.' : state.due && ' Next review ' + new Date(state.due).toLocaleDateString() + '.'}</p>
      {followUp && <p>{followUp}</p>}
      {daily.length > 0 && <div className="actions" aria-label="Recommended today">
        {daily.map(key => <button type="button" className="secondary" key={key} onClick={() => choose(key)}>
          {mathPath[key].title}
        </button>)}
      </div>}
      {state.unused.length === 0 && <p>All tracked variations have been tried. You can revisit them for practice.</p>}
    </>}
    <h3>{entry.title}</h3>
    <nav className="actions" aria-label="Lesson navigation">
      {previousConcept && <button className="secondary" onClick={() => choose(previousConcept)}>Previous concept</button>}
      {nextConcept && <button className="secondary" onClick={() => choose(nextConcept)}>Skip concept</button>}
      <button className="secondary" onClick={() => {setApplication(false);setAssessment(value=>!value)}}>
        {assessment ? 'Return to lesson' : 'Test my knowledge'}</button>
    </nav>
    <p>{lastSeed-firstSeed+1} generated practice variations{sync === 'ready' && ' · ' + state.unused.length + ' without a recorded attempt'}</p>
    {coverage && <p>{coverage.imported} imported questions linked to this concept</p>}
    {!assessment && <>
    <FoundationGuide key={'guide-' + concept} concept={concept} />
    <details key={'example-' + concept} className="concept-worked">
      <summary>Understand the concept with a worked example</summary>
      <p><MathText text={example.question} /></p>
      <ol>{example.steps.map(step => <li key={step}><MathText text={step} /></li>)}</ol>
      <p>Common mistake: {example.mistake}</p>
    </details>
    </>}
    {remedy && !assessment && <p role="status">Review the worked example, then try a fresh foundational exercise.</p>}
    {!assessment && coverage?.imported > 0 && renderPractice && <div className="actions">
      <label>Reviewer difficulty <select value={selectedBand} onChange={event => {
        setSelectedBand(event.target.value)
      }}>
        <option value="">Recommended ({band})</option>
        {difficultyOptions.map(level => <option key={level} value={level}>{level}</option>)}
      </select></label>
      {selectedBand && <small>Study Desk looks for this difficulty first.</small>}
      <button className="secondary" onClick={() => setApplication(value=>!value)}>
        {applying ? 'Return to guided exercise' : 'Apply with original reviewer questions'}</button>
    </div>}
    {!applying && <h3>{assessment ? 'Independent knowledge check' : state.dueNow && state.unused.length > 0 ? 'Check what you remember' : 'Try it independently'}</h3>}
    {sync !== 'loading' && !applying && <Variation key={'variation-' + concept + '-' + assessment} concept={concept} assessment={assessment} entry={entry} state={state}
      sync={sync} refresh={refresh} onNextConcept={nextConcept ? () => choose(nextConcept) : null}
      onOriginalPractice={!assessment && coverage?.imported ? () => setApplication(true) : null} /> }
    {applying && renderPractice?.(concept,reviewFoundation,selectedBand || band)}
    {applying && nextConcept && <button className="primary" onClick={() => choose(nextConcept)}>Next concept</button>}
  </section>
}

function Variation({ concept, entry, state, sync, refresh, assessment, onNextConcept, onOriginalPractice }) {
  const [variant, next] = useState(() => (assessment ? state.unused[1] : null) ?? state.unused[0] ?? firstSeed)
  const [response, change] = useState('')
  const [feedback, show] = useState('')
  const [graded, setGraded] = useState(null)
  const [hints, setHints] = useState(0)
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const problem = entry.generate(variant)

  async function check(event) {
    event.preventDefault()
    const fraction = rational(response)
    if (!fraction) { show('Enter a number, decimal or fraction.'); return }
    let correct = equivalentNumber(response, problem.answer)
    let saveFailed = false
    if (sync === 'ready') {
      setBusy(true)
      try {
        correct = await rpc('v2_concept_attempt', {
          skill: concept, variant_no: variant, numerator: String(fraction[0]),
          denominator: String(fraction[1]), hint_count: hints,
        })
        await refresh()
      } catch {
        saveFailed = true
      } finally {
        setBusy(false)
      }
    }
    setGraded(correct)
    setStep(0)
    show(saveFailed ? 'Progress could not be saved.' : '')
  }

  return <>
    <p className="answer-prompt"><MathText text={problem.question} /></p>
    <form onSubmit={check}>
      <fieldset disabled={busy || graded !== null} className="math-input-group">
        <PracticeResponse item={{}} math inputLabel="Your calculation" response={response}
          change={value => { change(value); show('') }} />
      </fieldset>
      {graded === null && <div className="actions">
        <button className="primary" disabled={busy}>Check my calculation</button>
        {!assessment && <button type="button" className="secondary" disabled={busy || hints >= Math.min(3,problem.steps.length-1)}
          onClick={() => setHints(hints+1)}>{hints ? 'Show another hint' : 'Show hint'}</button>}
      </div>}
    </form>
    {graded === null && <><p role="status">{feedback}</p>
      {hints > 0 && <ol>{problem.steps.slice(0,hints).map(line => <li key={line}><MathText text={line} /></li>)}</ol>}
    </>}
    {graded !== null && <>
      <AnswerFeedback correct={graded} answer={problem.answer}>{feedback && <p>{feedback}</p>}</AnswerFeedback>
      <section className="concept-worked" aria-label="Worked solution">
        <h4>Worked solution · Step {step+1} of {problem.steps.length}</h4>
        <p aria-live="polite"><MathText text={problem.steps[step]} /></p>
        <div className="actions">
          <button className="secondary" disabled={step===0} onClick={() => setStep(step-1)}>Previous step</button>
          <button className="secondary" disabled={step===problem.steps.length-1} onClick={() => setStep(step+1)}>Next step</button>
        </div>
        <p>Common mistake: <MathText text={problem.mistake} /></p>
      </section>
      {concept === 'syllogism' && <div className="logic-groups" aria-label="Groups in the deduction">
        Badge holders<div>Members <div>Volunteers</div></div>
      </div>}
      <div className="actions">
        {onNextConcept && <button className={graded ? 'primary' : 'secondary'} onClick={onNextConcept}>Next concept</button>}
        <button className={graded && onNextConcept ? 'secondary' : 'primary'} onClick={() => {
          if (onOriginalPractice) { onOriginalPractice(); return }
          next(advanceVariant(variant,state.unused))
          change(''); show(''); setHints(0); setStep(0); setGraded(null)
        }}>{graded ? 'Practice more' : 'Try a similar question'}</button>
      </div>
    </>}
  </>
}
