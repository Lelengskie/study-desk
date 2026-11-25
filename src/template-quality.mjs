const groups = {
  retired: ['basic-arithmetic','fraction-understanding','simple-probability','counting-pairs','percent','sufficiency','fraction-review','discount','commission','venn','syllogism','arrangement'],
  foundation: ['fraction-equivalent','fraction-simplify','fraction-common-denominator','fraction-subtract','fraction-multiply','fraction-divide','fraction-mixed',
    'whole-subtract','whole-multiply','whole-divide','factor-pairs','gcf-lcm','fraction-decimal','signed','order','fractions','decimals','linear','sequence','area','perimeter'],
  targeted: ['fraction-word','deductive-counterexample','percent-change','compound-interest','multi-equation','volume','measurement-conversion',
    'algebra-expression','ratio','average','speed','age','work','interest'],
}

export const templateQuality = Object.fromEntries(Object.entries(groups).flatMap(([group,skills]) =>
  skills.map(skill=>[skill,group])))

// Keep a small explicit collection. Historical IDs still grade using their original definitions.
const foundationSeeds = [2, 19, 315]
const targetedSeeds = [2, 3, 19, 315]
export function activeLegacySeeds(skill) {
  return templateQuality[skill] === 'foundation' ? foundationSeeds :
    templateQuality[skill] === 'targeted' ? targetedSeeds : []
}
