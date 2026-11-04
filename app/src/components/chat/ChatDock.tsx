import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChatComposer } from '../../views/customer/ChatComposer'
import { useDemoStore } from '../../state/store'
import { restaurant } from '../../data/restaurant'
import type { Stage } from '../../views/customer/journey'
import { answerOrderQuestion, starterQuestions, type ChatAnswer } from './orderAnswers'

type Turn = { id: number; question: string; attachments: string[]; answer: ChatAnswer }

/**
 * The ordering chat: a column beside every step of a new request (a slide-over on narrow screens).
 * Mounted once in the app shell, so the conversation survives moving between steps.
 * Orange gradient background; answers come from Pearl Island's menu and rules, not a language model.
 */
export function ChatDock({ stage }: { stage: Stage }) {
  const order = useDemoStore((state) => state.order)
  const [turns, setTurns] = useState<Turn[]>([])
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => { end.current?.scrollIntoView?.({ block: 'end' }) }, [turns.length])

  function ask(question: string, attachments: string[] = []) {
    const trimmed = question.trim()
    if (!trimmed && attachments.length === 0) return
    setTurns((current) => [...current, { id: current.length, question: trimmed, attachments, answer: answerOrderQuestion(trimmed, { order, stage }, attachments) }])
    setText('')
  }

  const empty = turns.length === 0

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open order help"
        className="fixed bottom-24 right-4 z-40 lg:bottom-6 rounded-full border border-primary bg-primary px-5 py-3 font-mono text-[12px] tracking-[-0.01em] text-primary-foreground shadow-[0_6px_16px_-8px_rgb(0_0_0/0.3)] transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 xl:hidden"
      >
        Help
      </button>

      <aside
        aria-label="Order help chat"
        data-open={open}
        className="chat-dock fixed inset-y-0 right-0 z-50 flex w-[min(92vw,24rem)] translate-x-full flex-col border-l border-primary transition-transform duration-200 data-[open=true]:translate-x-0 motion-reduce:transition-none xl:sticky xl:top-[3.25rem] xl:z-10 xl:h-[calc(100svh-3.25rem)] xl:w-[23rem] xl:shrink-0 xl:translate-x-0"
      >
        <div className="flex items-center justify-between px-5 pt-4">
          <span className="rounded-full border border-primary/40 bg-background/80 px-2.5 py-1 font-mono text-[11px] leading-none text-primary-ink">Preview</span>
          <button type="button" onClick={() => setOpen(false)} className="font-mono text-[12px] text-foreground hover:text-primary-ink focus-visible:underline focus-visible:outline-none xl:hidden">Close</button>
        </div>

        <div role="log" aria-live="polite" aria-label="Conversation" className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {empty ? (
            <div className="flex h-full flex-col items-center justify-center gap-6 pb-10 text-center">
              <div className="grid gap-2">
                <h2 className="mx-auto max-w-[15ch] text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-foreground">What do you need help with today?</h2>
                <p className="mx-auto max-w-[26ch] text-[14px] leading-[1.45] text-foreground/80">Hi, I’m here to help you plan your {restaurant.name} order.</p>
              </div>
              <ul className="grid w-full gap-2" aria-label="Suggested questions">
                {starterQuestions.map((question) => (
                  <li key={question}>
                    <button type="button" onClick={() => ask(question)} className="w-full rounded-[var(--chat-chip-radius,9999px)] border border-primary/40 bg-background/90 px-4 py-2.5 text-left text-[14px] text-foreground transition-colors hover:border-primary hover:bg-background focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30">{question}</button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <ol className="grid gap-4">
              {turns.map((turn) => (
                <li key={turn.id} className="grid gap-2">
                  <p className="ml-auto max-w-[88%] rounded-[var(--chat-bubble-radius,20px)] bg-foreground px-4 py-2.5 text-[14px] leading-[1.45] text-background">
                    {turn.question || turn.attachments.join(', ')}
                  </p>
                  <div className="mr-auto max-w-[94%] rounded-[var(--chat-bubble-radius,20px)] border border-primary/40 bg-background px-4 py-3 text-[14px] leading-[1.5] text-foreground">
                    <p className="whitespace-pre-line">{turn.answer.text}</p>
                    {turn.answer.href && <Link to={turn.answer.href} className="mt-2 inline-block font-mono text-[12px] text-primary-ink underline underline-offset-4 hover:text-foreground">{turn.answer.linkLabel ?? 'Open'}</Link>}
                  </div>
                </li>
              ))}
              <div ref={end} />
            </ol>
          )}
        </div>

        <div className="px-4 pb-4 pt-2">
          <ChatComposer
            value={text}
            onChange={setText}
            onSubmit={(attachments) => ask(text, attachments)}
            label="Ask about your order"
            placeholder="Ask anything"
            hints={[]}
            sendLabel="Send"
          />
          <p className="mt-3 text-center text-[11px] leading-[1.4] text-foreground/80">Answers come from Pearl Island’s menu and rules. The team confirms every request.</p>
        </div>
      </aside>
    </>
  )
}
