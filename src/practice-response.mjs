export function equivalentNumber(input, expected) {
  const a = rational(input)
  const b = rational(expected)
  return a !== null && b !== null && a[0] * b[1] === b[0] * a[1]
}

export function rational(value) {
  const text = String(value).trim().replace('−', '-')
  if (text.length > 48) return null
  const mixed = /^([+-]?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(text)
  if (mixed) {
    const denominator = BigInt(mixed[4])
    if (!denominator) return null
    return [(mixed[1] === '-' ? -1n : 1n) * (BigInt(mixed[2]) * denominator + BigInt(mixed[3])), denominator]
  }
  const fraction = /^([+-]?\d+)\s*\/\s*([+-]?\d+)$/.exec(text)
  if (fraction) return BigInt(fraction[2]) ? [BigInt(fraction[1]), BigInt(fraction[2])] : null
  const decimal = /^([+-]?)(\d*)(?:\.(\d+))?(%)?$/.exec(text)
  if (!decimal || !(decimal[2] || decimal[3])) return null
  const part = decimal[3] ?? ''
  return [
    (decimal[1] === '-' ? -1n : 1n) * BigInt(decimal[2] + part),
    10n ** BigInt(part.length) * (decimal[4] ? 100n : 1n)
  ]
}
