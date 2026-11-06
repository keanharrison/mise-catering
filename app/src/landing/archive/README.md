# Archived landing sections

Removed from the one-screen landing page on request, kept here to bring back later.

- `Deck.tsx` and `deck.css`: the fanned "From event to confirmed order" step cards.
- The closing call to action and footer that sat under the deck (markup below).
- `Collage.tsx` and `collage.css`: the gray box with floating chore cards ("Operations without efficiency"). Markup that held it:

```tsx
<section className="lp-box" aria-labelledby="lp-box-title">
  <h2 id="lp-box-title">Operations without efficiency</h2>
  <Collage />
</section>
```

- The previous nav with the Product dropdown and mobile menu: see `git show 8adb359:app/src/landing/Nav.tsx`.

Whole previous page: `git show 8adb359:app/src/landing/main.tsx`.

```tsx
<section id="restaurants" className="lp-section lp-close">
  <h2>See it on your menu.</h2>
  <p className="lp-section-lead">Tell us where to reach you and we will set up a demo around your restaurant.</p>
  <DemoForm />
</section>

<footer className="lp-footer">
  <span className="lp-footer-mark">Mise</span>
  <a href="/pearl-login.html">Sign in</a>
</footer>
```

## Cards section (archived later)

- `Cards.tsx`, `CardArt.tsx`, `cards.css`: the fanned row of six punch-hole cards with dithered art.
- Section markup that held them:

```tsx
<section id="how-it-works" className="lp-section">
  <h2>Sound familiar?</h2>
  <Cards colors={[r.accentText, r.accent, theme.paper]} />
</section>
```

- The big footer (about line, email box, links) is in git history; see `git log -- app/src/landing/main.tsx`.

## Scatter image and email field (archived later)

- `Scatter.tsx`, `scatter.css`: the scattered-desk hero image and its two-column hero grid.
- `DemoForm.tsx`, `demoform.css`: the work-email field with the demo button.
- `Cards.tsx` / `CardArt.tsx` / `cards.css` here are the earlier tall-card version (with the description line). The live `landing/Cards.tsx` is the square-card version.
