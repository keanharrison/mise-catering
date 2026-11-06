import { StrictMode, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { supabase } from '../lib/supabase'
import { LOGIN_URL, fetchProfile, homeFor, isStaffRole, requestDemo, saveProfileLocally, sendPasswordReset, setPassword, signIn, signUp } from '../state/auth'
import { DitherPanel } from './DitherPanel'
import { DesignPanel } from '../components/design/DesignPanel'
import '../components/design/design-panel.css'
import { resolve, useDesignTheme } from './theme'
import '@fontsource/space-grotesk/400.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/600.css'
import './login.css'

function MiseMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M48 48H0V0h48z" fill="var(--line)" />
      <path d="M12 36V12h3.6L24 25.2 32.4 12H36v24h-3.4V18.6L24 31.4l-8.6-12.8V36z" fill="var(--on-accent)" />
    </svg>
  )
}

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M4 10 10 4M5 4h5v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
    </svg>
  )
}

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="7.4" stroke="currentColor" strokeWidth="1.2" />
      <path d="m5.8 9.2 2.2 2.2 4.2-4.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

type Mode = 'signin' | 'staff' | 'signup' | 'biz-email' | 'biz-details' | 'biz-done' | 'check-email' | 'set-password'

// Invite and password-reset links arrive with a type in the URL hash; read it before the Supabase client consumes it.
const arrivedBy = new URLSearchParams(window.location.hash.slice(1)).get('type')

