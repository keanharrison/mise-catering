import { useEffect, useRef } from 'react'

// Ordered-dither field in the brand palette: orange fading through peach to white.
// Rendered once to a low-res canvas and scaled with pixelated sampling, so it stays crisp and cheap.
function toRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function bayer(n: number): number[][] {
  if (n === 1) return [[0]]
  const p = bayer(n / 2)
  const m: number[][] = []
  for (let y = 0; y < n; y++) {
    m.push([])
    for (let x = 0; x < n; x++) {
      const q = p[y % (n / 2)][x % (n / 2)] * 4
      m[y].push(q + [[0, 2], [3, 1]][Math.floor(y / (n / 2))][Math.floor(x / (n / 2))])
    }
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
  const xi = Math.floor(x), yi = Math.floor(y)
  const xf = x - xi, yf = y - yi
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf)
  const a = hash(xi, yi, seed), b = hash(xi + 1, yi, seed)
  const c = hash(xi, yi + 1, seed), d = hash(xi + 1, yi + 1, seed)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
function fbm(x: number, y: number, seed: number) {
  return noise(x, y, seed) * 0.55 + noise(x * 2.1, y * 2.1, seed + 7) * 0.3 + noise(x * 4.3, y * 4.3, seed + 13) * 0.15
}

export function DitherPanel({ seed, className, colors, cell }: { seed: number; className?: string; colors: [string, string, string]; cell: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const draw = () => {
      const w = Math.ceil(canvas.clientWidth / cell)
      const h = Math.ceil(canvas.clientHeight / cell)
      if (!w || !h) return
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      const palette = colors.map(toRgb)
      const img = ctx.createImageData(w, h)
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const grad = y / h // dense orange at the top, white at the bottom
          const n = fbm(x / 38, y / 38, seed)
          const value = Math.min(1, Math.max(0, grad * 0.7 + n * 0.6 - 0.2)) // 0 = orange, 1 = white
          const level = Math.min(2, Math.floor(value * 2 + B8[y % 8][x % 8] / 64))
          const [r, g, b] = palette[level]
          const i = (y * w + x) * 4
          img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255
        }
      }
      ctx.putImageData(img, 0, 0)
    }
    draw()
    window.addEventListener('resize', draw)
    return () => window.removeEventListener('resize', draw)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, cell, colors[0], colors[1], colors[2]])

  return <canvas ref={ref} className={className} aria-hidden="true" />
}
