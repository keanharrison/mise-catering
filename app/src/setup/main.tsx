import { StrictMode, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { createRoot } from 'react-dom/client'
import { Backdrop } from './Backdrop'
import { allQuestions, sections } from './questions'
import { MAX_FILES, MAX_FILE_BYTES, type SubmittedFile } from './submit'
import './setup.css'


const DRAFT_KEY = 'mise-setup-draft-v2'
type Draft = { name: string; email: string; answers: Record<string, string>; checks: Record<string, string[]> }
type Attached = SubmittedFile & { size: number }

function loadDraft(): Draft {
  try { return { name: '', email: '', answers: {}, checks: {}, ...JSON.parse(localStorage.getItem(DRAFT_KEY) ?? '{}') } } catch { return { name: '', email: '', answers: {}, checks: {} } }
}

const readBase64 = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
  reader.onerror = () => reject(reader.error)
  reader.readAsDataURL(file)
})

const megabytes = (bytes: number) => `${(bytes / 1_000_000).toFixed(1)} MB`

function SetupPage() {
  const [draft, setDraft] = useState<Draft>(loadDraft)
  const [files, setFiles] = useState<Attached[]>([])
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')
  const pickers = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)) }, [draft])

  const used = files.reduce((sum, f) => sum + f.size, 0)

  /** Answers as sent: a checklist's ticked items go in front of the written note. */
  const mergedAnswers = () => Object.fromEntries(allQuestions.map((question) => {
    const checked = draft.checks[question.id] ?? []
    const note = draft.answers[question.id]?.trim() ?? ''
    return [question.id, [checked.length ? `Already have: ${checked.join(', ')}.` : '', note].filter(Boolean).join('\n\n')]
  }))

  const toggleCheck = (id: string, option: string) => setDraft((d) => {
    const current = d.checks[id] ?? []
    return { ...d, checks: { ...d.checks, [id]: current.includes(option) ? current.filter((o) => o !== option) : [...current, option] } }
  })

  const setAnswer = (id: string, value: string) => setDraft((d) => ({ ...d, answers: { ...d.answers, [id]: value } }))

  async function addFiles(questionId: string, event: ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(event.target.files ?? [])
    event.target.value = ''
    setError('')
    let total = used
    const added: Attached[] = []
    for (const file of chosen) {
      if (files.length + added.length >= MAX_FILES) { setError(`You can attach up to ${MAX_FILES} files here.`); break }
      if (total + file.size > MAX_FILE_BYTES) { setError(`${file.name} would take the attachments past ${megabytes(MAX_FILE_BYTES)}. Please email larger files to us directly.`); continue }
      total += file.size
      added.push({ questionId, filename: file.name, contentBase64: await readBase64(file), size: file.size })
    }
    if (added.length) setFiles((current) => [...current, ...added])
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!draft.name.trim() || !draft.email.trim()) { setError('Please add your name and email at the top so we know who this is from.'); document.getElementById('who')?.scrollIntoView({ behavior: 'smooth' }); return }
    setStatus('sending')
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: draft.name, email: draft.email, answers: mergedAnswers(), files: files.map(({ questionId, filename, contentBase64 }) => ({ questionId, filename, contentBase64 })), website: honeypot }),
      })
      const result = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string }
      if (!response.ok || !result.ok) throw new Error(result.message || 'Something went wrong. Please try again.')
      localStorage.removeItem(DRAFT_KEY)
      setStatus('sent')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setStatus('idle')
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    }
  }

  function downloadCopy() {
    const merged = mergedAnswers()
    const text = [`Pearl Island Catering Setup`, `${draft.name} <${draft.email}>`, '', ...allQuestions.flatMap((q, i) => [`${i + 1}. ${q.text}`, merged[q.id] || '(no answer)', ''])].join('\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
    link.download = 'pearl-island-setup-answers.txt'
    link.click()
    URL.revokeObjectURL(link.href)
  }

  if (status === 'sent') {
    return (
      <>
        <Backdrop />
        <main className="doc">
          <h1>Thank You</h1>
          <p className="doc-lead">We received your answers{files.length ? ` and ${files.length} file${files.length === 1 ? '' : 's'}` : ''}. We’ll review them and follow up with anything we still need. You can close this page.</p>
        </main>
      </>
    )
  }

  return (
    <>
      <Backdrop />
      <main className="doc">
        <h1>Pearl Island Catering Setup</h1>
        <p className="doc-lead">Hey Sober, Kean and Diego here. We’re almost done with your website and catering platform. There are just a few more details we need to finish your catering platform. Answer what you can to the best of your ability, and skip anything you’re unsure about; we’ll follow up. Your answers save in this browser as you type, so you can close the page and come back. You can download a copy of your responses at the end. We’ll also get an email of your responses.</p>

        <form onSubmit={submit} noValidate>
          <section id="who" aria-labelledby="who-title">
            <h2 id="who-title">About You</h2>
            <div className="doc-grid">
              <label>Your name<input value={draft.name} autoComplete="name" onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
              <label>Your email<input type="email" value={draft.email} autoComplete="email" onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></label>
            </div>
          </section>

          {sections.map((section) => (
            <section key={section.id} aria-labelledby={`${section.id}-title`}>
              <h2 id={`${section.id}-title`}>{section.title}</h2>
              {section.questions.map((q) => {
                const mine = files.filter((f) => f.questionId === q.id)
                return (
                  <div className="doc-q" key={q.id}>
                    <label htmlFor={q.id}><span className="doc-n">{q.id.slice(1)}</span>{q.text}</label>
                    {q.options && (
                      <div className="doc-checks" role="group" aria-label="Check any that apply">
                        {q.options.map((option) => (
                          <label key={option} className="doc-check">
                            <input type="checkbox" checked={(draft.checks[q.id] ?? []).includes(option)} onChange={() => toggleCheck(q.id, option)} />
                            {option}
                          </label>
                        ))}
                      </div>
                    )}
                    <textarea id={q.id} rows={2} value={draft.answers[q.id] ?? ''} onChange={(e) => setAnswer(q.id, e.target.value)} placeholder={q.placeholder ?? 'Your answer'} />
                    {q.files && (
                      <div className="doc-files">
                        <input ref={(el) => { pickers.current[q.id] = el }} type="file" multiple hidden onChange={(e) => void addFiles(q.id, e)} />
                        <button type="button" className="doc-attach" onClick={() => pickers.current[q.id]?.click()}>Attach files</button>
                        {q.fileHint && <span className="doc-hint">{q.fileHint}</span>}
                        {mine.map((f) => (
                          <span className="doc-file" key={f.filename}>{f.filename} · {megabytes(f.size)}
                            <button type="button" aria-label={`Remove ${f.filename}`} onClick={() => setFiles((cur) => cur.filter((x) => x !== f))}>×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </section>
          ))}

          <input className="doc-trap" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />

          {error && <p className="doc-error" role="alert">{error}</p>}
          <div className="doc-submit">
            <button type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Submit'}</button>
            <button type="button" className="doc-link" onClick={downloadCopy}>Download a copy of my answers</button>
          </div>
          <p className="doc-fine">Attachments can total up to {megabytes(MAX_FILE_BYTES)}. For anything bigger, email it to us directly.</p>
        </form>
      </main>
    </>
  )
}

createRoot(document.getElementById('root')!).render(<StrictMode><SetupPage /></StrictMode>)
