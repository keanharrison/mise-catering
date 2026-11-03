import { afterEach, vi } from 'vitest'

// Tests run without Supabase so results do not depend on the developer's app/.env.local.
vi.stubEnv('VITE_SUPABASE_URL', '')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')

// jsdom does not currently implement matchMedia, which the app shell uses for
// its system theme. Keep the browser-facing shell in tests without changing app code.
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  })
}

afterEach(() => {
  if (typeof document !== 'undefined') document.documentElement.classList.remove('light', 'dark')
})
