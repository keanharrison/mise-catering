import { useState } from 'react'
import { PRESETS, mix, resolve, type Theme } from './theme'

type Props = { theme: Theme; onChange: (patch: Partial<Theme>) => void; onReset: () => void }

function ColorRow({ label, value, onChange, auto, onAuto }: {
  label: string; value: string; onChange: (v: string) => void; auto?: boolean; onAuto?: () => void
}) {
  return (
    <div className="dp-row">
      <label className="dp-label">{label}{auto && <em> auto</em>}</label>
      <div className="dp-controls">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} aria-label={`${label} color`} />
        <input
          className="dp-hex" value={value} spellCheck={false} aria-label={`${label} hex`}
          onChange={(e) => /^#[0-9a-f]{6}$/i.test(e.target.value) && onChange(e.target.value.toLowerCase())}
        />
        {onAuto && !auto && <button type="button" className="dp-link" onClick={onAuto}>auto</button>}
      </div>
    </div>
  )
}

export function DesignPanel({ theme, onChange, onReset }: Props) {
  const [open, setOpen] = useState(true)
  const r = resolve(theme)

  return (
    <>
      <button type="button" className="dp-toggle" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="design-panel">
        {open ? 'Hide design' : 'Design'}
      </button>
      <aside id="design-panel" className="dp" data-open={open} aria-label="Design controls">
        <header className="dp-head">
          <h2>Design</h2>
          <button type="button" className="dp-link" onClick={onReset}>Reset</button>
        </header>

        <section>
          <h3>Presets <em className="dp-current">{PRESETS.find((p) => p.theme.accent === theme.accent)?.name ?? 'Custom'}</em></h3>
          <div className="dp-swatches">
            {PRESETS.map((p) => (
              <button
                key={p.name} type="button" title={p.name} aria-label={p.name}
                className="dp-swatch" data-active={theme.accent === p.theme.accent}
                style={{ background: p.theme.accent }}
                onClick={() => onChange({ ...p.theme, hover: null, mid: null })}
              />
            ))}
          </div>
        </section>

        <section>
          <h3>Colors</h3>
          <ColorRow label="Accent" value={r.accent} onChange={(accent) => onChange({ accent })} />
          <ColorRow label="Hover" value={r.hover} auto={theme.hover === null} onChange={(hover) => onChange({ hover })} onAuto={() => onChange({ hover: null })} />
          <ColorRow label="Panel tint" value={r.mid} auto={theme.mid === null} onChange={(mid) => onChange({ mid })} onAuto={() => onChange({ mid: null })} />
          <ColorRow label="Text" value={theme.ink} onChange={(ink) => onChange({ ink })} />
          <ColorRow label="Background" value={theme.paper} onChange={(paper) => onChange({ paper, mid: theme.mid })} />
        </section>

        <section>
          <h3>Backdrop texture</h3>
          <div className="dp-row">
            <label className="dp-label" htmlFor="dp-cell">Tile size <em>{theme.cell}px</em></label>
            <input id="dp-cell" type="range" min={2} max={12} value={theme.cell} onChange={(e) => onChange({ cell: Number(e.target.value) })} />
          </div>
        </section>

        <section>
          <h3>Quick contrast</h3>
          <div className="dp-chips">
            <button type="button" onClick={() => onChange({ ink: '#111111', paper: '#ffffff' })}>White</button>
            <button type="button" onClick={() => onChange({ ink: '#1a1410', paper: mix(theme.accent, '#ffffff', 0.94) })}>Warm</button>
            <button type="button" onClick={() => onChange({ ink: '#ffffff', paper: '#111111' })}>Dark</button>
          </div>
        </section>
      </aside>
    </>
  )
}