// A demo request needs a restaurant's own address, so personal mailboxes are turned away.
const PERSONAL_DOMAINS = new Set(['gmail.com', 'googlemail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'msn.com', 'icloud.com', 'me.com', 'aol.com', 'proton.me', 'protonmail.com', 'gmx.com'])
const isWorkEmail = (email: string) => !PERSONAL_DOMAINS.has(email.trim().toLowerCase().split('@')[1] ?? '')

const INTERESTS = [
  'Catering orders and intake',
  'AI ordering assistant',
  'Order review and staff workflow',
  'Customer messages and follow-up',
  'Analytics from real orders',
  'Calendar and integrations',
  'Menu, prices and portion setup',
]

const EXPECT = [
  { title: 'A walkthrough on your own menu and prices', path: 'M4 6h16M4 12h16M4 18h10' },
  { title: 'How orders reach your team, calendar and customers', path: 'M5 12h14M13 6l6 6-6 6' },
  { title: 'Straight answers on setup, timing and cost', path: 'M12 6v6l4 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z' },
]

function Field(props: { id: string; label: string; type?: string; value: string; onChange: (v: string) => void; autoComplete?: string; autoFocus?: boolean; required?: boolean; minLength?: number; readOnly?: boolean }) {
  const required = props.required ?? true
  return (
    <div className="rf">
      <label htmlFor={props.id}>{props.label}{required ? ' *' : ''}</label>
      <input
        id={props.id} type={props.type ?? 'text'} required={required} readOnly={props.readOnly}
        autoComplete={props.autoComplete} autoFocus={props.autoFocus} minLength={props.minLength}
        value={props.value} onChange={(e) => props.onChange(e.target.value)}
      />
    </div>
  )
}

function LoginPage() {
  const [mode, setMode] = useState<Mode>(arrivedBy === 'invite' || arrivedBy === 'recovery' ? 'set-password' : 'signin')
  const [step, setStep] = useState<'email' | 'password'>('email')
  const [theme, patchTheme, resetTheme] = useDesignTheme()
  const r = resolve(theme)
  const dither: [string, string, string] = [r.accent, r.mid, theme.paper]
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [f, setF] = useState({ name: '', first: '', last: '', email: '', phone: '', password: '', restaurant: '' })
  const set = (key: keyof typeof f) => (value: string) => setF((prev) => ({ ...prev, [key]: value }))

  // Already signed in: go straight to the right workspace (unless setting a password from an email link).
  useEffect(() => {
    if (!supabase || mode === 'set-password') return
    fetchProfile().then((p) => { if (p) { saveProfileLocally(p); window.location.replace(homeFor(p.role)) } })
  }, [mode])

  function go(next: Mode) {
    setMode(next)
    setStep('email')
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
    if ((mode === 'signin' || mode === 'staff') && step === 'email') { setStep('password'); setError(''); return }
    void run(async () => {
      if (mode === 'signin' || mode === 'staff') {
        await signIn(f.email.trim(), f.password)
        await enter(mode === 'staff')
      } else if (mode === 'signup') {
        const ready = await signUp({ fullName: f.name.trim(), email: f.email.trim(), phone: f.phone.trim(), password: f.password })
        if (ready) await enter(false)
        else go('check-email')
      } else if (mode === 'set-password') {
        await setPassword(f.password)
        await enter(false)
      }
    })
  }

  function submitWorkEmail(e: FormEvent) {
    e.preventDefault()
    if (!isWorkEmail(f.email)) {
      setError("Use your restaurant's work email. Personal addresses like gmail.com can't be used to request a demo.")
      return
    }
    go('biz-details')
  }

  function submitDemo(e: FormEvent) {
    e.preventDefault()
    void run(async () => {
      await requestDemo({
        restaurantName: f.restaurant.trim(),
        contactName: `${f.first.trim()} ${f.last.trim()}`.trim(),
        email: f.email.trim(),
        phone: '',
        message: interests.length ? `Interested in: ${interests.join(', ')}` : '',
      })
      setMode('biz-done')
    })
  }

  function forgot() {
    if (!f.email.trim()) { setError('Enter your email first.'); return }
    void run(async () => {
      await sendPasswordReset(f.email.trim())
      setNotice('If that email has an account, a reset link is on its way.')
    })
  }

  const toggleInterest = (name: string) => setInterests((prev) => (prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]))

  const messages = (
    <>
      {!supabase && <p className="mise-alert" role="alert">Accounts are not connected yet. Add the Supabase URL and key to app/.env.local.</p>}
      {error && <p className="mise-alert" role="alert">{error}</p>}
      {notice && <p className="mise-notice" role="status">{notice}</p>}
    </>
  )

  const shell = (children: ReactNode, tone: 'light' | 'dark' = 'light') => (
    <div
      className={`mise-page mise-${tone}`}
      style={{ '--line': r.accent, '--line-hover': r.hover, '--on-accent': r.onAccent, '--line-text': r.accentText, ...(tone === 'light' ? { '--ink': theme.ink, '--paper': theme.paper } : {}) } as React.CSSProperties}
    >
      <DesignPanel theme={theme} onChange={patchTheme} onReset={resetTheme} surface="login" />
      {children}
    </div>
  )

  // Business sign-up, step 1: a work email, on a blurred brand backdrop.
  if (mode === 'biz-email') {
    return shell(
      <div className="mise-bizbg">
        <DitherPanel seed={1018} colors={dither} cell={theme.cell} className="mise-bizbg-art" />
        <div className="mise-bizbg-veil" />
        <section className="mise-card" aria-labelledby="biz-title">
          <button type="button" className="mise-card-close" aria-label="Back to sign in" onClick={() => go('signin')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3 3 10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.4" /></svg>
          </button>
          <div className="mise-logo mise-logo-center"><MiseMark size={26} /><span>mise</span></div>
          <h1 id="biz-title" className="mise-card-title">See Mise on your menu.</h1>
          <p className="mise-card-lead">Tell us where to reach you. We'll set up a demo around your restaurant's real menu and prices.</p>
          {messages}
          <form className="mise-claim" onSubmit={submitWorkEmail}>
            <input
              type="email" required autoFocus autoComplete="email" aria-label="Work email" placeholder="you@yourrestaurant.com"
              value={f.email} onChange={(e) => { set('email')(e.target.value); setError('') }}
            />
            <button type="submit">Request a demo</button>
          </form>
          <ul className="mise-checks">
            <li><Check />Built around your menu</li>
            <li><Check />Your team confirms every order</li>
            <li><Check />No commitment</li>
          </ul>
        </section>
      </div>,
    )
  }

  // Business sign-up, step 2: the details we need to run the demo.
  if (mode === 'biz-details' || mode === 'biz-done') {
    return shell(
      <div className="mise-demo">
        <button type="button" className="mise-back" onClick={() => go(mode === 'biz-done' ? 'signin' : 'biz-email')}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M9 2 4 7l5 5" stroke="currentColor" strokeWidth="1.4" /></svg>
          {mode === 'biz-done' ? 'Back to sign in' : 'Back'}
        </button>
        <div className="mise-demo-grid">
          <section className="mise-demo-form" aria-labelledby="demo-title">
            {mode === 'biz-done' ? (
              <>
                <h1 id="demo-title">Thank you{f.first ? `, ${f.first.trim()}` : ''}.</h1>
                <p className="mise-demo-lead">We received your request and will reach out to {f.email} to set up your demo.</p>
              </>
            ) : (
              <>
                <h1 id="demo-title">Let's set up your demo.</h1>
                <p className="mise-demo-lead">A few details so we can prepare around your restaurant.</p>
                {messages}
                <form onSubmit={submitDemo}>
                  <div className="rf rf-static">
                    <label htmlFor="d-email">Email</label>
                    <input id="d-email" type="email" value={f.email} readOnly />
                  </div>
                  <div className="rf-row">
                    <Field id="d-first" label="First name" value={f.first} onChange={set('first')} autoComplete="given-name" autoFocus />
                    <Field id="d-last" label="Last name" value={f.last} onChange={set('last')} autoComplete="family-name" />
                  </div>
                  <Field id="d-restaurant" label="Restaurant name" value={f.restaurant} onChange={set('restaurant')} autoComplete="organization" />
                  <fieldset className="mise-interests">
                    <legend>What do you want to solve?</legend>
                    {INTERESTS.map((name) => (
                      <label key={name} className="mise-check">
                        <input type="checkbox" checked={interests.includes(name)} onChange={() => toggleInterest(name)} />
                        <span>{name}</span>
                      </label>
                    ))}
                  </fieldset>
                  <p className="mise-demo-fine">Don't worry. This is not a commitment.</p>
                  <button type="submit" className="mise-submit" disabled={busy || !supabase}>{busy ? 'One moment…' : 'Request a demo'}</button>
                </form>
              </>
            )}
          </section>
          <aside className="mise-expect" aria-labelledby="expect-title">
            <DitherPanel seed={1015} colors={dither} cell={theme.cell} className="mise-expect-art" />
            <h2 id="expect-title">What can you expect?</h2>
            <ul>
              {EXPECT.map((item) => (
                <li key={item.title}>
                  <span className="mise-expect-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={item.path} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
                  {item.title}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>,
      'dark',
    )
  }

  const copy: Record<'signin' | 'staff' | 'signup' | 'check-email' | 'set-password', { title: string; lead?: string; cta: string }> = {
    signin: { title: 'Welcome to Mise', cta: step === 'email' ? 'Continue' : 'Log in' },
    staff: { title: 'Staff sign in', lead: 'For restaurant teams with an invitation.', cta: step === 'email' ? 'Continue' : 'Log in' },
    signup: { title: 'Create your account', lead: 'Save your details so ordering is faster next time.', cta: 'Create account' },
    'set-password': { title: 'Set a password', lead: 'Choose a password to finish setting up your account.', cta: 'Save password' },
    'check-email': { title: 'Check your email', lead: `We sent a confirmation link to ${f.email}. Open it to finish creating your account.`, cta: '' },
  }
  const c = copy[mode]
  const signinLike = mode === 'signin' || mode === 'staff'

  return shell(
    <div className="mise-frame">
      <header className="mise-top">
        <a href={LOGIN_URL} className="mise-logo" aria-label="Mise home"><MiseMark /><span>mise</span></a>
      </header>

      <main className="mise-main">
        <section className="mise-auth" aria-labelledby="login-title">
          <h1 id="login-title">{c.title}</h1>
          {c.lead && <p className="mise-lead">{c.lead}</p>}
          {messages}

          {c.cta !== '' && (
            <form onSubmit={submit}>
              {mode === 'signup' && <Field id="name" label="Full name" value={f.name} onChange={set('name')} autoComplete="name" autoFocus />}
              {mode !== 'set-password' && (
                signinLike && step === 'password' ? (
                  <div className="mise-who">
                    <span>{f.email}</span>
                    <button type="button" onClick={() => { setStep('email'); setError('') }}>Change</button>
                  </div>
                ) : (
                  <Field id="email" label="Email address" type="email" value={f.email} onChange={set('email')} autoComplete="email" autoFocus={signinLike || mode !== 'signup'} />
                )
              )}
              {mode === 'signup' && <Field id="phone" label="Phone" type="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" />}
              {(!signinLike || step === 'password') && (
                <Field
                  id="password" label="Password" type="password" value={f.password} onChange={set('password')}
                  autoComplete={signinLike ? 'current-password' : 'new-password'}
                  minLength={signinLike ? undefined : 8} autoFocus={mode === 'set-password' || step === 'password'}
                />
              )}
              {(mode === 'signup' || mode === 'set-password') && <p className="mise-hint">At least 8 characters.</p>}
              <button type="submit" className="mise-submit" disabled={busy || !supabase}>{busy ? 'One moment…' : c.cta}</button>
            </form>
          )}

          <p className="mise-switch">
            {signinLike && step === 'password' && <><button type="button" onClick={forgot}>Forgot password?</button></>}
            {mode === 'signin' && step === 'email' && <>Looking to get started with Mise for your restaurant?{' '}<button type="button" className="mise-link" onClick={() => go('biz-email')}>Sign up<Arrow /></button></>}
            {mode === 'staff' && step === 'email' && <>Not on a restaurant team?{' '}<button type="button" className="mise-link" onClick={() => go('signin')}>Customer sign in</button></>}
            {mode === 'signup' && <>Have an account? <button type="button" className="mise-link" onClick={() => go('signin')}>Sign in</button></>}
            {(mode === 'check-email' || mode === 'set-password') && <button type="button" className="mise-link" onClick={() => go('signin')}>Back to sign in</button>}
          </p>
        </section>
      </main>

      <footer className="mise-footer">
        {mode === 'signin' && <button type="button" onClick={() => go('signup')}>Ordering catering? Create a customer account</button>}
        {mode !== 'staff' && <button type="button" onClick={() => go('staff')}>Staff sign in</button>}
      </footer>
    </div>,
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><LoginPage /></StrictMode>,
)
