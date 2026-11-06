import { StrictMode, useState, type FormEvent } from 'react'
import { createRoot } from 'react-dom/client'
import { DesignPanel } from '../components/design/DesignPanel'
import '../components/design/design-panel.css'
import { FONTS, LOGIN_DEFAULT_THEME, LOGIN_THEME_KEY, mix, resolve, useDesignTheme } from '../lib/designTheme'
import '../lib/fonts.css'
import { DEMO_EMAIL_KEY, WORK_EMAIL_ERROR, isWorkEmail } from '../lib/workEmail'
import { DotField } from './DotField'
import { Nav } from './Nav'
import './landing.css'

function DemoForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  function submit(e: FormEvent) {
    e.preventDefault()
    if (!isWorkEmail(email)) { setError(WORK_EMAIL_ERROR); return }
    try { sessionStorage.setItem(DEMO_EMAIL_KEY, email.trim()) } catch { /* the demo form just asks again */ }
    window.location.assign('/pearl-login.html?view=biz-email')
  }
  return (
    <form className="lp-cta" onSubmit={submit} noValidate>
      <div className="lp-cta-box">
        <input
          type="email" value={email} placeholder="What's your work email?" aria-label="Work email" autoComplete="email"
          aria-invalid={error ? true : undefined} aria-describedby={error ? 'lp-cta-error' : undefined}
          onChange={(e) => { setEmail(e.target.value); setError('') }}
        />
        <button type="submit">Request a demo</button>
      </div>
      {error && <p id="lp-cta-error" className="lp-cta-error" role="alert">{error}</p>}
    </form>
  )
}

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
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<StrictMode><LandingPage /></StrictMode>)
