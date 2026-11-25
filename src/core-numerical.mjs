const build = (title, prerequisite, generate) => ({ title, prerequisite, generate })
const exercise = (question, answer, steps, mistake) => ({ question, answer: String(answer), steps, mistake })

export const coreNumerical = {
  'whole-subtract': build('Whole-number subtraction', 'basic-arithmetic', n => {
    const removed = 2+n%8
    const start = n+removed
    return exercise(`There are ${start} forms. A clerk files ${removed}. How many forms remain unfiled?`, n,
      [`Start with ${start} forms. Filing takes ${removed} out of the unfiled group, so subtract.`,
        `Calculate ${start} − ${removed} = ${n} forms.`,
        `Check using addition. ${n} unfiled plus ${removed} filed equals the original ${start}.`],
      'Subtract the filed count from the starting count. The remaining count is smaller than the start.')
  }),
  'whole-multiply': build('Whole-number multiplication', 'basic-arithmetic', n => {
    const size = 2 + n % 8
    return exercise(`There are ${n} packets of ${size} labels. How many labels are there?`, n * size,
      ['Multiplication counts equal groups. Each packet contributes the same number of labels.',
        `Multiply the number of packets by labels per packet. ${n} × ${size} = ${n * size} labels.`,
        `Check by dividing ${n * size} labels into groups of ${size}. There are ${n} packets.`],
      'Adding the two given numbers counts only the packets plus one packet’s labels.')
  }),
  'whole-divide': build('Whole-number division', 'whole-multiply', n => {
    const size = 2 + n % 9
    return exercise(`Share ${n * size} cards equally among ${size} learners. How many cards does each learner get?`, n,
      ['Equal sharing is division. The dividend is the total and the divisor is the number of learners.',
        `Calculate ${n * size} ÷ ${size} = ${n} cards per learner.`,
        `Check: ${size} learners with ${n} cards each have ${size * n} cards in all.`],
      'The divisor is the number of groups here. The answer is the size of each group.')
  }),
  'percent-change': build('Percentage change', 'percent', n => {
    const change = n % 2 ? 1 : -1
    const newPrice = (100 + 5 * change) * n
    return exercise(`A price of ₱${100 * n} ${change > 0 ? 'increases' : 'decreases'} by 5%. What is the new price in pesos?`, newPrice,
      [`Five percent means 5 per 100 of the original price. The original contains ${n} hundreds, so the change is ₱${5 * n}.`,
        `${change > 0 ? 'Add' : 'Subtract'} the change because the price ${change > 0 ? 'rises' : 'falls'}. ${100 * n} ${change > 0 ? '+' : '−'} ${5 * n} = ${newPrice} pesos.`,
        `The difference is ${5 * n} pesos. Dividing it by the original ${100 * n} pesos gives 5/100.`],
      'Calculate the percentage from the original price, then apply the change in the stated direction.')
  }),
  'compound-interest': build('Compound interest', 'interest', n => {
    const rate = n % 2 ? 1 : 2
    const factor = 100 + rate
    return exercise(`A deposit of ₱${10000 * n} earns ${rate}% annually, compounded once per year. What is the balance after two years in pesos?`, n * factor ** 2,
      [`The factor ${factor}/100 includes the starting balance and the new interest.`,
        `After year one, multiply ₱${10000 * n} by ${factor}/100 to get ₱${100 * n * factor}.`,
        `In year two, apply the factor to that new balance. ${100 * n * factor} × ${factor}/100 = ₱${n * factor ** 2}.`,
        'Check that second-year interest is greater than first-year interest because the balance grew.'],
      'The second year earns interest on the first year’s interest as well as the original deposit.')
  }),
  'multi-equation': build('Multi-step equations', 'linear', n => {
    const scale = 2 + n % 5
    const left = n + 4
    const right = left * scale
    return exercise(`Solve for x: ${scale}(x + 4) − 3 = ${right - 3}.`, n,
      [`Add 3 to both sides to reverse the subtraction. The right side becomes ${right}.`,
        `Divide both sides by ${scale} to leave x + 4 = ${left}.`,
        `Subtract 4 from both sides. x = ${n}.`,
        `Check by substituting ${n}. The left side becomes ${scale} × ${left} − 3 = ${right - 3}.`],
      'When working from the outside of the expression, undo the subtraction before dividing.')
  }),
  volume: build('Volume of a rectangular box', 'area', n => {
    const height = 2 + n % 5
    return exercise(`A box has inside dimensions ${n} cm by 3 cm by ${height} cm. What is its volume in cubic centimeters?`, n * 3 * height,
      [`A 1 cm layer has ${n} × 3 = ${3 * n} square centimeters of base area.`,
        `Stack ${height} layers of that size. Each square centimeter in each layer represents one cubic centimeter.`,
        `Compute ${3 * n} × ${height} = ${3 * n * height} cubic centimeters.`],
      'Area uses two dimensions. Volume also includes the height.')
  }),
  'measurement-conversion': build('Measurement conversions', 'whole-multiply', n => {
    const reverse = n % 2 === 0
    return exercise(reverse ? `Convert ${100 * n} centimeters to meters.` : `Convert ${n} meters to centimeters.`, reverse ? n : 100 * n,
      ['One meter equals 100 centimeters. The same length has a larger numerical value in the smaller unit.',
        reverse ? `Each group of 100 centimeters is a meter. ${100 * n} ÷ 100 = ${n} meters.` : `${n} groups of 100 centimeters equal ${100 * n} centimeters.`,
        `Check by pairing ${n} m with ${100 * n} cm using the same equality.`],
      'Check the direction before choosing multiplication or division.')
  }),
  'simple-probability': build('Single-draw probability', 'fraction-understanding', n => {
    const other = 2 + n % 7
    return exercise(`A bag contains ${n} blue counters and ${other} white counters. One counter is drawn at random. What fraction represents the probability of drawing a blue counter?`, `${n}/${n + other}`,
      ['Each counter is equally likely. Favorable outcomes are the blue counters.',
        `There are ${n} favorable choices and ${n} + ${other} = ${n + other} possible choices.`,
        `Divide favorable outcomes by all possible outcomes to get ${n}/${n + other}. It is between zero and one.`],
      'Include both blue and white counters in the denominator.')
  }),
  'factor-pairs': build('Factors and multiples', 'whole-divide', n => {
    const factor = 2+n%7
    return exercise(`The number ${factor*n} is a multiple of ${factor}. Find the other factor in this pair.`, n,
      ['A factor divides a number exactly. A pair of factors multiplies to give that number.',
        `Divide the product by the known factor. ${factor*n} ÷ ${factor} = ${n}.`,
        `Check by multiplying the factors. ${factor} × ${n} = ${factor*n}.`],
      'The product is the multiple. Each of the two numbers multiplied is a factor.')
  }),
  'gcf-lcm': build('Greatest common factor and least common multiple', 'factor-pairs', n => {
    const gcf = n%2 === 0
    return exercise(`Find the ${gcf ? 'greatest common factor' : 'least common multiple'} of ${3*n} and ${5*n}.`, gcf ? n : 15*n,
      [`Both numbers contain a factor of ${n}. The remaining factors are 3 and 5, which share no factor greater than 1.`,
        gcf ? `The only shared portion of the prime factors is the factor ${n}. So the greatest common factor is ${n}.`
          : `A common multiple needs both the extra factor 3 and the extra factor 5. Multiply ${n} × 3 × 5 = ${15*n}.`,
        gcf ? `Dividing the two original numbers by ${n} leaves 3 and 5 with no further common factor.`
          : `${15*n} ÷ ${3*n} = 5 and ${15*n} ÷ ${5*n} = 3. Neither 3 nor 5 can be dropped while keeping both divisibilities.`],
      'A common factor divides both inputs. A common multiple can be divided by both inputs.')
  }),
  'fraction-decimal': build('Fraction to decimal conversion', 'decimals', n => {
    const denominator = n%2 === 0 ? 10 : 100
    return exercise(`Write ${n}/${denominator} as a decimal.`, `${n}/${denominator}`,
      [`The denominator ${denominator} says how many equal parts make one unit. The numerator counts those parts.`,
        `Divide ${n} by ${denominator}. Moving the decimal point ${denominator===10 ? 'one place' : 'two places'} left makes the value ${n/denominator}.`,
        `Check by multiplying the decimal by ${denominator}. The result is the original numerator, ${n}.`],
      'Dividing by 10 or 100 makes the value smaller. Moving the decimal point right would make it larger.')
  }),
  'algebra-expression': build('Substitution in algebraic expressions', 'order', n => {
    const multiply = 2+n%4
    return exercise(`Evaluate ${multiply}x + 3 when x = ${n}.`, multiply*n+3,
      ['A variable is a symbol for a value. A number written next to x multiplies x.',
        `Replace x with ${n}. Calculate the product first: ${multiply} × ${n} = ${multiply*n}.`,
        `Then add 3: ${multiply*n} + 3 = ${multiply*n+3}. Subtracting 3 recovers the product.`],
      'The multiplier belongs to x alone. Adding first would change the expression.')
  }),
  'counting-pairs': build('Counting combinations of choices', 'whole-multiply', n => {
    const options = 2+n%5
    return exercise(`A form has ${n} possible cover designs and ${options} paper colors. Each design can use any color. How many distinct design-color pairs are possible?`, n*options,
      ['Separate the choices into two stages. Each cover design can pair with every paper color.',
        `Each design contributes ${options} new pairs. Multiply ${n} × ${options} = ${n*options} pairs.`,
        `Check by reversing the count: each of the ${options} colors appears in ${n} pairs.`],
      'Adding the choices counts individual designs and colors. The question asks for complete pairs.')
  }),
}
