import { CardArt, type ArtKind } from './CardArt'

type Card = { art: ArtKind; question: string; title: string; detail: string }

// Six moments from a restaurant's back office, in one fanned row of square cards. (`detail` is kept for later; the square card shows only the question and title.)
const CARDS: Card[] = [
  { art: 'receipt', question: "Where's that receipt?", title: 'The shoebox', detail: 'Paper receipts pile up until someone types them in.' },
  { art: 'sheet', question: 'Whose spreadsheet is this?', title: 'Quantities, final_v7', detail: "Prep counts that live on one person's laptop." },
  { art: 'phone', question: 'Can you cater for 40?', title: 'The call during rush', detail: 'The same questions, answered again instead of cooking.' },
  { art: 'calendar', question: 'Who put it on the calendar?', title: 'Typed in by hand', detail: 'Order details copied between systems, one at a time.' },
  { art: 'slip', question: 'What did the slip say?', title: '"trays???"', detail: 'Handwriting nobody can read at 6 AM.' },
  { art: 'inbox', question: 'How many unread?', title: 'Re: Re: Fwd:', detail: 'Orders buried in email threads.' },
]

/** A fanned row of punch-hole cards. Hovering one straightens it and nudges its neighbors aside. */
export function Cards({ colors }: { colors: [string, string, string] }) {
  return (
    <div className="lp-cards" role="list" aria-label="Back-office moments Mise replaces">
      {CARDS.map((card, i) => (
        <div key={card.title} className="lp-mini" role="listitem">
          <CardArt kind={card.art} colors={colors} seed={i} />
          <div className="lp-mini-body">
            <p className="lp-mini-q">{card.question}</p>
            <h3 className="lp-mini-title">{card.title}</h3>
          </div>
        </div>
      ))}
    </div>
  )
}
