import { catalog, type DietaryTag, type Order } from '../../data'
import { estimate, money } from '../../engine'
import { routes } from '../../routes'
import type { Stage } from '../../views/customer/journey'

/**
 * Answers for the ordering chat. Rule-based: every answer is built from Pearl Island's menu and rules in the catalog
 * and from the request the customer is building. It is not a language model, and anything it cannot answer from
 * approved data goes to the team instead of being guessed (PRD: "connect to staff rather than guessing").
 */

export type ChatAnswer = { text: string; href?: string; linkLabel?: string }
export type ChatContext = { order: Order; stage: Stage }

const UNCONFIRMED = 'Pearl Island hasn’t confirmed these numbers yet, so treat them as a guide.'
const TEAM: Pick<ChatAnswer, 'href' | 'linkLabel'> = { href: routes.customerMessages, linkLabel: 'Message the team' }

export const starterQuestions = [
  'How do I cater an event?',
  'How much food do I need?',
  'What dietary options are there?',
  'What will this cost?',
]

const stageHelp: Record<Stage, string> = {
  event: 'You’re on Event: tell us the event type, date, guest count and pickup or delivery. Everything else builds from that.',
  menu: 'You’re on Menu: add entrees, sides and salads. “Help me choose” can suggest quantities for your guest count and budget.',
  supplies: 'You’re on Supplies: pick plates, cutlery, cups and serving items, or choose no supplies.',
  details: 'You’re on Details: choose a pickup or delivery time and add contact details and any notes.',
  review: 'You’re on Review: check everything, then submit. Submitting sends a request; it isn’t confirmed until Pearl Island accepts it.',
}

const tagWords: Array<[DietaryTag, string[]]> = [
  ['vegan', ['vegan']],
  ['vegetarian', ['vegetarian', 'veggie']],
  ['gluten-free', ['gluten']],
  ['dairy-free', ['dairy', 'lactose']],
  ['spicy', ['spicy', 'hot', 'heat']],
]

const names = (ids: string[]) => ids.join(', ')

function itemsWith(tag: DietaryTag) {
  return catalog.menu.filter((item) => item.category !== 'supply' && item.dietaryTags.includes(tag))
}

