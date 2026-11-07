import { useEffect, useRef, useState } from 'react'

const SIGN_IN_URL = '/pearl-login.html'
const DEMO_URL = '/pearl-login.html?view=biz-email'

// Placeholder until the application flow exists.
// Placeholder until there is a pricing page.
const PRICING_URL = '#'


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
    <>
    {open === 'product' && <div className="lp-dim" aria-hidden="true" onClick={() => setOpen(null)} />}
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
          </li>
          <li className="lp-item"><a className="lp-link" href={PRICING_URL}>Pricing</a></li>
        </ul>

        <div className="lp-actions">
          <a className="lp-btn lp-btn-quiet" href={SIGN_IN_URL}>Sign in</a>
          <a className="lp-btn lp-btn-primary" href={DEMO_URL}>See a demo</a>
        </div>

        <button
          type="button" className="lp-burger" aria-label="Toggle navigation menu" aria-expanded={open === 'mobile'} aria-controls="lp-mobile"
          onClick={() => setOpen(open === 'mobile' ? null : 'mobile')}
        >
          <span /><span /><span />
        </button>
      </div>

      {open === 'product' && (
        <div id="lp-product-menu" className="lp-mega">
          <div className="lp-mega-box">
            <p className="lp-menu-empty">Coming soon</p>
          </div>
        </div>
      )}

      {open === 'mobile' && (
        <div id="lp-mobile" className="lp-mobile">
          <a href={PRICING_URL} onClick={() => setOpen(null)}>Pricing</a>
          <div className="lp-mobile-actions">
            <a className="lp-btn lp-btn-quiet" href={SIGN_IN_URL}>Sign in</a>
            <a className="lp-btn lp-btn-primary" href={DEMO_URL}>See a demo</a>
          </div>
        </div>
      )}
    </nav>
    </>
  )
}
