# Mise: company and brand direction

Status: source of truth for this phase, recorded from Kean's brief on 2026-11-03. Supersedes the "brand accent undecided" line in `docs/color-plan.md` once applied.

## Company

Mise builds bespoke software for restaurants, aimed at acute operational and administrative inefficiencies. From its suite of products, it deploys one or more solutions into restaurants for their specific use cases. Catering is the first product that Kean and Diego are building. Diego is owning two other builds, and Kean is owning this build and another build for a company called The Alley Light (not relevant for this build). 

## Site structure

- One website describes the whole company (the landing page).
- Each product, starting with the catering workflow, shares that branding.

## Brand direction

- White and orange, taken from the Y Combinator sign-in screen (`yc-reference.webp`).
- Intent: orange and white read as friendly and hospitality-adjacent, and as the AI-native feel of an advanced company shipping bespoke software.
- Reference traits: white canvas, single saturated orange accent for primary actions and logo mark, thin orange rules, monospace utility text for nav and footer, dithered orange halftone side panels, left-aligned bold headline.

## Order of work

1. Catering workflow first, strictly.
2. Landing page after, using the branding settled in step 1.

## Open questions (to strategize)

- Exact orange and neutral tokens, and how they interact with the status colors in `docs/color-plan.md`.
- Whether the product keeps black primary buttons or moves to orange.
- How much of the reference's monospace and halftone texture carries into the product versus staying on the landing page.
- How Pearl Island's own brand (`docs/branding/pearl-island/`) coexists with Mise branding, since `soul.md` says customer-facing pages carry the restaurant's brand.

## Product default (2026-11-03)

The product and sign-in page now start from the configuration chosen in the Design panel: Ocean blue accent (`#2563eb`), 24px corners, pill fields, system font, soft lines, pill gradient order chat. Mise orange remains a preset (and the landing page brand). Defaults live in `DEFAULT_THEME` in `app/src/lib/designTheme.ts`; each restaurant will override colors at onboarding.
