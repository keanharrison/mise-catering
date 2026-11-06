import type { ReactNode } from 'react'

type Chore = { id: string; x: number; y: number; rot: number; delay: number; node: ReactNode }

const bar = (w: number) => <i className="lp-bar" style={{ width: `${w}%` }} />

// The scattered, manual chores of a restaurant's back office. Illustrations only: nothing here is real data.
const CHORES: Chore[] = [
  { id: 'call', x: 13, y: 26, rot: -2, delay: 0, node: (
    <>
      <p className="lp-chore-meta">Incoming call</p>
      <p className="lp-chore-text">"Can you cater for 40?"</p>
    </>
  ) },
  { id: 'email', x: 33, y: 56, rot: 1.5, delay: 0.8, node: (
    <>
      <p className="lp-chore-meta">Inbox <b className="lp-badge">7</b></p>
      <p className="lp-chore-line">Re: Friday lunch?</p>
      <p className="lp-chore-line">Fwd: quantities</p>
      <p className="lp-chore-line">Re: Re: pickup time</p>
    </>
  ) },
  { id: 'slip', x: 50, y: 22, rot: -4, delay: 1.6, node: (
    <>
      <p className="lp-chore-meta">Order slip</p>
      <p className="lp-chore-hand">Fri 12:30</p>
      <p className="lp-chore-hand">40 people</p>
      <p className="lp-chore-hand">trays???</p>
    </>
  ) },
  { id: 'sheet', x: 68, y: 60, rot: 1, delay: 0.4, node: (
    <>
      <p className="lp-chore-meta">Quantities.xlsx</p>
      <div className="lp-grid" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => <i key={i} className={i < 3 ? 'is-head' : ''} />)}
      </div>
    </>
  ) },
  { id: 'text', x: 87, y: 24, rot: 2.5, delay: 1.2, node: (
    <>
      <p className="lp-chore-meta">Message</p>
      <p className="lp-chore-text">Is that enough food?</p>
    </>
  ) },
  { id: 'calendar', x: 14, y: 78, rot: 2, delay: 2, node: (
    <>
      <p className="lp-chore-meta">Calendar, typed by hand</p>
      <p className="lp-chore-line">Fri 12:30</p>
      {bar(70)}
    </>
  ) },
  { id: 'note', x: 90, y: 74, rot: -5, delay: 0.6, node: (
    <p className="lp-chore-hand">Call back about Saturday</p>
  ) },
]

// Which chores connect to which, drawn as dashed curves behind the cards.
const LINKS: Array<[number, number]> = [[0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [3, 6], [0, 2]]

function curve(a: Chore, b: Chore, bend: number) {
  const x1 = a.x * 10, y1 = a.y * 4, x2 = b.x * 10, y2 = b.y * 4
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2
  const dx = x2 - x1, dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const cx = mx + (-dy / len) * bend, cy = my + (dx / len) * bend
  return `M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`
}

/** A stage of floating chore cards joined by slowly moving dashed lines. */
export function Collage() {
  return (
    <div className="lp-stage" aria-hidden="true">
      <svg className="lp-links" viewBox="0 0 1000 400" preserveAspectRatio="none">
        {LINKS.map(([from, to], i) => (
          <path key={`${from}-${to}`} d={curve(CHORES[from], CHORES[to], i % 2 ? 70 : -70)} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      {CHORES.map((c) => (
        <div
          key={c.id} className={`lp-chore lp-chore-${c.id}`}
          style={{ left: `${c.x}%`, top: `${c.y}%`, '--rot': `${c.rot}deg`, '--delay': `${c.delay}s` } as React.CSSProperties}
        >
          {c.node}
        </div>
      ))}
    </div>
  )
}
