import { useEffect, useState } from 'react'

export type FontChoice = 'space' | 'inter' | 'nunito' | 'dm' | 'system'
export type ChatShape = 'pill' | 'rounded' | 'sharp'
export type ChatStyle = 'gradient' | 'tint' | 'plain'
export type Pill = 'match' | 'pill'
export type LineTone = 'soft' | 'neutral' | 'strong'

export type Theme = {
  accent: string
  hover: string | null // null = derive from accent
  mid: string | null // dither / tint mid-tone; null = derive from accent
  ink: string
  paper: string
  /** Sign-in backdrop tile size (px). */
  cell: number
  /** Corner radius for the whole product, in px (0 = sharp). */
  radius: number
  buttons: Pill
  fields: Pill
  font: FontChoice
  chatShape: ChatShape
  chatStyle: ChatStyle
  /** 0-100: how deep the chat gradient gets toward the accent. */
  chatIntensity: number
  /** Dividers and card borders: soft accent tint, neutral gray, or full accent. */
  lines: LineTone
  /** Field borders: accent or neutral. */
  fieldBorder: 'accent' | 'neutral'
}

export const DEFAULT_THEME: Theme = {
  accent: '#ff6600', hover: null, mid: null, ink: '#111111', paper: '#ffffff', cell: 5,
  radius: 0, buttons: 'match', fields: 'match', font: 'space',
  chatShape: 'pill', chatStyle: 'gradient', chatIntensity: 100, lines: 'soft', fieldBorder: 'accent',
}

export const FONTS: Record<FontChoice, { label: string; stack: string }> = {
  space: { label: 'Space Grotesk', stack: "'Space Grotesk Variable', system-ui, -apple-system, 'Segoe UI', sans-serif" },
  inter: { label: 'Inter', stack: "'Inter Variable', system-ui, -apple-system, 'Segoe UI', sans-serif" },
  nunito: { label: 'Nunito', stack: "'Nunito Variable', system-ui, -apple-system, 'Segoe UI', sans-serif" },
  dm: { label: 'DM Sans', stack: "'DM Sans Variable', system-ui, -apple-system, 'Segoe UI', sans-serif" },
  system: { label: 'System', stack: "system-ui, -apple-system, 'Segoe UI', sans-serif" },
}

export const PRESETS: { name: string; theme: Partial<Theme> }[] = [
  { name: 'Pearl Island', theme: { accent: '#00708d' } },
  { name: 'Pearl Aqua', theme: { accent: '#00a1ca' } },
  { name: 'Pearl Gold', theme: { accent: '#f5a742' } },
  { name: 'Mise Orange', theme: { accent: '#ff6600' } },
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


const CHAT_RADII: Record<ChatShape, { composer: string; bubble: string; chip: string }> = {
  pill: { composer: '9999px', bubble: '20px', chip: '9999px' },
  rounded: { composer: '18px', bubble: '14px', chip: '14px' },
  sharp: { composer: '0px', bubble: '0px', chip: '0px' },
}

/** The chat dock background for a theme. */
export function chatBackground(t: Theme): string {
  const k = t.chatIntensity / 100
  if (t.chatStyle === 'plain') return t.paper
  if (t.chatStyle === 'tint') return mix(t.accent, t.paper, 0.9 - 0.1 * k)
  return `linear-gradient(180deg, ${mix(t.accent, '#f6f4f2', 1 - 0.03)} 0%, ${mix(t.accent, t.paper, 1 - 0.12 * k)} 38%, ${mix(t.accent, t.paper, 1 - 0.45 * k)} 72%, ${mix(t.accent, t.paper, 1 - k)} 100%)`
}

/** Every CSS variable and attribute the product reads from a theme. Pure, so it can be tested. */
export function themeVariables(t: Theme): Record<string, string> {
  const r = resolve(t)
  const radii = CHAT_RADII[t.chatShape]
  const border = t.lines === 'strong' ? r.accent : t.lines === 'neutral' ? mix(t.ink, t.paper, 0.88) : mix(r.accent, t.paper, 0.78)
  return {
    '--primary': r.accent,
    '--primary-hover': r.hover,
    '--primary-foreground': r.onAccent,
    '--primary-ink': r.accentText,
    '--link': r.accentText,
    '--ring': r.accent,
    '--sidebar-primary': r.accent,
    '--sidebar-border': r.accent,
    '--field-border': t.fieldBorder === 'accent' ? r.accent : mix(t.ink, t.paper, 0.55),
    '--border': border,
    '--foreground': t.ink,
    '--card-foreground': t.ink,
    '--popover-foreground': t.ink,
    '--background': t.paper,
    '--card': t.paper,
    '--popover': t.paper,
    '--radius': `${t.radius / 16}rem`,
    '--font-sans': FONTS[t.font].stack,
    '--chat-bg': chatBackground(t),
    '--chat-composer-radius': radii.composer,
    '--chat-bubble-radius': radii.bubble,
    '--chat-chip-radius': radii.chip,
  }
}

/** Put a theme on the page: variables on the root, plus attributes the stylesheet keys off. */
export function applyTheme(t: Theme, root: HTMLElement = document.documentElement) {
  for (const [name, value] of Object.entries(themeVariables(t))) root.style.setProperty(name, value)
  root.dataset.buttons = t.buttons
  root.dataset.fields = t.fields
}

export function readStoredTheme(): Theme {
  try { return { ...DEFAULT_THEME, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } } catch { return DEFAULT_THEME }
}

export function useDesignTheme() {
  const [theme, setTheme] = useState<Theme>(readStoredTheme)
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(theme)) }, [theme])
  return [theme, (patch: Partial<Theme>) => setTheme((t) => ({ ...t, ...patch })), () => setTheme(DEFAULT_THEME)] as const
}
