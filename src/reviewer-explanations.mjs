import { equivalentNumber } from './practice-response.mjs'
import { manualFractionExplanation } from './manual-fractions.mjs'

function percentRule(prompt, expected) {
  const direct = /^(?:what is )?(\d{1,3})\s*% of ([\d,]{1,11})(?: is equal to)?[?.]?$/i.exec(prompt)
  const inverse = /^(\d{1,3})\s*% of what number is ([\d,]{1,11})[?.]?$/i.exec(prompt)
  const reversed = /^([\d,]{1,11}) is (\d{1,3})\s*% of what number[?.]?$/i.exec(prompt)
  if (!direct && !inverse && !reversed) return null
  const [rateText, amountText] = reversed ? [reversed[2], reversed[1]] : (direct ?? inverse).slice(1)
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(amountText)) return null
  if (!/^[+-]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?$|^[+-]?(?:\d*\.\d+|\d+\s*\/\s*\d+)$/.test(expected)) return null
  const rate = BigInt(rateText), amount = BigInt(amountText.replaceAll(',', ''))
  if (!direct && rate === 0n) return null
  const fraction = direct ? [rate * amount, 100n] : [amount * 100n, rate]
  if (!equivalentNumber(expected.replaceAll(',', ''), fraction.join('/'))) return null
  return direct
    ? { explanation: 'Percent means per 100. Divide ' + amount + ' by 100 to find 1%, then multiply that amount by ' + rate + '. Together those steps give ' + amount + ' × ' + rate + '/100 = ' + expected + '.',
        shortcut: rate % 10n === 0n ? 'Divide by 10 to find 10%, then multiply by ' + rate / 10n + '.' : undefined }
    : { explanation: 'The given amount ' + amount + ' represents ' + rate + ' percentage points. Divide ' + amount + ' by ' + rate + ' to find 1%, then multiply by 100 to recover the whole: ' + expected + '.' }
}

function fractionProduct(prompt, expected) {
  const match = /^(?:calculate |compute )?(\d{1,6})\s*\/\s*(\d{1,6})\s*([×x÷])\s*(\d{1,6})\s*\/\s*(\d{1,6})\s*(?:=\s*_*)?[?.]?$/iu.exec(prompt)
  if (!match) return null
  const [a,b,c,d] = [match[1],match[2],match[4],match[5]].map(BigInt)
  const division = match[3] === '÷'
  if (!b || !d || division && !c) return null
  const product = (division ? [a*d,b*c] : [a*c,b*d]).join('/')
  if (!equivalentNumber(expected, product)) return null
  const rule = division
    ? 'Dividing by ' + c + '/' + d + ' is the same as multiplying by its reciprocal, ' + d + '/' + c + '. This counts how many portions of size ' + c + '/' + d + ' fit into ' + a + '/' + b + '.'
    : 'Multiply the numerators and multiply the denominators. Multiplication here means taking one fractional part of another.'
  return { explanation: rule + ' The product is ' + product + ', which is equal to ' + expected + '.',
    shortcut: 'Cancel common factors between a numerator and a denominator before multiplying.' }
}

function letterStep(prompt, expected) {
  const match = /^(?:(?:which comes next|which is the next letter in the pattern|identify the next letter in the series|continue the sequence|sequence)[:?]\s*)?([A-Z](?:\s*,\s*[A-Z]){3,9})\s*,?\s*(?:…|\.\.\.|_+)?\s*\??$/i.exec(prompt)
  if (!match || !/^[a-z]$/i.test(expected)) return null
  const positions = match[1].toUpperCase().split(/\s*,\s*/).map(letter => letter.charCodeAt(0) - 64)
  const step = positions[1] - positions[0]
  const next = positions.at(-1) + step
  if (!step || !positions.every((value, index) => value === positions[0] + step * index)
    || next < 1 || next > 26 || String.fromCharCode(64 + next) !== expected.toUpperCase()) return null
  return { explanation: 'Use alphabet positions: ' + positions.join(', ') + '. They ' + (step > 0 ? 'increase' : 'decrease')
    + ' by ' + Math.abs(step) + ' each time. Apply that step again to reach position ' + next + ', or ' + expected.toUpperCase() + '.' }
}

function commonFactor(prompt, expected) {
  const match = /^(?:find|what is|compute) the (?:greatest|highest) common (?:factor|divisor) of (\d{1,7}) and (\d{1,7})[?.]?(?: \[[A-Z ]+\])?$/i.exec(prompt)
  if (!match) return null
  let [a,b] = match.slice(1).map(BigInt).sort((x,y) => x < y ? 1 : x === y ? 0 : -1)
  if (!b) return null
  const steps = []
  while (b) {
    steps.push(a + ' = ' + b + ' × ' + a/b + ' + ' + a%b)
    const remainder = a % b
    a = b
    b = remainder
  }
  if (!equivalentNumber(expected, String(a))) return null
  return { explanation: 'A common factor of two numbers also divides their difference. Keep replacing the larger number with the remainder until the division is exact.\n'
    + steps.join('\n') + '\nThe last nonzero divisor, ' + a + ', is the greatest common factor.' }
}

function numericFiling(prompt, expected) {
  const match = /^(?:numerical|ascending numerical filing):\s*((?:\([1-9]\)\s*\d+(?:\.\d+)?\s*){3,6})\.?$/i.exec(prompt)
  if (!match) return null
  const entries = [...match[1].matchAll(/\(([1-9])\)\s*(\d+(?:\.\d+)?)/g)]
    .map(([, label, value]) => ({label,value, number: Number(value)}))
  if (entries.some(entry => entry.value.length > 12 || !Number.isFinite(entry.number))
    || new Set(entries.map(entry => entry.number)).size !== entries.length
    || new Set(entries.map(entry => entry.label)).size !== entries.length) return null
  const sorted = entries.sort((a,b) => a.number - b.number)
  if (expected.replace(/\s/g, '') !== sorted.map(entry => entry.label).join(',')) return null
  return { explanation: 'Compare the numeric values in ascending order. For decimals, append zeros on the right if that makes place values easier to compare. The values are '
    + sorted.map(entry => entry.value).join(' < ') + ', so their filing order is ' + sorted.map(entry => entry.label).join(', ') + '.' }
}

const rules = [
  ['fraction_sum', manualFractionExplanation], ['fraction_product', fractionProduct],
  ['percent', percentRule], ['letter_step', letterStep],
  ['common_factor', commonFactor], ['numeric_filing', numericFiling],
]

function invariantPlural(prompt, expected) {
  if (!/^sheep[.!]?$/i.test(expected) || !(/\bplural\b/i.test(prompt) && /\bsheep\b/i.test(prompt))
    && !/\bflock of _{2,}\b|\bflock of _{2,} /i.test(prompt)) return null
  return { explanation: 'Sheep has the same singular and plural form: one sheep, five sheep. Do not add -s or -es. Deer and species follow the same pattern: one deer, five deer; one species, five species.' }
}

export function reviewerExplanation(stem, answer) {
  if (typeof stem !== 'string' || typeof answer !== 'string' || !answer.trim() || stem.includes('�')) return null
  const prompt = stem.trim().replace(/\s+/g, ' ').replace(/[¼½¾]/g, value => ({'¼':'1/4','½':'1/2','¾':'3/4'})[value])
  for (const [method, explain] of rules) {
    const result = explain(prompt, answer.trim())
    if (result) return { ...result, method }
  }
  const plural = invariantPlural(prompt, answer.trim())
  if (plural) return { ...plural, method: 'invariant_plural' }
  return null
}
