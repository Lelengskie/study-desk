
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'

test('Edge verifies tokens, hides practice keys, sends only skill text, and falls back on quota and failures', async (t) => {
  let handle
  const env = new Map(Object.entries({
    SITE_ORIGINS: 'https://reviewer.example.com',
    SUPABASE_URL: 'https://database.invalid',
    SUPABASE_ANON_KEY: 'test-public',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service',
    GEMINI_API_KEY: 'test-gemini'
  }))
  let quota = true
  let providerCalls = 0
  let providerStatus = 200
  let roundErrors = false
  let user = { id: 'private-user-id', email: 'private-student@example.com' }
  let reservationCalls = 0
  let hybrid = false
  let cached = null
  const oldFetch = globalThis.fetch
  t.after(() => {
    delete globalThis.Deno
    delete globalThis.__edgeTestClient
    globalThis.fetch = oldFetch
  })
  globalThis.Deno = { env: { get: (key) => env.get(key) }, serve: (fn) => { handle = fn } }
  globalThis.__edgeTestClient = (url, key) => {
    assert.equal(url, env.get('SUPABASE_URL'))
    if (key === 'test-public') {
      return { auth: { getUser: async (token) => {
        assert.equal(token, 'test-session')
        return { data: { user }, error: user ? null : { message: 'Invalid' } }
      } } }
    }
    assert.equal(key, 'test-service')
    return {
      rpc: async (name, args) => {
        if (hybrid) {
          if (name === 'hybrid_tutor_prepare') {
            assert.equal(args.learner, user.id)
            assert.equal(args.question, 'a'.repeat(64))
            assert.deepEqual([args.user_cap, args.project_cap], [5, 12])
            return { data: cached ? { status: 'ai', explanation: cached }
              : { status: 'ready', stem: 'Local practice fixture?', options: [{ label: 'A', text: 'Example' }], revision: 'fixture' } }
          }
          assert.equal(name, 'hybrid_tutor_cache')
          assert.equal(args.revision, 'fixture')
          cached = args.explanation
          return { data: null }
        }
        assert.equal(args.p_user, user.id)
        assert.equal(args.p_question, 'arithmetic-06')
        if (name === 'tutor_open') {
          assert.ok(args.p_practice.answer)
          return roundErrors ? { error: { code: '42501' } } : { data: 'private-round' }
        }
        assert.equal(name, 'tutor_reserve')
        assert.equal(args.p_user_cap, 5)
        assert.equal(args.p_project_cap, 12)
        reservationCalls += 1
        return { data: quota }
      }
    }
  }
  globalThis.fetch = async (url, request) => {
    providerCalls += 1
    assert.match(url, /^https:\/\/generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-/)
    assert.equal(request.headers['x-goog-api-key'], 'test-gemini')
    assert.match(request.body, hybrid ? /Local practice fixture/ : /Multiply two negative integers/)
    for (const privateValue of [user.id, user.email, 'private-round', 'arithmetic-06', 'student input', '98']) {
      assert.equal(request.body.includes(privateValue), false)
    }
    if (providerStatus !== 200) return new Response(null, { status: providerStatus })
    const explanation = 'Two negative signs cancel. First multiply the absolute values. For example, negative two times negative five equals ten.'
    return Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify({ explanation }) }] } }] })
  }
  const entry = new URL('../supabase/functions/tutor/index.ts', import.meta.url)
  const source = (await readFile(entry, 'utf8'))
    .replace(/^import \{ createClient \} from .+$/m, 'const createClient = globalThis.__edgeTestClient')
    .replace("'./practice.mjs'", JSON.stringify(new URL('./practice.mjs', entry).href))
  const compiled = stripTypeScriptTypes(source)
  await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'))
  const invoke = (useAi, token = 'test-session', origin = 'https://reviewer.example.com') =>
    handle(new Request('https://tutor.invalid', {
      method: 'POST', headers: { Origin: origin, ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: JSON.stringify({ question_id: 'arithmetic-06', use_ai: useAi, prompt: 'student input' })
    }))

  assert.equal((await invoke(true, '')).status, 401)
  assert.equal((await invoke(true, 'test-session', 'https://other.example.com')).status, 403)
  user = null
  assert.equal((await invoke(true)).status, 401)
  user = { id: 'private-user-id', email: 'private-student@example.com' }
  roundErrors = true
  assert.equal((await invoke(true)).status, 403)
  roundErrors = false
  const off = await (await invoke(false)).json()
  assert.equal(off.status, 'off')
  assert.equal(reservationCalls, 0)
  quota = false
  assert.equal((await (await invoke(true)).json()).status, 'daily_limit')
  assert.equal(providerCalls, 0)
  quota = true
  const ai = await (await invoke(true)).json()
  assert.equal(ai.status, 'ai')
  assert.ok(ai.explanation.length > 60)
  assert.equal(ai.round_id, 'private-round')
  assert.deepEqual(Object.keys(ai.practice), ['stem', 'options'])
  assert.equal(JSON.stringify(ai).includes('test-gemini'), false)
  providerStatus = 429
  assert.equal((await (await invoke(true)).json()).status, 'unavailable')
  env.delete('GEMINI_API_KEY')
  assert.equal((await (await invoke(true)).json()).status, 'not_configured')
  assert.equal(providerCalls, 2)
  hybrid = true
  providerStatus = 200
  env.set('GEMINI_API_KEY', 'test-gemini')
  const invokeHybrid = () => handle(new Request('https://tutor.invalid', {
    method: 'POST',
    headers: { Origin: 'https://reviewer.example.com', Authorization: 'Bearer test-session' },
    body: JSON.stringify({ question_id: 'a'.repeat(64), use_ai: true, mode: 'hybrid' })
  }))
  const hybridResult = await (await invokeHybrid()).json()
  assert.equal(hybridResult.status, 'ai')
  assert.deepEqual(await (await invokeHybrid()).json(), hybridResult)
  assert.equal(providerCalls, 3)
})
