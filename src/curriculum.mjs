import { mathPath } from './math-path.mjs'

export const curriculum = {
  'Numerical Ability': {
    'Whole numbers': ['basic-arithmetic','signed','order','whole-multiply','whole-divide','factor-pairs','gcf-lcm'],
    'Fractions': ['fraction-understanding','fraction-equivalent','fraction-simplify','fraction-common-denominator','fractions','fraction-subtract','fraction-multiply','fraction-divide','fraction-mixed','fraction-word','fraction-review'],
    'Decimals, percentages and ratios': ['decimals','Decimal subtraction, multiplication and division','fraction-decimal','percent','percent-change','ratio','average'],
    'Financial mathematics': ['discount','commission','interest','compound-interest'],
    'Algebra': ['algebra-expression','linear','multi-equation','Translating word problems','Inequalities'],
    'Applied problems': ['age','work','speed','Money problems','Ratio word problems','Number word problems','Mixtures'],
    'Measurement and data': ['area','perimeter','volume','measurement-conversion','Tables and charts','simple-probability','counting-pairs'],
    'Numerical reasoning': ['sequence','Mixed numerical reasoning','Timed numerical challenges'],
  },
  'Verbal Ability': {
    'Vocabulary': ['Vocabulary','Synonyms','@verbal-antonyms','@verbal-context','Idioms','Word relationships'],
    'Grammar and usage': ['Parts of speech','@grammar','@verbal-tenses','@verbal-pronouns','Prepositions','Correct usage'],
    'Sentence skills': ['Sentence completion','Sentence correction','Error identification'],
    'Reading': ['Reading comprehension','@verbal-main-idea','@verbal-evidence','Inference','Paragraph organization'],
  },
  'Filipino': {
    'Talasalitaan': ['Talasalitaan','@filipino-synonyms','@filipino-antonyms','@filipino'],
    'Wika at pagbasa': ['@filipino-usage','Gramatika','@filipino-reading','Pagkakaayos ng mga talata'],
  },
  'Analytical Ability': {
    'Patterns and relationships': ['@analytical-classification','@analytical-analogy','Number patterns','@analytical-letter-patterns','arrangement'],
    'Deductive and inductive reasoning': ['Deductive reasoning','Inductive reasoning','syllogism','venn','Valid conclusions','deductive-counterexample'],
    'Evaluating arguments': ['@analytical-assumptions','Inferences','Argument evaluation','@analytical-evidence'],
    'Interpreting information': ['@data-interpretation','sufficiency','Data interpretation','Mixed multi-step cases','Timed analytical challenges'],
  },
  'General Information': {
    'The Constitution and government': ['@constitution','@government-branches','Constitutional rights'],
    'Public service and society': ['RA 6713 and public-service ethics','Peace and human rights','Environmental management'],
  },
  'Clerical Ability': {
    'Filing and indexing': ['@clerical','@clerical-indexing','@clerical-secondary','@clerical-numeric'],
    'Accuracy in office work': ['Spelling','@clerical-transcription','Office clerical applications'],
  },
}

export const independentlyTestedSkills = new Set([
  'verbal-evidence','verbal-context','verbal-tenses','analytical-analogy','analytical-classification',
  'analytical-evidence','filipino-reading','clerical-secondary',
])

export const extraSkills = {
  'verbal-evidence': ['Verbal Ability','Supporting details','reading'],
  'verbal-context': ['Verbal Ability','English context clues','context'],
  'verbal-tenses': ['Verbal Ability','Verb tense and time','grammar'],
  'analytical-analogy': ['Analytical Ability','Analogies and ordered relationships','analogies'],
  'analytical-classification': ['Analytical Ability','Classification by a rule','logic'],
  'analytical-evidence': ['Analytical Ability','Evidence and conclusions','conclusions'],
  'filipino-reading': ['Filipino','Pag-unawa sa binasa','filipino'],
  'clerical-secondary': ['Clerical Ability','Secondary filing keys','filing'],

  'verbal-antonyms': ['Verbal Ability','Antonyms in context','antonyms'],
  'analytical-letter-patterns': ['Analytical Ability','Letter patterns','letter-patterns'],
  'filipino-usage': ['Filipino','Wastong gamit ng ng at nang','filipino'],
  'clerical-indexing': ['Clerical Ability','Filing index entries','clerical'],
  'government-branches': ['General Information','Branches of Philippine government','constitution'],
  'verbal-main-idea': ['Verbal Ability', 'Finding the main idea','reading-comprehension'],
  'verbal-pronouns': ['Verbal Ability', 'Clear pronoun reference','grammar'],
  'filipino-synonyms': ['Filipino', 'Kasingkahulugan','filipino'],
  'filipino-antonyms': ['Filipino', 'Kasalungat','filipino'],
  'analytical-assumptions': ['Analytical Ability', 'Finding necessary assumptions','assumptions'],
  'clerical-numeric': ['Clerical Ability', 'Numeric filing keys','clerical'],
  'clerical-transcription': ['Clerical Ability', 'Accurate transcription','spelling'],
}

export const curatedTitles = {
  ...Object.fromEntries(Object.entries(extraSkills).map(([id, [, title]]) => [id, title])),
  grammar: 'Subject–verb agreement',
  filipino: 'Pahiwatig sa konteksto',
  'data-interpretation': 'Conditions and sufficient evidence',
  constitution: 'Constitutional conditions and safeguards',
  clerical: 'Alphabetical filing and tie-breaks',
}

export function curriculumEntry(key, states, curated) {
  if (key.startsWith('@')) {
    const id = key.slice(1)
    return { id, kind: 'curated', title: curatedTitles[id], mastered: curated[id]?.mastered === true, due: curated[id]?.due === true }
  }
  if (mathPath[key]) {
    const state = states[key]
    return { id: key, kind: 'guided', title: mathPath[key].title, mastered: state?.mastery === true, due: state?.dueNow && state?.unused?.length > 0 }
  }
  return { id: key, kind: 'pending', title: key, mastered: false, due: false }
}
