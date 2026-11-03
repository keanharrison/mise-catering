import { DEFAULT_THEME, mix, resolve, type Theme } from '../login/theme'

/** Carry the accent chosen in the sign-in Design panel into the product, so color experiments show up on every screen. */
export function applyStoredTheme() {
  let stored: Partial<Theme> = {}
  try { stored = JSON.parse(localStorage.getItem('mise-design-theme') ?? '{}') } catch { /* use defaults */ }
  const theme = { ...DEFAULT_THEME, ...stored }
  if (theme.accent === DEFAULT_THEME.accent && theme.hover === null) return
  const r = resolve(theme)
  const root = document.documentElement.style
  root.setProperty('--primary', r.accent)
  root.setProperty('--primary-hover', r.hover)
  root.setProperty('--primary-foreground', r.onAccent)
  root.setProperty('--primary-ink', r.accentText)
  root.setProperty('--link', r.accentText)
  root.setProperty('--ring', r.accent)
  root.setProperty('--field-border', r.accent)
  root.setProperty('--sidebar-border', r.accent)
  root.setProperty('--sidebar-primary', r.accent)
  root.setProperty('--border', mix(r.accent, '#ffffff', 0.78))
}
