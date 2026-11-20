
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { createServer } from 'vite'

const fakeUrl = 'https://reviewer-test.supabase.co'
process.env.VITE_SUPABASE_URL = fakeUrl
process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key'
const server = await createServer({
  server: { host: '127.0.0.1', port: 5317, strictPort: true }
})
await server.listen()
let browser
try {
  browser = await chromium.launch(process.env.REVIEWER_CHROME
    ? { executablePath: process.env.REVIEWER_CHROME }
    : {})
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  const quizOptions = [{ id: '1', text: 'Twelve' }, { id: '2', text: 'Five' }]
  const practiceOptions = [{ id: '1', text: 'Four' }, { id: '2', text: 'Seven' }]
  const testModule = {
    id: 'math', track: 'Numerical Ability', title: 'Number patterns',
    levels: ['professional', 'subprofessional'], lesson: 'Compare each term to the one before it.',
    quiz_ids: ['sequence-01']
  }
  const user = {
    id: '10000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated',
    email: 'student@example.com', app_metadata: { provider: 'email' }, user_metadata: {}
  }
  const tokenPart = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
  const token = tokenPart({ alg: 'HS256', typ: 'JWT' }) + '.' +
    tokenPart({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600 }) + '.signature'
  const due = '2026-11-21T03:00:00.000Z'
  let completed = []
  let gradeCalls = 0
  let tutorCalls = 0
  let tutorGrades = 0
  await page.route(fakeUrl + '/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    const method = route.request().method()
    const headers = {
      'access-control-allow-origin': '*', 'access-control-allow-headers': '*',
      'access-control-allow-methods': 'GET, POST, OPTIONS'
    }
    const send = (json, status = 200) => route.fulfill({ status, headers, json })
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers })
    if (path === '/auth/v1/token') return send({
      access_token: token, refresh_token: 'test-refresh', token_type: 'bearer', expires_in: 3600, user
    })
    if (path === '/auth/v1/logout') return route.fulfill({ status: 204, headers })
    assert.ok(route.request().headers().authorization?.includes(token), 'Protected request used a session token')
    if (path.endsWith('/study_catalog')) return send({ modules: [testModule] })
    if (path.endsWith('/study_progress')) return send({
      completed,
      mastery: gradeCalls ? { math: { attempts: gradeCalls, correct: 1, distinct_items: 1, sessions: 1, mastered: false } } : {},
      reviews: gradeCalls ? [{ topic_id: 'math', question_id: 'sequence-01', step: 1, is_due: true, due_at: due }] : []
    })
    if (path.endsWith('/study_complete')) { completed = ['math']; return send(null) }
    if (path.endsWith('/study_question')) return send({
      id: 'sequence-01', language: 'en', stem: 'What comes after 3, 6, 9?', options: quizOptions
    })
    if (path.endsWith('/study_submit')) {
      const value = route.request().postDataJSON()
      assert.equal(value.p_option, '1')
      assert.ok(value.p_request && value.p_session)
      gradeCalls += 1
      return send({
        correct: true, answer_option_id: '1', explanation: 'Add three to the last term.',
        verification: 'independently_checked', sources: [{ title: 'Test source', locator: 'p. 1' }], due_at: due
      })
    }
    if (path === '/functions/v1/tutor') {
      const value = route.request().postDataJSON()
      assert.deepEqual(value, { question_id: 'sequence-01', use_ai: true })
      tutorCalls += 1
      return send({ round_id: 'test-round', status: 'daily_limit', explanation: null, skill: 'Compare the gaps.',
        practice: { stem: 'What comes after 1, 2, 3?', options: practiceOptions } })
    }
    if (path.endsWith('/tutor_answer')) {
      tutorGrades += 1
      assert.equal(route.request().postDataJSON().p_option, '2')
      return send({ correct: false, answer_option_id: '1', explanation: 'Add one to get four.' })
    }
    return send({ error: 'Unexpected mock request for ' + path }, 404)
  })
  await page.goto('http://127.0.0.1:5317')
  await page.getByLabel('Email').fill(user.email)
  await page.getByLabel('Password').fill('test-password')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await page.getByRole('heading', { name: 'Your study plan' }).waitFor()
  await page.getByRole('button', { name: 'Open lesson: Number patterns' }).click()
  await page.getByRole('button', { name: 'Mark lesson complete' }).click()
  await page.getByRole('button', { name: 'Lesson complete' }).waitFor()
  await page.getByRole('button', { name: 'Start quiz', exact: true }).click()
  await page.getByRole('heading', { name: 'What comes after 3, 6, 9?' }).waitFor()
  assert.equal(await page.getByRole('button', { name: 'Check answer' }).isDisabled(), true)
  await page.getByText('Twelve', { exact: true }).click()
  await page.getByRole('button', { name: 'Check answer' }).click()
  await page.getByText('Add three to the last term.', { exact: true }).waitFor()
  await page.getByText('Source and verification').click()
  await page.getByText('Test source · p. 1', { exact: true }).waitFor()
  await page.getByRole('checkbox', { name: /Use Gemini/ }).check()
  await page.getByRole('button', { name: 'Start tutor practice' }).click()
  await page.getByText(/AI daily limit reached/).waitFor()
  assert.equal(await page.getByRole('button', { name: 'Check practice answer' }).isDisabled(), true)
  assert.equal(await page.getByText('Add one to get four.').count(), 0)
  await page.getByText('Seven', { exact: true }).click()
  await page.getByRole('button', { name: 'Check practice answer' }).click()
  await page.getByText('Add one to get four.').waitFor()
  await page.getByRole('button', { name: 'Finish session' }).click()
  await page.getByRole('button', { name: 'View mastery' }).click()
  await page.getByRole('heading', { name: 'Your mastery' }).waitFor()
  await page.getByText('100% · 1 of 1 correct').waitFor()
  await page.getByRole('button', { name: /Repeat/ }).click()
  await page.getByRole('button', { name: 'Start due reviews' }).click()
  await page.getByRole('heading', { name: 'What comes after 3, 6, 9?' }).waitFor()
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
  await page.getByRole('button', { name: 'Sign out' }).click()
  await page.getByRole('heading', { name: 'Make time to study.' }).waitFor()
  assert.deepEqual([gradeCalls, tutorCalls, tutorGrades], [1, 1, 1])
  assert.deepEqual(errors, [])
  console.log('375 px browser flow passed: sign-in, lesson, quiz, explanation, tutor fallback, mastery, review and sign-out.')
} finally {
  await browser?.close()
  await server.close()
}
