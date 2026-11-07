import { StrictMode } from 'react'
import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { FONTS, LOGIN_DEFAULT_THEME, LOGIN_THEME_KEY, mix, resolve, useDesignTheme } from '../lib/designTheme'
import '../lib/fonts.css'
import { MiseWordmark } from '../components/MiseLogo'
import './dashboard.css'

// Layout preview only: every name and number below is placeholder data until the real tables exist.
const RESTAURANT = { name: 'UVA', owner: 'Kean' }

// Icons are Lucide outlines (18px, 1.5 stroke) so the rail matches the reference product.
const ICONS = {
  house: <><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></>,
  workflow: <><rect width="8" height="8" x="3" y="3" rx="2" /><path d="M7 11v4a2 2 0 0 0 2 2h4" /><rect width="8" height="8" x="13" y="13" rx="2" /></>,
  card: <><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></>,
  inbox: <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></>,
  activity: <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />,
  chart: <><path d="M3 3v16a2 2 0 0 0 2 2h16" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></>,
  report: <><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></>,
  plug: <><path d="M12 22v-5" /><path d="M9 8V2" /><path d="M15 8V2" /><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" /></>,
  users: <><path d="M18 21a8 8 0 0 0-16 0" /><circle cx="10" cy="8" r="5" /><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" /></>,
}

type NavItem = { label: string; icon: React.ReactNode; active?: boolean; badge?: number }
const NAV: NavItem[][] = [
  [{ label: 'Home', icon: ICONS.house, active: true }],
  [{ label: 'Tools', icon: ICONS.workflow }, { label: 'Tool reports', icon: ICONS.report }, { label: 'Integrations', icon: ICONS.plug }],
  [{ label: 'Live activity', icon: ICONS.activity }, { label: 'Performance', icon: ICONS.chart }],
  [{ label: 'Usage and billing', icon: ICONS.card, badge: 1 }, { label: 'Feedback', icon: ICONS.inbox, badge: 2 }],
  [{ label: 'Profile', icon: ICONS.users }],
]

// Dark-mode surfaces. Flip LINEAR_BLACK to false to go back to the warm charcoal used on the landing page.
const LINEAR_BLACK = false
const DARK = LINEAR_BLACK
  ? { main: '#121213', side: '#09090a', edge: '#212224' }
  : { main: '#1a1919', side: '#222020', edge: '#3a3737' }

const TOOLS = [
  { name: 'Catering platform', note: 'Orders, intake and staff review.', status: 'Live', stat: '14', statLabel: 'orders this week', href: '/' },
  { name: 'Order automation', note: 'Phone and email orders into one queue.', status: 'Setting up', stat: '3 of 5', statLabel: 'steps done', href: '#' },
]

const STATS = [
  { label: 'Orders this week', value: '14', delta: '+3 vs last week' },
  { label: 'Active users', value: '6', delta: '2 new this month' },
  { label: 'Open feedback', value: '2', delta: '1 needs a reply' },
  { label: 'Next invoice', value: '$1,200', delta: 'Due Dec 1' },
]

function Icon({ children }: { children: React.ReactNode }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
}

// Default profile picture: a grey disc with a darker grey person silhouette.
export function Avatar({ size = 28 }: { size?: number }) {
  return (
    <svg className="db-avatar" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="16" className="db-avatar-bg" />
      <circle cx="16" cy="12.5" r="5" className="db-avatar-fg" />
      <path d="M5.5 27.2C7.2 22.4 11.2 20 16 20s8.8 2.4 10.5 7.2A15.9 15.9 0 0 1 16 32a15.9 15.9 0 0 1-10.5-4.8Z" className="db-avatar-fg" />
    </svg>
  )
}

const hold = (e: React.MouseEvent) => e.preventDefault()

