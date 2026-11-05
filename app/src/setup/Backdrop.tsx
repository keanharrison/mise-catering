import { useEffect, useRef } from 'react'

// Standalone dithered Pearl Island turquoise tiles for the sides of the setup page (no product code is shared).
const PALETTE: Array<[number, number, number]> = [[0, 161, 202], [140, 213, 231], [255, 255, 255]]
const CELL = 5

function bayer(n: number): number[][] {
  if (n === 1) return [[0]]
  const p = bayer(n / 2)
  const m: number[][] = []
  for (let y = 0; y < n; y++) {
    m.push([])
    for (let x = 0; x < n; x++) m[y].push(p[y % (n / 2)][x % (n / 2)] * 4 + [[0, 2], [3, 1]][Math.floor(y / (n / 2))][Math.floor(x / (n / 2))])
  }
  return m
}
const B8 = bayer(8)

function hash(x: number, y: number, seed: number) {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}
function noise(x: number, y: number, seed: number) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf)
  const a = hash(xi, yi, seed), b = hash(xi + 1, yi, seed), c = hash(xi, yi + 1, seed), d = hash(xi + 1, yi + 1, seed)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
const fbm = (x: number, y: number, s: number) => noise(x, y, s) * 0.55 + noise(x * 2.1, y * 2.1, s + 7) * 0.3 + noise(x * 4.3, y * 4.3, s + 13) * 0.15

function Panel({ seed, className }: { seed: number; className: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const draw = () => {
      const w = Math.ceil(canvas.clientWidth / CELL), h = Math.ceil(canvas.clientHeight / CELL)
      if (!w || !h) return
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      const img = ctx.createImageData(w, h)
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const value = Math.min(1, Math.max(0, (y / h) * 0.7 + fbm(x / 38, y / 38, seed) * 0.6 - 0.2))
        const level = Math.min(2, Math.floor(value * 2 + B8[y % 8][x % 8] / 64))
        const [r, g, b] = PALETTE[level]
        const i = (y * w + x) * 4
        img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255
      }
      ctx.putImageData(img, 0, 0)
    }
    draw()
    window.addEventListener('resize', draw)
    return () => window.removeEventListener('resize', draw)
  }, [seed])
  return <canvas ref={ref} className={className} aria-hidden="true" />
}

export function Backdrop() {
  return (
    <div className="doc-sides" aria-hidden="true">
      <Panel seed={1018} className="doc-side doc-side-left" />
      <Panel seed={1015} className="doc-side doc-side-right" />
    </div>
  )
}
