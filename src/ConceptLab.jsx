import MathText from './MathText'
import React, { useState } from 'react'
import { equivalentNumber } from './practice-response.mjs'
import PracticeResponse from './PracticeResponse'
import MathPath from './MathPath'

const lessons = {
  fractions: {
    title: 'Read a fraction as equal parts',
    meaning: 'The denominator is the number of equal parts in one whole. The numerator counts the parts you selected.',
    recognize: 'When you see a shaded shape, check that every part has the same area before you count.',
    hint: 'Count all the equal parts first. That number goes below the fraction bar.',
    mistake: 'The unshaded parts still count toward the denominator.',
    field: 'Shaded parts', maximum: 12, initial: 3, total: 4, fraction: true,
    solve: (shaded, total) => `${shaded}/${total}`,
    explanation: (shaded, total) => `${shaded} shaded parts out of ${total} equal parts represent ${shaded}/${total}. Divide the numerator by the denominator to express the fraction as a decimal.`,
    steps: (shaded, total) => [
      ['Understand the question', 'Find what share of one whole is shaded.'],
      ['Count the equal parts', `The whole has ${total} equal parts. Each part is 1/${total} of the whole.`],
      ['Count the shaded parts', `Add ${shaded} copies of 1/${total}. They give ${shaded}/${total}.`],
      ['Verify the fraction', `The shaded and unshaded parts add to ${shaded} + ${total - shaded} = ${total} parts, or one whole.`],
    ],
  },
  arithmetic: {
    title: 'Percent means out of 100',
    meaning: 'A percent describes how many parts out of 100. The same percentage gives different amounts when the starting total changes.',
    recognize: 'Find the starting total and ask which fraction of it the question wants. For a discount, distinguish the amount saved from the final price.',
    hint: 'Divide the percentage by 100 before multiplying by the total.',
    mistake: 'A 20% increase is adding one fifth of the original amount. It does not mean adding 20 units.',
    field: 'Percentage', maximum: 100, initial: 25, total: 80,
    solve: (percent, total) => total * percent / 100,
    explanation: (percent, total, answer) => `${percent}% is ${percent}/100. Multiply ${total} × ${percent}/100 to get ${answer}.`,
    steps: (percent, total, answer) => [
      ['Understand the question', 'Find the amount that represents the given share of the starting total.'],
      ['Identify what you know', `The starting total is ${total}. You want ${percent} parts out of every 100.`],
      ['Explain the relationship', 'Divide the percentage by 100 to express it as a fraction of the whole. Multiplying by the whole gives the amount.'],
      ['Substitute and solve', `Write ${total} × (${percent} ÷ 100). Multiplying ${total} by ${percent} gives ${total * percent}; dividing by 100 gives ${answer}.`],
      ['Check and avoid a common mistake', `${answer} is between zero and ${total}, as expected when the percentage is between 0 and 100. Percent is a share, so adding ${percent} to the total would answer a different question.`],
    ],
  },
  'word-problems': {
    title: 'Translate a trip into an equation',
    meaning: 'A speed tells you the distance covered per unit of time. At constant speed, each hour adds the same distance.',
    recognize: 'Identify what is given, what is asked, and the units. Convert minutes to hours before multiplying by kilometers per hour.',
    hint: 'Multiply speed by time. The hours cancel, leaving kilometers.',
    mistake: 'Use the time spent moving. A stop adds elapsed time, but contributes no distance.',
    field: 'Hours', maximum: 12, initial: 3, total: 40,
    solve: (hours, speed) => hours * speed,
    explanation: (hours, speed, answer) => `At ${speed} km per hour for ${hours} hours, the distance is ${speed} × ${hours} = ${answer} km.`,
    steps: (hours, speed, answer) => [
      ['Understand the question', 'Find how far the traveler moves at a steady speed.'],
      ['Identify the given values', `The speed is ${speed} kilometers per hour and the elapsed travel time is ${hours} hours. The unknown is distance in kilometers.`],
      ['Explain the formula', 'Distance equals speed times time. Each hour adds one hour’s worth of travel. The hours in kilometers per hour cancel the hours of travel.'],
      ['Substitute and solve', `${speed} kilometers per hour × ${hours} hours = ${answer} kilometers.`],
      ['Verify the result', hours ? `Divide ${answer} kilometers by ${hours} hours. This gives the original speed of ${speed} kilometers per hour.` : 'No time elapsed, so no distance was traveled.'],
    ],
  },
  logic: {
    title: 'Test a conclusion with a counterexample',
    meaning: 'A conclusion follows only when it is true in every arrangement that satisfies the premises.',
    recognize: 'Read “all” as a one-way claim. “All volunteers are members” places volunteers inside the member group, but members may include non-volunteers.',
    hint: 'Try adding a member who is not a volunteer. The original premise still holds.',
    mistake: 'Reversing an implication can create a claim that the premises do not support.',
    field: 'Non-volunteer members', maximum: 12, initial: 2, total: 5,
    conclusion: 'Is every member a volunteer in this example?',
    solve: nonVolunteers => nonVolunteers === 0 ? 'yes' : 'no',
    explanation: (nonVolunteers, volunteers) => `All ${volunteers} volunteers are members. With ${nonVolunteers} non-volunteer members, ${nonVolunteers ? 'the reverse claim is false' : 'the reverse claim happens to be true in this example'}. The original premise allows both arrangements.`,
  },
}

