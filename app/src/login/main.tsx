import { StrictMode, useEffect, useState, type FormEvent } from 'react'
import { createRoot } from 'react-dom/client'
import { supabase } from '../lib/supabase'
import { LOGIN_URL, fetchProfile, homeFor, isStaffRole, requestDemo, saveProfileLocally, sendPasswordReset, setPassword, signIn, signUp } from '../state/auth'
import { DitherPanel } from './DitherPanel'
import { DesignPanel } from './DesignPanel'
import { resolve, useDesignTheme } from './theme'
import '@fontsource/space-grotesk/400.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/600.css'
import '@fontsource/jetbrains-mono/400.css'
import './login.css'

function MiseMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M48 48H0V0h48z" fill="var(--line)" />
      <path d="M12 36V12h3.6L24 25.2 32.4 12H36v24h-3.4V18.6L24 31.4l-8.6-12.8V36z" fill="var(--on-accent)" />
    </svg>
  )
}

type Mode = 'signin' | 'signup' | 'staff' | 'inquire' | 'check-email' | 'inquired' | 'set-password'

// Invite and password-reset links arrive with a type in the URL hash; read it before the Supabase client consumes it.
const arrivedBy = new URLSearchParams(window.location.hash.slice(1)).get('type')

function Field(props: { id: string; label: string; type?: string; value: string; onChange: (v: string) => void; autoComplete?: string; autoFocus?: boolean; required?: boolean; minLength?: number }) {
  return (
    <div className="mise-field">
      <label htmlFor={props.id} className="mise-label">{props.label}</label>
      <input
        id={props.id} type={props.type ?? 'text'} className="mise-input" required={props.required ?? true}
        autoComplete={props.autoComplete} autoFocus={props.autoFocus} minLength={props.minLength}
        value={props.value} onChange={(e) => props.onChange(e.target.value)}
      />
    </div>
  )
}

