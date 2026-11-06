import { useEffect, useRef } from 'react'

// A grid of dots that shimmer on their own, are pushed away by the pointer, and ring outward from a click.
// Each dot is a damped spring pulled back to its home cell. Written from scratch for this site.
const SPACING = 12
const DOT_RADIUS = 1.1
const SPRING = 0.018
const DAMPING = 0.8
const POINTER_RADIUS = 150
const POINTER_FORCE = 10
const RIPPLE_SPEED = 420
const RIPPLE_WIDTH = 500
const RIPPLE_FORCE = 10
const RIPPLE_DECAY = 2.2
const RIPPLE_LIFE = 2
const MAX_RIPPLES = 6
const STEP = 1000 / 60
const ALPHA_LEVELS = 6
const INTERACTIVE = 'a, button, input, select, textarea, label, [role="button"], form, video'

type Ripple = { x: number; y: number; born: number }

function rgbOf(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`
}

export function DotField({ color }: { color: string }) {
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const host = wrap.current
    const el = canvas.current
    const ctx = el?.getContext('2d')
    if (!host || !el || !ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const rgb = rgbOf(color)
    let cols = 0, rows = 0, originX = 0, originY = 0, width = 0, height = 0
    let ox = new Float32Array(0), oy = new Float32Array(0), vx = new Float32Array(0), vy = new Float32Array(0), seed = new Float32Array(0)

    const pointer = { x: -9999, y: -9999, sx: -9999, sy: -9999, inside: false, lastMove: -10 }
    let ripples: Ripple[] = []
    let clock = 0
    let visible = true
    let frame = 0
    let last = 0
    let accumulator = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = host.getBoundingClientRect()
      width = rect.width
      height = rect.height
      el.width = Math.max(1, Math.floor(width * dpr))
      el.height = Math.max(1, Math.floor(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      originX = (width % SPACING) / 2 + SPACING / 2
      originY = (height % SPACING) / 2 + SPACING / 2
      cols = Math.max(1, Math.ceil((width + SPACING - originX) / SPACING))
      rows = Math.max(1, Math.ceil((height + SPACING - originY) / SPACING))
      const n = cols * rows
      ox = new Float32Array(n); oy = new Float32Array(n); vx = new Float32Array(n); vy = new Float32Array(n)
      seed = new Float32Array(n)
      for (let i = 0; i < n; i++) seed[i] = 0.8 + 0.4 * (((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1)
    }

    const step = () => {
      const age = clock - pointer.lastMove
      const pull = pointer.inside ? Math.exp(-7 * age) : 0
      const live = ripples.length
      for (let r = 0; r < rows; r++) {
        const hy = originY + r * SPACING
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c
          const hx = originX + c * SPACING
          let ax = -ox[i] * SPRING * seed[i]
          let ay = -oy[i] * SPRING * seed[i]
          const px = hx + ox[i], py = hy + oy[i]
          if (pull > 0.001) {
            const dx = px - pointer.sx, dy = py - pointer.sy
            const d2 = dx * dx + dy * dy
            if (d2 < POINTER_RADIUS * POINTER_RADIUS && d2 > 0.01) {
              const d = Math.sqrt(d2)
              const t = 1 - d / POINTER_RADIUS
              const f = t * t * POINTER_FORCE * pull
              ax += (dx / d) * f; ay += (dy / d) * f
            }
          }
          for (let k = 0; k < live; k++) {
            const rp = ripples[k]
            const a = clock - rp.born
            const dx = px - rp.x, dy = py - rp.y
            const d = Math.sqrt(dx * dx + dy * dy)
            const diff = d - a * RIPPLE_SPEED
            const amp = Math.exp(-(diff * diff) / RIPPLE_WIDTH) * Math.exp(-a * RIPPLE_DECAY) * RIPPLE_FORCE
            if (d > 0.01) { ax += (dx / d) * amp; ay += (dy / d) * amp }
          }
          vx[i] = (vx[i] + ax) * DAMPING
          vy[i] = (vy[i] + ay) * DAMPING
          ox[i] += vx[i]
          oy[i] += vy[i]
        }
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      const paths: Path2D[] = Array.from({ length: ALPHA_LEVELS }, () => new Path2D())
      for (let r = 0; r < rows; r++) {
        const hy = originY + r * SPACING
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c
          const hx = originX + c * SPACING
          let alpha = 0.6
          if (!reduced) {
            const p1 = hx * 0.018 + hy * 0.009 + clock * 0.55
            const p2 = hx * -0.012 + hy * 0.016 + clock * 0.38
            const p3 = hx * 0.006 + hy * -0.014 + clock * 0.22
            const flick = (Math.sin(p1) + Math.sin(p2) + Math.sin(p3)) / 3
            alpha = 0.35 + 0.65 * (0.5 + 0.5 * flick)
          }
          const level = Math.min(ALPHA_LEVELS - 1, Math.floor(alpha * ALPHA_LEVELS))
          const x = hx + ox[i], y = hy + oy[i]
          paths[level].moveTo(x + DOT_RADIUS, y)
          paths[level].arc(x, y, DOT_RADIUS, 0, Math.PI * 2)
        }
      }
      for (let l = 0; l < ALPHA_LEVELS; l++) {
        ctx.fillStyle = `rgba(${rgb}, ${(l + 0.5) / ALPHA_LEVELS})`
        ctx.fill(paths[l])
      }
    }

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      if (!visible) { last = now; return }
      accumulator += Math.min(now - last, 100)
      last = now
      while (accumulator >= STEP) {
        accumulator -= STEP
        clock += STEP / 1000
        pointer.sx += (pointer.x - pointer.sx) * 0.8
        pointer.sy += (pointer.y - pointer.sy) * 0.8
        ripples = ripples.filter((rp) => clock - rp.born < RIPPLE_LIFE)
        step()
      }
      draw()
    }

    const hostRect = () => host.getBoundingClientRect()
    const onMove = (e: PointerEvent) => {
      const rect = hostRect()
      if (e.clientY < rect.top - POINTER_RADIUS || e.clientY > rect.bottom + POINTER_RADIUS) { pointer.inside = false; return }
      const target = e.target
      if (target instanceof Element && target.closest(INTERACTIVE)) { pointer.inside = false; return }
      pointer.x = e.clientX - rect.left
      pointer.y = e.clientY - rect.top
      if (!pointer.inside || pointer.sx < -9000) { pointer.sx = pointer.x; pointer.sy = pointer.y }
      pointer.inside = true
      pointer.lastMove = clock
    }
    const onLeave = () => { pointer.inside = false }
    const onDown = (e: PointerEvent) => {
      if (!e.isPrimary) return
      const target = e.target
      if (target instanceof Element && target.closest(INTERACTIVE)) return
      const rect = hostRect()
      const x = e.clientX - rect.left, y = e.clientY - rect.top
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return
      ripples = [...ripples, { x, y, born: clock }].slice(-MAX_RIPPLES)
    }

    resize()
    const resizeObserver = new ResizeObserver(() => { resize(); if (reduced) draw() })
    resizeObserver.observe(host)
    const visibility = new IntersectionObserver(([entry]) => { visible = entry?.isIntersecting ?? true })
    visibility.observe(host)

    if (reduced) {
      draw()
    } else {
      document.addEventListener('pointermove', onMove)
      document.addEventListener('pointerleave', onLeave)
      document.addEventListener('pointerdown', onDown)
      last = performance.now()
      frame = requestAnimationFrame(tick)
    }

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      visibility.disconnect()
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [color])

  return (
    <div ref={wrap} className="lp-hero-bg" aria-hidden="true">
      <canvas ref={canvas} className="lp-dots" />
    </div>
  )
}