export function answerOrderQuestion(question: string, ctx: ChatContext, attachments: string[] = []): ChatAnswer {
  const { order, stage } = ctx
  const q = question.toLowerCase()
  const has = (...words: string[]) => words.some((word) => q.includes(word))
  const guests = order.intent.guestCount
  const food = order.lines.filter((line) => catalog.menu.find((item) => item.id === line.itemId)?.category !== 'supply')

  if (attachments.length > 0) {
    return { text: `I can’t read attachments yet, so I haven’t looked at ${attachments.join(', ')}. If a file matters to your order, send it to the team.`, ...TEAM }
  }

  // Allergies and exceptions are never answered from menu tags alone.
  if (has('allerg', 'anaphyl', 'celiac', 'intoleran', 'refund', 'complain', 'custom', 'special request', 'speak to', 'talk to', 'human', 'someone', 'call')) {
    return { text: 'That one needs a person. Dietary tags on the menu are guides, not allergy guarantees, and I can’t promise anything about allergies, custom items or exceptions. The Pearl Island team can.', ...TEAM }
  }

  const dietary = tagWords.find(([, words]) => has(...words))
  if (dietary || has('dietary', 'diet')) {
    if (dietary) {
      const matches = itemsWith(dietary[0])
      return {
        text: matches.length
          ? `Items tagged ${dietary[0]}: ${names(matches.map((item) => item.name))}. Tags are as listed by the restaurant, not allergy or nutrition guarantees.`
          : `No menu items are tagged ${dietary[0]} right now. The team can tell you what else is possible.`,
        ...(matches.length ? {} : TEAM),
      }
    }
    return { text: 'The menu tags items as vegetarian, vegan, gluten-free, dairy-free and spicy. Ask about one, for example “what is vegan?”. Tags are guides, not allergy guarantees.' }
  }

  if (has('how much', 'enough', 'quantity', 'quantities', 'portion', 'serving', 'how many', 'run out', 'short')) {
    const rule = catalog.portionRules.find((r) => r.category === 'entree')
    const base = rule ? `${rule.explanation} Sides and salads follow the same idea: one serving per guest each.` : 'Plan on about one serving of each item per guest.'
    if (guests) {
      const est = estimate(food, guests)
      const status = food.length === 0
        ? `For ${guests} guests that’s about ${guests} entree servings.`
        : est.entreeShortfall > 0
          ? `You have ${est.entreeServings} entree servings for ${guests} guests, so you’re about ${est.entreeShortfall} short.`
          : `You have ${est.entreeServings} entree servings for ${guests} guests, which covers everyone.`
      return { text: `${base} ${status} ${UNCONFIRMED}` }
    }
    return { text: `${base} Add your guest count on the Event step and I can check your order against it. ${UNCONFIRMED}` }
  }

  if (has('cost', 'price', 'total', 'estimate', 'budget', 'how much is', 'expensive', 'afford', 'cheap')) {
    if (order.lines.length === 0) return { text: 'Add items on the Menu step and I’ll show a running estimate. Prices come from the restaurant’s menu; the final price is confirmed by Pearl Island.' }
    const est = estimate(order.lines, guests)
    const perGuest = est.costPerGuestCents !== null ? ` That’s about ${money(est.costPerGuestCents)} per guest.` : ''
    return { text: `Your estimate is ${money(est.subtotalCents)} so far.${perGuest} It’s an estimate; Pearl Island confirms the final price.` }
  }

  if (has('notice', 'lead time', 'how soon', 'how early', 'in advance', 'rush', 'last minute', 'tomorrow')) {
    const lines = catalog.leadTimeRules.map((rule) => rule.explanation).join(' ')
    return { text: `${lines} ${UNCONFIRMED}`, ...TEAM }
  }

  if (has('change', 'edit', 'cancel', 'modify')) {
    return { text: `Changes may be refused within ${catalog.changePolicy.changeCutoffHours} hours of the event. ${UNCONFIRMED} After you submit, ask the team for changes from Messages.`, ...TEAM }
  }

  if (has('delivery', 'deliver', 'pickup', 'pick up', 'pick-up')) {
    return { text: 'You choose pickup or delivery on the Event step. Delivery asks for an address. I don’t have approved delivery fees or areas, so for those please ask the team.', ...TEAM }
  }

  if (has('suppl', 'plate', 'cutlery', 'utensil', 'cups', 'chafing')) {
    const supplies = catalog.menu.filter((item) => item.category === 'supply').map((item) => item.name)
    return { text: `Supplies you can add: ${names(supplies)}. Or choose no supplies on the Supplies step.` }
  }

  if (has('submit', 'confirm', 'accepted', 'approval', 'approve', 'what happens')) {
    return { text: 'Submitting sends your request to Pearl Island for review. It isn’t confirmed until the team accepts it, and they may ask a question or propose a change, which you approve in Current orders.', href: routes.currentOrders, linkLabel: 'Open Current orders' }
  }

  if (has('how do i', 'how to', 'cater', 'order', 'get started', 'start', 'begin', 'process', 'steps')) {
    return { text: `Ordering takes five steps: Event, Menu, Supplies, Details, Review. You can build it yourself or use “Help me choose” on the Menu step. ${stageHelp[stage]}` }
  }

  if (has('next', 'where am i', 'what now', 'what should', 'help', 'stuck', 'continue')) return { text: stageHelp[stage] }

  if (has('menu', 'what do you', 'what can i', 'chicken', 'pork', 'entree', 'side', 'salad')) {
    const entrees = catalog.menu.filter((item) => item.category === 'entree').map((item) => `${item.name} (${money(item.priceCents)})`)
    return { text: `Entrees: ${names(entrees)}. Sides and salads are on the Menu step.` }
  }

  if (/^(hi|hello|hey|yo|thanks|thank you)\b/.test(q.trim())) return { text: `Hi! Ask me about quantities, dietary options, pricing or notice. ${stageHelp[stage]}` }

  return { text: 'I don’t have an approved answer for that, and I won’t guess. The Pearl Island team can help, or try asking about quantities, dietary options, pricing, notice or supplies.', ...TEAM }
}
