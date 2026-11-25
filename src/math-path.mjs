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
  decimals: lesson('Decimals and place value', 'fractions', n => ({
    question: `Calculate 0.${n} + 0.05.`, answer: `${10 * n + 5}/100`,
    steps: ['The first digit after the decimal point counts tenths. The second counts hundredths.', `0.${n} is ${10 * n} hundredths. Add 5 hundredths to get ${10 * n + 5} hundredths.`, `Check by subtracting 5 hundredths to recover ${10 * n} hundredths.`],
    mistake: 'Line up decimal points so the same place values are added.',
  })),
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
  speed: lesson('Distance, speed and time', 'linear', n => ({
    question: `How far in kilometers does a vehicle travel in ${n} hours at a constant 35 kilometers per hour?`, answer: String(35 * n),
    steps: ['A speed of 35 kilometers per hour means 35 kilometers are covered in each hour.', `Multiply ${n} hours by 35 kilometers per hour to get ${35 * n} kilometers. The hours cancel.`, `Divide the distance by ${n} hours to recover 35 kilometers per hour.`],
    mistake: 'Convert the travel time to hours before using a speed measured per hour.',
  })),
  sequence: lesson('Arithmetic sequences', 'order', n => ({
    question: `The sequence ${n}, ${n + 4}, ${n + 8} keeps increasing by the same amount. What comes next?`, answer: String(n + 12),
    steps: ['The common difference is the amount added at each step.', `Subtract ${n} from ${n + 4} to get 4. Add 4 to ${n + 8} to get ${n + 12}.`, `Check that ${n + 12} minus ${n + 8} equals 4.`],
    mistake: 'Use the difference between neighboring terms.',
  })),
  age: lesson('Age problems', 'linear', n => ({
    question: `Two siblings are 4 years apart. Their ages add to ${2 * n + 4}. How old is the younger sibling?`, answer: String(n),
    steps: ['Let x be the younger age. The older age is x plus four.', `Their sum is 2x + 4. Subtract 4 from ${2 * n + 4}, then divide ${2 * n} by 2 to get ${n} years.`, `Check that ${n} plus ${n + 4} gives the stated total and the ages differ by 4.`],
    mistake: 'The older sibling is four years older than the younger sibling.',
  })),
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
}
