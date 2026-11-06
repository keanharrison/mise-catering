import { useId, useState, type FormEvent } from 'react'
import { DEMO_EMAIL_KEY, WORK_EMAIL_ERROR, isWorkEmail } from '../../lib/workEmail'

/** Work-email field plus the demo button. A valid address is handed to the demo form through session storage, never the URL. */
export function DemoForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const errorId = useId()

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
          aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined}
          onChange={(e) => { setEmail(e.target.value); setError('') }}
        />
        <button type="submit">Request a demo</button>
      </div>
      {error && <p id={errorId} className="lp-cta-error" role="alert">{error}</p>}
    </form>
  )
}
