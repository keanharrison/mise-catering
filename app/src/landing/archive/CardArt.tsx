import { useEffect, useRef } from 'react'
export type ArtKind = 'receipt' | 'sheet' | 'phone' | 'calendar' | 'slip' | 'inbox'

const W = 110
const H = 69

// 8x8 ordered-dither threshold matrix (Bayer), built recursively.
function bayer(n: number): number[][] {
  if (n === 1) return [[0]]
  const p = bayer(n / 2)
  const h = n / 2
  return Array.from({ length: n }, (_, y) =>
    Array.from({ length: n }, (_, x) => p[y % h][x % h] * 4 + [[0, 2], [3, 1]][Math.floor(y / h)][Math.floor(x / h)]),
  )
}
const B8 = bayer(8)

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const EMOJI_FONT = "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif"
const HAND_FONT = "'Bradley Hand', 'Segoe Print', 'Comic Sans MS', cursive"

function paper(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, W, H)
}

function emoji(ctx: CanvasRenderingContext2D, glyph: string, size: number, x = W / 2, y = H / 2 + 2) {
  ctx.font = `${size}px ${EMOJI_FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(glyph, x, y)
}

// Each scene is drawn dark-on-white; the dither pass then maps brightness onto the theme's three tones.
const SCENES: Record<ArtKind, (ctx: CanvasRenderingContext2D) => void> = {
  receipt(ctx) {
    paper(ctx)
    // Two paper receipts, one over the other, with torn zig-zag bottoms.
    const slip = (x: number, y: number, w: number, h: number, tilt: number, lines: number) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(tilt)
      ctx.fillStyle = '#fff'
      ctx.strokeStyle = '#666'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(-w / 2, -h / 2)
      ctx.lineTo(w / 2, -h / 2)
      ctx.lineTo(w / 2, h / 2)
      for (let i = 0; i < 8; i++) ctx.lineTo(w / 2 - (i + 0.5) * (w / 8), h / 2 + (i % 2 ? 0 : 3))
      ctx.lineTo(-w / 2, h / 2)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = '#333'
      ctx.fillRect(-w / 2 + 5, -h / 2 + 6, w * 0.5, 4)
      ctx.fillStyle = '#777'
      for (let i = 0; i < lines; i++) {
        ctx.fillRect(-w / 2 + 5, -h / 2 + 16 + i * 7, w * (0.45 + ((i * 5) % 4) * 0.1), 3)
        ctx.fillRect(w / 2 - 17, -h / 2 + 16 + i * 7, 12, 3)
      }
      ctx.fillStyle = '#222'
      ctx.fillRect(-w / 2 + 5, h / 2 - 12, w - 10, 4)
      ctx.restore()
    }
    slip(40, 36, 36, 62, -0.12, 6)
    slip(70, 34, 38, 58, 0.1, 5)
  },
  sheet(ctx) {
    paper(ctx)
    const cols = 5, rows = 7, cw = W / cols, ch = H / rows
    ctx.fillStyle = '#444'
    ctx.fillRect(0, 0, W, ch)
    ctx.strokeStyle = '#8a8a8a'
    ctx.lineWidth = 1
    for (let c = 1; c < cols; c++) { ctx.beginPath(); ctx.moveTo(c * cw, 0); ctx.lineTo(c * cw, H); ctx.stroke() }
    for (let r = 1; r < rows; r++) { ctx.beginPath(); ctx.moveTo(0, r * ch); ctx.lineTo(W, r * ch); ctx.stroke() }
    ctx.fillStyle = '#666'
    for (let r = 1; r < rows; r++) for (let c = 0; c < cols; c++) if ((r * 7 + c * 3) % 4 !== 0) ctx.fillRect(c * cw + 3, r * ch + 3, cw * (0.35 + ((r + c) % 3) * 0.15), ch - 6)
  },
  phone(ctx) {
    paper(ctx)
    ctx.strokeStyle = '#999'
    ctx.lineWidth = 2
    for (const r of [24, 34, 44]) { ctx.beginPath(); ctx.arc(W / 2, H / 2 + 2, r, -0.6, 0.6); ctx.stroke(); ctx.beginPath(); ctx.arc(W / 2, H / 2 + 2, r, Math.PI - 0.6, Math.PI + 0.6); ctx.stroke() }
    emoji(ctx, '\u{1F4DE}', 40)
  },
  calendar(ctx) {
    paper(ctx)
    // A hand-typed wall calendar: header band, day grid, one circled day.
    const x0 = 22, y0 = 8, w = 66, h = 54
    ctx.strokeStyle = '#666'
    ctx.lineWidth = 1
    ctx.strokeRect(x0, y0, w, h)
    ctx.fillStyle = '#444'
    ctx.fillRect(x0, y0, w, 12)
    ctx.fillStyle = '#fff'
    for (const rx of [x0 + 12, x0 + w - 18]) ctx.fillRect(rx, y0 - 3, 4, 7)
    ctx.strokeStyle = '#aaa'
    for (let c = 1; c < 7; c++) { ctx.beginPath(); ctx.moveTo(x0 + (c * w) / 7, y0 + 12); ctx.lineTo(x0 + (c * w) / 7, y0 + h); ctx.stroke() }
    for (let r = 1; r < 4; r++) { ctx.beginPath(); ctx.moveTo(x0, y0 + 12 + (r * (h - 12)) / 4); ctx.lineTo(x0 + w, y0 + 12 + (r * (h - 12)) / 4); ctx.stroke() }
    ctx.fillStyle = '#777'
    for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) ctx.fillRect(x0 + (c * w) / 7 + 3, y0 + 12 + (r * (h - 12)) / 4 + 3, 4, 3)
    ctx.strokeStyle = '#222'
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.ellipse(x0 + (4.5 * w) / 7, y0 + 12 + (1.5 * (h - 12)) / 4, 8, 6, -0.2, 0, Math.PI * 2); ctx.stroke()
  },
  slip(ctx) {
    paper(ctx)
    ctx.save()
    ctx.translate(W / 2, H / 2)
    ctx.rotate(-0.07)
    ctx.fillStyle = '#f4f4f4'
    ctx.strokeStyle = '#777'
    ctx.lineWidth = 1
    ctx.fillRect(-34, -29, 68, 58)
    ctx.strokeRect(-34, -29, 68, 58)
    ctx.fillStyle = '#222'
    ctx.font = `italic 12px ${HAND_FONT}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText('Fri 12:30', -26, -14)
    ctx.fillText('40 ppl', -26, 2)
    ctx.fillText('trays???', -26, 18)
    ctx.restore()
  },
  inbox(ctx) {
    paper(ctx)
    ctx.fillStyle = '#777'
    for (let i = 0; i < 4; i++) ctx.fillRect(56, 12 + i * 13, 40 - (i % 2) * 8, 5)
    emoji(ctx, '✉️', 38, 30, H / 2 + 1)
    ctx.fillStyle = '#222'
    ctx.beginPath(); ctx.arc(46, 22, 8, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 10px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('7', 46, 22.5)
  },
}

/** A small illustration, ordered-dithered into the theme's three tones and drawn pixelated. */
export function CardArt({ kind, colors, seed = 0 }: { kind: ArtKind; colors: [string, string, string]; seed?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return
    const palette = colors.map(rgb)

    const dither = () => {
      const img = ctx.getImageData(0, 0, W, H)
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4
          const lum = (0.299 * img.data[i] + 0.587 * img.data[i + 1] + 0.114 * img.data[i + 2]) / 255
          const shaded = Math.min(1, Math.max(0, lum - 0.16 * (1 - y / H)))
          const level = Math.min(2, Math.max(0, Math.floor(shaded * 3 + (B8[y % 8][(x + seed) % 8] / 64 - 0.5))))
          const [r, g, b] = palette[level]
          img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255
        }
      }
      ctx.putImageData(img, 0, 0)
    }

    SCENES[kind](ctx)
    dither()
  }, [kind, seed, colors[0], colors[1], colors[2]]) // eslint-disable-line react-hooks/exhaustive-deps

  return <canvas ref={ref} className="lp-mini-art" aria-hidden="true" />
}
