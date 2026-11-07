import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { DesignPanel } from '../components/design/DesignPanel'
import '../components/design/design-panel.css'
import { FONTS, LOGIN_DEFAULT_THEME, isDarkPaper, LOGIN_THEME_KEY, mix, resolve, useDesignTheme } from '../lib/designTheme'
import '../lib/fonts.css'
import { Cards } from './Cards'
import { DotField } from './DotField'
import { Nav } from './Nav'
import { ToolsGrid } from './ToolsGrid'
import './landing.css'

const DEMO_URL = '/pearl-login.html?view=biz-email'
// Placeholder until the real company page exists.
const LINKEDIN_URL = '#'

function LandingPage() {
  const [theme, patchTheme, resetTheme] = useDesignTheme(LOGIN_THEME_KEY, LOGIN_DEFAULT_THEME)
  const r = resolve(theme)
  // Local preview: /landing.html?preview=tools shows only the integrations-style tile grid.
  const previewTools = import.meta.env.DEV && new URLSearchParams(window.location.search).get('preview') === 'tools'
  return (
    <div
      className="lp-page"
      style={{
        '--line': r.accent, '--line-hover': r.hover, '--on-accent': r.onAccent, '--line-text': r.accentText, '--on-accent-strong': r.onAccent === '#111111' ? '#050505' : r.onAccent, '--ink': theme.ink, '--paper': theme.paper,
        '--muted': mix(theme.ink, theme.paper, 0.42), '--edge': mix(theme.ink, theme.paper, 0.9), '--sans': FONTS[theme.font].stack,
      } as React.CSSProperties}
    >
      <DesignPanel theme={theme} onChange={patchTheme} onReset={resetTheme} surface="login" />
      {previewTools ? (
        <div className="lp-preview"><ToolsGrid ink={theme.ink} accent={r.accent} paper={theme.paper} /></div>
      ) : (
        <>
          <Nav />
          <section className="lp-hero">
            <DotField color={mix(theme.ink, theme.paper, 0.76)} />
            <div className="lp-hero-inner">
              <main className="lp-main">
                <h1>You run the restaurant. We build the rest.</h1>
                <p>Mise builds custom software for restaurants so owners spend their time on what they love.</p>
                <a className="lp-hero-btn" href={DEMO_URL}>Request a demo</a>
              </main>
              <Cards colors={[r.accentText, r.accent, theme.paper]} />
            </div>
          </section>

          <footer id="restaurants" className="lp-footer" data-white={isDarkPaper(theme.paper)}>
            <div className="lp-footer-inner">
              <span className="lp-footer-mark">Mise</span>
              <div className="lp-footer-right">
                <ul className="lp-footer-links">
                  <li><a href={LINKEDIN_URL} onClick={(e) => { if (LINKEDIN_URL === '#') e.preventDefault() }}>LinkedIn</a></li>
                  <li><a href={DEMO_URL}>Request a demo</a></li>
                  <li><a href="/pearl-login.html">Sign in</a></li>
                </ul>
                <p className="lp-footer-legal">© 2026 Mise</p>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<StrictMode><LandingPage /></StrictMode>)
