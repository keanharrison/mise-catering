import { describe, expect, it, vi } from 'vitest'
import { allQuestions } from './questions'
import { buildEmail, handleSubmit, validate } from './submit'

const good = { name: 'Sober', email: 'sober@example.com', answers: { q1: 'Yes, current.' }, files: [] }
const env = { RESEND_API_KEY: 'key', SETUP_TO_EMAIL: 'team@example.com' }

describe('setup questions', () => {
  it('has 27 numbered questions and five upload questions', () => {
    expect(allQuestions).toHaveLength(27)
    expect(allQuestions.filter((q) => q.files).map((q) => q.id)).toEqual(['q2', 'q14', 'q18', 'q25', 'q27'])
  })

  it('offers a checklist only on the knowledge question, and no role field is asked', () => {
    expect(allQuestions.filter((q) => q.options).map((q) => q.id)).toEqual(['q27'])
  })
})

describe('setup submission', () => {
  it('requires a name and a valid email', () => {
    expect(validate({ ...good, name: '' }).ok).toBe(false)
    expect(validate({ ...good, email: 'nope' }).ok).toBe(false)
    expect(validate(good).ok).toBe(true)
  })

  it('rejects files over the size limit', () => {
    const big = 'A'.repeat(4_200_000)
    expect(validate({ ...good, files: [{ questionId: 'q18', filename: 'orders.csv', contentBase64: big }] }).ok).toBe(false)
  })

  it('lists every question in the email, marks blanks, and attaches files', () => {
    const checked = validate({ ...good, files: [{ questionId: 'q18', filename: 'orders.csv', contentBase64: 'YQ==' }] })
    if (!checked.ok) throw new Error(checked.message)
    const email = buildEmail(checked.submission)
    expect(email.text).toContain('1. We’re building from your January 2026 catering menu PDF')
    expect(email.text).toContain('Yes, current.')
    expect(email.text).toContain('(no answer)')
    expect(email.text).toContain('Files: orders.csv')
    expect(email.attachments).toEqual([{ filename: 'orders.csv', content: 'YQ==' }])
    expect(email.subject).toContain('1/27')
  })

  it('sends through Resend with a reply-to and ignores bots', async () => {
    const send = vi.fn(async () => new Response('{}', { status: 200 })) as unknown as typeof fetch
    const ok = await handleSubmit(good, env, send)
    expect(ok.status).toBe(200)
    const [, init] = (send as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit]
    expect(JSON.parse(String(init.body))).toMatchObject({ to: ['team@example.com'], reply_to: 'sober@example.com' })
    const bot = await handleSubmit({ ...good, website: 'spam.example' }, env, send)
    expect(bot.status).toBe(200)
    expect((send as unknown as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1)
  })

  it('reports a failed send and refuses to fake success in production without a key', async () => {
    const fail = vi.fn(async () => new Response('{}', { status: 500 })) as unknown as typeof fetch
    expect((await handleSubmit(good, env, fail)).status).toBe(502)
    expect((await handleSubmit(good, { VERCEL_ENV: 'production' })).status).toBe(500)
    expect((await handleSubmit(good, {})).body.dryRun).toBe(true)
  })
})
