import { useEffect, useRef } from 'react'

type Draw = (ctx: CanvasRenderingContext2D, u: number, ink: string, accent: string) => void

// Simple line icons drawn in a unit box of half-size u. Generic restaurant-admin objects, not brand logos.
const ICONS: Draw[] = [
  (c, u, ink, accent) => { c.strokeRect(-u, -u * 0.8, u * 2, u * 1.8); c.fillStyle = accent; c.fillRect(-u, -u * 0.8, u * 2, u * 0.6); c.beginPath(); c.moveTo(-u * 0.5, -u * 1.1); c.lineTo(-u * 0.5, -u * 0.5); c.moveTo(u * 0.5, -u * 1.1); c.lineTo(u * 0.5, -u * 0.5); c.stroke(); c.fillStyle = ink; c.fillRect(-u * 0.5, u * 0.15, u * 0.35, u * 0.35); },
  (c, u) => { c.strokeRect(-u, -u * 0.7, u * 2, u * 1.4); c.beginPath(); c.moveTo(-u, -u * 0.7); c.lineTo(0, u * 0.1); c.lineTo(u, -u * 0.7); c.stroke(); },
  (c, u, ink) => { c.beginPath(); c.moveTo(-u * 0.75, -u); c.lineTo(u * 0.75, -u); c.lineTo(u * 0.75, u); c.lineTo(u * 0.4, u * 0.75); c.lineTo(0, u); c.lineTo(-u * 0.4, u * 0.75); c.lineTo(-u * 0.75, u); c.closePath(); c.stroke(); c.fillStyle = ink; for (const y of [-0.5, -0.1, 0.3]) c.fillRect(-u * 0.4, u * y, u * 0.8, u * 0.12); },
  (c, u, _ink, accent) => { c.fillStyle = accent; c.fillRect(-u, -u * 0.9, u * 2, u * 0.4); c.strokeRect(-u, -u * 0.9, u * 2, u * 1.8); c.beginPath(); for (const y of [-0.5, -0.05, 0.4]) { c.moveTo(-u, u * y); c.lineTo(u, u * y); } for (const x of [-0.33, 0.33]) { c.moveTo(u * x, -u * 0.9); c.lineTo(u * x, u * 0.9); } c.stroke(); },
  (c, u, _ink, accent) => { c.beginPath(); c.roundRect(-u * 0.55, -u, u * 1.1, u * 2, u * 0.25); c.stroke(); c.fillStyle = accent; c.beginPath(); c.arc(0, u * 0.65, u * 0.12, 0, Math.PI * 2); c.fill(); c.beginPath(); c.moveTo(-u * 0.2, -u * 0.75); c.lineTo(u * 0.2, -u * 0.75); c.stroke(); },
  (c, u, _ink, accent) => { c.fillStyle = accent; c.beginPath(); c.roundRect(-u, -u * 0.8, u * 2, u * 1.25, u * 0.3); c.fill(); c.stroke(); c.beginPath(); c.moveTo(-u * 0.3, u * 0.45); c.lineTo(-u * 0.55, u * 0.95); c.lineTo(u * 0.1, u * 0.45); c.stroke(); },
  (c, u, ink, accent) => { c.beginPath(); c.roundRect(-u, -u * 0.7, u * 2, u * 1.4, u * 0.2); c.stroke(); c.fillStyle = accent; c.fillRect(-u, -u * 0.4, u * 2, u * 0.3); c.fillStyle = ink; c.fillRect(-u * 0.75, u * 0.25, u * 0.7, u * 0.14); },
  (c, u, _ink, accent) => { c.strokeRect(-u, -u * 0.55, u * 1.3, u * 1.1); c.beginPath(); c.moveTo(u * 0.3, -u * 0.2); c.lineTo(u * 0.8, -u * 0.2); c.lineTo(u, u * 0.1); c.lineTo(u, u * 0.55); c.lineTo(u * 0.3, u * 0.55); c.stroke(); c.fillStyle = accent; for (const x of [-0.5, 0.6]) { c.beginPath(); c.arc(u * x, u * 0.65, u * 0.22, 0, Math.PI * 2); c.fill(); c.stroke(); } },
  (c, u, ink, accent) => { c.strokeRect(-u * 0.75, -u * 0.9, u * 1.5, u * 1.9); c.fillStyle = accent; c.fillRect(-u * 0.35, -u * 1.1, u * 0.7, u * 0.35); c.strokeRect(-u * 0.35, -u * 1.1, u * 0.7, u * 0.35); c.fillStyle = ink; for (const y of [-0.35, 0.05, 0.45]) c.fillRect(-u * 0.45, u * y, u * 0.9, u * 0.12); },
  (c, u, _ink, accent) => { c.beginPath(); c.arc(0, 0, u, 0, Math.PI * 2); c.stroke(); c.fillStyle = accent; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, u * 0.9, -Math.PI / 2, 0); c.closePath(); c.fill(); c.beginPath(); c.moveTo(0, -u * 0.6); c.lineTo(0, 0); c.lineTo(u * 0.5, u * 0.2); c.stroke(); },
]

