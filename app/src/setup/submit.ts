import { allQuestions, sections } from './questions.ts'

export type SubmittedFile = { questionId: string; filename: string; contentBase64: string }
export type Submission = {
  name: string
  email: string
  role?: string
  answers: Record<string, string>
  files: SubmittedFile[]
  /** Honeypot: real people leave it empty. */
  website?: string
}

export const MAX_FILE_BYTES = 3_000_000
export const MAX_FILES = 8
const MAX_ANSWER = 5000

const decodedSize = (base64: string) => Math.floor((base64.length * 3) / 4)
export const totalBytes = (files: SubmittedFile[]) => files.reduce((sum, file) => sum + decodedSize(file.contentBase64), 0)

export type Env = { RESEND_API_KEY?: string; SETUP_TO_EMAIL?: string; SETUP_FROM_EMAIL?: string; VERCEL_ENV?: string }
export type Result = { status: number; body: { ok: boolean; message?: string; dryRun?: boolean } }

export function validate(body: unknown): { ok: true; submission: Submission } | { ok: false; message: string } {
  if (!body || typeof body !== 'object') return { ok: false, message: 'Missing form data.' }
  const b = body as Partial<Submission>
  const name = String(b.name ?? '').trim().slice(0, 200)
  const email = String(b.email ?? '').trim().slice(0, 320)
  if (!name) return { ok: false, message: 'Please enter your name.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: 'Please enter a valid email so we can reach you.' }
  const answers: Record<string, string> = {}
  for (const question of allQuestions) {
    const value = String((b.answers ?? {})[question.id] ?? '').trim().slice(0, MAX_ANSWER)
    if (value) answers[question.id] = value
  }
  const files = (Array.isArray(b.files) ? b.files : [])
    .filter((f): f is SubmittedFile => Boolean(f && typeof f.filename === 'string' && typeof f.contentBase64 === 'string'))
    .slice(0, MAX_FILES)
    .map((f) => ({ questionId: String(f.questionId), filename: f.filename.replace(/[^\w.\- ()]/g, '_').slice(0, 120), contentBase64: f.contentBase64 }))
  if (totalBytes(files) > MAX_FILE_BYTES) return { ok: false, message: 'Those files are too large to send here. Please email the big ones directly.' }
  return { ok: true, submission: { name, email, role: String(b.role ?? '').trim().slice(0, 200), answers, files, website: String(b.website ?? '') } }
}

/** The email we receive: every question in order, blank ones marked, then the attachment list. */
export function buildEmail(s: Submission) {
  const answered = allQuestions.filter((q) => s.answers[q.id]).length
  const lines: string[] = [
    `Pearl Island catering setup`,
    `From: ${s.name} <${s.email}>${s.role ? ` (${s.role})` : ''}`,
    `Answered: ${answered} of ${allQuestions.length}`,
    `Files attached: ${s.files.length}`,
    '',
  ]
  for (const section of sections) {
    lines.push(section.title.toUpperCase(), '')
    for (const q of section.questions) {
      const files = s.files.filter((f) => f.questionId === q.id).map((f) => f.filename)
      lines.push(`${q.id.slice(1)}. ${q.text}`, s.answers[q.id] ?? '(no answer)')
      if (files.length) lines.push(`Files: ${files.join(', ')}`)
      lines.push('')
    }
  }
  return {
    subject: `Pearl Island setup answers from ${s.name} (${answered}/${allQuestions.length})`,
    text: lines.join('\n'),
    attachments: s.files.map((f) => ({ filename: f.filename, content: f.contentBase64 })),
  }
}

/** Validate, then email through Resend. With no API key outside production it only logs, so the page can be tested locally. */
export async function handleSubmit(body: unknown, env: Env, send: typeof fetch = fetch): Promise<Result> {
  const checked = validate(body)
  if (!checked.ok) return { status: 400, body: { ok: false, message: checked.message } }
  const { submission } = checked
  if (submission.website) return { status: 200, body: { ok: true } } // bot: pretend it worked
  const email = buildEmail(submission)

  if (!env.RESEND_API_KEY || !env.SETUP_TO_EMAIL) {
    if (env.VERCEL_ENV === 'production') return { status: 500, body: { ok: false, message: 'Email is not set up yet. Please email your answers instead.' } }
    console.log(`[setup dry run] would email ${env.SETUP_TO_EMAIL ?? '(no SETUP_TO_EMAIL)'}\n${email.subject}\n${email.text}\nattachments: ${email.attachments.map((a) => a.filename).join(', ') || 'none'}`)
    return { status: 200, body: { ok: true, dryRun: true } }
  }

  const response = await send('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.SETUP_FROM_EMAIL ?? 'Mise Setup <onboarding@resend.dev>',
      to: [env.SETUP_TO_EMAIL],
      reply_to: submission.email,
      subject: email.subject,
      text: email.text,
      attachments: email.attachments,
    }),
  })
  if (!response.ok) return { status: 502, body: { ok: false, message: 'We could not send your answers just now. Please try again, or email them to us.' } }
  return { status: 200, body: { ok: true } }
}
