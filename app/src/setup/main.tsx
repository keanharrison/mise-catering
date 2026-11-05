import { StrictMode, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { createRoot } from 'react-dom/client'
import { applyTheme, readStoredTheme } from '../lib/designTheme'
import { allQuestions, sections } from './questions'
import { MAX_FILES, MAX_FILE_BYTES, type SubmittedFile } from './submit'
import './setup.css'

applyTheme(readStoredTheme())

const DRAFT_KEY = 'mise-setup-draft'
type Draft = { name: string; email: string; role: string; answers: Record<string, string> }
type Attached = SubmittedFile & { size: number }

function loadDraft(): Draft {
  try { return { name: '', email: '', role: '', answers: {}, ...JSON.parse(localStorage.getItem(DRAFT_KEY) ?? '{}') } } catch { return { name: '', email: '', role: '', answers: {} } }
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

  const answered = useMemo(() => allQuestions.filter((q) => draft.answers[q.id]?.trim() || files.some((f) => f.questionId === q.id)).length, [draft.answers, files])
  const used = files.reduce((sum, f) => sum + f.size, 0)

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
        body: JSON.stringify({ ...draft, files: files.map(({ questionId, filename, contentBase64 }) => ({ questionId, filename, contentBase64 })), website: honeypot }),
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
    const text = [`Pearl Island catering setup`, `${draft.name} <${draft.email}>`, '', ...allQuestions.flatMap((q, i) => [`${i + 1}. ${q.text}`, draft.answers[q.id]?.trim() || '(no answer)', ''])].join('\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
    link.download = 'pearl-island-setup-answers.txt'
    link.click()
    URL.revokeObjectURL(link.href)
  }

  if (status === 'sent') {
    return (
      <main className="doc">
        <p className="doc-mark" aria-hidden="true">M</p>
        <h1>Thank you.</h1>
        <p className="doc-lead">We received your answers{files.length ? ` and ${files.length} file${files.length === 1 ? '' : 's'}` : ''}. We’ll review them and follow up with anything we still need. You can close this page.</p>
      </main>
    )
  }

  return (
    <>
      <div className="doc-progress" role="status" aria-live="polite">
        <span>{answered} of {allQuestions.length} answered</span>
        <span className="doc-progress-bar" aria-hidden="true"><span style={{ width: `${(answered / allQuestions.length) * 100}%` }} /></span>
      </div>
      <main className="doc">
        <p className="doc-mark" aria-hidden="true">M</p>
        <h1>Pearl Island catering setup</h1>
        <p className="doc-lead">These are the details we need to finish your catering platform. Answer what you can in your own words, and skip anything you’re unsure about; we’ll follow up. Your answers save in this browser as you type, so you can close the page and come back.</p>

        <form onSubmit={submit} noValidate>
          <section id="who" aria-labelledby="who-title">
            <h2 id="who-title">About you</h2>
            <div className="doc-grid">
              <label>Your name<input value={draft.name} autoComplete="name" onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
              <label>Your email<input type="email" value={draft.email} autoComplete="email" onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></label>
              <label className="doc-wide">Your role (optional)<input value={draft.role} autoComplete="organization-title" onChange={(e) => setDraft({ ...draft, role: e.target.value })} /></label>
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
                    <textarea id={q.id} rows={2} value={draft.answers[q.id] ?? ''} onChange={(e) => setAnswer(q.id, e.target.value)} placeholder="Your answer" />
                    {q.files && (
                      <div className="doc-files">
                        <input ref={(el) => { pickers.current[q.id] = el }} type="file" multiple hidden onChange={(e) => void addFiles(q.id, e)} />
                        <button type="button" className="doc-attach" onClick={() => pickers.current[q.id]?.click()}>Attach files</button>
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
