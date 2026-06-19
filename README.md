# Reel — The Anime Annual

A film magazine for anime. The cover art is the star and the chrome disappears:
a full-bleed cinematic cover plate, an asymmetric editorial index (a magazine
layout, not a uniform card wall), and detail pages set like feature spreads —
pull-quote synopsis, a typeset credits rail, an inline trailer, and cast.

This is **Direction 1 — Editorial / Cinematic**, one of three premium frontends
built on the same typed Jikan data layer. Data comes from the
[Jikan API](https://jikan.moe) (the unofficial MyAnimeList REST API). The cover,
the index, and the top ~40 detail pages are **server-rendered and prerendered at
build time** (SSG), so deep links return real, crawlable 200s with per-title
SEO/OG; the long tail hydrates client-side via the SPA fallback. It still ships
as a fully static site (GitHub Pages, no server runtime).

**Live:** https://sr-sov.github.io/anime-editorial/

[![CI](https://github.com/sr-sov/anime-editorial/actions/workflows/ci.yml/badge.svg)](https://github.com/sr-sov/anime-editorial/actions/workflows/ci.yml)

## The direction

Calm, expensive, art-directed — the register of a print film annual.

- **Palette:** warm near-black ink (tinted toward the accent in OKLCH, never
  pure black), warm paper, one restrained **ember** accent. `tailwind.config.ts`.
- **Type:** **Fraunces** display serif · **Hanken Grotesk** body · **IBM Plex
  Mono** for the typeset credits and kickers — two working faces and a bounded
  third with a single named role, all self-hosted (vendored via `@fontsource`,
  no runtime CDN, no layout shift).
- **One house motion curve** (`cubic-bezier(0.16, 1, 0.3, 1)`), transform/opacity
  only, framerate-independent, fully reduced-motion aware.

### Three deliberate cinematic moments (not blanket effects)

1. **The cover plate** — a masked image reveal (the plate wipes up from black on
   a clip-path), a character-aware **SplitText** title that rises glyph by glyph,
   and a single scroll **parallax** on the artwork. One hero, one moment.
   `components/CoverPlate.vue`, `components/SplitReveal.vue`,
   `composables/useParallax.ts`.
2. **Scroll-reveal on the editorial sections** — a shared IntersectionObserver
   raises blocks into view on the house curve. `composables/useReveal.ts`.
3. **A shared-element transition from grid tile to detail** — the cover plate you
   click morphs into the detail hero via the native **View Transitions API**
   (matched `view-transition-name`), cross-dissolving the rest of the page.
   `composables/useSharedTransition.ts`.

Every motion path renders a real static state under `prefers-reduced-motion`
(checked in JS and CSS), not a shortened duration.

## Stack

- **Nuxt 3** (Vue 3, `<script setup>` + Composition API), `ssr: true` + SSG
  prerender (top detail routes seeded from Jikan at build), SPA fallback for the
  long tail
- **TypeScript** in `strict` mode, typed Jikan response interfaces, typecheck-clean
- **TailwindCSS** via `@nuxtjs/tailwindcss`, OKLCH-derived design tokens
- **Jikan API v4** — no key, no auth
- Native **View Transitions** + IntersectionObserver for motion (no GSAP needed
  for this direction's restraint)

## Engineering patterns demonstrated

- **Reused, typed data layer** — `composables/useJikan.ts` is a typed client with
  an in-memory cache and a serialized client-side **rate guard** (Jikan allows
  ~3 req/s). Extended here with `seasons/now`, `characters`, and
  `recommendations` endpoints, all typed in `types/jikan.ts`.
- **Typed `useAsyncData`** — the cover page fans out `top` + `season` in parallel;
  the index keys on the active query so search/genre refetch cleanly with
  accumulating pagination; the detail page loads the record first and enriches
  with cast + recommendations that **fail quietly** without blocking the spread.
- **Explicit states everywhere** — loading (skeletons that mirror the plate
  rhythm), empty, error+retry, loaded. `components/states/`.
- **Pure logic is unit-tested** — the SplitText tokeniser and the editorial
  formatters are pure and covered; the rate-guard's cache key keeps its tests.
- **Accessibility** — semantic landmarks, a single H1 per page with clean
  heading order, `alt` on every image, full keyboard operation with visible
  focus rings, `aria-pressed` filter toggles, AA-or-better contrast throughout
  (body 10.6:1, headings 17:1), and a lite-YouTube trailer facade (zero
  third-party JS until the reader clicks).

## Project structure

```
types/jikan.ts                 Typed Jikan v4 interfaces (+ characters, recs)
composables/
  useJikan.ts                  Typed fetchers + cache + rate guard
  useFormat.ts                 Score/year/count + editorial helpers (pullQuote, folio…)
  useDebounce.ts               Debounced ref for the index search
  useReveal.ts                 IntersectionObserver scroll-reveal
  useParallax.ts               Framerate-independent hero parallax
  useSplitText.ts              Pure word/char tokeniser (unit-tested)
  useSharedTransition.ts       View-Transitions tile → spread morph
  useReducedMotion.ts          Reactive prefers-reduced-motion flag
components/
  CoverPlate.vue               The cinematic full-bleed hero
  SplitReveal.vue              Character-aware title reveal
  EditorialGrid.vue            Asymmetric magazine grid (feature/standard/quiet)
  EditorialTile.vue            One index entry; carries the shared-element name
  CoverImage.vue               No-CLS, decode-aware lazy image
  StatRail.vue                 Typeset credits sidebar
  CastRail.vue · TrailerEmbed.vue
  GenreRail.vue · IndexSearch.vue
  TheMasthead.vue · TheColophon.vue
  states/{LoadingGrid,EmptyState,ErrorState}.vue
layouts/default.vue            Masthead + colophon frame
pages/
  index.vue                    The Cover: hero + Now Showing + Running Order
  browse.vue                   The Index: search + genre + paginated grid
  anime/[id].vue               The feature spread
app.vue · error.vue            Shell + error boundary
test/                          Vitest: formatters, cache key, debounce, splitText
```

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

Other scripts:

```bash
npm test             # vitest run (unit tests)
npm run typecheck    # nuxt typecheck (strict)
npm run generate     # static build -> .output/public
```

## Testing & CI

[Vitest](https://vitest.dev) covers the pure logic where bugs actually hide:

- `test/splitText.test.ts` — the SplitText tokeniser: word/char splitting, a
  continuous global index for the stagger, whitespace collapsing, multibyte
  glyphs, and the empty-string guard.
- `test/useFormat.test.ts` — score/year/count/episode formatting plus the
  editorial helpers (`seasonStamp`, `pullQuote` source-stripping + word-boundary
  truncation, `folio` zero-padding) and their missing-value fallbacks.
- `test/cache-key.test.ts` — `buildCacheKey` stable sorting and empty-param drop.
- `test/useDebounce.test.ts` — debounce timing with fake timers.

GitHub Actions (`.github/workflows/ci.yml`) runs the strict typecheck and the
unit tests on every push and pull request.

## Deploy (GitHub Pages)

Configured as a GitHub Pages **project page**: `app.baseURL` is
`/anime-editorial/` and Nitro uses the `github-pages` preset (emits `.nojekyll`
and a `404.html` SPA fallback). `npm run generate` produces a ready-to-publish
`.output/public`, pushed to the `gh-pages` branch.

## Going further

- **Nitro proxy** — a `server/api` proxy would move rate-limiting and caching
  server-side (the SSR build already paces Jikan conservatively to dodge the
  burst limiter during prerender); the composable seam is the right place.
- **Wider prerender** — the seed currently captures the top ~40 ids; a fuller
  build could enumerate every browsable id (the long tail already works via the
  SPA fallback, this would just make more deep links crawlable).
- **Issue archive** — the "Issue Nº" framing invites a real back-catalogue:
  seasonal archives addressable by `/issue/spring-2024`, generated at build time.

---

Data and imagery © MyAnimeList, served via Jikan. A portfolio work sample by
Joshua David Sta Rita, not affiliated with either.
