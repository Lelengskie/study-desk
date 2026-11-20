
const bank = {
  'word-meaning-21': ['Use context to find a Filipino synonym.', 'Matapos ang mahabang paglalakad, siya ay hapo. Ano ang kahulugan ng “hapo”?', ['pagod','masaya','galit','mabagal'], 'Ang “hapo” ay nangangahulugang pagod. Ang mahabang paglalakad ang pahiwatig.'],
  'word-meaning-24': ['Infer a Filipino word meaning from repeated experience.', 'Palagi siyang nagluluto kaya naging bihasa siya. Ano ang kahulugan ng “bihasa”?', ['sanay','takot','baguhan','mahina'], 'Ang bihasa ay sanay o mahusay dahil sa karanasan.'],
  'word-meaning-22': ['Use contextual clues to choose an English synonym.', 'The employee made a surreptitious copy so no one would notice. What does surreptitious mean?', ['secret','careless','routine','speedy'], 'So no one would notice points to something done secretly.'],
  'grammar-02': ['Recognize would rather plus a base verb.', 'Mika ___ rather walk to the library.', ['would','has','does','should'], 'The idiom is “would rather” followed by the base verb: “would rather walk.”'],
  'grammar-03': ['Use an -ing form after an expression such as “have trouble”.', 'Did they have trouble ___ the address?', ['finding','find','finds','found'], '“Have trouble doing something” takes the -ing form here.'],
  'grammar-09': ['Form an irregular English plural ending in -sis.', 'Which is the plural of analysis?', ['analyses','analysises','analysis','analysies'], 'Words such as analysis change the final -sis to -ses in the plural.'],
  'reading-order-01': ['Recognize an opener that gives the whole paragraph a topic.', 'Which sentence best opens a paragraph about how a town prepares for storms?', ['The town prepares for storms in several ways.','These are kept in a shed.','That is why it worked.','The first shelter has blue doors.'], 'The first sentence states the shared topic. The others rely on prior context or give one detail.'],
  'reading-order-02': ['Order sentences using chronology and a clear referent.', 'Order these sentences. A. Finally, Mara labeled the folder. B. Mara gathered the forms. C. She placed them in one folder.', ['B–C–A','C–B–A','A–C–B','B–A–C'], 'B introduces Mara and the forms. C uses both references, then A gives the final action.'],
  'reading-order-03': ['Find the main idea broad enough to cover the details.', 'A notice describes longer opening hours, a new return slot, and online renewals. What is the main idea?', ['The library made borrowing more convenient.','The return slot is outdoors.','Staff changed shifts.','The library bought shelves.'], 'The shared purpose of the three changes is convenience. A single detail is too narrow.'],
  'sequence-01': ['Identify consecutive perfect squares.', 'Continue the sequence 9, 16, 25, 36, 49.', ['64','56','72','81'], 'These are 3² through 7². The next term is 8² = 64.'],
  'sequence-03': ['Find a constant divisor between consecutive terms.', 'What comes next: 1024, 256, 64, 16?', ['4','8','12','2'], 'Each term is one fourth of the preceding term. 16 ÷ 4 = 4.'],
  'sequence-55-01': ['Split alternating sequences into odd and even positions.', 'Fill the gap in 3, 30, 6, __, 9, 22.', ['26','24','27','28'], 'Odd positions go up by 3. Even positions go down by 4, giving 30, 26, 22.'],
  'arithmetic-06': ['Multiply two negative integers.', 'Evaluate (−7) × (−14).', ['98','−98','21','−21'], 'Two negatives multiply to a positive. 7 × 14 = 98.'],
  'arithmetic-08': ['Determine the greatest common factor.', 'Find the greatest common factor of 24 and 40.', ['8','4','12','16'], '24 = 8 × 3 and 40 = 8 × 5. Since 3 and 5 share no larger factor, the GCF is 8.'],
  'arithmetic-10': ['Add fractions after simplifying or finding a common denominator.', 'Evaluate 1/3 + 9/3 + 4/6.', ['4','3','10/9','4 1/3'], '9/3 = 3 and 4/6 = 2/3. The thirds sum to 1, giving 4.'],
  'arithmetic-17': ['Divide by a fraction using its reciprocal.', 'Evaluate 2/3 ÷ 1/6.', ['4','1/9','2','3'], 'Multiply 2/3 by the reciprocal 6/1 to get 12/3 = 4.'],
  'arithmetic-131': ['Compare expressions after applying multiplication before addition.', 'Which expression is smallest?', ['5 + 2 × 3','4 + 3 × 3','3 × 4 + 2','3 + 2 × 5'], 'Their values are 11, 13, 14, and 13. Perform each multiplication first.'],
  'word-problems-18': ['Build an equation with a sum and a multiple plus a constant.', 'Two integers total 50. The larger is twice the smaller plus 2. Find them.', ['16 and 34','18 and 32','15 and 35','17 and 33'], 'Let x be the smaller integer. x + 2x + 2 = 50, so x = 16 and the larger is 34.'],
  'word-problems-age-02': ['Move both ages to the same point in time before solving.', 'Luis is 8 years older than Pia. Four years ago they totaled 34 years. How old are they now?', ['Luis 25, Pia 17','Luis 21, Pia 13','Luis 26, Pia 18','Luis 24, Pia 16'], 'Add 8 years to their old total because both aged 4. Their current total is 42 and the difference is 8, giving 25 and 17.'],
  'word-problems-129': ['Find an original value after a percent increase.', 'A number increased by 25% equals 75. What was it?', ['60','56.25','50','62.5'], 'The final amount is 125% of the original, so divide 75 by 1.25 to get 60.'],
  'logic-assumption-01': ['Identify a necessary assumption that bridges evidence and a conclusion.', 'A kiosk claims it must close because its only printer failed. Which assumption does this depend on?', ['It cannot continue serving customers without a working printer.','The printer is blue.','Customers can pay in cash.','The kiosk is open daily.'], 'The reasoning requires the failed printer to prevent service. Otherwise it could stay open.'],
  'logic-figure-01': ['Track the position after a quarter turn in the stated direction.', 'A pointer starts on the right. It rotates a quarter-turn counterclockwise. Where is it now?', ['Top','Bottom','Left','Right'], 'A counterclockwise turn from the three-o’clock position points to twelve o’clock.'],
  'logic-analogy-01': ['Match the direction of an explanatory relationship in an analogy.', 'Glossary is to textbook as label is to what?', ['Diagram','Stapler','Classroom','Eraser'], 'A glossary explains terms in a textbook. A label identifies a part of a diagram.'],
  'clerical-01': ['Match recruitment and hiring to the human resources function.', 'Which team usually posts vacancies and screens applicants?', ['Human resources','Facilities','Payroll processing','Inventory'], 'Recruitment is a human resources function. Screening applicants is part of recruiting.'],
  'clerical-alpha-01': ['File by surname then given name for ties.', 'File by surname. A. Pia Santos, B. Jo Cruz, C. Ana Santos, D. Ian Bautista.', ['D, B, C, A','D, C, B, A','B, D, A, C','C, A, D, B'], 'Bautista precedes Cruz, then Santos. Ana precedes Pia within Santos.'],
  'clerical-check-01': ['Compare each digit group to an exact reference.', 'Select the exact copy of 86-209-147.', ['86-209-147','86-290-147','68-209-147','86-209-174'], 'Match every group in order. The other choices switch two digits.'],
  'constitution-02': ['Apply Article IV Section 4: marriage alone does not remove Filipino citizenship; legal renunciation is an exception.', 'A Philippine citizen marries a citizen of another country and has taken no action deemed renunciation under law. What follows under Article IV?', ['Philippine citizenship is retained.','Philippine citizenship ends immediately.','Citizenship ends after one year.','The spouse immediately becomes Filipino.'], 'Article IV, Section 4 retains Philippine citizenship unless an act or omission is deemed a renunciation under law.'],
  'constitution-separation': ['Locate the constitutional principle of separation of Church and State in Article II Section 6.', 'A reviewer asks whether the Constitution lets a religious body govern as the State. Which principle is most relevant?', ['Separation of Church and State','Legislative immunity','Presidential succession','Territorial jurisdiction'], 'Article II, Section 6 establishes separation of Church and State.'],
  'constitution-habeas': ['Apply Article III Section 15: invasion or rebellion and public safety requiring suspension.', 'A major flood occurs, with no invasion or rebellion. Can it alone justify suspension of the privilege of the writ of habeas corpus under Article III Section 15?', ['No. Invasion or rebellion and a public safety need are required.','Yes. Any disaster automatically qualifies.','Yes. A city vote automatically qualifies.','Yes. Any disruption of public services qualifies.'], 'The constitutional provision specifies invasion or rebellion when public safety requires suspension. A flood alone fails that condition.'],
  'ethics-conflict': ['Recognize a private interest that can impair faithful public duties under RA 6713.', 'A procurement officer helps evaluate a company in which she has a substantial stake. Which concern does this raise?', ['Conflict of interest','Timekeeping','Civil service eligibility','Record retention'], 'A financial stake can conflict with the officer’s duty to evaluate bids impartially.'],
  'ethics-norm': ['Apply RA 6713 commitment to public interest.', 'An employee is choosing between an option that benefits the public and one that serves their own private interest. Which norm directs the decision?', ['Commitment to public interest','Personal preference','Seniority','Political loyalty'], 'Section 4(a) puts public interest ahead of personal interest.'],
  'ethics-disclosure': ['Recognize what belongs in a SALN under RA 6713.', 'Which item belongs under liabilities in a SALN?', ['An outstanding loan','An office holiday','An attendance time','An examination score'], 'A liability is an obligation such as an outstanding loan. A SALN reports assets, liabilities, and net worth.'],
  'environment-eia': ['Identify a prospective environmental impact assessment.', 'Before building a road, a team studies how construction could affect streams and wildlife. What is this work?', ['Environmental impact assessment','Personnel appraisal','Asset inventory','Payroll reconciliation'], 'An environmental impact assessment considers likely effects of a proposed project before it proceeds.'],
  'environment-monitoring': ['Distinguish ongoing impact monitoring from initial assessment.', 'Which activity monitors an operating treatment plant’s environmental effects?', ['Sampling discharge every month','Choosing a site before design','Drafting a staffing chart','Writing a construction bid'], 'Repeated discharge sampling measures what is happening while the plant operates.'],
  'environment-mitigation': ['Identify mitigation that limits suspended sediment from dredging.', 'A crew wants to contain cloudy dredging water around the work area. Which measure directly helps?', ['A suitable floating silt curtain','More office lighting','A new project logo','A visitor counter'], 'A properly installed silt curtain can restrict the movement of suspended sediment.'],
  'data-share-01': ['Calculate a category’s share of a known total.', 'Of 120 forms, 30 are from District A. What percentage comes from District A?', ['25%','30%','40%','75%'], 'Divide the count by the total: 30 ÷ 120 = 0.25 = 25%.'],
  'data-change-01': ['Distinguish percentage points from relative percent change.', 'A response rate moves from 35% to 50%. How many percentage points did it rise?', ['15','50','35','43'], 'The difference between two percentages is measured in percentage points: 50 − 35 = 15.'],
  'data-compare-01': ['Compare rates using counts and the correct group denominators.', 'Clinic A serves 21 of 30 scheduled patients. Clinic B serves 39 of 60. Which has the higher rate?', ['Clinic A','Clinic B','They are equal','Cannot be determined'], 'A has 21 ÷ 30 = 70%. B has 39 ÷ 60 = 65%.'],
  'spell-01': ['Check English spellings with uncertain doubled consonants.', 'Select the correct spelling for the adjective meaning required.', ['necessary','neccessary','necesary','nessessary'], 'Necessary has one c and two s characters.'],
  'spell-02': ['Check the internal vowel in a commonly misspelled word.', 'Which spelling is correct for an organized group of people or things?', ['category','catagory','categry','catigory'], 'Category has the sequence cate- followed by -gory.'],
  'spell-03': ['Match a surname exactly, checking letter order.', 'Which entry matches the reference surname Manalansan?', ['Manalansan','Manalanson','Malanansan','Manalansaan'], 'Copy the full sequence from the reference, including the ending -ansan.'],
  'rights-01': ['Identify the independent Commission on Human Rights under Article XIII Section 17.', 'Which Article XIII office was created specifically as an independent body for human rights?', ['Commission on Human Rights','Civil Service Commission','Commission on Audit','Senate Electoral Tribunal'], 'Article XIII, Section 17 creates the independent Commission on Human Rights.'],
  'rights-02': ['Distinguish investigation of civil and political rights violations from unrelated government powers.', 'People complain that their civil rights were violated. Which action falls within the Commission on Human Rights’ constitutional functions?', ['Investigate the allegation.','Set the annual tax rate.','Conduct a national election.','Create a criminal statute.'], 'Article XIII, Section 18 includes investigating human rights violations involving civil and political rights.'],
  'rights-03': ['Recognize due process and equal protection under Article III Section 1.', 'A law treats similarly situated people differently. Which Article III Section 1 guarantee is most directly relevant?', ['Equal protection of the laws','Freedom of travel','Right against self-incrimination','Right to information'], 'Equal protection is the relevant guarantee when similarly situated people are treated differently.']
}

