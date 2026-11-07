import { CardArt, type ArtKind } from './CardArt'

// Each card names something that happens in a restaurant's back office, then what it costs the owner.
// No statistics on purpose: add real numbers only when there is a source for them.
type Card = { art: ArtKind; pain: string; effect: string }

const CARDS: Card[] = [
  { art: 'phone', pain: 'Orders arrive by phone and email', effect: 'Hours lost every week answering the same questions.' },
  { art: 'receipt', pain: 'Receipts pile up in a drawer', effect: 'Month-end turns into a scramble for the bookkeeper.' },
  { art: 'calendar', pain: 'Schedules are built by hand', effect: 'Every shift swap becomes a thread of texts.' },
  { art: 'sheet', pain: 'Inventory is counted on paper', effect: 'You only see the waste and over-ordering later.' },
  { art: 'slip', pain: 'Orders are written, then retyped', effect: 'Small mistakes reach the kitchen and the customer.' },
  { art: 'inbox', pain: 'Guest messages sit unread', effect: 'Regulars and new customers go unanswered.' },
]

/** A fanned row of punch-hole cards. Hovering one straightens it and nudges its neighbors aside. */
export function Cards({ colors }: { colors: [string, string, string] }) {
  return (
    <div className="lp-cards" role="list" aria-label="Common back-office problems in a restaurant">
      {CARDS.map((card, i) => (
        <div key={card.pain} className="lp-mini" role="listitem">
          <CardArt kind={card.art} colors={colors} seed={i} />
          <div className="lp-mini-body">
            <h3 className="lp-mini-title">{card.pain}</h3>
            <p className="lp-mini-effect">{card.effect}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
