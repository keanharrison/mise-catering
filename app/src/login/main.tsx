import { StrictMode, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { supabase } from '../lib/supabase'
import { DEMO_EMAIL_KEY, WORK_EMAIL_ERROR, isWorkEmail } from '../lib/workEmail'
import { fetchProfile, homeFor, isStaffRole, requestDemo, saveProfileLocally, sendPasswordReset, setPassword, signIn, signUp } from '../state/auth'
import { DitherPanel } from './DitherPanel'
import { MiseWordmark } from '../components/MiseLogo'
import { DotField } from '../landing/DotField'
import { FONTS, LOGIN_DEFAULT_THEME, LOGIN_THEME_KEY, mix, resolve, useDesignTheme } from './theme'
import '../lib/fonts.css'
import './login.css'

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

const INTERESTS = [
  'Catering orders and intake',
  'AI ordering assistant',
  'Order review and staff workflow',
  'Customer messages and follow-up',
  'Analytics from real orders',
  'Calendar and integrations',
  'Menu, prices and portion setup',
  'Other - not listed',
]

function Field(props: { id: string; label: string; type?: string; value: string; onChange: (v: string) => void; autoComplete?: string; autoFocus?: boolean; required?: boolean; minLength?: number; readOnly?: boolean }) {
  const required = props.required ?? true
  return (
    <div className="rf">
      <label htmlFor={props.id}>{props.label}{required ? ' *' : ''}</label>
      <input
        id={props.id} type={props.type ?? 'text'} required={required} readOnly={props.readOnly}
        autoComplete={props.autoComplete} autoFocus={props.autoFocus} minLength={props.minLength} placeholder=" "
        value={props.value} onChange={(e) => props.onChange(e.target.value)}
      />
    </div>
  )
}

// Local preview only: ?view=biz-email | biz-details | biz-done | signup | staff opens that screen directly.
const PREVIEW_VIEWS: Mode[] = ['biz-email', 'biz-details', 'biz-done', 'signup', 'staff']
const requestedView = new URLSearchParams(window.location.search).get('view') as Mode | null
// The demo card is a public deep link (the landing page uses it); every other preview view is local only.
const previewView = import.meta.env.DEV ? requestedView : requestedView === 'biz-email' ? requestedView : null
const PREVIEW_EMAIL = 'preview@yourrestaurant.com'

// An address typed on the landing page skips straight to the details step.
function takeLandingEmail() {
  try {
    const email = sessionStorage.getItem(DEMO_EMAIL_KEY) ?? ''
    sessionStorage.removeItem(DEMO_EMAIL_KEY)
    return isWorkEmail(email) ? email.trim() : ''
  } catch { return '' }
}
const landingEmail = requestedView === 'biz-email' ? takeLandingEmail() : ''

function LoginPage() {
  const [mode, setMode] = useState<Mode>(
    arrivedBy === 'invite' || arrivedBy === 'recovery' ? 'set-password' : landingEmail ? 'biz-details' : previewView && PREVIEW_VIEWS.includes(previewView) ? previewView : 'signin',
  )
  const [step, setStep] = useState<'email' | 'password'>('email')
  const [theme] = useDesignTheme(LOGIN_THEME_KEY, LOGIN_DEFAULT_THEME)
  const r = resolve(theme)
  const dither: [string, string, string] = [r.accent, r.mid, theme.paper]
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [f, setF] = useState({ name: '', first: '', last: '', email: landingEmail || (previewView?.startsWith('biz-') && previewView !== 'biz-email' ? PREVIEW_EMAIL : ''), phone: '', password: '', restaurant: '' })
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
      setError(WORK_EMAIL_ERROR)
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
      style={{ '--line': r.accent, '--line-hover': r.hover, '--on-accent': r.onAccent, '--line-text': r.accentText, '--sans': FONTS[theme.font].stack, ...(tone === 'light' ? { '--ink': theme.ink, '--paper': theme.paper, '--muted': mix(theme.ink, theme.paper, 0.42), '--edge': mix(theme.ink, theme.paper, 0.79), '--edge-focus': mix(theme.ink, theme.paper, 0.36) } : {}) } as React.CSSProperties}
    >
      {mode !== 'biz-email' && (
        <div className="mise-dots"><DotField color={tone === 'dark' ? mix('#f4f2ef', '#1a1919', 0.76) : mix(theme.ink, theme.paper, 0.76)} /></div>
      )}
      <div className="mise-content">{children}</div>
    </div>
  )

  // Business sign-up, step 1: a work email, on a blurred brand backdrop.
  if (mode === 'biz-email') {
    return shell(
      <div className="mise-bizbg">
        <DitherPanel seed={1018} colors={dither} cell={theme.cell} className="mise-bizbg-art" />
        <div className="mise-bizbg-veil" />
        <section className="mise-card" aria-labelledby="biz-title">
          <button type="button" className="mise-card-close" aria-label="Back to Mise" onClick={() => window.location.assign('/landing.html')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3 3 10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.4" /></svg>
          </button>
          <a className="mise-logo mise-logo-center" href="/landing.html" aria-label="Mise home"><span className="mise-word"><MiseWordmark /></span></a>
          <h1 id="biz-title" className="mise-card-title">Run the restaurant. Leave the rest to us.</h1>
          <p className="mise-card-lead">Mise builds the software behind your operations, from orders to admin, so you can spend your time on the food and the guests you love.</p>
          {messages}
          <form className="mise-claim" onSubmit={submitWorkEmail}>
            <input
              type="email" required autoFocus autoComplete="email" aria-label="Work email" placeholder="Enter your work email"
              value={f.email} onChange={(e) => { set('email')(e.target.value); setError('') }}
            />
            <button type="submit">Continue</button>
          </form>
          <ul className="mise-checks">
            <li><Check />Built for your specific problems</li>
            <li><Check />Your team runs what matters most</li>
            <li><Check />No commitment</li>
          </ul>
          {import.meta.env.DEV && (
            <button type="button" className="mise-skip" onClick={() => { set('email')(f.email.trim() || PREVIEW_EMAIL); go('biz-details') }}>
              Skip without an email (local preview only)
            </button>
          )}
        </section>
      </div>,
    )
  }

  // Business sign-up, step 2: one centered column on a dark page.
  if (mode === 'biz-details' || mode === 'biz-done') {
    return shell(
      <div className="mise-demo">
        <button type="button" className="mise-back" onClick={() => window.location.assign('/landing.html')}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M9 2 4 7l5 5" stroke="currentColor" strokeWidth="1.4" /></svg>
          Back to Mise
        </button>
        <section className="mise-demo-form" aria-labelledby="demo-title">
          {mode === 'biz-done' ? (
            <>
              <h1 id="demo-title">Thank you{f.first ? `, ${f.first.trim()}` : ''}.</h1>
              <p className="mise-demo-lead">We received your request and will reach out to {f.email} to schedule your call.</p>
            </>
          ) : (
            <>
              <h1 id="demo-title">Book a call</h1>
              {messages}
              <form onSubmit={submitDemo}>
                <div className="rf rf-locked">
                  <label htmlFor="d-email">Work email address</label>
                  <input id="d-email" type="email" value={f.email} readOnly />
                  <svg className="rf-lock" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2" /><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.2" /></svg>
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
                <button type="submit" className="mise-submit" disabled={busy || !supabase}>{busy ? 'One moment…' : 'Book a call'}</button>
              </form>
            </>
          )}
        </section>
      </div>,
      'dark',
    )
  }

  const copy: Record<'signin' | 'staff' | 'signup' | 'check-email' | 'set-password', { title: string; lead?: string; cta: string }> = {
    signin: { title: 'Welcome back to Mise', cta: step === 'email' ? 'Continue' : 'Log in' },
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
        <a className="mise-back" href="/landing.html">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M9 2 4 7l5 5" stroke="currentColor" strokeWidth="1.4" /></svg>
          Back to Mise
        </a>
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
                    <input
                      className="mise-who-email" type="text" readOnly value={f.email} aria-label="Email address"
                      onKeyDown={(e) => { const t = e.currentTarget; const all = t.selectionStart === 0 && t.selectionEnd === t.value.length; if (all && (e.key === 'Backspace' || e.key === 'Delete')) { e.preventDefault(); set('email')(''); setStep('email'); setError('') } }}
                    />
                    <button type="button" onClick={() => { setStep('email'); setError('') }}>Change</button>
                  </div>
                ) : (
                  <Field id="email" label="Email address" type="email" value={f.email} onChange={set('email')} autoComplete="email" autoFocus={!signinLike && mode !== 'signup'} />
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

      {mode !== 'signin' && (
        <footer className="mise-footer">
          {mode !== 'staff' && <button type="button" onClick={() => go('staff')}>Staff sign in</button>}
        </footer>
      )}
    </div>,
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><LoginPage /></StrictMode>,
)
