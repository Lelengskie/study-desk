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

export function AnswerFeedback({ correct, answer, submitted, explanation, children }) {
  return <div className="answer-feedback" data-state={correct === true ? 'correct' : correct === false ? 'incorrect' : 'neutral'}>
    <div className="feedback-summary" role="status">
      <strong>{correct === true ? 'Correct! Well done.' : correct === false ? 'Incorrect' : 'Self-check'}</strong>
      {(submitted != null || answer != null) && <dl className="feedback-comparison">
        {submitted != null && <div><dt>Your answer</dt><dd><MathText text={submitted} /></dd></div>}
        {answer != null && <div><dt>Correct answer</dt><dd><MathText text={answer} /></dd></div>}
      </dl>}
    </div>
    {(explanation || children) && <div className="feedback-teaching">
      {explanation && <><h4>Explanation</h4><div className="answer-explanation"><MathText text={explanation} /></div></>}
      {children}
    </div>}
  </div>
}
