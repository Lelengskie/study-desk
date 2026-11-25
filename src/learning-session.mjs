export function nextLearningActivity({ due, weak, independent, exposed, hasImported }) {
  if (due) return 'retention'
  if (weak) return 'guided'
  if (independent < 2 || !hasImported) return 'foundations'
  return exposed ? 'foundations' : 'application'
}

export function practiceScopes(subject, topics) {
  return [...new Set([...topics.filter(Boolean), null])].map(topic => ({ subject, topic }))
}

export function learningBand(recent, retained, structureCount) {
  if (!recent.length || recent.slice(-2).some(row => !row.correct || !row.independent)) return 'foundation'
  const clean = recent.slice(-5).filter(row => row.correct && row.independent).length
  if (clean < 3) return 'beginner'
  if (!retained || structureCount < 2) return 'intermediate'
  if (clean < 5 || structureCount < 3) return 'advanced'
  return 'examination'
}
