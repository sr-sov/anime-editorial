<script setup lang="ts">
import type { Anime } from '~/types/jikan'

/**
 * The Cover — issue front matter.
 *
 * Three movements:
 *  1. the cinematic cover plate (the #1 ranked title, full-bleed hero),
 *  2. "Now Showing" — the current season, as an asymmetric editorial grid,
 *  3. "The Running Order" — the all-time top titles, continuing the grid.
 *
 * One fetch drives both lists (top + season). All states are explicit.
 * Data is fetched client-side (ssr: false) against Jikan.
 */
const { getTopAnime, getSeasonNow } = useJikan()

const { data, pending, error, refresh } = await useAsyncData(
  'cover',
  async () => {
    const [top, season] = await Promise.all([getTopAnime(1), getSeasonNow(1)])
    // Return ONLY what the cover renders (12 top + 6 season). Trimming here
    // shrinks the inlined hydration payload that ships in the prerendered HTML
    // — the full run is fetched fresh on /browse. The cap is a teaser by design.
    return { top: top.data.slice(0, 12), season: season.data.slice(0, 6) }
  },
  { default: () => ({ top: [] as Anime[], season: [] as Anime[] }) },
)

// The cover star is the top-ranked title; the running order is the teaser rest.
const featured = computed<Anime | null>(() => data.value.top[0] ?? null)
const runningOrder = computed(() => data.value.top.slice(1, 12))
const nowShowing = computed(() => data.value.season.slice(0, 6))

const showLoading = computed(() => pending.value && !featured.value)
const showError = computed(() => !!error.value && !featured.value)

useHead({
  title: 'The Cover · Reel — The Anime Annual',
  meta: [
    {
      name: 'description',
      content:
        'Reel — a film magazine for anime. Cover plates, feature spreads, and a running index of the best titles, drawn from MyAnimeList.',
    },
  ],
})
</script>

<template>
  <div>
    <!-- 1 · The cover plate (cinematic hero) -->
    <template v-if="showLoading">
      <div class="flex min-h-[100svh] items-end">
        <div class="container-spread pb-24 pt-28">
          <div class="skeleton h-3 w-40 rounded-sm" />
          <div class="skeleton mt-6 h-20 w-3/4 max-w-3xl rounded-sm" />
          <div class="skeleton mt-6 h-16 w-1/2 max-w-xl rounded-sm" />
        </div>
      </div>
    </template>

    <section v-else-if="showError" class="flex min-h-[70svh] items-center">
      <div class="container-spread w-full max-w-2xl">
        <ErrorState @retry="refresh()" />
      </div>
    </section>

    <CoverPlate v-else-if="featured" :anime="featured" />

    <!-- 2 · Now Showing — the current season -->
    <section
      v-if="nowShowing.length"
      class="cv-section container-spread mt-28"
      aria-labelledby="now-showing"
    >
      <header class="mb-12 flex items-end justify-between gap-6 border-b border-ink-600 pb-6">
        <div>
          <p class="kicker">Section I</p>
          <h2
            id="now-showing"
            class="mt-3 font-serif text-4xl font-semibold text-bone-100 sm:text-5xl"
          >
            Now Showing
          </h2>
        </div>
        <p class="hidden max-w-xs text-right text-sm leading-relaxed text-muted sm:block">
          What is airing this season, set in the order the catalogue ranks them.
        </p>
      </header>

      <!-- Below the fold: server-rendered for SEO/LCP, but client hydration is
           DEFERRED until the grid scrolls into view (Nuxt lazy hydration ->
           IntersectionObserver). This removes the ~2.4s synchronous hydration
           long task that burned mobile TBT, without losing the painted markup. -->
      <LazyEditorialGrid :items="nowShowing" lead-feature hydrate-on-visible />
    </section>

    <!-- 3 · The Running Order — all-time top titles -->
    <section
      v-if="runningOrder.length"
      class="cv-section container-spread mt-32"
      aria-labelledby="running-order"
    >
      <header class="mb-12 flex items-end justify-between gap-6 border-b border-ink-600 pb-6">
        <div>
          <p class="kicker">Section II</p>
          <h2
            id="running-order"
            class="mt-3 font-serif text-4xl font-semibold text-bone-100 sm:text-5xl"
          >
            The Running Order
          </h2>
        </div>
        <NuxtLink
          to="/browse"
          class="group hidden items-center gap-2 rounded-sm font-mono text-[0.72rem] uppercase tracking-[0.16em] text-bone-300 transition-colors hover:text-ember sm:inline-flex"
        >
          Open the full index
          <span class="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">→</span>
        </NuxtLink>
      </header>

      <LazyEditorialGrid :items="runningOrder" :start-index="1" hydrate-on-visible />

      <div class="mt-16 flex justify-center sm:hidden">
        <NuxtLink
          to="/browse"
          class="inline-flex items-center gap-2 rounded-sm border border-ink-500 px-6 py-3 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-bone-200"
        >
          Open the full index →
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