const format = value => Number(value.toFixed(2))

export default function ConceptLab({ topic }) {
  const [foundation, setFoundation] = useState(false)
  const lesson = lessons[topic === 'arithmetic' && foundation ? 'fractions' : topic]
  return lesson ? <>
    {topic === 'arithmetic' && <div className="actions concept-switch">
      <button className="secondary" onClick={() => setFoundation(!foundation)}>
        {foundation ? 'Continue to percentages' : 'Review fractions first'}
      </button>
    </div>}
    <Exercise key={lesson.title} lesson={lesson} />
    {topic === 'arithmetic' && <MathPath />}
  </> : null
}

function Exercise({ lesson }) {
  const [value, setValue] = useState(lesson.initial)
  const [total, setTotal] = useState(lesson.total)
  const [response, setResponse] = useState('')
  const [help, setHelp] = useState(0)
  const [checked, setChecked] = useState(false)
  const [depth, setDepth] = useState('detailed')
  const [step, setStep] = useState(0)
  const result = lesson.solve(value, total)
  const answer = lesson.conclusion || lesson.fraction ? result : format(result)
  const correct = lesson.conclusion ? response === answer : equivalentNumber(response, answer)
  const steps = lesson.steps?.(value, total, answer)
  function reset() {
    setResponse('')
    setHelp(0)
    setChecked(false)
    setStep(0)
  }
  return <section className="surface concept-lab">
    <h2>{lesson.title}</h2>
    <p>{lesson.meaning}</p><p>{lesson.recognize}</p>
    <div className="concept-controls">
      <label>{lesson.field} <output>{value}</output>
        <input type="range" min="0" max={lesson.fraction ? total : lesson.maximum} value={value}
          onChange={event => { setValue(Number(event.target.value)); reset() }} />
      </label>
      <label>{lesson.fraction ? 'Equal parts' : lesson.field === 'Hours' ? 'Speed (km/h)' : lesson.field === 'Percentage' ? 'Starting total' : 'Volunteer members'}
        <input type="number" min="1" max={lesson.fraction ? 12 : 100} value={total} onChange={event => {
          const next = Math.min(lesson.fraction ? 12 : 100, Math.max(1, Math.trunc(Number(event.target.value)) || 1))
          setTotal(next)
          if (lesson.fraction) setValue(Math.min(value, next))
          reset()
        }} />
      </label>
    </div>
    {lesson.field === 'Percentage' && <progress aria-label="Fraction of the whole" value={value} max="100" />}
    {lesson.fraction && <div className="fraction-grid" role="img" aria-label={`${value} of ${total} equal parts shaded`}
      style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
      {Array.from({ length: total }, (_, index) => <span key={index} className={index < value ? 'shaded' : ''} />)}
    </div>}
    <form onSubmit={event => { event.preventDefault(); setChecked(true) }}>
      {lesson.conclusion ? <label>{lesson.conclusion}
        <select value={response} required onChange={event => {
          setResponse(event.target.value)
          setChecked(false)
        }}><option value="">Choose an answer</option><option value="yes">Yes</option><option value="no">No</option></select>
      </label> : <PracticeResponse item={{}} inputLabel={lesson.fraction ? 'Enter the shaded fraction' : lesson.field === 'Hours' ? 'Find the distance in kilometers' : 'Find the amount'}
        response={response} change={text => {
          setResponse(text)
          setChecked(false)
        }} />}
      <div className="actions">
        <button className="primary" type="submit">Check my answer</button>
        <button className="secondary" type="button" onClick={() => setHelp(Math.min(2, help + 1))}
          disabled={help === 2}>{help ? 'Show worked solution' : 'Get a hint'}</button>
        <button className="quiet" type="button" onClick={() => {
          setValue((value + 3) % ((lesson.fraction ? total : lesson.maximum) + 1))
          reset()
        }}>Try different values</button>
      </div>
    </form>
    {checked && <p role="status">{correct ? 'Correct.' : 'Try again or use the hint.'}</p>}
    {help === 1 && <p role="status"><MathText text={lesson.hint} /></p>}
    {help === 2 && <div className="concept-worked">
      {steps && <label>Explanation depth <select value={depth} onChange={event => {
        setDepth(event.target.value)
        setStep(0)
      }}>
        <option value="detailed">Detailed</option><option value="standard">Standard</option><option value="quick">Quick</option>
      </select></label>}
      {steps && depth === 'detailed' ? <>
        <div role="status"><h3>{steps[step][0]}</h3><p><MathText text={steps[step][1]} /></p></div>
        <div className="actions">
          <button className="secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>Previous Step</button>
          <button className="secondary" disabled={step === steps.length - 1} onClick={() => setStep(step + 1)}>Next Step</button>
        </div>
      </> : <div role="status"><p><MathText text={lesson.explanation(value, total, answer)} /></p>{depth !== 'quick' && <p><MathText text={lesson.mistake} /></p>}</div>}
      {lesson.field === 'Percentage' && <small>Prerequisite · Fractions and decimals</small>}
    </div>}
  </section>
}
