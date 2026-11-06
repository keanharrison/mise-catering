import { useEffect, useRef, useState } from 'react'

const SIGN_IN_URL = '/pearl-login.html'
const DEMO_URL = '/pearl-login.html?view=biz-email'

const PRODUCT_LINKS = [
  { label: 'Order assistant', href: '#assistant', note: 'Customers describe an event and get a proposed order.' },
  { label: 'Staff review', href: '#review', note: 'Your team confirms, asks, or changes every order.' },
  { label: 'Analytics', href: '#analytics', note: 'Counts from real orders, nothing invented.' },
]

function Chevron() {
  return (
    <svg className="lp-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

/**
 * Top navigation. Layout follows the pattern of a fixed, blurred bar: wordmark and links on the left,
 * sign-in and a primary action on the right, a menu button on small screens.
 */
export function Nav() {
  const [open, setOpen] = useState<'product' | 'mobile' | null>(null)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  return (
    <nav ref={ref} className="lp-nav" aria-label="Main">
      <div className="lp-nav-inner">
        <a href="/landing.html" className="lp-logo" aria-label="Mise home">Mise</a>

        <ul className="lp-links">
          <li className="lp-item">
            <button
              type="button" className="lp-link" aria-expanded={open === 'product'} aria-controls="lp-product-menu"
              onClick={() => setOpen(open === 'product' ? null : 'product')}
            >
              Product<Chevron />
            </button>
            {open === 'product' && (
              <div id="lp-product-menu" className="lp-menu">
                {PRODUCT_LINKS.map((l) => (
                  <a key={l.href} href={l.href} className="lp-menu-link" onClick={() => setOpen(null)}>
                    <span>{l.label}</span>
                    <small>{l.note}</small>
                  </a>
                ))}
              </div>
            )}
          </li>
          <li className="lp-item"><a className="lp-link" href="#how-it-works">How it works</a></li>
          <li className="lp-item"><a className="lp-link" href="#restaurants">For restaurants</a></li>
        </ul>

        <div className="lp-actions">
          <a className="lp-btn lp-btn-quiet" href={SIGN_IN_URL}>Sign in</a>
          <a className="lp-btn lp-btn-primary" href={DEMO_URL}>Request a demo</a>
        </div>

        <button
          type="button" className="lp-burger" aria-label="Toggle navigation menu" aria-expanded={open === 'mobile'} aria-controls="lp-mobile"
          onClick={() => setOpen(open === 'mobile' ? null : 'mobile')}
        >
          <span /><span /><span />
        </button>
      </div>

      {open === 'mobile' && (
        <div id="lp-mobile" className="lp-mobile">
          {PRODUCT_LINKS.map((l) => <a key={l.href} href={l.href} onClick={() => setOpen(null)}>{l.label}</a>)}
          <a href="#how-it-works" onClick={() => setOpen(null)}>How it works</a>
          <a href="#restaurants" onClick={() => setOpen(null)}>For restaurants</a>
          <div className="lp-mobile-actions">
            <a className="lp-btn lp-btn-quiet" href={SIGN_IN_URL}>Sign in</a>
            <a className="lp-btn lp-btn-primary" href={DEMO_URL}>Request a demo</a>
          </div>
        </div>
      )}
    </nav>
  )
}
