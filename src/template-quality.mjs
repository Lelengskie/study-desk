const groups = {
  retired: ['basic-arithmetic','fraction-understanding','simple-probability','counting-pairs','percent','sufficiency'],
  foundation: ['fraction-equivalent','fraction-simplify','fraction-common-denominator','fraction-subtract','fraction-multiply','fraction-divide','fraction-mixed',
    'whole-subtract','whole-multiply','whole-divide','factor-pairs','gcf-lcm','fraction-decimal','signed','order','fractions','decimals','linear','sequence','area','perimeter'],
  targeted: ['fraction-word','fraction-review','deductive-counterexample','percent-change','compound-interest','multi-equation','volume','measurement-conversion',
    'algebra-expression','ratio','average','speed','age','work','discount','interest','commission','venn','syllogism','arrangement'],
}

export const templateQuality = Object.fromEntries(Object.entries(groups).flatMap(([group,skills]) =>
  skills.map(skill=>[skill,group])))
