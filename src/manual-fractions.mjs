import { equivalentNumber } from './practice-response.mjs'

function gcd(a,b) {
  a = a < 0n ? -a : a
  while (b) [a,b] = [b,a%b]
  return a
}

export function manualFractionExplanation(prompt, expected) {
  const match = /^(?:(?:calculate|evaluate|simplify|compute|what is)\s+)?\s*([+-]?\d{1,6})\s*\/\s*(\d{1,6})\s*([+−-])\s*([+-]?\d{1,6})\s*\/\s*(\d{1,6})\s*(?:[?.]|=\s*\??)?$/iu.exec(prompt ?? '')
  if (!match || typeof expected !== 'string') return null
  const [a,b,c,d] = [match[1],match[2],match[4],match[5]].map(BigInt)
  if (!b || !d) return null
  const plus = match[3] === '+'
  const sign = plus ? '+' : '−'
  const verb = plus ? 'Add' : 'Subtract'
  const common = b/gcd(b,d)*d
  const left = a*(common/b)
  const right = c*(common/d)
  const raw = plus ? left+right : left-right
  const factor = gcd(raw,common)
  const answer = `${raw/factor}/${common/factor}`
  if (!equivalentNumber(answer,expected)) return null
  const steps = b===d
    ? [`Both fractions count equal-sized parts. Keep the common denominator of ${common}.`,
       `${verb} the numerators: (${left} ${sign} ${right})/${common} = ${raw}/${common}.`]
    : [`The denominators describe different-sized parts. Use their least common multiple, ${common}, so the pieces have the same size.`,
       `Rename the fractions as ${left}/${common} and ${right}/${common}. ${verb} their numerators: (${left} ${sign} ${right})/${common} = ${raw}/${common}.`]
  steps.push(factor===1n
    ? `The two numbers share no factor greater than 1, so ${answer} is already simplest.`
    : `Divide both parts by their common factor ${factor} to simplify to ${answer}.`)
  const shortcut = b===d
    ? `Equal denominators: ${verb.toLowerCase()} the numerators and keep the denominator.`
    : 'Use the least common denominator to keep the numbers small. Only the numerators change in the final operation.'
  return { explanation: steps.join('\n'), shortcut }
}
