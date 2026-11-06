import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { DesignPanel } from '../components/design/DesignPanel'
import '../components/design/design-panel.css'
import { FONTS, LOGIN_DEFAULT_THEME, LOGIN_THEME_KEY, mix, resolve, useDesignTheme } from '../lib/designTheme'
import '../lib/fonts.css'
import { Deck } from './Deck'
import { DemoForm } from './DemoForm'
import { DotField } from './DotField'
import { Nav } from './Nav'
import './landing.css'

function LandingPage() {
  const [theme, patchTheme, resetTheme] = useDesignTheme(LOGIN_THEME_KEY, LOGIN_DEFAULT_THEME)
  const r = resolve(theme)
  return (
    <div
      className="lp-page"
      style={{
        '--line': r.accent, '--line-hover': r.hover, '--on-accent': r.onAccent, '--on-accent-strong': r.onAccent === '#111111' ? '#050505' : r.onAccent, '--ink': theme.ink, '--paper': theme.paper,
        '--muted': mix(theme.ink, theme.paper, 0.42), '--edge': mix(theme.ink, theme.paper, 0.9), '--sans': FONTS[theme.font].stack,
      } as React.CSSProperties}
    >
      <DesignPanel theme={theme} onChange={patchTheme} onReset={resetTheme} surface="login" />
      <Nav />
      <section className="lp-hero">
        <DotField color={mix(theme.ink, theme.paper, 0.76)} />
        <main className="lp-main">
          <h1>Catering made easy.</h1>
          <p>Customers describe their event and get a proposed order. Your team reviews and confirms it.</p>
          <DemoForm />
        </main>
      </section>

      <Deck colors={[r.accent, r.mid, theme.paper]} />

      <section id="restaurants" className="lp-section lp-close">
        <h2>See it on your menu.</h2>
        <p className="lp-section-lead">Tell us where to reach you and we will set up a demo around your restaurant.</p>
        <DemoForm />
      </section>

      <footer className="lp-footer">
        <span className="lp-footer-mark">Mise</span>
        <a href="/pearl-login.html">Sign in</a>
      </footer>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<StrictMode><LandingPage /></StrictMode>)
