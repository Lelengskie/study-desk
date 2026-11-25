
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { build, preview } from 'vite'

const fakeUrl = 'https://reviewer-test.supabase.co'
process.env.VITE_SUPABASE_URL = fakeUrl
process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key'
const buildOptions = { outDir: 'node_modules/.cache/study-browser', emptyOutDir: true }
await build({ build: buildOptions, logLevel: 'error' })
const server = await preview({
  build: buildOptions, preview: { host: '127.0.0.1', port: 5317, strictPort: true }, logLevel: 'error'
})
let browser
try {
  browser = await chromium.launch(process.env.REVIEWER_CHROME
    ? { executablePath: process.env.REVIEWER_CHROME }
    : {})
  const desktop = process.argv.includes('--desktop')
  const page = await browser.newPage({ viewport: { width: desktop ? 1440 : 375, height: 812 }, isMobile: !desktop, hasTouch: !desktop })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  const quizOptions = [{ id: '1', text: 'Twelve' }, { id: '2', text: 'Five' }]
  const practiceOptions = [{ id: '1', text: 'Four' }, { id: '2', text: 'Seven' }]
  const testModule = {
    id: 'arithmetic', track: 'Numerical Ability', title: 'Number patterns',
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
  const unscored = { id: 'a'.repeat(64), stem: 'Which option is the source value?', status: 'source_answer_available',
    options: [{ label: 'A', text: 'Sample option' }, { label: 'B', text: 'Other option' }], saved: false }
  const typed = { ...unscored, id: 'b'.repeat(64), stem: 'What is half of one?', options: [] }
  const selfCheck = { ...typed, id: 'c'.repeat(64), stem: 'Reword the sentence in your own words.' }
  const conceptAttempts = []
  let weeklyGoal = null
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
    if (path.endsWith('/study_catalog')) return send({ modules: [testModule, { ...testModule, id: 'logic', track: 'Analytical Ability', title: 'Check a conclusion' }, { ...testModule, id: 'word-problems', title: 'Speed and distance' }] })
    if (path.endsWith('/hybrid_library')) return send([{
      id: 'fixture', title: 'Sample mock examination', format: 'pdf', role: 'mock exam',
      editions: ['2027'], drive_file_id: 'fixture-only'
    }])
    if (path.endsWith('/hybrid_practice')) {
      const count = route.request().postDataJSON()?.random_count
      if (count !== undefined) assert.equal(count, 3)
      return send(count === undefined ? [unscored] : [unscored, typed, selfCheck])
    }
    if (path.endsWith('/hybrid_practice_context')) return send({ instructions: 'Give an equivalent response.' })
    if (path.endsWith('/hybrid_answer')) {
      const id = route.request().postDataJSON()?.question_id
      if (id === typed.id) return send({ answer_text: '1/2', exact_value: '1/2', status: unscored.status })
      if (id === selfCheck.id) return send({ answer_text: 'An example sentence.', status: unscored.status })
      return send({ answer: 'A', status: unscored.status })
    }
    if (path.endsWith('/hybrid_feedback')) return send(null)
    if (path.endsWith('/v21_weekly_goal')) {
      weeklyGoal = route.request().postDataJSON()?.new_goal ?? weeklyGoal
      return send(weeklyGoal)
    }
    if (path.endsWith('/v21_concept_counts')) return send([
      { subject: 'Numerical Ability', concept: 'fractions', imported: 9 }
    ])
    if (path.endsWith('/v21_subject_counts')) return send([
      { subject: 'Numerical Ability', imported: 35, verified: 12, subject_only: 30 }
    ])
    if (path.endsWith('/v2_concept_progress')) return send(conceptAttempts)
    if (path.endsWith('/v2_concept_attempt')) {
      const attempt = route.request().postDataJSON()
      assert.equal(attempt.skill, 'decimals')
      assert.equal(attempt.hint_count, 0)
      assert.equal(Number(attempt.numerator) / Number(attempt.denominator), .25)
      conceptAttempts.push({ concept: 'decimals', variant: attempt.variant_no, independent: true,
        correct: true, attempted_at: new Date().toISOString() })
      return send(true)
    }
    if (path.endsWith('/study_progress')) return send({
      completed,
      mastery: gradeCalls ? { arithmetic: { attempts: gradeCalls, correct: 1, distinct_items: 1, sessions: 1, mastered: false } } : {},
      reviews: gradeCalls ? [{ topic_id: 'arithmetic', question_id: 'sequence-01', step: 1, is_due: true, due_at: due }] : []
    })
    if (path.endsWith('/study_complete')) { completed = ['arithmetic']; return send(null) }
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
      if (value.mode === 'allowance') return send({ used: 1, limit: 5, remaining: 4, resets_at: new Date(Date.now()+3600000).toISOString() })
      if (value.mode === 'hybrid') {
        assert.equal(value.language,'taglish')
        assert.equal(value.style,'steps')
        return send({ status: 'daily_limit' })
      }
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
  await page.getByRole('heading', { name: 'Make time to study.' }).waitFor({ timeout: 5000 }).catch(async error => {
    throw Error('Fixture did not load: ' + (await page.locator('body').innerText()) + ' ' + errors.join('; '), { cause: error })
  })
  await page.getByLabel('Email').fill(user.email)
  await page.getByLabel('Password').fill('test-password')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await page.getByRole('heading', { name: 'Your study plan' }).waitFor()
  await page.getByRole('heading', { name: 'Study today' }).waitFor()
  await page.getByRole('button', { name: 'Continue learning: addition and subtraction' }).click()
  await page.getByRole('heading', { name: 'Math foundations' }).waitFor()
  assert.equal(await page.getByLabel('Concept').inputValue(), 'basic-arithmetic')
  await page.getByLabel('Concept').selectOption('fractions')
  assert.equal(await page.getByRole('heading',{name:'Explore fraction skills',exact:true}).count(),1)
  await page.getByLabel('Concept').selectOption('signed')
  assert.equal(await page.getByRole('heading',{name:'Explore fraction skills',exact:true}).count(),0)
  await page.getByRole('button', { name: 'Back to Learn' }).click()
  await page.getByRole('heading', { name: 'Explore subjects' }).waitFor()
  await page.getByText('35 imported · 12 verified').waitFor()
  await page.getByRole('button', { name: 'Home', exact: true }).click()
  await page.getByLabel('Weekly goal').selectOption('5')
  await page.waitForFunction(() => !document.querySelector('.journey-goal select').disabled)
  await page.evaluate(id => localStorage.removeItem('study-desk:weekly-goal:' + id),user.id)
  await page.reload()
  await page.getByRole('button', { name: 'Explore subjects' }).click()
  await page.getByRole('heading', { name: 'Explore subjects' }).waitFor()
  await page.getByRole('button', { name: 'Home', exact: true }).click()
  assert.equal(await page.getByLabel('Weekly goal').inputValue(), '5')
  await page.getByRole('button', { name: 'Explore subjects' }).click()
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
  await page.getByRole('button', { name: 'Open Numerical Ability roadmap' }).click()
  await page.getByText(/Foundation · .* concepts/).waitFor()
  await page.getByRole('heading', { name: 'Imported practice by concept' }).waitFor()
  await page.getByRole('button', { name: 'Practice Adding fractions' }).click()
  await page.getByRole('heading', {name:'Imported practice', exact:true}).waitFor()
  await page.getByRole('button',{name:'Practice filters'}).click()
  assert.equal(await page.getByLabel('Topic').inputValue(), 'concept:fractions')
  await page.getByRole('button', { name: 'Learn', exact: true }).click()
  await page.getByRole('button', { name: 'Open Numerical Ability roadmap' }).click()

  await page.getByRole('button', { name: 'Open lesson: Number patterns' }).click()
  await page.getByRole('heading', { name: 'Percent means out of 100' }).waitFor()
  await page.getByRole('button', { name: 'Get a hint' }).click()
  await page.getByText('Divide the percentage by 100 before multiplying by the total.').waitFor()
  assert.equal(await page.getByText(/25% is 25\/100/).count(), 0)
  await page.getByLabel('Find the amount').fill('20')
  await page.getByRole('button', { name: 'Check my answer' }).click()
  await page.getByText('Correct.', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Show worked solution' }).click()
  await page.getByRole('heading', { name: 'Understand the question' }).waitFor()
  await page.getByRole('button', { name: 'Next Step' }).click()
  await page.getByRole('heading', { name: 'Identify what you know' }).waitFor()
  await page.getByRole('button', { name: 'Previous Step' }).click()
  await page.getByRole('heading', { name: 'Understand the question' }).waitFor()
  await page.getByLabel('Explanation depth').selectOption('standard')
  await page.getByText(/25% is 25\/100/).waitFor()
  await page.getByRole('button', { name: 'Review fractions first' }).click()
  await page.getByRole('img', { name: '3 of 4 equal parts shaded' }).waitFor()
  await page.getByLabel('Enter the shaded fraction').fill('0.75')
  await page.getByRole('button', { name: 'Check my answer' }).click()
  await page.getByText('Correct.', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Continue to percentages' }).click()
  await page.getByRole('button', { name: 'Try different values' }).click()
  assert.equal(await page.getByLabel('Find the amount').inputValue(), '')
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
  const pathway = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Math foundations' }) })
  await pathway.getByLabel('Concept').selectOption('percent')
  await pathway.getByRole('button', { name: 'Review decimals and place value' }).click()
  await pathway.getByText('Math keypad', { exact: true }).click()
  for (const key of ['1', '/', '4']) await pathway.getByRole('button', { name: key, exact: true }).click()
  assert.equal(await pathway.locator('math mfrac').count(), 1)
  for (const [value, selector] of [
    ['(-1/2)/(3/4)', 'mfrac mfrac'], ['2 1/3','mfrac'], ['-3/4','mfrac'], ['2^3','msup'], ['√9','msqrt'],
  ]) {
    await pathway.getByLabel('Your calculation').fill(value)
    assert.ok(await pathway.locator('math ' + selector).count(), value)
  }
  await pathway.getByLabel('Your calculation').fill('12/25/2026')
  assert.equal(await pathway.locator('math').count(), 0)
  await pathway.getByLabel('Your calculation').fill('1/4')
  await pathway.getByRole('button', { name: 'Check my calculation' }).click()
  await pathway.getByText('Correct.', { exact: true }).waitFor()
  await pathway.getByText(/1 correct on 1 independent variations/).waitFor()
  await pathway.getByRole('button', { name: 'Try a new calculation' }).click()
  assert.equal(await pathway.getByLabel('Your calculation').inputValue(), '')
  await page.getByRole('button', { name: 'Back to lessons' }).click()
  await page.getByRole('button', { name: 'Back to subjects' }).click()
  await page.getByRole('button', { name: 'Home', exact: true }).click()
  await page.getByText('Independent problem solver', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Explore subjects' }).click()
  await page.getByRole('button', { name: 'Open Analytical Ability roadmap' }).click()
  await page.getByRole('button', { name: 'Open lesson: Check a conclusion' }).click()
  await page.getByRole('heading', { name: 'Test a conclusion with a counterexample' }).waitFor()
  await page.getByLabel('Is every member a volunteer in this example?').selectOption('no')
  await page.getByRole('button', { name: 'Check my answer' }).click()
  await page.getByText('Correct.', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Back to lessons' }).click()
  await page.getByRole('button', { name: 'Back to subjects' }).click()
  await page.getByRole('button', { name: 'Open Numerical Ability roadmap' }).click()
  await page.getByRole('button', { name: 'Open lesson: Speed and distance' }).click()
  await page.getByLabel('Find the distance in kilometers').fill('120')
  await page.getByRole('button', { name: 'Check my answer' }).click()
  await page.getByText('Correct.', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Back to lessons' }).click()
  await page.getByRole('button', { name: 'Open lesson: Number patterns' }).click()
  await page.getByRole('button', { name: 'Mark lesson complete' }).click()
  await page.getByRole('button', { name: 'Lesson complete' }).waitFor()
  await page.getByRole('button', { name: 'Start quiz', exact: true }).click()
  await page.getByRole('heading', { name: 'What comes after 3, 6, 9?' }).waitFor()
  await page.getByRole('button', { name: 'Library', exact: true }).click()
  await page.getByRole('heading', { name: 'Sample mock examination' }).waitFor()
  assert.match(await page.getByRole('link', { name: 'Open in Google Drive' }).getAttribute('href'), /drive.google.com/)
  await page.getByLabel('Source', { exact: true }).fill('mock')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await page.getByRole('button', { name: 'Learn', exact: true }).click()
  await page.getByRole('button', { name: 'Browse all practice', exact: true }).click()
  await page.getByLabel('Questions per session').fill('3')
  await page.getByRole('button', { name: 'Start random practice' }).click()
  await page.getByText('Question 1 of 3').waitFor()
  await page.getByLabel('Sample option', { exact: true }).check()
  await page.getByRole('button', { name: 'Check answer availability' }).click()
  await page.getByText('Answer: Sample option', { exact: true }).waitFor()
  await page.getByRole('button',{name:'Check application allowance'}).click()
  await page.getByText(/1 used · 4 remaining in the application allowance/).waitFor()
  await page.getByLabel('Tutor language').selectOption('taglish')
  await page.getByLabel('Tutor help').selectOption('steps')
  await page.getByRole('button',{name:'Request AI explanation'}).click()
  await page.getByText(/Daily tutor allowance reached/).waitFor()
  await page.getByRole('button', { name: 'Bookmark', exact: true }).click()
  await page.getByRole('button', { name: 'Remove bookmark' }).waitFor()
  await page.getByLabel('Report a problem').fill('Synthetic feedback')
  await page.getByRole('button', { name: 'Send report' }).click()
  await page.getByText('Report saved.').waitFor()
  await page.getByRole('button', { name: 'Next question' }).click()
  await page.getByText('Give an equivalent response.').waitFor()
  assert.equal(await page.getByText('Answer: 1/2', { exact: true }).count(), 0)
  await page.getByLabel('Your answer').fill('0.5')
  await page.getByRole('button', { name: 'Compare with the answer' }).click()
  await page.getByText('Correct · Your answer: 0.5', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Next question' }).click()
  await page.getByLabel('Your answer').fill('My own sentence.')
  await page.getByRole('button', { name: 'Compare with the answer' }).click()
  await page.getByText('Self-check · Your answer: My own sentence.').waitFor()
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
  await page.getByRole('button', { name: 'Learn', exact: true }).click()
  await page.getByRole('button', { name: 'Open Numerical Ability roadmap' }).click()
  await page.getByRole('button', { name: 'Verified topic quizzes' }).click()
  await page.getByRole('button', { name: 'Start quiz: Number patterns' }).click()
  assert.equal(await page.getByRole('button', { name: 'Check answer', exact: true }).isDisabled(), true)
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
  await page.getByRole('button', { name: 'Learn', exact: true }).click()
  await page.getByRole('button', { name: 'Review due', exact: true }).click()
  await page.getByRole('button', { name: 'Start due reviews' }).click()
  await page.getByRole('heading', { name: 'What comes after 3, 6, 9?' }).waitFor()
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
  await page.getByRole('button', { name: 'Sign out' }).click()
  await page.getByRole('heading', { name: 'Make time to study.' }).waitFor()
  assert.deepEqual([gradeCalls, tutorCalls, tutorGrades], [1, 1, 1])
  assert.deepEqual(errors, [])
  console.log((desktop ? '1440' : '375') + ' px browser flow passed: verified study, library search, randomized unscored practice, bookmarks, reports, tutor fallback and sign-out.')
} finally {
  await browser?.close()
  await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()))
}
