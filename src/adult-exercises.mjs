const item = (level,question,answer,steps,mistake) => ({level,question,answer:String(answer),steps,mistake})
export const adultExercises = {
  'basic-arithmetic': [
    item('Beginner','An office received 1,250 applications on Monday and 875 on Tuesday. If 368 applications were rejected, how many remained?',1757,
      ['Find the number still in the queue. Monday and Tuesday both add applications, so combine those counts before removing rejections.',
       'The office received 1,250 + 875 = 2,125 applications. Subtract the 368 rejections: 2,125 − 368 = 1,757.',
       'Check the total: 1,757 remaining + 368 rejected = 2,125 applications received.'], 'Use applications from both days. The rejections are already part of the total received.'),
    item('Intermediate','An office had 1,840 active files before processing 415 new files and closing some records. It ended the day with 1,972 active files. How many files were closed?',283,
      ['The number closed is unknown. After adding 415, the office would have 2,255 files if none were closed.',
       'The gap between that total and the actual total is the count closed: 2,255 − 1,972 = 283.',
       'Check: 1,840 + 415 − 283 = 1,972.'], 'The increase of 132 is the net change. It combines new and closed files.'),
  ],
  percent: [
    item('Intermediate','An employee earns ₱28,500 monthly. If 12% is deducted and ₱6,750 is spent on household expenses, how much remains?',18330,
      ['Find what remains after two deductions. The 12% applies to the original salary. The expense is a separate fixed amount.',
       'Convert 12% to 12/100. The deduction is 28,500 × 12/100 = 3,420 pesos, leaving 25,080 pesos.',
       'Subtract household expenses: 25,080 − 6,750 = 18,330 pesos. Check: 18,330 + 6,750 + 3,420 = 28,500.'], 'Apply the percentage to the salary before subtracting the household expenses.'),
    item('Examination','A department allocated 35% of its budget to equipment and 25% to training. If the remaining budget is ₱480,000, what was the original budget?',1200000,
      ['Both percentages are shares of the same original budget. Together they use 35% + 25% = 60%, leaving 40%.',
       'Let the original budget be x. The remaining amount gives 0.40x = 480000. Divide both sides by 0.40 to find x = 1,200,000 pesos.',
       'Check the allocation. Equipment takes 420,000 pesos and training takes 300,000 pesos, leaving 480,000 pesos.'], 'Dividing by the remaining fraction finds the original whole. Multiplying by 40% would find a smaller share.'),
  ],
  'percent-change': [
    item('Advanced','A supplier raises a ₱40,000 quote by 15%, then offers a 10% discount on the increased quote. How much higher is the final quote than the original, in pesos?',1400,
      ['Apply each percentage to its own base. The increase uses the original quote, and the discount uses the increased quote.',
       'The increase is 40,000 × 15/100 = 6,000, so the new quote is 46,000 pesos. The discount is 46,000 × 10/100 = 4,600 pesos.',
       'The final quote is 46,000 − 4,600 = 41,400 pesos. Compare it with 40,000: the difference is 1,400 pesos.'], 'Subtracting 10 from 15 would compare percentages computed from different base amounts.'),
  ],
  'whole-subtract': [
    item('Beginner','A records office must archive 2,460 folders. It archived 1,785 by noon. How many folders are still waiting?',675,
      ['The total is 2,460 and the count already archived is 1,785. The unknown is the remainder.',
       'Subtract the archived count from the total: 2,460 − 1,785 = 675 folders.',
       'Check by adding the two groups back together: 1,785 + 675 = 2,460.'], 'The number already archived is one part of the total, so it should be removed once.'),
  ],
  'whole-multiply': [
    item('Beginner','A regional office orders 26 boxes of 48 envelopes. How many envelopes will it receive?',1248,
      ['Each box contains the same number of envelopes. Multiply the number of boxes by envelopes per box.',
       'Break 26 boxes into 20 and 6. The groups contain 20 × 48 = 960 and 6 × 48 = 288 envelopes.',
       'Add the groups: 960 + 288 = 1,248. Check: 48 × 26 can also be calculated as 50 × 26 − 2 × 26 = 1,300 − 52.'], 'Adding boxes to envelopes per box would combine different quantities.'),
  ],
}