function LoginPage() {
  const [mode, setMode] = useState<Mode>(arrivedBy === 'invite' || arrivedBy === 'recovery' ? 'set-password' : 'signin')
  const [theme, patchTheme, resetTheme] = useDesignTheme()
  const r = resolve(theme)
  const dither: [string, string, string] = [r.accent, r.mid, theme.paper]
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', restaurant: '', message: '' })
  const set = (key: keyof typeof f) => (value: string) => setF((prev) => ({ ...prev, [key]: value }))

  // Already signed in: go straight to the right workspace (unless setting a password from an email link).
  useEffect(() => {
    if (!supabase || mode === 'set-password') return
    fetchProfile().then((p) => { if (p) { saveProfileLocally(p); window.location.replace(homeFor(p.role)) } })
  }, [mode])

  function go(next: Mode) {
    setMode(next)
    setError('')
    setNotice('')
  }

  async function run(task: () => Promise<void>) {
    setBusy(true)
    setError('')
    try { await task() } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.') } finally { setBusy(false) }
  }

  async function enter(staffOnly: boolean) {
    const profile = await fetchProfile()
    if (!profile) throw new Error('We could not load your account. Please try again.')
    if (staffOnly && !isStaffRole(profile.role)) {
      await supabase?.auth.signOut()
      throw new Error("This account doesn't have staff access. Ask your restaurant owner for an invite.")
    }
    saveProfileLocally(profile)
    window.location.assign(homeFor(profile.role))
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    void run(async () => {
      if (mode === 'signin' || mode === 'staff') {
        await signIn(f.email.trim(), f.password)
        await enter(mode === 'staff')
      } else if (mode === 'signup') {
        const ready = await signUp({ fullName: f.name.trim(), email: f.email.trim(), phone: f.phone.trim(), password: f.password })
        if (ready) await enter(false)
        else go('check-email')
      } else if (mode === 'inquire') {
        await requestDemo({ restaurantName: f.restaurant.trim(), contactName: f.name.trim(), email: f.email.trim(), phone: f.phone.trim(), message: f.message.trim() })
        go('inquired')
      } else if (mode === 'set-password') {
        await setPassword(f.password)
        await enter(false)
      }
    })
  }

  function forgot() {
    if (!f.email.trim()) { setError('Enter your email above first.'); return }
    void run(async () => {
      await sendPasswordReset(f.email.trim())
      setNotice('If that email has an account, a reset link is on its way.')
    })
  }

  const copy: Record<Mode, { title: string; lead: string; cta: string }> = {
    signin: { title: 'Sign in.', lead: 'Enter your email and password to continue.', cta: 'Log in' },
    staff: { title: 'Staff sign in.', lead: 'For restaurant teams with an invitation.', cta: 'Log in' },
    signup: { title: 'Create account.', lead: 'Save your details so ordering is faster next time.', cta: 'Create account' },
    inquire: { title: 'Request a demo.', lead: 'Tell us about your restaurant and we will be in touch.', cta: 'Send request' },
    'set-password': { title: 'Set a password.', lead: 'Choose a password to finish setting up your account.', cta: 'Save password' },
    'check-email': { title: 'Check your email.', lead: `We sent a confirmation link to ${f.email}. Open it to finish creating your account.`, cta: '' },
    inquired: { title: 'Thank you.', lead: 'We received your request and will reach out shortly.', cta: '' },
  }
  const c = copy[mode]
  const showForm = c.cta !== ''

  return (
    <div
      className="mise-page"
      style={{ '--line': r.accent, '--line-hover': r.hover, '--on-accent': r.onAccent, '--line-text': r.accentText, '--ink': theme.ink, '--paper': theme.paper } as React.CSSProperties}
    >
      <DesignPanel theme={theme} onChange={patchTheme} onReset={resetTheme} />
      <div className="mise-sides" aria-hidden="true">
        <DitherPanel seed={1018} colors={dither} cell={theme.cell} className="mise-side mise-side-left" />
        <DitherPanel seed={1015} colors={dither} cell={theme.cell} className="mise-side mise-side-right" />
      </div>

      <div className="mise-frame">
        <nav className="mise-nav">
          <div className="mise-nav-links mise-nav-left" />
          <a href={LOGIN_URL} className="mise-nav-mark" aria-label="Mise home"><MiseMark /></a>
          <div className="mise-nav-links mise-nav-right">
            <button type="button" onClick={() => go('signin')}>Sign in</button>
            <button type="button" className="mise-nav-accent" onClick={() => go('inquire')}>[ Request a demo ]</button>
          </div>
        </nav>

        <main className="mise-main">
          <section className="mise-auth" aria-labelledby="login-title">
            <h1 id="login-title">{c.title}</h1>
            <p className="mise-lead">{c.lead}</p>
            {!supabase && <p className="mise-alert" role="alert">Accounts are not connected yet. Add the Supabase URL and key to app/.env.local.</p>}
            {error && <p className="mise-alert" role="alert">{error}</p>}
            {notice && <p className="mise-notice" role="status">{notice}</p>}

            {showForm && (
              <form onSubmit={submit}>
                {(mode === 'signup' || mode === 'inquire') && <Field id="name" label={mode === 'inquire' ? 'Your name' : 'Full name'} value={f.name} onChange={set('name')} autoComplete="name" autoFocus />}
                {mode === 'inquire' && <Field id="restaurant" label="Restaurant" value={f.restaurant} onChange={set('restaurant')} autoComplete="organization" />}
                {mode !== 'set-password' && <Field id="email" label="Email" type="email" value={f.email} onChange={set('email')} autoComplete="email" autoFocus={mode === 'signin' || mode === 'staff'} />}
                {(mode === 'signup' || mode === 'inquire') && <Field id="phone" label={mode === 'inquire' ? 'Phone (optional)' : 'Phone'} type="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" required={mode === 'signup'} />}
                {mode === 'inquire' && (
                  <div className="mise-field">
                    <label htmlFor="message" className="mise-label">What would you like to solve? (optional)</label>
                    <textarea id="message" className="mise-input mise-textarea" rows={3} value={f.message} onChange={(e) => set('message')(e.target.value)} />
                  </div>
                )}
                {mode !== 'inquire' && (
                  <Field
                    id="password" label="Password" type="password" value={f.password} onChange={set('password')}
                    autoComplete={mode === 'signin' || mode === 'staff' ? 'current-password' : 'new-password'}
                    minLength={mode === 'signin' || mode === 'staff' ? undefined : 8} autoFocus={mode === 'set-password'}
                  />
                )}
                {(mode === 'signup' || mode === 'set-password') && <p className="mise-hint">At least 8 characters.</p>}
                <button type="submit" className="mise-submit" disabled={busy || !supabase}>{busy ? 'One moment…' : c.cta}</button>
              </form>
            )}

            <p className="mise-switch">
              {mode === 'signin' && <>New here? <button type="button" onClick={() => go('signup')}>Create an account</button> · <button type="button" onClick={forgot}>Forgot password?</button></>}
              {mode === 'staff' && <button type="button" onClick={forgot}>Forgot password?</button>}
              {mode === 'signup' && <>Have an account? <button type="button" onClick={() => go('signin')}>Sign in</button></>}
              {(mode === 'inquire' || mode === 'check-email' || mode === 'inquired') && <button type="button" onClick={() => go('signin')}>Back to sign in</button>}
            </p>
          </section>
        </main>

        <footer className="mise-footer">
          <p className="mise-foot-by">Built by <strong>Mise</strong></p>
          <div className="mise-foot-links">
            <button type="button" onClick={() => go(mode === 'staff' ? 'signin' : 'staff')}>{mode === 'staff' ? 'Customer sign in' : 'Staff sign in'}</button>
            <button type="button" onClick={() => go('inquire')}>For restaurants</button>
          </div>
        </footer>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><LoginPage /></StrictMode>,
)
