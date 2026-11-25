import { useEffect, useMemo, useRef } from 'react'
import { rpc } from './api'

export function useQuestionEvents(key, source, concept, difficulty, reason) {
  const element = useRef(null)
  const id = useMemo(() => key ? crypto.randomUUID() : null,[key])
  const pending = useMemo(() => ({ promise:Promise.resolve() }),[id])
  const record = transition => {
    if (!id) return
    pending.promise = pending.promise.then(() => rpc('learn_record_question_event',{
      presentation_id:id,question_source:source,scope_concept:concept ?? null,
      scope_difficulty:difficulty ?? null,reason,transition,
    })).catch(() => {})
  }
  useEffect(() => {
    if (!id) return
    record('selected')
    const node = element.current
    if (!node) return
    const watcher = new IntersectionObserver(entries => {
      if (entries.some(entry=>entry.isIntersecting)) {
        record('displayed')
        watcher.disconnect()
      }
    })
    watcher.observe(node)
    return () => watcher.disconnect()
  },[id])
  return { element,record }
}
