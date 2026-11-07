# Continue building: Mise landing page, login, and catering platform

Paste this into a new session started in `/Users/keanharrison/catering/mise-catering`. Read it fully, then ask me what to do next. Do not start work unprompted.

## Who I am and how to reply
- I'm Kean, an early-career engineer building toward Forward Deployed Engineering mastery. My co-founder is Diego.
- Mise builds bespoke software for restaurants. Pearl Island (operator: Sober) is the first pilot.
- Replies: one or two sentences, bottom line first, plain words plus engineering terms with a brief gloss. Say whether something is implemented, simulated, or unverified. Link files instead of pasting code or logs. No file lists, walkthroughs, CSS values, or test narration unless I ask.
- Don't commit, push, or open PRs unless I say so.

## Repo and stack
- Repo: github.com/keanharrison/mise-catering, app in `app/`. Vite 8, React 19, TypeScript. Plain CSS per entry (`login.css`, `landing.css`); Tailwind only in the product app.
- Vitest: 44 files, 280 tests, all passing. `npm run build` passes. Dev server: `http://localhost:5173/landing.html`.
- Multi-entry Vite: `index.html`, `pearl-login.html`, `setup.html`, `landing.html` (all in `vite.config.ts` rollupOptions input).
- Shared theme engine: `app/src/lib/designTheme.ts` (`Theme`, `resolve`, `mix`, `contrast`, `isDarkPaper`, `COMBOS`, `FONTS` (21), `useDesignTheme`, `LOGIN_THEME_KEY='mise-login-theme'`, `LOGIN_DEFAULT_THEME`).
- `LOGIN_DEFAULT_THEME` = `{ ...DEFAULT_THEME, accent:'#e6f23a', ink:'#111111', paper:'#ffffff', font:'hanken' }` (light by default). A saved theme in the browser overrides it until Reset in the Design panel.
- Supabase auth plus `demo_inquiries` insert (`requestDemo` in `app/src/state/auth.ts`). `isWorkEmail`, `DEMO_EMAIL_KEY` in `app/src/lib/workEmail.ts`.
- Fonts: `app/src/lib/fonts.css` imports 21 free font packages.

## State of the landing page (`app/src/landing/`)
Done and approved by me, except where noted:
- One screen, no scroll on laptop/desktop. Centered one-line headline "You run the restaurant. We build the rest." with a gray sentence under it, then a Request a demo button (no email box).
- Dot field behind everything (`DotField.tsx`, spring-physics, pointer push, click ripples).
- Fanned row of six square punch-hole cards with dithered canvas art (`Cards.tsx`, `CardArt.tsx`, Bayer 8x8 dither into three theme tones). Cards show the pain, then its downstream effect, no "We build" line, no invented statistics. **I said the cards look great; leave them alone unless I ask.**
  1. Orders arrive by phone and email / Hours lost every week answering the same questions.
  2. Receipts pile up in a drawer / Month-end turns into a scramble for the bookkeeper.
  3. Schedules are built by hand / Every shift swap becomes a thread of texts.
  4. Inventory is counted on paper / You only see the waste and over-ordering later.
  5. Orders are written, then retyped / Small mistakes reach the kitchen and the customer.
  6. Guest messages sit unread / Regulars and new customers go unanswered.
- Nav (`Nav.tsx`): Mise wordmark left. Tabs: Product (dropdown) and Pricing (placeholder `#`). Right: Sign in, "See a demo" (accent, opens demo form), "Get started" (dark, placeholder `#`). "How it works" and "For restaurants" were removed. Mobile burger menu exists but was never checked on a phone.
- Product dropdown: Ramp-style full-width rounded panel (`.lp-mega`) under the nav, page dimmed behind (`.lp-dim`, rendered outside the nav because a fixed child inside a `backdrop-filter` parent gets contained). Content is only a centered "Coming soon". The panel starts 1px below the nav so the nav's bottom border line stays visible.
- Footer: dark in light mode, white in dark mode. "Mise" wordmark on the LEFT; on the RIGHT: LinkedIn (placeholder `#`), Request a demo, Sign in, and "© 2026 Mise". No custom-software line.
- Design panel (`app/src/components/design/DesignPanel.tsx`) floats left, vertically centered: mode switch, color combinations, font list. Unchanged.
- `app/src/landing/archive/` holds old Deck, Collage, Scatter, DemoForm, old tall Cards. README there explains restoring; `git show 8adb359` has the older nav/page.
- Dev-only `?preview=tools` renders `ToolsGrid` (integrations-style grid, not on the page).

## Login (`app/src/login/main.tsx`, `login.css`)
Ramp-style sign-in, work-email card (`biz-email`), dark demo form (`biz-details`), thank-you screen, dev-only skip and `?view=`. Landing-to-login email hand-off via sessionStorage (`takeLandingEmail`). The sign-in header has a `MarkCompare` component showing five logo-mark candidates; no mark chosen yet.

## Placeholders waiting on me
- Get started application flow, Pricing page, LinkedIn URL, Product dropdown content.
- Logo mark choice (five candidates).
- Real numbers for card copy only if I supply sources. Never invent stats, logos, or customer claims on the public page.

## Rules I set for this work
- Replicate Ramp's visual patterns with original code only; no copied assets, logos, or fonts. Free lookalike fonts, our own icons and art.
- I pasted a Ramp hero SVG: it is a frame of a Lottie animation (vector glyphs plus embedded PNG screenshots); the motion lives in a separate Lottie JSON. We decided the pixel-art cards are good enough; a Lottie hero would need an animator and real Mise product screens, so maybe later.
- Honesty on the public page: generic problem statements, no fabricated proof.

## Uncommitted work
Latest commit is `78889c6`. After it, uncommitted: light default theme, nav tabs, Product panel, new card copy and size, panel border fix, centered "Coming soon", footer reshuffle. Ask me whether to commit; if I say yes: `git add -A app && git commit` with trailer `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## tsk build board (nothing dispatched)
Project `mise-catering` in `~/.tsk/config.toml` with `claude` and `codex` profiles; 16 tasks set up (plan in the earlier session scratchpad `plan.json`). Threads: foundation (persist orders/messages/menu in Supabase; make sign-in work end to end), customer (AI-or-manual start screen; "waiting for restaurant confirmation" state; ordering Q&A with staff handoff; server-side profile/history), staff (In Progress/Completed states; nav aligned to Review, Messages, Analytics, Settings, Account, Team; analytics from real orders; owner edits menu/prices/policies), comms (email notifications; calendar handoff preview), assistant (order-proposal interface and validator; connect and tune the model last), qa (final pass and e2e). Assignment: T1, T2, T3-T6, T13, T14, T16 to claude; T7-T12 to codex. Don't dispatch until I say.

## Product app notes
Customer and staff app lives in `app/src` (Tailwind, `state/`, `engine/`, `views/`, `components/mise.ts` class sets). Roles: customer, owner, manager, staff (`state/auth.ts`). Orders, messages, approvals are still browser-only; moving them to Supabase is board task 1.

## First thing to do
Confirm you've read this, run `git status` and `npm test` to verify the state, and ask what I want next.
