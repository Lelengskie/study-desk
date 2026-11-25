import React from 'react'
import MathText from './MathText'

export function AnswerChoices({ options, value, onChange, name, prompt, disabled, correct }) {
  const graded = correct !== undefined && correct !== null
  return <fieldset className="answer-choices" disabled={disabled || graded}>
    {prompt ? <legend className="answer-prompt">{prompt}</legend> : <legend className="sr-only">Choose an answer</legend>}
    {options.map((option,index) => {
      const selected = value === option.id
      const right = graded && correct === option.id
      const wrong = graded && selected && !right
      const state = right ? 'correct' : wrong ? 'incorrect' : selected && !graded ? 'selected' : 'neutral'
      return <label key={option.id} data-state={state} className="answer-choice">
        <input type="radio" aria-label={option.text} name={name} checked={selected} onChange={() => onChange(option.id)} />
        <span className="answer-letter" aria-hidden="true">{String.fromCharCode(65+index)}</span>
        <span className="answer-text"><MathText text={option.text} /></span>
        {right && <span className="answer-mark"><span aria-hidden="true">✓</span> Correct answer</span>}
        {wrong && <span className="answer-mark"><span aria-hidden="true">✕</span> Your answer, incorrect</span>}
      </label>
    })}
  </fieldset>
}

export function AnswerFeedback({ correct, answer, explanation, children }) {
  return <div className="answer-feedback" data-state={correct === true ? 'correct' : correct === false ? 'incorrect' : 'neutral'} role="status">
    <strong>{correct === true ? 'Correct! Well done.' : correct === false ? "Incorrect. Here's why." : 'Self-check'}</strong>
    {answer != null && <p>Correct answer: <MathText text={answer} /></p>}
    {explanation && <div className="answer-explanation"><MathText text={explanation} /></div>}
    {children}
  </div>
}
