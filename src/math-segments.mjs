const fraction = String.raw`[+−-]?\d+\s*\/\s*\d+`
const nested = String.raw`\(\s*${fraction}\s*\)\s*\/\s*\(\s*${fraction}\s*\)`
const standalonePart = String.raw`(?:${nested}|[+−-]?\d+\s+\d+\/\d+|${fraction}|(?:\d+(?:\.\d+)?|[xyzabXYZAB])\^[+−-]?\d+|√\s*\d+)`
const ambiguous = String.raw`(?:https?:\/\/\S+|www\.\S+|[\p{L}\d_-]+(?:\/[\p{L}\d_-]+){2,}|\b\d{4}\/\d{1,2}\b|\b\d{1,2}\/\d{4}\b)`
const fragments = new RegExp(`(${nested})|(${ambiguous})|(?<![\\p{L}\\d/])(${standalonePart})(?![\\p{L}\\d/])`, 'gu')
const calculation = /^(?:[\d\sxyzabXYZAB+−*/÷×=^√().%<>≤≥-]+)$/u
const dateContext = /\b(?:dated|date|as of|issued on|born on)\s*:?\s*$/i

export function mathSegments(text) {
  if (typeof text !== 'string' || !text) return [{ text, math:false }]
  const trimmed = text.trim()
  if (calculation.test(trimmed) && /\d/.test(trimmed) && /[=×÷+<>≤≥%]/.test(trimmed)
      && !/\d\s*\/\s*\d+\s*\/\s*\d/u.test(trimmed)) return [{text, math:true}]
  const segments = []
  let end = 0
  for (const match of text.matchAll(fragments)) {
    if (!match[1] && !match[3] || dateContext.test(text.slice(Math.max(0,match.index-24),match.index))) continue
    if (match.index > end) segments.push({text:text.slice(end,match.index),math:false})
    segments.push({text:match[0],math:true})
    end = match.index + match[0].length
  }
  if (end < text.length) segments.push({text:text.slice(end),math:false})
  return segments
}

export const mathTokens = new RegExp(`(${standalonePart}|\\d+(?:\\.\\d+)?|[xyzabXYZAB]|[+−*/÷×=().%<>≤≥-])`, 'gu')
