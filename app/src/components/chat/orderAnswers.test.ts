import { describe, expect, it } from 'vitest'
import { catalog } from '../../data'
import { scenarios } from '../../data/scenarios'
import { createOrder } from '../../state/orderMachine'
import { answerOrderQuestion, type ChatContext } from './orderAnswers'

const base = createOrder(scenarios[0])
const ctx = (patch: Partial<ChatContext['order']['intent']> = {}, lines = base.lines): ChatContext => ({
  order: { ...base, lines, intent: { ...base.intent, ...patch } },
  stage: 'menu',
})

describe('order chat answers', () => {
  it('sends allergy questions to the team instead of answering from tags', () => {
    const answer = answerOrderQuestion('Is this safe for a peanut allergy?', ctx())
    expect(answer.text).toMatch(/needs a person/i)
    expect(answer.href).toBe('/customer/messages')
  })

  it('lists menu items for a dietary tag and says tags are not guarantees', () => {
    const answer = answerOrderQuestion('what is vegan?', ctx())
    expect(answer.text).toMatch(/vegan/i)
    expect(answer.text).toMatch(/not allergy/i)
    expect(catalog.menu.some((item) => item.dietaryTags.includes('vegan'))).toBe(true)
  })

  it('checks quantities against the guest count and flags the data as unconfirmed', () => {
    const answer = answerOrderQuestion('do I have enough food?', ctx({ guestCount: 40 }, []))
    expect(answer.text).toMatch(/40/)
    expect(answer.text).toMatch(/hasn’t confirmed/)
  })

  it('says estimates are estimates', () => {
    const answer = answerOrderQuestion('what will this cost?', ctx({ guestCount: 20 }))
    expect(answer.text).toMatch(/estimate/i)
  })

  it('does not read attachments', () => {
    expect(answerOrderQuestion('see file', ctx(), ['menu.pdf']).text).toMatch(/can’t read attachments/)
  })

  it('hands off what it cannot answer rather than inventing', () => {
    const answer = answerOrderQuestion('qwerty zxcv', ctx())
    expect(answer.text).toMatch(/won’t guess/)
    expect(answer.href).toBe('/customer/messages')
  })
})
