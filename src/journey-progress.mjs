export function activeStudyDays(attempts, today = new Date()) {
  const dateKey = stamp => {
    const date = new Date(stamp)
    return Number.isNaN(date.valueOf()) ? null : new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).valueOf()
  }
  const now = dateKey(today)
  const day = 86_400_000
  const dates = new Set(attempts.map(row => dateKey(row.attempted_at)).filter(value => value !== null && value <= now))
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now - (6 - i) * day)
    return { date, active: dates.has(date.valueOf()) }
  })
  // Allow the whole current day to study before the streak changes.
  let cursor = dates.has(now) ? now : now - day
  let streak = 0
  while (dates.has(cursor)) { streak++; cursor -= day }
  return { week, streak, weeklyDays: week.filter(entry => entry.active).length }
}

export function journeyRewards(attempts, states, completed, verifiedMastered) {
  const independent = new Set(attempts.filter(row => row.independent && row.correct).map(row => row.concept))
  const mastered = Object.values(states).filter(state => state.everMastered).length
  const retained = Object.values(states).filter(state => state.bestRetained > 0).length
  const xp = completed * 10 + independent.size * 15 + verifiedMastered * 25 + mastered * 35 + retained * 20
  const badges = [
    completed && 'First lesson completed',
    independent.size && 'Independent problem solver',
    retained && 'Remembered after a delay',
    mastered && 'Guided concept mastered',
    verifiedMastered && 'Verified topic mastered',
  ].filter(Boolean)
  return { xp, level: 1 + Math.floor(xp / 100), badges }
}
