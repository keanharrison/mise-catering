type Piece = { id: string; left: number; top: number; width: number; rot: number; z: number; delay: number; className?: string; children: React.ReactNode }

const bar = (w: number) => <i className="lp-sc-bar" style={{ width: `${w}%` }} />

// A pile of the paper and screens a small restaurant runs on. Illustration only; nothing here is real data.
const PIECES: Piece[] = [
  { id: 'receipt', left: 5, top: 5, width: 22, rot: -9, z: 2, delay: 0, className: 'lp-sc-receipt', children: (
    <>
      <p className="lp-sc-head">TOTAL???</p>
      {bar(80)}{bar(55)}{bar(70)}{bar(45)}{bar(65)}{bar(50)}
    </>
  ) },
  { id: 'sheet', left: 28, top: 8, width: 40, rot: 4, z: 1, delay: 1, children: (
    <>
      <p className="lp-sc-meta">Quantities_final_v7.xlsx</p>
      <div className="lp-sc-grid" aria-hidden="true">{Array.from({ length: 20 }, (_, i) => <i key={i} className={i < 4 ? 'is-head' : ''} />)}</div>
    </>
  ) },
  { id: 'sticky-a', left: 67, top: 3, width: 25, rot: 10, z: 4, delay: 0.5, className: 'lp-sc-sticky', children: <p className="lp-sc-hand">Call back about Saturday</p> },
  { id: 'slip', left: 8, top: 45, width: 30, rot: -5, z: 4, delay: 1.5, className: 'lp-sc-slip', children: (
    <>
      <p className="lp-sc-meta">Order slip</p>
      <p className="lp-sc-hand">Fri 12:30</p>
      <p className="lp-sc-hand">40 people</p>
      <p className="lp-sc-hand">trays???</p>
    </>
  ) },
  { id: 'call', left: 40, top: 40, width: 38, rot: 3, z: 5, delay: 0.8, children: (
    <>
      <p className="lp-sc-meta">Incoming call</p>
      <p className="lp-sc-text">"Can you cater for 40?"</p>
    </>
  ) },
  { id: 'inbox', left: 58, top: 66, width: 36, rot: -4, z: 3, delay: 1.2, children: (
    <>
      <p className="lp-sc-meta">Inbox <b className="lp-sc-badge">7</b></p>
      <p className="lp-sc-line">Re: Friday lunch?</p>
      <p className="lp-sc-line">Fwd: quantities</p>
      <p className="lp-sc-line">Re: Re: pickup time</p>
    </>
  ) },
  { id: 'calendar', left: 4, top: 75, width: 27, rot: 6, z: 2, delay: 0.3, children: (
    <>
      <p className="lp-sc-meta">Calendar, typed by hand</p>
      <p className="lp-sc-line">Fri 12:30</p>
      {bar(70)}
    </>
  ) },
  { id: 'sticky-b', left: 33, top: 76, width: 22, rot: -8, z: 6, delay: 1.8, className: 'lp-sc-sticky', children: <p className="lp-sc-hand">pickup 12:30??</p> },
]

/** An overlapping pile of everyday paperwork and screens: the scattered way a small restaurant keeps its books. */
export function Scatter() {
  return (
    <div className="lp-scatter" aria-hidden="true">
      {PIECES.map((p) => (
        <div
          key={p.id} className={`lp-sc ${p.className ?? ''}`}
          style={{ left: `${p.left}%`, top: `${p.top}%`, width: `${p.width}%`, zIndex: p.z, '--rot': `${p.rot}deg`, '--delay': `${p.delay}s` } as React.CSSProperties}
        >
          {p.children}
        </div>
      ))}
    </div>
  )
}
