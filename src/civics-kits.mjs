const pathway=(title,lesson,example,rows)=>({title,lesson,example,rows})
export const civicsKits = {
  'civil-rights': pathway('Constitutional rights in public life',
    'Identify whose action is being restricted, the protected interest, and any exception in the relevant section of Article III.',
    'An office proposes a religious qualification for exercising a political right. Article III, Section 5 expressly rules out that kind of test.',
    [
      ['Which article contains the Bill of Rights?','Article III','Article VI',0,'Article III contains the Bill of Rights. Article VI establishes the legislative branch.'],
      ['Which provision addresses taking privately owned land for a public facility?','Article III, Section 10 on contracts','Article III, Section 9 on public use and compensation',1,'Section 9 concerns government taking of private property for public use and requires just compensation.'],
      ['Residents wish to gather peacefully to petition a council. Which listed right directly concerns their planned action?','Peaceable assembly and petition','Protection against impairment of contracts',0,'Section 4 protects peaceable assembly and petition. Contract impairment addresses a different government action.'],
      ['Under Article III, Section 7, which reading of access to official records is accurate?','Access is absolute for every document.','Access on matters of public concern is subject to limitations set by law.',1,'Section 7 recognizes access while expressly allowing legal limitations. The absolute reading omits that qualification.'],
      ['A proposal conditions exercise of a political right on belonging to a particular religion. Which textual protection rules out that condition?','The prohibition on religious tests in Section 5','The rule on just compensation in Section 9',0,'Section 5 specifically bars tests of religion for civil or political rights. Compensation addresses government taking of property.'],
      ['A case asks about the permitted grounds for a legal restriction on travel. Which list matches Article III, Section 6?','Administrative convenience or routine workload','National security, public safety, or public health, as provided by law',1,'Section 6 lists those three grounds and ties them to law. Office convenience is absent from the provision.'],
    ]),
  'public-ethics': pathway('Public service ethics under RA 6713',
    'Match the specific conduct to the governing principle. Section 4 sets conduct standards for public officials and employees. Section 5 lists specified duties.',
    'Choosing how to use an office vehicle involves public interest. An official should use public resources for public work and avoid spending them for personal convenience.',
    [
      ['Under Section 4, which interest should take priority in official work?','Public interest','Personal interest of the official',0,'Section 4 places public interest first. Personal benefit does not direct the use of official powers.'],
      ['Which practice fits the professionalism standard?','Offering routine patronage as part of a public role','Checking the accuracy of official work and discouraging undue patronage',1,'Section 4 links professionalism to skill and excellence and calls on personnel to discourage the perception that they dispense undue patronage.'],
      ['Which expectation relates to simple living under Section 4?','A lifestyle appropriate to position and income','A lifestyle measured by an official’s authority to spend public funds',0,'Simple living concerns a modest lifestyle appropriate to position and income. Public spending authority does not determine personal means.'],
      ['A resident asks how to submit a public-service request. Which practice aligns with the responsiveness standard in Section 4?','Keep the procedure obscure even when it may be shared.','Explain the procedure clearly, subject to applicable limits.',1,'Section 4 supports clear procedures and openness, subject to legal and public-interest qualifications. Obscurity creates needless barriers.'],
      ['An official proposes diverting fuel budgeted for inspections to a private event. Which standard directly addresses the use of that fuel?','Commitment to public interest and economical use of resources','The rule for choosing an office address',0,'The fuel is a public resource. Section 4 requires honest, economical use in the public interest. The choice of address is irrelevant.'],
      ['Under the general public-letter response duty stated in RA 6713 Section 5(a), which reply meets the stated duration and content requirements?','An acknowledgment sent within 15 working days without stating the action taken','A reply within 15 working days of receipt that states the action taken',1,'Section 5(a) gives a 15-working-day period from receipt and requires the reply to state the action taken. A bare acknowledgment omits the latter requirement.'],
    ]),
}
