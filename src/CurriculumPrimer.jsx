import { AnswerChoices, AnswerFeedback } from './AnswerFeedback'
import MathText from './MathText'
import React, { useState } from 'react'

const material = {
  'word-meaning': {
    lesson: 'Use neighboring words to infer meaning. A contrast word such as “but” often points to an opposite idea.',
    example: '“The report was concise, but the memo went on for pages.” The contrast suggests that concise means brief.',
    question: '“The water was scarce, so each family received only a cup.” Which clue most strongly explains scarce?',
    options: ['each family received only a cup', 'the water belonged to families'],
    reason: 'The small amount each family received is evidence that there was too little water.',
  },
  'reading-order': {
    lesson: 'Look for the sentence that introduces the topic. A sentence starting with “this” or “these” usually needs an earlier idea to refer to.',
    example: '“The office changed its opening hours” introduces a change. “This change shortened the queue” then explains its effect.',
    question: 'Which sentence should come first in a paragraph?',
    options: ['The library introduced a reservation system.', 'This system reduced waiting time.'],
    reason: 'Introduce the reservation system before using “this system” to refer to it.',
  },
  grammar: {
    lesson: 'Find the subject of the clause before choosing the verb. A phrase between the subject and verb can contain a different noun.',
    example: 'In “The box of forms is heavy,” the subject is box. “Of forms” describes the box.',
    question: 'Which subject controls the verb in “The list of applicants is ready”?',
    options: ['list', 'applicants'],
    reason: 'The list is ready. The phrase “of applicants” only identifies which list.',
  },
  logic: {
    lesson: 'Separate facts from conclusions. A conclusion follows only if it must be true whenever the premises are true.',
    example: 'If all signed forms are filed and this form is signed, it must be filed. A filed form need not be signed from that rule alone.',
    question: 'All typed notices are archived. This notice is archived. Can you prove it was typed?',
    options: ['No. Other notices may also be archived.', 'Yes. Being archived proves it was typed.'],
    reason: 'The premise connects typed notices to the archive in one direction. It does not exclude other archived notices.',
  },
  'data-interpretation': {
    lesson: 'An absolute increase and a percentage increase answer different questions. Use the starting value as the denominator for the percentage.',
    example: 'Going from 20 to 30 adds 10. Those 10 are half of the starting 20, so the increase is 50%.',
    question: 'An office processed 40 applications last month and 50 this month. What was the percentage increase?',
    options: ['25%', '20%'],
    reason: 'Subtract 40 from 50 to get 10. Divide the increase by the starting 40 to get one quarter, or 25%.',
  },
  constitution: {
    lesson: 'Read each condition of a constitutional rule separately. One qualifying condition does not necessarily satisfy the full rule.',
    example: 'Article III, Section 15 links suspension of the privilege of the writ to invasion or rebellion and a requirement of public safety.',
    question: 'Under that provision, does a declaration of rebellion by itself establish every condition?',
    options: ['No. Public safety must also require it.', 'Yes. The public-safety condition never applies during rebellion.'],
    reason: 'The section expressly includes public safety as a condition.',
    source: 'https://lawphil.net/consti/cons1987.html',
  },
  clerical: {
    lesson: 'Compare filing keys from left to right. Move to the next letter only if the preceding letters match.',
    example: 'File Cruz before Cuevas. Both start with C, then r comes before u.',
    question: 'Which surname goes first in an alphabetical file?',
    options: ['Dela Cruz', 'Delos Santos'],
    reason: 'After Del, the a in Dela Cruz comes before the o in Delos Santos.',
  },
  spelling: {
    lesson: 'Read every letter in the model before transcribing. Common words can still contain doubled letters.',
    example: '“Address” contains two d’s and two s’s. Compare each group with the original.',
    question: 'Which entry exactly matches “committee”?',
    options: ['committee', 'commitee'],
    reason: 'The model has two t’s. The shorter entry omits one.',
  },
  filipino: {
    lesson: 'Hanapin ang mga pahiwatig sa pangungusap upang maunawaan ang salita.',
    example: '“Matipid si Ana kaya may naitatabi siyang pera.” Ang naitatabing pera ay pahiwatig ng maingat na paggastos.',
    question: '“Mabilis kumilos si Lito kaya natapos niya agad ang gawain.” Ano ang pinakamalapit sa kahulugan ng mabilis?',
    options: ['matulin', 'mabagal'],
    reason: 'Ang salitang “agad” ay pahiwatig na hindi mabagal ang kaniyang pagkilos.',
  },
}

export default function CurriculumPrimer({ concept, onReady }) {
  const [answer, setAnswer] = useState(null)
  const [checked, setChecked] = useState(false)
  const entry = material[concept]
  if (!entry) return null
  const options = ['logic','constitution'].includes(concept) ? entry.options : [...entry.options].reverse()
  const correct = answer === entry.options[0]
  return <section className="surface concept-lab">
    <h2>Understand the concept</h2><p>{entry.lesson}</p>
    <details className="concept-worked"><summary>Read a worked example</summary><p>{entry.example}</p></details>
    {entry.source && <p><a href={entry.source} target="_blank" rel="noreferrer">Read the 1987 Constitution</a></p>}
    <AnswerChoices name={'primer-'+concept} options={options.map(text=>({id:text,text}))}
      value={answer} onChange={setAnswer} prompt={<MathText text={entry.question} />}
      correct={checked ? entry.options[0] : undefined} />
    {!checked && <button className="primary" disabled={!answer} onClick={() => setChecked(true)}>Check answer</button>}
    {checked && <AnswerFeedback correct={correct} answer={entry.options[0]} explanation={entry.reason} />}
    {checked && !correct && <button className="secondary" onClick={() => {setAnswer(null);setChecked(false)}}>Review the concept</button>}
    {checked && correct && <button className="primary" onClick={onReady}>Continue learning</button>}
  </section>
}
export const hasPrimer = concept => Object.hasOwn(material, concept)
