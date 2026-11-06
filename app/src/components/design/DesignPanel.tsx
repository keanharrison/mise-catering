import { useState } from 'react'
import { COMBOS, FONTS, isDarkPaper, resolve, type ChatShape, type ChatStyle, type FontChoice, type LineTone, type Pill, type Theme } from '../../lib/designTheme'

type Props = {
  theme: Theme
  onChange: (patch: Partial<Theme>) => void
  onReset: () => void
  /** The sign-in page also offers the backdrop tile size; the product offers shape, type and chat options. */
  surface: 'login' | 'product'
  /** Start collapsed (the product keeps it out of the way). */
  defaultOpen?: boolean
}

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

function FontList({ value, onChange }: { value: FontChoice; onChange: (v: FontChoice) => void }) {
  return (
    <div className="dp-fonts" role="listbox" aria-label="Font">
      {(Object.keys(FONTS) as FontChoice[]).map((id) => (
        <button
          key={id} type="button" role="option" aria-selected={value === id} className="dp-font"
          style={{ fontFamily: FONTS[id].stack }} onClick={() => onChange(id)}
        >
          {FONTS[id].label}
        </button>
      ))}
    </div>
  )
}

function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Array<[T, string]>; onChange: (v: T) => void }) {
  return (
    <div className="dp-row">
      <span className="dp-label" id={`seg-${label}`}>{label}</span>
      <div className="dp-seg" role="group" aria-labelledby={`seg-${label}`}>
        {options.map(([id, text]) => <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange(id)}>{text}</button>)}
      </div>
    </div>
  )
}

export function DesignPanel({ theme, onChange, onReset, surface, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const r = resolve(theme)
  const product = surface === 'product'
  const comboButton = (c: (typeof COMBOS)[number]) => (
    <button
      key={c.name} type="button" className="dp-combo" title={c.name} aria-label={`${c.name} combination`}
      data-active={theme.accent === c.theme.accent && theme.ink === c.theme.ink && theme.paper === c.theme.paper}
      onClick={() => onChange({ ...c.theme, hover: null, mid: null })}
    >
      <span className="dp-combo-chip" style={{ background: c.theme.paper, borderColor: c.theme.ink }}>
        <i style={{ background: c.theme.accent }} /><b style={{ background: c.theme.ink }} />
      </span>
      {c.name}
    </button>
  )
  const dark = isDarkPaper(theme.paper)

  return (
    <>
      <button type="button" className="dp-toggle" data-surface={surface} onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="design-panel">
        {open ? 'Hide design' : 'Design'}
      </button>
      <aside id="design-panel" className="dp" data-open={open} data-surface={surface} aria-label="Design controls">
        <header className="dp-head">
          <h2>Design</h2>
          <button type="button" className="dp-link" onClick={onReset}>Reset</button>
        </header>

        <section>
          <h3>Mode</h3>
          <div className="dp-chips">
            <button type="button" aria-pressed={!dark} onClick={() => onChange({ ink: '#111111', paper: '#ffffff', hover: null, mid: null })}>Light</button>
            <button type="button" aria-pressed={dark} onClick={() => onChange({ ink: '#f4f2ef', paper: '#1a1919', hover: null, mid: null })}>Dark</button>
          </div>
        </section>

        <section>
          <h3>Combinations</h3>
          <p className="dp-swatches-group">Light</p>
          <div className="dp-combos">{COMBOS.filter((c) => c.mode === 'light').map(comboButton)}</div>
          <p className="dp-swatches-group" style={{ marginTop: 12 }}>Dark</p>
          <div className="dp-combos">{COMBOS.filter((c) => c.mode === 'dark').map(comboButton)}</div>
        </section>

        <section>
          <h3>Colors</h3>
          <ColorRow label="Accent" value={r.accent} onChange={(accent) => onChange({ accent })} />
          <ColorRow label="Hover" value={r.hover} auto={theme.hover === null} onChange={(hover) => onChange({ hover })} onAuto={() => onChange({ hover: null })} />
          {product && <ColorRow label="Panel tint" value={r.mid} auto={theme.mid === null} onChange={(mid) => onChange({ mid })} onAuto={() => onChange({ mid: null })} />}
          <ColorRow label="Text" value={theme.ink} onChange={(ink) => onChange({ ink })} />
          <ColorRow label="Background" value={theme.paper} onChange={(paper) => onChange({ paper, mid: theme.mid })} />
        </section>

        {product ? (
          <>
            <section>
              <h3>Shape</h3>
              <div className="dp-row">
                <label className="dp-label" htmlFor="dp-radius">Corner radius <em>{theme.radius}px</em></label>
                <input id="dp-radius" type="range" min={0} max={24} value={theme.radius} onChange={(e) => onChange({ radius: Number(e.target.value) })} />
              </div>
              <Seg<Pill> label="Buttons" value={theme.buttons} options={[['match', 'Match radius'], ['pill', 'Pill']]} onChange={(buttons) => onChange({ buttons })} />
              <Seg<Pill> label="Fields" value={theme.fields} options={[['match', 'Match radius'], ['pill', 'Pill']]} onChange={(fields) => onChange({ fields })} />
            </section>

            <section>
              <h3>Type</h3>
              <FontList value={theme.font} onChange={(font) => onChange({ font })} />
            </section>

            <section>
              <h3>Lines</h3>
              <Seg<LineTone> label="Dividers and cards" value={theme.lines} options={[['soft', 'Soft'], ['neutral', 'Gray'], ['strong', 'Accent']]} onChange={(lines) => onChange({ lines })} />
              <Seg<'accent' | 'neutral'> label="Field borders" value={theme.fieldBorder} options={[['accent', 'Accent'], ['neutral', 'Gray']]} onChange={(fieldBorder) => onChange({ fieldBorder })} />
            </section>

            <section>
              <h3>Order chat</h3>
              <Seg<ChatShape> label="Shape" value={theme.chatShape} options={[['pill', 'Pill'], ['rounded', 'Rounded'], ['sharp', 'Sharp']]} onChange={(chatShape) => onChange({ chatShape })} />
              <Seg<ChatStyle> label="Background" value={theme.chatStyle} options={[['gradient', 'Gradient'], ['tint', 'Tint'], ['plain', 'Plain']]} onChange={(chatStyle) => onChange({ chatStyle })} />
              <div className="dp-row">
                <label className="dp-label" htmlFor="dp-intensity">Gradient depth <em>{theme.chatIntensity}%</em></label>
                <input id="dp-intensity" type="range" min={0} max={100} value={theme.chatIntensity} onChange={(e) => onChange({ chatIntensity: Number(e.target.value) })} />
              </div>
            </section>
          </>
        ) : (
          <>
          <section>
            <h3>Type</h3>
            <FontList value={theme.font} onChange={(font) => onChange({ font })} />
          </section>
          <section>
            <h3>Sign-up backdrop</h3>
            <ColorRow label="Tint" value={r.mid} auto={theme.mid === null} onChange={(mid) => onChange({ mid })} onAuto={() => onChange({ mid: null })} />
            <div className="dp-row">
              <label className="dp-label" htmlFor="dp-cell">Tile size <em>{theme.cell}px</em></label>
              <input id="dp-cell" type="range" min={2} max={12} value={theme.cell} onChange={(e) => onChange({ cell: Number(e.target.value) })} />
            </div>
          </section>
          </>
        )}
      </aside>
    </>
  )
}
