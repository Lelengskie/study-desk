import React from 'react'

// Render only recognizable math. Everything else remains escaped React text.
function mathParts(text) {
  return text.split(/(\(\s*[+−-]?\d+\s*\/\s*\d+\s*\)\s*\/\s*\(\s*[+−-]?\d+\s*\/\s*\d+\s*\)|[+−-]?\d+\s+\d+\/\d+|[+−-]?\d+\/\d+|(?:\d+(?:\.\d+)?|[xX])\^[+−-]?\d+|√\s*\d+)/u)
}

function token(text, key) {
  const nested = /^\(\s*([+−-]?\d+)\s*\/\s*(\d+)\s*\)\s*\/\s*\(\s*([+−-]?\d+)\s*\/\s*(\d+)\s*\)$/u.exec(text)
  const frac = (top, bottom) => <mfrac><mn>{top}</mn><mn>{bottom}</mn></mfrac>
  if (nested) return <mfrac key={key}>{frac(nested[1], nested[2])}{frac(nested[3], nested[4])}</mfrac>
  const mixed = /^([+−-]?\d+)(?:\s+(\d+))?\/(\d+)$/u.exec(text)
  if (mixed) return <mrow key={key}>{mixed[2] ? <><mn>{mixed[1]}</mn><mspace width=".2em" />{frac(mixed[2], mixed[3])}</> : frac(mixed[1], mixed[3])}</mrow>
  const power = /^(\d+(?:\.\d+)?|[xX])\^([+−-]?\d+)$/u.exec(text)
  if (power) return <msup key={key}>{/\d/.test(power[1]) ? <mn>{power[1]}</mn> : <mi>{power[1]}</mi>}<mn>{power[2]}</mn></msup>
  if (/^√\s*\d+$/u.test(text)) return <msqrt key={key}><mn>{text.slice(1).trim()}</mn></msqrt>
  return <mtext key={key}>{text}</mtext>
}

export default function MathText({ text }) {
  if (typeof text !== 'string' || text.length > 500) return text
  const prefix = /^(?:Calculate|Evaluate|Simplify|Find x if)\s+/i.exec(text)?.[0] ?? ''
  const expression = text.slice(prefix.length).trim().replace(/\.$/, '')
  if (!/^[\d xX+−*/÷×=^√().%<>≤≥\s-]+$/u.test(expression)
      || /\d\s*\/\s*\d+\s*\/\s*\d/u.test(expression)
      || !/[\/^√]/u.test(expression)) return text
  return <>{prefix}<math aria-label={expression}>{mathParts(expression).map(token)}</math></>
}
