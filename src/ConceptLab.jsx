import React, { useState } from 'react'

const lessons = {
  arithmetic: {
    title: 'Percent means out of 100',
    meaning: 'A percent describes how many parts out of 100. The same percentage gives different amounts when the starting total changes.',
    recognize: 'Find the starting total and ask which fraction of it the question wants. For a discount, distinguish the amount saved from the final price.',
    hint: 'Divide the percentage by 100 before multiplying by the total.',
    mistake: 'A 20% increase is adding one fifth of the original amount. It does not mean adding 20 units.',
    field: 'Percentage', maximum: 100, initial: 25, total: 80,
    solve: (percent, total) => total * percent / 100,
    explanation: (percent, total, answer) => `${percent}% is ${percent}/100. Multiply ${total} × ${percent}/100 to get ${answer}.`,
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
  const lesson = lessons[topic]
  return lesson ? <Exercise key={topic} lesson={lesson} /> : null
}

function Exercise({ lesson }) {
  const [value, setValue] = useState(lesson.initial)
  const [total, setTotal] = useState(lesson.total)
  const [response, setResponse] = useState('')
  const [help, setHelp] = useState(0)
  const [checked, setChecked] = useState(false)
  const result = lesson.solve(value, total)
  const answer = lesson.conclusion ? result : format(result)
  const correct = lesson.conclusion ? response === answer : Number(response) === answer
  function reset() {
    setResponse('')
    setHelp(0)
    setChecked(false)
  }
  return <section className="surface concept-lab">
    <h2>{lesson.title}</h2>
    <p>{lesson.meaning}</p><p>{lesson.recognize}</p>
    <div className="concept-controls">
      <label>{lesson.field} <output>{value}</output>
        <input type="range" min="0" max={lesson.maximum} value={value}
          onChange={event => { setValue(Number(event.target.value)); reset() }} />
      </label>
      <label>{lesson.field === 'Hours' ? 'Speed (km/h)' : lesson.field === 'Percentage' ? 'Starting total' : 'Volunteer members'}
        <input type="number" min="1" max="100" value={total} onChange={event => {
          setTotal(Math.min(100, Math.max(1, Number(event.target.value) || 1)))
          reset()
        }} />
      </label>
    </div>
    {lesson.field === 'Percentage' && <progress aria-label="Fraction of the whole" value={value} max="100" />}
    <form onSubmit={event => { event.preventDefault(); setChecked(true) }}>
      {lesson.conclusion ? <label>{lesson.conclusion}
        <select value={response} required onChange={event => {
          setResponse(event.target.value)
          setChecked(false)
        }}><option value="">Choose an answer</option><option value="yes">Yes</option><option value="no">No</option></select>
      </label> : <label>Find the {lesson.field === 'Hours' ? 'distance in kilometers' : 'amount'}
        <input type="number" step="any" value={response} required onChange={event => {
          setResponse(event.target.value)
          setChecked(false)
        }} />
      </label>}
      <div className="actions">
        <button className="primary" type="submit">Check my answer</button>
        <button className="secondary" type="button" onClick={() => setHelp(Math.min(2, help + 1))}
          disabled={help === 2}>{help ? 'Show worked solution' : 'Get a hint'}</button>
        <button className="quiet" type="button" onClick={() => {
          setValue((value + 3) % (lesson.maximum + 1))
          reset()
        }}>Try different values</button>
      </div>
    </form>
    {checked && <p role="status">{correct ? 'Correct.' : 'Try again or use the hint.'}</p>}
    {help === 1 && <p role="status">{lesson.hint}</p>}
    {help === 2 && <div role="status"><p>{lesson.explanation(value, total, answer)}</p><p>{lesson.mistake}</p></div>}
  </section>
}
