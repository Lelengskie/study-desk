import React from 'react'

export default function PracticeResponse({ item, response, change, inputLabel = 'Your answer' }) {
  return <>
    {item.instructions && <p>{item.instructions}</p>}
    {item.shared_context?.passage && <blockquote>{item.shared_context.passage}</blockquote>}
    {Array.isArray(item.shared_context?.word_bank) && <p>Word bank · {item.shared_context.word_bank.join(' · ')}</p>}
    <label>{inputLabel}
      <input value={response} maxLength={1000} required onChange={event => change(event.target.value)} />
    </label>
  </>
}
