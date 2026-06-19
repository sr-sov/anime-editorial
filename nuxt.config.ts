// https://nuxt.com/docs/api/configuration/nuxt-config
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Detail routes to prerender. Seeded at build time by
 * `scripts/seed-prerender-routes.mjs` (the top ~40 ids from Jikan) and committed
 * as `prerender-routes.json` so the build is reproducible even if Jikan is down
 * at deploy time. Missing/empty file -> shell-only prerender (the long tail
 * stays SPA), never a build failure.
 */
function seededDetailRoutes(): string[] {
  try {
    const path = fileURLToPath(new URL('./prerender-routes.json', import.meta.url))
    const routes = JSON.parse(readFileSync(path, 'utf8'))
    return Array.isArray(routes) ? routes.filter((r) => typeof r === 'string') : []
  } catch {
    return []
  }
}

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
      // Prerender the static shells (cover + index) AND the top ~40 detail
      // routes seeded from Jikan (committed in prerender-routes.json, read at
      // config-eval). Each prerendered detail page returns a real, server-
      // painted 200 with its own title/OG card — fixing deep-links, SEO,
      // social, and the mobile LCP. crawlLinks stays false so the long tail
      // (every other /anime/:id) is served by the 404.html SPA fallback and
      // hydrated against the live API.
      crawlLinks: false,
      routes: ['/', '/browse', ...seededDetailRoutes()],
      failOnError: false,
    },
  },

  // Server-render + prerender. The cover, index, and the top detail routes are
  // painted on the server at build time; the long-tail detail route hydrates
  // against the live API via the SPA fallback. Data flows through hydration-safe
  // `useAsyncData` (return value IS the data — no setup-time side effects).
  ssr: true,

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
