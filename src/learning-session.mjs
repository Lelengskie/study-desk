export function nextLearningActivity({ due, weak, independent, exposed, hasImported }) {
  if (due) return 'retention'
  if (weak) return 'guided'
  if (independent < 2 || !hasImported) return 'foundations'
  return exposed ? 'foundations' : 'application'
}

export function practiceScopes(subject, topics) {
  return [...new Set([...topics.filter(Boolean), null])].map(topic => ({ subject, topic }))
}
