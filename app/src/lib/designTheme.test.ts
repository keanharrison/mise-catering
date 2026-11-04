import { describe, expect, it } from 'vitest'
import { DEFAULT_THEME, chatBackground, contrast, themeVariables } from './designTheme'

describe('design theme', () => {
  it('turns the radius slider into rem and keeps the default sharp', () => {
    expect(themeVariables(DEFAULT_THEME)['--radius']).toBe('0rem')
    expect(themeVariables({ ...DEFAULT_THEME, radius: 16 })['--radius']).toBe('1rem')
  })

  it('maps chat shape to composer and bubble radii', () => {
    expect(themeVariables({ ...DEFAULT_THEME, chatShape: 'pill' })['--chat-composer-radius']).toBe('9999px')
    expect(themeVariables({ ...DEFAULT_THEME, chatShape: 'sharp' })['--chat-composer-radius']).toBe('0px')
  })

  it('ends the chat gradient at the accent at full depth and at the page color at zero depth', () => {
    expect(chatBackground({ ...DEFAULT_THEME, chatIntensity: 100 })).toContain('#ff6600 100%')
    expect(chatBackground({ ...DEFAULT_THEME, chatIntensity: 0 })).toContain('#ffffff 100%')
    expect(chatBackground({ ...DEFAULT_THEME, chatStyle: 'plain' })).toBe('#ffffff')
  })

  it('picks readable button text for light and dark accents', () => {
    const light = themeVariables({ ...DEFAULT_THEME, accent: '#f5a742' })
    expect(contrast(light['--primary'], light['--primary-foreground'])).toBeGreaterThan(4.5)
    const dark = themeVariables({ ...DEFAULT_THEME, accent: '#00708d' })
    expect(contrast(dark['--primary'], dark['--primary-foreground'])).toBeGreaterThan(4.5)
  })
})
