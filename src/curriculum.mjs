import { mathPath } from './math-path.mjs'

export const curriculum = {
  'Numerical Ability': {
    'Whole numbers': ['basic-arithmetic','signed','order','whole-multiply','whole-divide','Factors and multiples','GCF and LCM'],
    'Fractions': ['fraction-understanding','fraction-equivalent','fraction-simplify','fraction-common-denominator','fractions','fraction-subtract','fraction-multiply','fraction-divide','fraction-mixed','fraction-word','fraction-review'],
    'Decimals, percentages and ratios': ['decimals','Decimal subtraction, multiplication and division','Fraction–decimal conversion','percent','percent-change','ratio','average'],
    'Financial mathematics': ['discount','commission','interest','compound-interest'],
    'Algebra': ['Variables and expressions','linear','multi-equation','Translating word problems','Inequalities'],
    'Applied problems': ['age','work','speed','Money problems','Ratio word problems','Number word problems','Mixtures'],
    'Measurement and data': ['area','perimeter','volume','measurement-conversion','Tables and charts','simple-probability','Counting'],
    'Numerical reasoning': ['sequence','Mixed numerical reasoning','Timed numerical challenges'],
  },
  'Verbal Ability': {
    'Vocabulary': ['Vocabulary','Synonyms','Antonyms','Context clues','Idioms','Word relationships'],
    'Grammar and usage': ['Parts of speech','@grammar','Verb tenses','Pronouns','Prepositions','Correct usage'],
    'Sentence skills': ['Sentence completion','Sentence correction','Error identification'],
    'Reading': ['Reading comprehension','Main idea','Supporting details','Inference','Paragraph organization'],
  },
  'Filipino': {
    'Talasalitaan': ['Talasalitaan','Kasingkahulugan','Kasalungat','@filipino'],
    'Wika at pagbasa': ['Wastong gamit','Gramatika','Pag-unawa sa binasa','Pagkakaayos ng mga talata'],
  },
  'Analytical Ability': {
    'Patterns and relationships': ['Classification','Analogies','Number patterns','Letter patterns','arrangement'],
    'Deductive and inductive reasoning': ['Deductive reasoning','Inductive reasoning','syllogism','venn','Valid conclusions','deductive-counterexample'],
    'Evaluating arguments': ['Assumptions','Inferences','Argument evaluation','Evidence'],
    'Interpreting information': ['@data-interpretation','sufficiency','Data interpretation','Mixed multi-step cases','Timed analytical challenges'],
  },
  'General Information': {
    'The Constitution and government': ['@constitution','Government structure','Constitutional rights'],
    'Public service and society': ['RA 6713 and public-service ethics','Peace and human rights','Environmental management'],
  },
  'Clerical Ability': {
    'Filing and indexing': ['@clerical','Indexing','Secondary filing keys','Numeric filing keys'],
    'Accuracy in office work': ['Spelling','Transcription','Office clerical applications'],
  },
}

export const curatedTitles = {
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
