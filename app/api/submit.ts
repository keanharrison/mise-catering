import { handleSubmit } from '../src/setup/submit.js'

/** Vercel function: POST /api/submit. Set RESEND_API_KEY and SETUP_TO_EMAIL in the project's environment variables. */
export default async function handler(
  req: { method?: string; body?: unknown },
  res: { status: (code: number) => { json: (body: unknown) => void }; setHeader: (name: string, value: string) => void },
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, message: 'Method not allowed.' })
  }
  const result = await handleSubmit(req.body, process.env)
  return res.status(result.status).json(result.body)
}

export const config = { api: { bodyParser: { sizeLimit: '4.4mb' } } }
