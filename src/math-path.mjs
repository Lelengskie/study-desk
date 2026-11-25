export const analyticalConcepts = new Set(['sequence', 'venn', 'syllogism', 'arrangement', 'sufficiency'])
export const firstSeed = 2
export const lastSeed = 999

// A seed is persisted with its skill. Existing seed values retain their original meaning.
const decimalPlaces = n => n < 10 ? 1 : String(n).length
const lesson = (title, prerequisite, generate) => ({ title, prerequisite, generate })

// Each explanation is generated from the same bounded integers as its question.
export const mathPath = {
  signed: lesson('Signed arithmetic', null, n => ({
    question: `A balance of −${n + 3} pesos increases by 3 pesos. What is the new balance in pesos?`,
    answer: String(-n),
    steps: ['A negative balance means you owe money. An increase moves right on the number line.', `Start at −${n + 3} and move 3 places right. You still owe ${n} pesos, so the balance is −${n}.`, `Check by subtracting the increase. −${n} − 3 = −${n + 3}.`],
    mistake: 'Keep the negative sign when the amount owed exceeds the payment.',
  })),
  order: lesson('Order of operations', 'signed', n => ({
    question: `Calculate ${n} + 2 × 3.`, answer: String(n + 6),
    steps: ['Multiplication groups equal quantities. Complete that operation before adding.', `2 × 3 = 6, so ${n} + 6 = ${n + 6}.`, `Check by expanding the multiplication into ${n} + 3 + 3.`],
    mistake: 'Adding the first two numbers would change which quantities the multiplication groups.',
  })),
  fractions: lesson('Adding fractions', 'order', n => ({
    question: `Calculate 1/2 + 1/${2 * n}.`, answer: `${n + 1}/${2 * n}`,
    steps: ['The denominator gives the number of equal pieces in a whole. Addition requires pieces of the same size.', `Each half equals ${n} pieces of size 1/${2 * n}. Add one more piece to get ${n + 1}/${2 * n}.`, `Check by subtracting one piece. ${n}/${2 * n} is exactly one half.`],
    mistake: 'Adding denominators changes the size of the pieces.',
  })),
  decimals: lesson('Decimals and place value', 'fractions', n => {
    const places = decimalPlaces(n)
    const denominator = 10 ** (places + 1)
    const left = `0.${n}`
    const right = `0.${'0'.repeat(places)}5`
    return {
      question: `Calculate ${left} + ${right}.`,
      answer: `${10*n+5}/${denominator}`,
      steps: [`Each place to the right of the decimal point is worth one tenth of the previous place. Turn both numbers into parts of size 1/${denominator} before adding.`,
        `${left} has ${10*n} of those parts. Add the 5 parts in ${right} to get ${10*n+5}/${denominator}.`,
        `Subtract 5 of those parts to get ${10*n}/${denominator}, which equals ${left}.`],
      mistake: 'Line up decimal points so the same place values are added.',
    }
  }),
  percent: lesson('Percentages', 'decimals', n => ({
    question: `What is 25% of ${4 * n} pesos?`, answer: String(n),
    steps: ['Percent means out of 100. The fraction 25/100 simplifies to 1/4.', `Divide ${4 * n} pesos into four equal groups. Each group contains ${n} pesos.`, `Check that four groups of ${n} make the original ${4 * n} pesos.`],
    mistake: 'The percentage describes a share of the starting amount.',
  })),
  ratio: lesson('Ratios and proportions', 'percent', n => ({
    question: `A recipe uses 2 cups of rice for every 3 cups of water. How many cups of water go with ${2 * n} cups of rice?`, answer: String(3 * n),
    steps: ['A ratio gives a fixed pairing. Every group uses 2 cups of rice and 3 cups of water.', `Divide ${2 * n} by 2 to find ${n} groups. Use ${n} × 3 = ${3 * n} cups of water.`, `Divide both amounts by ${n} to recover the ratio 2 to 3.`],
    mistake: 'Multiply both quantities by the same factor to preserve the ratio.',
  })),
  linear: lesson('Linear equations', 'ratio', n => ({
    question: `Find x if 3x + 4 = ${3 * n + 4}.`, answer: String(n),
    steps: ['The symbol x is the unknown. The expression 3x means three times x.', `Subtract 4 from both sides to keep the equation balanced. This gives 3x = ${3 * n}. Divide both sides by 3 to get x = ${n}.`, `Substitute ${n}. Three times ${n} plus four equals ${3 * n + 4}.`],
    mistake: 'Apply the same operation to both sides of the equation.',
  })),
  average: lesson('Arithmetic averages', 'ratio', n => ({
    question: `Find the average of ${n}, ${n + 2} and ${n + 7}.`, answer: String(n + 3),
    steps: ['The average is the amount each entry would have if the total were shared equally.', `Add the entries to get ${3 * n + 9}. Divide by the 3 entries to get ${n + 3}.`, `Check that three copies of ${n + 3} total ${3 * n + 9}.`],
    mistake: 'Divide by the number of entries, including any zero entries.',
  })),
  speed: lesson('Distance, speed and time', 'linear', n => {
    const hours = n < 10 ? n : 1 + (n-10)%12
    const rate = n < 10 ? 35 : 40 + Math.floor((n-10)/12)
    return {
      question: `How far in kilometers does a vehicle travel in ${hours} hours at a constant ${rate} kilometers per hour?`,
      answer: String(hours*rate),
      steps: [`A speed of ${rate} kilometers per hour means ${rate} kilometers are covered in each hour.`,
        `Multiply ${hours} hours by ${rate} kilometers per hour to get ${hours*rate} kilometers. The hours cancel.`,
        `Divide the distance by ${hours} hours to recover ${rate} kilometers per hour.`],
      mistake: 'Convert the travel time to hours before using a speed measured per hour.',
    }
  }),
  sequence: lesson('Arithmetic sequences', 'order', n => ({
    question: `The sequence ${n}, ${n + 4}, ${n + 8} keeps increasing by the same amount. What comes next?`, answer: String(n + 12),
    steps: ['The common difference is the amount added at each step.', `Subtract ${n} from ${n + 4} to get 4. Add 4 to ${n + 8} to get ${n + 12}.`, `Check that ${n + 12} minus ${n + 8} equals 4.`],
    mistake: 'Use the difference between neighboring terms.',
  })),
  age: lesson('Age problems', 'linear', n => {
    const younger = n < 10 ? n : 10 + (n-10) % 40
    const gap = n < 10 ? 4 : 1 + Math.floor((n-10)/40)
    const total = 2*younger+gap
    return {
      question: `Two relatives are ${gap} years apart. Their ages add to ${total}. How old is the younger relative?`,
      answer: String(younger),
      steps: ['Let x be the younger age. Add the age gap to get the older age.',
        `Their sum is 2x + ${gap}. Subtract ${gap} from both sides to remove the age gap. Divide ${2*younger} by 2 because the remaining amount is two copies of the younger age.`,
        `Check that ${younger} plus ${younger+gap} gives ${total} and that the difference is ${gap} years.`],
      mistake: 'Remove the age gap before dividing the shared amount by two.',
    }
  }),
  work: lesson('Combined work rates', 'fractions', n => ({
    question: `One person takes ${2 * n} hours to complete a job. A second takes ${2 * n} hours. How many hours will they take together at constant rates?`, answer: String(n),
    steps: ['Find each hourly rate as a fraction of one job.', `Each person completes 1/${2 * n} of the job in one hour. Together they do 2/${2 * n}, or 1/${n}, per hour. That takes ${n} hours.`, `After ${n} hours each person has finished half the job, so together they finish one whole job.`],
    mistake: 'Add the rates. Adding the times would give the wrong quantity.',
  })),
  discount: lesson('Discounts', 'percent', n => ({
    question: `An item costs ${100 * n} pesos before a 10% discount. What is the sale price in pesos?`, answer: String(90 * n),
    steps: ['A discount is money taken off the listed price. Ten percent means one tenth.', `Divide ${100 * n} by 10 to find the discount of ${10 * n} pesos. Subtract it to get ${90 * n} pesos.`, `Add the discount back to the sale price to recover ${100 * n} pesos.`],
    mistake: 'A commission question usually asks for the percentage amount earned. This question asks for the price after subtracting the discount.',
  })),
  interest: lesson('Simple interest', 'percent', n => ({
    question: `Find the simple interest in pesos on ${100 * n} pesos at 5% per year for two years.`, answer: String(10 * n),
    steps: ['Simple interest uses the starting amount each year. Five percent is 5/100.', `Multiply ${100 * n} by 5/100 to get ${5 * n} pesos per year. Multiply by two years to get ${10 * n} pesos.`, `Divide ${10 * n} by two to recover the yearly interest.`],
    mistake: 'The interest is the amount earned. The ending balance includes the starting amount too.',
  })),
  area: lesson('Rectangle area', 'order', n => ({
    question: `A rectangle is 3 cm wide and ${n} cm long. What is its area in square centimeters?`, answer: String(3 * n),
    steps: ['Area counts the unit squares that cover a surface.', `Arrange ${n} squares in each of 3 rows. This gives ${n} × 3 = ${3 * n} square centimeters.`, `Divide the square count by 3 rows to recover the length of ${n} cm.`],
    mistake: `Perimeter measures the boundary. Adding its four sides gives ${2 * (n + 3)} cm, a different quantity.`,
  })),
  commission: lesson('Sales commissions', 'percent', n => ({
    question: `A salesperson earns 5% commission on ${100*n} pesos in sales. How many pesos do they earn as commission?`,
    answer: String(5*n),
    steps: ['Commission is the part of a sale paid to the salesperson. Five percent is 5 out of 100.',
      `There are ${n} groups of 100 pesos in the sales total. Each earns 5 pesos, so the commission is ${5*n} pesos.`,
      `Multiply the commission by 20. That reverses taking one twentieth and gives ${100*n} pesos.`],
    mistake: 'Use total sales to calculate the commission. Report only the amount earned.',
  })),
  perimeter: lesson('Rectangle perimeter', 'area', n => ({
    question: `A rectangle is ${n} cm long and 3 cm wide. What is the distance around it in centimeters?`,
    answer: String(2*(n+3)),
    steps: ['The perimeter is the length around the boundary. Opposite sides of a rectangle have equal lengths.',
      `Add two lengths and two widths. ${n} + 3 + ${n} + 3 = ${2*(n+3)} cm.`,
      `Halve the perimeter to get ${n+3} cm, the sum of one length and one width.`],
    mistake: 'Multiplying width by length gives square centimeters and measures area.',
  })),
  venn: lesson('Venn diagrams and overlap', 'order', n => ({
    question: `A class has ${n+6} readers of comics and ${n+4} readers of mysteries. ${n} read both. How many read at least one?`,
    answer: String(n+10),
    steps: ['A Venn diagram uses overlapping circles for groups. Readers in the overlap are counted in both group totals.',
      `Add the totals, then subtract the ${n} readers counted twice. ${n+6} + ${n+4} − ${n} = ${n+10}.`,
      `The three regions contain 6 comic-only readers, ${n} readers of both and 4 mystery-only readers. Together they total ${n+10}.`],
    mistake: 'Subtract each shared reader once so that reader is still included.',
  })),
  syllogism: lesson('Syllogisms and deductions', 'venn', n => ({
    question: `All ${n} club volunteers are members, and every member has a badge. How many of the volunteers must have badges?`,
    answer: String(n),
    steps: ['“All” means that there are no exceptions in the named group. Place volunteers inside the group of members.',
      'Every member is inside the group of badge holders. Since volunteers are members, they are inside that group too.',
      `Check one volunteer at a time. Each of the ${n} must have a badge, even if some badge holders are outside the club.`],
    mistake: 'The rules do not let you conclude that every badge holder is a volunteer.',
  })),
  arrangement: lesson('Logical arrangements', 'order', n => ({
    question: `In a queue, Kai is at position ${n}. Mo is two places after Kai. Lin is one place before Mo. What is Lin’s position?`,
    answer: String(n+1),
    steps: ['Give every person a position. “After” increases the position number and “before” decreases it.',
      `Move from position ${n} to ${n+2} to place Mo. Subtract one to place Lin at ${n+1}.`,
      `Check the order. Positions ${n}, ${n+1}, and ${n+2} place Kai before Lin and Lin immediately before Mo.`],
    mistake: 'Draw the queue from front to back. Apply each relationship to the person it names.',
  })),
  sufficiency: lesson('Data sufficiency', 'linear', n => {
    const target = n % 2 ? 'x' : 'y'
    return {
    question: `You need to find ${target}. Statement 1 says x + y = ${2*n+1}. Statement 2 says y = ${n+1}. Enter 1 if only statement 1 is sufficient, 2 if only statement 2 is sufficient, or 3 if both are needed.`,
    answer: n % 2 ? '3' : '2',
    steps: [`Statement 1 gives a sum. The pairs (${n}, ${n+1}) and (${n-1}, ${n+2}) both satisfy it, so it does not fix ${target}.`,
      n % 2 ? 'Statement 2 fixes y only. Alone, it gives no relationship to x.' : `Statement 2 directly gives y = ${n+1}.`,
      n % 2 ? `Together, substitute y into the sum. Subtract ${n+1} from both sides to isolate x = ${n}. Both statements are needed.` : 'Statement 2 alone answers the question. The sum is unnecessary.'],
    mistake: 'Test each statement alone before combining them.',
    }
  }),
}
