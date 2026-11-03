import { useEffect, useState } from 'react'

export type Theme = {
  accent: string
  hover: string | null // null = derive from accent
  mid: string | null // dither mid-tone; null = derive from accent
  ink: string
  paper: string
  cell: number
}

export const DEFAULT_THEME: Theme = { accent: '#ff6600', hover: null, mid: null, ink: '#111111', paper: '#ffffff', cell: 5 }

export const PRESETS: { name: string; theme: Partial<Theme> }[] = [
  { name: 'Orange', theme: { accent: '#ff6600' } },
  { name: 'Tomato', theme: { accent: '#e5382a' } },
  { name: 'Amber', theme: { accent: '#f59e0b' } },
  { name: 'Basil', theme: { accent: '#1f9d55' } },
  { name: 'Ocean', theme: { accent: '#2563eb' } },
  { name: 'Plum', theme: { accent: '#7c3aed' } },
  { name: 'Black', theme: { accent: '#111111' } },
  { name: 'Oxblood', theme: { accent: '#6e2639' } },
  { name: 'Burgundy', theme: { accent: '#800f2f' } },
  { name: 'Dusty Maroon', theme: { accent: '#874c62' } },
  { name: 'Mauve', theme: { accent: '#997a8d' } },
  { name: 'Terracotta', theme: { accent: '#b6654d' } },
  { name: 'Burnt Sienna', theme: { accent: '#a0522d' } },
  { name: 'Olive', theme: { accent: '#707c45' } },
  { name: 'Sage', theme: { accent: '#82957b' } },
  { name: 'Forest', theme: { accent: '#315c4b' } },
  { name: 'Slate Blue', theme: { accent: '#52677d' } },
  { name: 'Steel Blue', theme: { accent: '#54768a' } },
  { name: 'Petrol', theme: { accent: '#285c63' } },
  { name: 'Midnight Teal', theme: { accent: '#234f52' } },
  { name: 'Plum', theme: { accent: '#63465e' } },
  { name: 'Espresso', theme: { accent: '#59473e' } },
  { name: 'Antique Gold', theme: { accent: '#ad8b4a' } },
]

const KEY = 'mise-design-theme'

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = rgb(a), [r2, g2, b2] = rgb(b)
  const c = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0')
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`
}

function luminance(hex: string) {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** Darken the accent until it reads as text on the page background (WCAG AA, 4.5:1). */
function readableOn(accent: string, paper: string) {
  let c = accent
  for (let i = 0; i < 20 && contrast(c, paper) < 4.5; i++) c = mix(c, '#000000', 0.1)
  return c
}

export function resolve(t: Theme) {
  const hover = t.hover ?? mix(t.accent, '#000000', 0.2)
  // Button label: white or near-black, whichever keeps more contrast across both the resting and hover fills.
  const worst = (text: string) => Math.min(contrast(text, t.accent), contrast(text, hover))
  const onAccent = worst('#ffffff') >= worst('#111111') ? '#ffffff' : '#111111'
  return {
    accent: t.accent,
    hover,
    mid: t.mid ?? mix(t.accent, t.paper, 0.55),
    onAccent,
    accentText: readableOn(t.accent, t.paper),
  }
}

export function useDesignTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try { return { ...DEFAULT_THEME, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } } catch { return DEFAULT_THEME }
  })
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(theme)) }, [theme])
  return [theme, (patch: Partial<Theme>) => setTheme((t) => ({ ...t, ...patch })), () => setTheme(DEFAULT_THEME)] as const
}
