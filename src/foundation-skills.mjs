const exercise = (question, answer, steps, mistake) => ({ question, answer: String(answer), steps, mistake })
const lesson = (title, prerequisite, generate) => ({ title, prerequisite, generate })

export const foundationSkills = {
  'basic-arithmetic': lesson('Addition and subtraction', null, n => exercise(
    `A shelf starts with ${n} books. Add 18 and take away 7. How many remain?`, n+11,
    ['Addition combines what is already there with what is added. Subtraction takes away what leaves.',
      `Add 18 to ${n} to get ${n+18}. Subtract 7 to get ${n+11} books.`,
      `Check by adding the 7 books back. The result is ${n+18}, the total before removal.`],
    'Use the starting count as well as the books added and removed.')),
  'fraction-understanding': lesson('Understanding fractions', 'order', n => exercise(
    `A strip has ${n+3} equal pieces, and ${n} are shaded. What fraction of the strip is shaded?`, `${n}/${n+3}`,
    ['The denominator counts all equal pieces in one whole. The numerator counts the selected pieces.',
      `There are ${n+3} pieces altogether and ${n} selected. Write ${n}/${n+3}.`,
      `The three unshaded pieces and the ${n} shaded pieces make the whole.`],
    'Use all the pieces for the denominator, including the unshaded ones.')),
  'fraction-equivalent': lesson('Equivalent fractions', 'fraction-understanding', n => exercise(
    `What missing numerator makes ${n}/${n+1} equal to x/${3*(n+1)}?`, 3*n,
    ['Equivalent fractions select the same part of a whole. Cutting each piece into smaller equal pieces changes both counts.',
      `The denominator tripled from ${n+1} to ${3*(n+1)}, so triple the numerator from ${n} to ${3*n}.`,
      `Divide both new counts by 3 to recover ${n}/${n+1}.`],
    'Apply the scale factor to both counts.')),
  'fraction-simplify': lesson('Simplifying fractions', 'fraction-equivalent', n => exercise(
    `Reduce ${2*n}/${2*(n+1)} to lowest terms, then enter its numerator.`, n,
    ['Reducing groups the pieces into larger equal units. Divide both counts by their greatest common factor.',
      `Both counts are even, so divide both by 2 to get ${n}/${n+1}.`,
      `The numbers ${n} and ${n+1} differ by one. They have no common whole-number factor greater than 1.`],
    'Enter the numerator of the reduced fraction.')),
  'fraction-common-denominator': lesson('Common denominators', 'fraction-equivalent', n => exercise(
    `Find the least common denominator for 1/2 and 1/${2*n+1}.`, 2*(2*n+1),
    ['A common denominator is a multiple of both original denominators.',
      `${2*n+1} is odd. The first even multiple of it is twice that number, or ${2*(2*n+1)}.`,
      `The result divides exactly by 2 and by ${2*n+1}. No smaller positive multiple of ${2*n+1} is even.`],
    'The least common denominator is not always the product. Here one denominator is 2 and the other is odd.')),
  'fraction-subtract': lesson('Subtracting fractions', 'fractions', n => exercise(
    `Calculate 3/4 - 1/${4*n}.`, `${3*n-1}/${4*n}`,
    ['Subtraction requires pieces of the same size. Split each quarter into the same number of smaller pieces.',
      `Rename 3/4 as ${3*n}/${4*n}. Take away one of those pieces to get ${3*n-1}/${4*n}.`,
      `Add 1/${4*n} back to get ${3*n}/${4*n}, which equals 3/4.`],
    'After matching denominators, subtract the numerators only.')),
  'fraction-multiply': lesson('Multiplying fractions', 'fraction-simplify', n => exercise(
    `Calculate 2/3 × ${n}/${n+1}.`, `${2*n}/${3*(n+1)}`,
    ['Multiplying fractions finds a share of a share. Split each selected piece into three parts and keep two.',
      `There are ${n} selected pieces. Keeping two thirds of each gives ${2*n} new pieces out of ${3*(n+1)}.`,
      `The product is smaller than ${n}/${n+1}, as expected when taking only two thirds of it.`],
    'Multiplication works by splitting pieces and does not require a common denominator.')),
  'fraction-divide': lesson('Dividing fractions', 'fraction-multiply', n => exercise(
    `Calculate ${n}/${n+2} ÷ 1/3.`, `${3*n}/${n+2}`,
    ['Dividing by one third asks how many thirds fit. Three thirds fit in each whole.',
      `Multiply ${n}/${n+2} by 3, the number of thirds in one whole, to get ${3*n}/${n+2}.`,
      `Multiply the result by 1/3 and recover the starting value.`],
    'Dividing by one third makes the result three times as large.')),
  'fraction-mixed': lesson('Improper fractions and mixed numbers', 'fraction-understanding', n => exercise(
    `Write ${n} 2/5 as an improper fraction.`, `${5*n+2}/5`,
    ['A mixed number combines whole units and part of another whole. Each whole contains five fifths.',
      `Convert ${n} wholes to ${5*n} fifths. Add 2 fifths to get ${5*n+2}/5.`,
      `Dividing ${5*n+2} by 5 gives ${n} whole groups with 2 fifths left.`],
    'Convert the whole number into fifths before adding the two fifths.')),
  'fraction-word': lesson('Fraction word problems', 'fraction-multiply', n => exercise(
    `A container holds ${4*n+4} liters when full. It is three quarters full. How many liters does it hold now?`, 3*(n+1),
    ['The capacity is the whole. Three quarters means three of four equal groups, measured in liters.',
      `Divide ${4*n+4} liters by 4 to get ${n+1} liters in one quarter. Multiply by 3 to get ${3*(n+1)} liters.`,
      `Add the missing ${n+1} liters to recover the full capacity.`],
    'Divide the capacity into equal parts before counting how many are filled.')),
  'fraction-review': lesson('Mixed fraction practice', 'fraction-word', n => {
    const add = n % 2 === 0
    const top = 3*n + (add ? 2 : -2)
    return exercise(
      `Calculate 3/5 ${add ? '+' : '-'} 2/${5*n}.`, `${top}/${5*n}`,
      ['First identify the operation and the size of the pieces. Both operations here need a common denominator.',
        `Rename 3/5 as ${3*n}/${5*n}. ${add ? 'Add' : 'Subtract'} 2 pieces to get ${top}/${5*n}.`,
        `Reverse the operation with 2/${5*n} to check that you return to 3/5.`],
      'Read the plus or minus sign before changing the number of pieces.')
  }),
  'deductive-counterexample': lesson('Counterexamples', 'syllogism', n => {
    const others = 1 + Math.floor(n/10)
    return exercise(
      `Of ${n+others} library members, ${n} are volunteers. How many members can serve as counterexamples to “All members are volunteers”?`, others,
      ['A counterexample is one case that makes a claim false. Look for members who are outside the volunteer group.',
        `Subtract the ${n} volunteers from the ${n+others} members. The ${others} remaining members are counterexamples.`,
        `Add the ${others} non-volunteers to the ${n} volunteers to verify the membership count.`],
      'A counterexample must be a member and also fail to be a volunteer.')
  }),
}
