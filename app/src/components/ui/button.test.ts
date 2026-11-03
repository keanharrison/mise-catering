import { describe, expect, it } from 'vitest'
import { buttonVariants } from './button'

describe('button variants', () => {
  it('makes the primary action solid orange with white text, one size and one radius', () => {
    const primary = buttonVariants({})
    expect(primary).toContain('bg-primary')
    expect(primary).toContain('text-primary-foreground')
    expect(primary).toContain('rounded-xl')
    expect(primary).toContain('h-9')
  })

  it('shows a disabled primary action as solid gray, not a faded black', () => {
    expect(buttonVariants({})).toContain('disabled:bg-[var(--disabled-fill)]')
    expect(buttonVariants({})).toContain('disabled:opacity-100')
  })

  it('keeps secondary actions outlined in orange and filling on hover', () => {
    const outline = buttonVariants({ variant: 'outline' })
    expect(outline).toContain('border-primary')
    expect(outline).toContain('bg-card')
    expect(outline).not.toMatch(/(^| )bg-primary( |$)/)
  })

  it('keeps a visible focus ring on every variant', () => {
    expect(buttonVariants({ variant: 'outline' })).toContain('focus-visible:ring-3')
    expect(buttonVariants({})).toContain('focus-visible:ring-3')
  })
})
