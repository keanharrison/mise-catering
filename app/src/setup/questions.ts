export type SetupQuestion = {
  id: string
  text: string
  /** Also accepts file uploads. */
  files?: boolean
  /** A line under the upload button, e.g. what is worth attaching. */
  fileHint?: string
  /** Checklist choices shown above the answer box. */
  options?: string[]
  placeholder?: string
}
export type SetupSection = { id: string; title: string; questions: SetupQuestion[] }

type Q = Omit<SetupQuestion, 'id'>
const q = (text: string, extra: Partial<Q> = {}): Q => ({ text, ...extra })

/** The questions we need Pearl Island to answer before launch. Numbered in the order shown. */
const raw: Array<{ id: string; title: string; questions: Q[] }> = [
  {
    id: 'menu', title: 'Menu And Pricing', questions: [
      q('We’re building from your January 2026 catering menu PDF and your current Spoonfed menu. Has anything been added, removed, repriced or changed since, including the minimums listed in the PDF?'),
      q('Your catering PDF doesn’t list prices. We have prices for the entrees, sides, salads and supplies sold through Spoonfed. Please send current prices for everything else on the PDF, including breakfast, appetizers, specialty entrees, hot boxes, sandwiches, salad lunches, desserts and drinks. A photo, spreadsheet or Spoonfed export is fine.', { files: true }),
      q('Spoonfed sells entrees and sides by the 6 oz serving. For a buffet order, how many servings per guest do you prepare? For example, for 20 guests, how many servings of entrees, sides and salads do you make, and do you make a little extra so you never run short?'),
      q('How many appetizers, desserts and breakfast items do you plan per guest?'),
      q('Is there a minimum for catering orders overall, such as a minimum number of guests or dollar amount?'),
      q('How many serving spoons, tongs and chafing sets do you send for a group of, say, 25 guests?'),
    ],
  },
  {
    id: 'rules', title: 'Rules And Payments', questions: [
      q('Spoonfed asks for 5 business days’ notice, and an email to info@pearlislandcatering.com, for orders over 50 guests. For smaller orders, how much notice do you need: 48 hours, 72 hours, or something else?'),
      q('How late can a customer change or cancel an order, and is there a fee?'),
      q('What do you charge for delivery, and how far will you deliver (your delivery radius)?'),
      q('Your website lists Tuesday–Friday, 11 AM–3 PM for 2GO pickup and delivery. Are those also your catering hours, or do you take catering orders at other times, such as early mornings or weekends? And how many events can you handle in one day?'),
      q('How do you handle payments (tax, tip, and deposits)?'),
      q('When do customers pay: at order, at pickup, or by invoice?'),
    ],
  },
  {
    id: 'operations', title: 'Daily Operations', questions: [
      q('When an order arrives, what do you do first, step by step?'),
      q('Your wife enters each order into Google Calendar. Which details does she enter, such as event name, time, address, headcount, items, contact and notes?', { files: true, fileHint: 'Optional: a screenshot of a recent calendar entry is a big help.' }),
      q('Who on your team reviews and accepts new catering orders, and who answers customer messages today? Do those messages come through Spoonfed, or by phone, email or text?'),
    ],
  },
  {
    id: 'assistant', title: 'The AI Assistant', questions: [
      q('Do you have a preference about the AI assistant’s vibe or feel when it talks to your customers? Describe it in your own words, or tell us if you’d rather leave it to us.'),
    ],
  },
  {
    id: 'analytics', title: 'Analytics And Results', questions: [
      q('In Spoonfed, which metrics or analytics do you find most useful? Is there any information you wish your catering platform could tell you about your customers?'),
      q('Which of these can you download from Spoonfed: order history (date, headcount, items, totals, pickup or delivery) and your menu with prices? Order history shows us how much food your events really use and gives your analytics a head start. If you can’t export, tell us and we’ll ask Spoonfed.', { files: true }),
      q('So Diego and Kean can align every feature to one north star metric, what result would make this worth keeping? For example: more catering orders, fewer phone calls, hours saved each week, fewer order mistakes, or bigger orders.'),
    ],
  },
  {
    id: 'tools', title: 'Your Current Tools', questions: [
      q('Who manages your website and domain name today: you, a web designer, or a service like Squarespace, Wix or GoDaddy? If you know the name of the service, tell us.'),
      q('How do customers pay in Spoonfed today, and with which card processor, such as Stripe or Square? Do you want to keep using it?'),
      q('Which Google account holds your catering calendar, and what email address do you use for the business?'),
      q('Is there other software we should know about, such as accounting (QuickBooks) or an email list tool?'),
    ],
  },
  {
    id: 'launch', title: 'Launch', questions: [
      q('When a customer taps “Order Catering” on pearlislandcatering.com, where should they land: a catering page on your own domain, or an address we host that your button links to?'),
      q('Do you want your existing Spoonfed customers brought over, so they don’t have to sign up again? If yes, please upload your customer list.', { files: true }),
      q('Since you pay Spoonfed month by month, when is your next billing date, and would you want it to keep running for a short overlap after we launch?'),
    ],
  },
  {
    id: 'knowledge', title: 'Monetizing Industry Knowledge', questions: [
      q('You want to share your restaurant know-how. Besides what’s in your head, which of these do you already have written down, recorded or saved anywhere? Check any that apply, and add a line on what you’d most like to teach other owners.', {
        files: true,
        fileHint: 'Optional: attach a few examples of anything you checked.',
        placeholder: 'Anything to add, including what you’d most like to teach other owners',
        options: [
          'Recipes and prep guides',
          'Staff training or how-to docs',
          'Event checklists',
          'Supplier lists and costs',
          'Past menus and prices',
          'Sales or cost spreadsheets',
          'Customer FAQ emails or texts',
          'Newsletters or social posts',
          'Videos or voice memos',
        ],
      }),
    ],
  },
]

let n = 0
export const sections: SetupSection[] = raw.map((section) => ({
  ...section,
  questions: section.questions.map((question) => {
    n += 1
    return { id: `q${n}`, ...question }
  }),
}))

export const allQuestions: SetupQuestion[] = sections.flatMap((section) => section.questions)