/**
 * A grid of rounded tiles that grows toward the middle and fades toward the edges, drawn on a canvas.
 * Preview of an "integrations" style visual built from generic icons.
 */
export function ToolsGrid({ ink, accent, paper }: { ink: string; accent: string; paper: string }) {
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const host = wrap.current
    const el = canvas.current
    const ctx = el?.getContext('2d')
    if (!host || !el || !ctx) return

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = host.clientWidth, h = host.clientHeight
      el.width = Math.round(w * dpr); el.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      const pitch = Math.max(60, w / 4.5)
      const cx = w / 2, cy = h * 0.53
      const rows = Math.ceil(h / (pitch * 0.9)) + 2
      for (let r = -Math.floor(rows / 2); r <= Math.floor(rows / 2); r++) {
        const offset = r % 2 ? pitch / 2 : 0
        const cols = Math.ceil(w / pitch) + 3
        for (let c = -Math.floor(cols / 2); c <= Math.floor(cols / 2); c++) {
          const x = cx + c * pitch + offset
          const y = cy + r * pitch * 0.9
          const d = Math.min(1, Math.hypot((x - cx) / (w * 0.6), (y - cy) / (h * 0.55)))
          const scale = 1.12 - 0.62 * d
          const alpha = Math.max(0, 1 - d * d * 1.05)
          if (alpha < 0.03) continue
          const size = pitch * 0.8 * scale
          ctx.save()
          ctx.globalAlpha = alpha
          ctx.translate(x, y)
          ctx.shadowColor = 'rgba(0,0,0,0.08)'
          ctx.shadowBlur = 10 * scale
          ctx.shadowOffsetY = 2
          ctx.fillStyle = paper
          ctx.beginPath(); ctx.roundRect(-size / 2, -size / 2, size, size, size * 0.26); ctx.fill()
          ctx.shadowColor = 'transparent'
          ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1.2, size * 0.04); ctx.lineJoin = 'round'; ctx.lineCap = 'round'
          ICONS[(((c * 3 + r * 7) % ICONS.length) + ICONS.length) % ICONS.length](ctx, size * 0.22, ink, accent)
          ctx.restore()
        }
      }
    }
    draw()
    const observer = new ResizeObserver(draw)
    observer.observe(host)
    return () => observer.disconnect()
  }, [ink, accent, paper])

  return (
    <div className="lp-tools">
      <div className="lp-tools-head">
        <h3>Every tool<span> your restaurant already uses</span></h3>
        <span className="lp-tools-arrow" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 12 12 4M5 4h7v7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" /></svg>
        </span>
      </div>
      <div ref={wrap} className="lp-tools-stage" aria-hidden="true"><canvas ref={canvas} /></div>
    </div>
  )
}
