
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
export const client = url && key ? createClient(url, key) : null

export async function rpc(name, args) {
  const { data, error } = await client.rpc(name, args)
  if (error) throw new Error(error.message)
  return data
}

export async function tutor(questionId, useAi) {
  const { data, error } = await client.functions.invoke('tutor', {
    body: { question_id: questionId, use_ai: useAi }
  })
  if (error) {
    const problem = await error.context?.json?.().catch(() => null)
    throw new Error(problem?.error ?? 'The tutor is temporarily unavailable. Your verified explanation is still available.')
  }
  return data
}
