import React from 'react'

import { mathSegments, mathTokens } from './math-segments.mjs'

function token(text, key) {
  const nested = /^\(\s*([+−-]?\d+)\s*\/\s*(\d+)\s*\)\s*\/\s*\(\s*([+−-]?\d+)\s*\/\s*(\d+)\s*\)$/u.exec(text)
  const frac = (top, bottom) => <mfrac><mn>{top}</mn><mn>{bottom}</mn></mfrac>
  if (nested) return <mfrac key={key}>{frac(nested[1], nested[2])}{frac(nested[3], nested[4])}</mfrac>
  const mixed = /^([+−-]?\d+)(?:\s+(\d+))?\s*\/\s*(\d+)$/u.exec(text)
  if (mixed) return <mrow key={key}>{mixed[2] ? <><mn>{mixed[1]}</mn><mspace width=".2em" />{frac(mixed[2], mixed[3])}</> : frac(mixed[1], mixed[3])}</mrow>
  const power = /^(\d+(?:\.\d+)?|[xyzabXYZAB])\^([+−-]?\d+)$/u.exec(text)
  if (power) return <msup key={key}>{/\d/.test(power[1]) ? <mn>{power[1]}</mn> : <mi>{power[1]}</mi>}<mn>{power[2]}</mn></msup>
  if (/^√\s*\d+$/u.test(text)) return <msqrt key={key}><mn>{text.slice(1).trim()}</mn></msqrt>
  if (/^\d+(?:\.\d+)?$/u.test(text)) return <mn key={key}>{text}</mn>
  if (/^[xyzabXYZAB]$/u.test(text)) return <mi key={key}>{text}</mi>
  if (/^[+*/=().%<>-]$/u.test(text) || '−÷×≤≥'.includes(text)) return <mo key={key}>{text}</mo>
  return text.trim() ? <mtext key={key}>{text}</mtext> : null
}

export default function MathText({ text }) {
  return <>{mathSegments(text).map((part, index) => part.math
    ? <span className="math-inline" key={index}><math aria-label={part.text}>{part.text.split(mathTokens).filter(Boolean).map(token)}</math></span>
    : <React.Fragment key={index}>{part.text}</React.Fragment>)}</>
}
