import React, { useState } from 'react'
import MathText from './MathText'

const guides = {
  signed: ['Signed numbers tell you both a size and a direction from zero. On a number line, adding a positive number moves right.', 'Add the payment to the balance. If you stop to the left of zero, the result is still negative.'],
  order: ['An expression is a written calculation. Multiplication describes equal groups and is evaluated before addition.', 'Complete any parentheses first. After powers, do multiplication and division left to right, then addition and subtraction left to right.'],
  fractions: ['The denominator below the bar gives the number of equal parts in one whole. The numerator counts how many parts you have.', 'For addition or subtraction, rename fractions in equal-sized pieces first. Multiply or divide both parts of a fraction by the same nonzero number to keep the same value.'],
  decimals: ['The first place after the decimal point measures tenths. The next measures hundredths. Ten hundredths make one tenth.', 'Align the decimal points when adding. Adding a zero at the end of a decimal changes the spelling but preserves the value.'],
  percent: ['Percent means per hundred. A percentage describes a share of a specified whole.', 'Identify what 100% represents before multiplying. A 25% share of 80 is smaller than a 25% share of 200.'],
  ratio: ['A ratio compares two quantities in a given order. A proportion says that two ratios describe the same relationship.', 'Label both quantities and multiply them by the same scale factor.'],
  average: ['The arithmetic mean is what each person would have if the total were shared equally.', 'First find the total, then divide by the number of entries, including zeros.'],
  linear: ['A variable is a symbol for an unknown quantity. An equation states that both sides have the same value.', 'Apply the same operation to both sides to keep the equation balanced. Substitute the answer to check it.'],
}

const fractionSkills = [
  ['Simplify a fraction', 'Divide both counts by the same factor. Each new piece represents a group of equal smaller pieces.', '6/8 = 3/4', 'Divide the numerator and denominator by 2. The share of the whole stays the same.'],
  ['Add or subtract fractions', 'Rename the fractions so the pieces have the same size. Then add or subtract only the number of pieces.', '3/4 - 1/2 = 3/4 - 2/4 = 1/4', 'One half is two quarters, so taking away two of the three quarters leaves one quarter.'],
  ['Multiply fractions', 'Read the multiplication sign as “of.” Half of three quarters is three pieces, each half a quarter.', '1/2 × 3/4 = 3/8', 'Each half-quarter is one eighth of the original whole. Three of them make three eighths.'],
  ['Divide fractions', 'Ask how many groups of the divisor fit in the starting quantity.', '3/4 ÷ 1/8 = 6', 'Three quarters is six eighths, so six groups of one eighth fit.'],
  ['Read a mixed number', 'The whole number counts complete wholes. The fraction adds some equal pieces of the next whole.', '2 1/3 = 7/3', 'Two wholes contain six thirds. Add one more third to get seven thirds.'],
]

function FractionSkills() {
  return <div className="concept-worked">
    <h4>Explore fraction skills</h4>
    {fractionSkills.map(([title,meaning,example,reason]) => <details key={title}>
      <summary>{title}</summary><p>{meaning}</p>
      <p><MathText text={example} /></p><p>{reason}</p>
    </details>)}
  </div>
}

function FractionExplorer() {
  const [parts, setParts] = useState(4)
  const [shaded, setShaded] = useState(2)
  return <div className="fraction-explorer">
    <label>Equal pieces <input type="range" min="2" max="10" value={parts}
      onChange={event => {
        const count = Number(event.target.value)
        setParts(count)
        setShaded(value => Math.min(value,count))
      }} /> {parts}</label>
    <label>Pieces selected <input type="range" min="0" max={parts} value={shaded}
      onChange={event => setShaded(Number(event.target.value))} /> {shaded}</label>
    <div className="fraction-grid" role="img" aria-label={shaded + ' of ' + parts + ' equal pieces selected'}
      style={{ gridTemplateColumns: 'repeat(' + parts + ', minmax(0,1fr))' }}>
      {Array.from({ length: parts }, (_, i) => <span key={i} className={i < shaded ? 'shaded' : ''} />)}
    </div>
    <p><MathText text={shaded + '/' + parts + ' = ' + (shaded*2) + '/' + (parts*2)} />.
      Splitting each piece in two doubles both counts and keeps the selected area the same.</p>
  </div>
}

export default function FoundationGuide({ concept }) {
  const guide = guides[concept]
  if (!guide) return null
  return <div className="concept-worked">
    <h4>Understand the concept</h4>
    {guide.map(line => <p key={line}>{line}</p>)}
    {concept === 'fractions' && <><FractionExplorer /><FractionSkills /></>}
  </div>
}
