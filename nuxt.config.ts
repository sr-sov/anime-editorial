// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss'],

  css: ['~/assets/css/main.css'],

  // Deployed as a GitHub Pages *project* page, served from a sub-path.
  // baseURL keeps generated asset/route URLs correct under /anime-editorial/.
  app: {
    baseURL: '/anime-editorial/',
    // A slow editorial cross-dissolve between routes; `out-in` avoids overlap.
    // The `.spread-*` classes live in assets/css/main.css. The shared-element
    // (tile → spread) morph is layered on top via the View Transitions API in
    // useSharedTransition. prefers-reduced-motion collapses both (same CSS).
    pageTransition: { name: 'spread', mode: 'out-in' },
    head: {
      htmlAttrs: { lang: 'en', class: 'dark' },
      title: 'Reel — The Anime Annual',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Reel — a film magazine for anime. Cover plates, feature spreads, and a running index drawn from MyAnimeList via the Jikan API. A Nuxt 3 work sample.',
        },
        { name: 'theme-color', content: '#0b0a09' },
        { property: 'og:title', content: 'Reel — The Anime Annual' },
        {
          property: 'og:description',
          content:
            'A film magazine for anime: cinematic cover plates and feature spreads, built with Nuxt 3.',
        },
        { property: 'og:type', content: 'website' },
      ],
      // Icons live in public/ and ship to the GitHub Pages sub-path. The hrefs
      // are baseURL-prefixed so they resolve correctly. The .ico is listed
      // first as the legacy fallback; modern browsers pick the SVG. This also
      // stops the browser's implicit /favicon.ico request (a live-console 404).
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/anime-editorial/favicon.ico' },
        { rel: 'icon', type: 'image/svg+xml', href: '/anime-editorial/favicon.svg' },
        { rel: 'apple-touch-icon', href: '/anime-editorial/apple-touch-icon.png' },
      ],
    },
  },

  // GitHub Pages preset: emits .nojekyll and a 404.html SPA fallback,
  // so a fully static deploy works on a project sub-path.
  nitro: {
    preset: 'github-pages',
    prerender: {
      // Pre-render the two STATIC route shells (the cover + the index) to real
      // files, so a direct/cold load of either returns a true 200 — no SPA-
      // fallback 404 in the console. The dynamic detail route (/anime/:id)
      // can't be enumerated, so it resolves client-side via the 404.html SPA
      // fallback; this also keeps the build independent of Jikan being up (and
      // off its rate limit). Data is still fetched client-side on every page.
      crawlLinks: false,
      routes: ['/', '/browse'],
      failOnError: false,
    },
  },

  // Data is fetched client-side from Jikan (see composables/useJikan.ts), so
  // no server runtime is required at deploy time. The shell is pre-rendered for
  // a fast first paint; dynamic routes are served by the SPA fallback and
  // hydrate against the live API.
  ssr: false,

  typescript: {
    strict: true,
    typeCheck: false, // run explicitly via `npm run typecheck`
  },

  runtimeConfig: {
    public: {
      jikanBase: 'https://api.jikan.moe/v4',
    },
  },
})
