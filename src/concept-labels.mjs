import { mathPath } from './math-path.mjs'

const labels = {
  arithmetic: 'Basic arithmetic', geometry: 'Geometry', factors: 'Factors, GCF and LCM',
  synonyms: 'Synonyms', antonyms: 'Antonyms', context: 'Vocabulary in context',
  grammar: 'Grammar and correct usage', reading: 'Reading comprehension', paragraphs: 'Paragraph organization',
  'sentence-completion': 'Sentence completion', filipino: 'Filipino language skills',
  analogies: 'Analogies', 'data-interpretation': 'Data interpretation', assumptions: 'Assumptions',
  conclusions: 'Supported conclusions', 'letter-patterns': 'Letter patterns',
  spelling: 'Spelling', filing: 'Filing and indexing',
}

export const conceptLabel = id => labels[id] ?? mathPath[id]?.title ?? id
