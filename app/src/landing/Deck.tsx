import { DitherPanel } from '../login/DitherPanel'

const STEPS = [
  { id: undefined, who: 'The customer', title: 'Describes the event', body: 'Date, headcount and dietary needs, in their own words, or by choosing items directly.', rot: -3, seed: 1018 },
  { id: 'assistant', who: 'Mise', title: 'Proposes an order', body: 'Built from your approved menu, prices and portion rules. The customer can change anything.', rot: 1.5, seed: 1015 },
  { id: 'review', who: 'Your team', title: 'Reviews and decides', body: 'Confirm it, ask a question, suggest a change, or decline with a reason.', rot: -1, seed: 1021 },
  { id: undefined, who: 'The customer', title: 'Knows where it stands', body: 'It reads "Waiting for confirmation" until your team says yes. Nothing is promised early.', rot: 3, seed: 1031 },
]

/** A fanned row of cards, one per step of an order. Each header is a dithered field in the theme's accent. */
export function Deck({ colors }: { colors: [string, string, string] }) {
  return (
    <section id="how-it-works" className="lp-section">
      <h2>From event to confirmed order.</h2>
      <p className="lp-section-lead">Four steps, and your team makes the only decision that matters.</p>
      <div className="lp-deck">
        {STEPS.map((s) => (
          <article key={s.title} id={s.id} className="lp-card" style={{ '--rot': `${s.rot}deg` } as React.CSSProperties}>
            <DitherPanel seed={s.seed} colors={colors} cell={5} className="lp-card-art" />
            <div className="lp-card-body">
              <p className="lp-card-who">{s.who}</p>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