function Dashboard() {
  const [theme] = useDesignTheme(LOGIN_THEME_KEY, LOGIN_DEFAULT_THEME)
  const r = resolve(theme)
  const [dark, setDark] = useState(() => {
    try { const v = localStorage.getItem('mise-dashboard-mode'); if (v) return v === 'dark' } catch { /* storage unavailable */ }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  useEffect(() => { try { localStorage.setItem('mise-dashboard-mode', dark ? 'dark' : 'light') } catch { /* storage unavailable */ } }, [dark])
  const ink = dark ? '#f4f2ef' : theme.ink
  const paper = dark ? DARK.main : theme.paper
  return (
    <div
      className="db-page" data-mode={dark ? 'dark' : 'light'}
      style={{
        '--line': r.accent, '--on-accent': r.onAccent, '--ink': ink, '--paper': paper,
        '--muted': mix(ink, paper, dark ? 0.55 : 0.42), '--edge': dark ? DARK.edge : mix(ink, paper, 0.88),
        '--side-bg': dark ? DARK.side : mix(ink, paper, 0.965),
        '--side-edge': dark ? DARK.edge : mix(ink, paper, 0.9), '--sans': FONTS[theme.font].stack,
      } as React.CSSProperties}
    >
      <aside className="db-side">
        <a className="db-logo" href="/landing.html" aria-label="Mise home"><MiseWordmark /></a>
        <nav className="db-nav-wrap" aria-label="Dashboard">
          {NAV.map((group, i) => (
            <div key={i} className="db-group">
              {group.map((n) => (
                <a key={n.label} href="#" onClick={hold} className="db-nav" aria-current={n.active ? 'page' : undefined}>
                  <Icon>{n.icon}</Icon>
                  <span>{n.label}</span>
                  {n.badge ? <em aria-label={`${n.badge} new`}>{n.badge}</em> : null}
                </a>
              ))}
            </div>
          ))}
        </nav>
        <div className="db-foot">
          <div className="db-who">
            <Avatar />
            <div><strong>{RESTAURANT.owner}</strong><small>{RESTAURANT.name} · Owner</small></div>
          </div>
        </div>
      </aside>

      <main className="db-main">
        <button type="button" className="db-mode" onClick={() => setDark(!dark)} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Light mode' : 'Dark mode'}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {dark
              ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></>
              : <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />}
          </svg>
        </button>
        <header className="db-head">
          <h1>Welcome back, {RESTAURANT.owner}.</h1>
          <p>Here is what is running for {RESTAURANT.name} today.</p>
        </header>

        <section aria-labelledby="db-tools">
          <h2 id="db-tools">Your tools</h2>
          <div className="db-tools">
            {TOOLS.map((t) => (
              <a key={t.name} className="db-tool" href={t.href} onClick={t.href === '#' ? hold : undefined}>
                <div className="db-tool-top">
                  <span className={`db-chip${t.status === 'Live' ? ' is-live' : ''}`}>{t.status}</span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M4 10 10 4M5 4h5v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" /></svg>
                </div>
                <h3>{t.name}</h3>
                <p>{t.note}</p>
                <div className="db-tool-stat"><strong>{t.stat}</strong><span>{t.statLabel}</span></div>
              </a>
            ))}
          </div>
        </section>

        <section aria-labelledby="db-stats">
          <h2 id="db-stats">This week</h2>
          <div className="db-stats">
            {STATS.map((s) => (
              <div key={s.label} className="db-stat"><small>{s.label}</small><strong>{s.value}</strong><span>{s.delta}</span></div>
            ))}
          </div>
        </section>

        <section aria-labelledby="db-msg">
          <h2 id="db-msg">Latest from Mise</h2>
          <a className="db-msg" href="#" onClick={hold} aria-label="Open message from the Mise team">
            <span className="db-mise-av" aria-hidden="true">M</span>
            <div>
              <strong>Mise team <small>Today, 9:12 AM</small></strong>
              <p>Order automation is two steps from live. We need your phone-order hours to finish the last setup.</p>
            </div>
            <em>1 unread</em>
          </a>
        </section>
      </main>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<StrictMode><Dashboard /></StrictMode>)