const variants = {
  'arithmetic-06': (n) => {
    const a = n + 4
    const b = n + 11
    const product = a * b
    return [
      'Evaluate (−' + a + ') × (−' + b + ').',
      [String(product), '−' + product, String(a + b), '−' + (a + b)],
      'Two negative factors give a positive product. ' + a + ' × ' + b + ' = ' + product + '.'
    ]
  },
  'sequence-01': (n) => {
    const terms = Array.from({ length: 5 }, (_, i) => (n + i + 2) ** 2)
    const next = n + 7
    return [
      'What comes after ' + terms.join(', ') + '?',
      [next ** 2, next ** 2 + 1, (next + 1) ** 2, terms[4] + 2].map(String),
      'These are consecutive squares. The next term is ' + next + '² = ' + next ** 2 + '.'
    ]
  },
  'data-share-01': (n) => {
    const count = n * 8 + 24
    const total = count * 5
    return [
      'Of ' + total + ' forms, ' + count + ' are from District A. What percentage comes from District A?',
      ['20%', '25%', '40%', '80%'],
      'Divide the category count by the total: ' + count + ' ÷ ' + total + ' = 0.20 = 20%.'
    ]
  },
  'data-change-01': (n) => {
    const initial = n * 3 + 10
    const final = initial + 12
    return [
      'A completion rate rises from ' + initial + '% to ' + final + '%. How many percentage points did it rise?',
      [12, final, initial, 14].map(String),
      'Subtract the earlier rate from the later rate: ' + final + ' − ' + initial + ' = 12 percentage points.'
    ]
  }
}

export function createPractice(questionId, random = Math.random) {
  if (!Object.hasOwn(bank, questionId)) return null
  const [skill, ...authored] = bank[questionId]
  const [stem, choices, feedback] = Object.hasOwn(variants, questionId)
    ? variants[questionId](1 + Math.floor(random() * 8))
    : authored
  const options = choices.map((text, index) => ({ id: String(index + 1), text }))
  // Shuffle presentation only. The server retains the stable correct option ID.
  for (let index = options.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1))
    ;[options[index], options[other]] = [options[other], options[index]]
  }
  return { skill, stem, options, answer: '1', feedback }
}

export function studentPractice(practice) {
  return { stem: practice.stem, options: practice.options }
}

export const practiceIds = Object.keys(bank)
