export type SetupQuestion = { id: string; text: string; /** Also accepts file uploads. */ files?: boolean }
export type SetupSection = { id: string; title: string; intro?: string; questions: SetupQuestion[] }

/** The questions we need Pearl Island to answer before launch. Numbered in the order shown. */
const raw: Array<Omit<SetupSection, 'questions'> & { questions: Array<string | [string, 'files']> }> = [
  {
    id: 'menu', title: 'Menu and pricing', questions: [
      'Are the prices and dietary labels on your Spoonfed menu current and complete?',
      'Which items do you actually offer for catering?',
      'Which sides and salads go with each entree, and is anything included in the price?',
      'How many servings of entrees, sides and salads do you plan per guest?',
      'Do you add a buffer, such as 10–15%? If so, to which items?',
      'Are there minimum quantities per item or per order?',
      'Which supplies can be combined, and how many serving spoons, tongs and chafing sets do you use per headcount?',
    ],
  },
  {
    id: 'rules', title: 'Rules and money', questions: [
      'How much notice do you need: 48 hours, 72 hours, or 5 business days over 50 guests?',
      'How do you handle changes and cancellations, and what is the cutoff?',
      'Which orders need your personal review, and which should never be accepted automatically?',
      'What are your delivery areas, fees and minimums?',
      'What are your catering hours, blackout dates and maximum events per day?',
      'How do you handle tax, tip or service charge, and deposits?',
      'When do customers pay: at order, at pickup, or by invoice?',
    ],
  },
  {
    id: 'operations', title: 'Daily operations', questions: [
      'When an order arrives, what do you do first, step by step?',
      'What goes into Google Calendar, who enters it, and when?',
      'Who confirms orders, answers customer messages, and keeps the information up to date?',
      'Which emails or phone numbers should get a new-order alert?',
      'Who needs staff access? Please list names, emails and roles.',
    ],
  },
  {
    id: 'assistant', title: 'The AI assistant', questions: [
      'Which customer questions still become phone calls?',
      'What should the assistant answer for you, and what should it always hand to a person?',
      'How should it talk about allergies, gluten-free and vegan needs, and who confirms them?',
      'Is it okay to send customer questions to an AI provider? Any limits?',
      'Should it sound formal or casual? Is there anything it must never say or promise?',
    ],
  },
  {
    id: 'analytics', title: 'Analytics and results', questions: [
      'Which numbers would you look at each week?',
      ['Can you export your past orders from Spoonfed?', 'files'],
      'May we use your Square sales data, and how do we get access?',
      'What result would make this worth keeping: more orders, hours saved, fewer calls?',
    ],
  },
  {
    id: 'branding', title: 'Branding', questions: [
      ['Please upload your logo and a few food photos.', 'files'],
      'What colors represent your restaurant?',
      'What should your ordering page say to welcome customers?',
      'What web address do you want for ordering, and which website will link to it?',
    ],
  },
  {
    id: 'launch', title: 'Data and launch', questions: [
      'How long may we keep customer data, and who may see it?',
      'Should we import your Spoonfed customers and orders, or start fresh?',
      'Does this replace Spoonfed or sit beside it, and when does Spoonfed renew?',
      ['Please upload your terms and policies.', 'files'],
      'What date would you like to go live, and with how many customers first?',
    ],
  },
]

let n = 0
export const sections: SetupSection[] = raw.map((section) => ({
  ...section,
  questions: section.questions.map((q) => {
    n += 1
    return typeof q === 'string' ? { id: `q${n}`, text: q } : { id: `q${n}`, text: q[0], files: true }
  }),
}))

export const allQuestions: SetupQuestion[] = sections.flatMap((section) => section.questions)
