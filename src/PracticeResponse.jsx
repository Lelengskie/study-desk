import React from 'react'
import MathText from './MathText'

export default function PracticeResponse({ item, response, change, inputLabel = 'Your answer', math = false }) {
  return <>
    {item.instructions && <p>{item.instructions}</p>}
    {item.shared_context?.passage && <blockquote>{item.shared_context.passage}</blockquote>}
    {Array.isArray(item.shared_context?.word_bank) && <p>Word bank · {item.shared_context.word_bank.join(' · ')}</p>}
    <label>{inputLabel}
      <input value={response} maxLength={1000} required onChange={event => change(event.target.value)} />
    </label>
    {math && <>
      <small>Enter your final value as a number, decimal or fraction.</small>
      {response && <p><span className="sr-only">Math preview </span><MathText text={response} /></p>}
      <details className="math-keypad"><summary>Math keypad</summary>
        <div>{['7','8','9','/','4','5','6','×','1','2','3','−','0','.','+','(',')','^','√','Backspace','Clear'].map(key =>
          <button key={key} className="secondary" type="button" onClick={() => change(
            key === 'Clear' ? '' : key === 'Backspace' ? response.slice(0,-1) : (response + key).slice(0,48)
          )}>{key}</button>)}</div>
      </details>
    </>}
  </>
}
