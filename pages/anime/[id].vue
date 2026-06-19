<script setup lang="ts">
import type {
  Anime,
  AnimeCharacter,
  AnimeRecommendation,
} from '~/types/jikan'

/**
 * The feature spread.
 *
 * The cover plate morphs in from the grid tile (shared-element view transition,
 * matched by `view-transition-name: cover-<id>`), the title rises with the
 * SplitText reveal, and the synopsis is set as a magazine pull-quote beside a
 * typeset credits rail. Cast and recommendations load in parallel but never
 * block the spread — they fail quietly. All states explicit.
 */
const route = useRoute()
const id = computed(() => route.params.id as string)

const { getAnimeById, getCharacters, getRecommendations } = useJikan()
const { year, episodes, pullQuote } = useFormat()

// Primary record — the spread depends on this.
const { data, pending, error, refresh } = await useAsyncData<Anime | null>(
  () => `anime:${id.value}`,
  async () => (await getAnimeById(id.value)).data,
  { watch: [id], default: () => null },
)

// Secondary records — enrich the spread, never block it.
const { data: characters } = await useAsyncData<AnimeCharacter[]>(
  () => `characters:${id.value}`,
  async () => {
    try {
      return (await getCharacters(id.value)).data
    } catch {
      return []
    }
  },
  { watch: [id], default: () => [], server: false },
)

const { data: recs } = await useAsyncData<AnimeRecommendation[]>(
  () => `recs:${id.value}`,
  async () => {
    try {
      return (await getRecommendations(id.value)).data.slice(0, 6)
    } catch {
      return []
    }
  },
  { watch: [id], default: () => [], server: false },
)

const anime = computed(() => data.value)
const cover = computed(() => {
  const a = anime.value
  if (!a) return null
  return (
    a.images.webp?.large_image_url ??
    a.images.jpg.large_image_url ??
    a.images.jpg.image_url ??
    null
  )
})
// The JPG large image is the most universally crawlable OG card (some scrapers
// reject webp), so SEO prefers jpg even when the on-page art uses webp.
const ogImage = computed(() => {
  const a = anime.value
  if (!a) return null
  return a.images.jpg.large_image_url ?? a.images.jpg.image_url ?? null
})
const englishTitle = computed(() => {
  const a = anime.value
  if (!a?.title_english || a.title_english === a.title) return null
  return a.title_english
})
const hasTrailer = computed(
  () => Boolean(anime.value?.trailer?.embed_url || anime.value?.trailer?.youtube_id),
)
const synopsis = computed(() => anime.value?.synopsis ?? '')

// Gate the SplitText reveal until the record resolves (so it plays on open).
const titleReady = computed(() => !pending.value && Boolean(anime.value))

// Per-title SEO, off the (server-fetched) API data. Computed getters keep this
// reactive and SSR-safe: prerendered detail pages ship their OWN title,
// description, and a per-title OG/Twitter card painted at build time.
const metaTitle = computed(() =>
  anime.value ? `${anime.value.title} · Reel` : 'Reel — The Anime Annual',
)
const metaDescription = computed(() =>
  anime.value
    ? pullQuote(anime.value.synopsis, 150) || `${anime.value.title} on Reel — the anime annual.`
    : 'A film magazine for anime, built with Nuxt 3.',
)
useSeoMeta({
  title: () => metaTitle.value,
  description: () => metaDescription.value,
  ogTitle: () => metaTitle.value,
  ogDescription: () => metaDescription.value,
  ogType: 'article',
  ogImage: () => ogImage.value || undefined,
  twitterCard: () => (ogImage.value ? 'summary_large_image' : 'summary'),
  twitterTitle: () => metaTitle.value,
  twitterDescription: () => metaDescription.value,
  twitterImage: () => ogImage.value || undefined,
})
</script>

<template>
  <div>
    <!-- Loading: a quiet spread skeleton -->
    <div v-if="pending && !anime" class="container-spread pb-12 pt-32">
      <div class="grid gap-12 lg:grid-cols-[1.5fr_1fr]">
        <div class="space-y-5">
          <div class="skeleton h-3 w-40 rounded-sm" />
          <div class="skeleton h-16 w-5/6 rounded-sm" />
          <div class="skeleton aspect-[16/9] w-full rounded-sm" />
        </div>
        <div class="space-y-3">
          <div class="skeleton h-24 w-full rounded-sm" />
          <div class="skeleton h-3 w-full rounded-sm" />
          <div class="skeleton h-3 w-2/3 rounded-sm" />
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error || !anime" class="container-spread pb-12 pt-32">
      <div class="mx-auto max-w-xl">
        <ErrorState
          title="This title isn’t in the issue"
          message="We couldn’t fetch this spread. The title may not exist, or the API may be rate-limited right now."
          @retry="refresh()"
        />
        <div class="mt-8 text-center">
          <NuxtLink to="/" class="rounded-sm font-mono text-[0.72rem] uppercase tracking-[0.16em] text-ember">
            ← Back to the cover
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- The spread -->
    <article v-else>
      <!-- A · Cinematic header: full-bleed plate + masthead title -->
      <header class="relative isolate overflow-hidden">
        <div class="absolute inset-0 -z-10">
          <div
            class="absolute inset-0"
            :style="{ viewTransitionName: `cover-${anime.mal_id}` }"
          >
            <CoverImage
              :src="cover"
              :alt="`Cover art for ${anime.title}`"
              ratio="auto"
              priority
            />
          </div>
          <div
            class="absolute inset-0"
            aria-hidden="true"
            style="
              background:
                linear-gradient(to top, rgba(11,10,9,0.98) 6%, rgba(11,10,9,0.55) 46%, rgba(11,10,9,0.2) 78%),
                linear-gradient(to right, rgba(11,10,9,0.78) 0%, rgba(11,10,9,0.05) 58%);
            "
          />
        </div>

        <div class="container-spread flex min-h-[78svh] flex-col justify-end pb-14 pt-32">
          <NuxtLink
            to="/"
            class="mb-8 inline-flex w-fit items-center gap-2 rounded-sm font-mono text-[0.68rem] uppercase tracking-[0.16em] text-bone-300 transition-colors duration-300 hover:text-ember"
          >
            <span aria-hidden="true">←</span> The Cover
          </NuxtLink>

          <p class="kicker mb-5">
            {{ anime.type || 'Feature' }} · {{ year(anime) }} · {{ episodes(anime.episodes) }}
          </p>

          <SplitReveal
            :text="anime.title"
            as="h1"
            :play="titleReady"
            :stagger="26"
            :delay="120"
            class="max-w-[18ch] font-serif text-[clamp(2.4rem,7vw,5.5rem)] font-semibold leading-[0.96] tracking-[-0.02em] text-bone-100"
          />

          <p v-if="englishTitle" class="mt-4 font-serif text-xl italic text-bone-300">
            {{ englishTitle }}
          </p>
          <p v-if="anime.title_japanese" class="mt-1 font-mono text-sm text-muted">
            {{ anime.title_japanese }}
          </p>
        </div>
      </header>

      <!-- B · The feature body: pull-quote + typeset credits rail -->
      <div class="container-spread mt-20">
        <div class="grid gap-14 lg:grid-cols-[1.55fr_1fr] lg:gap-20">
          <!-- Lead column -->
          <div class="min-w-0">
            <!-- Genres as a typeset rail -->
            <div v-if="anime.genres.length" class="mb-10 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span class="kicker">Filed under</span>
              <ul class="flex flex-wrap items-center gap-x-3 gap-y-1 font-serif text-base text-bone-200">
                <li v-for="(g, i) in anime.genres" :key="g.mal_id" class="flex items-center gap-3">
                  {{ g.name }}
                  <span v-if="i < anime.genres.length - 1" aria-hidden="true" class="text-ink-500">·</span>
                </li>
              </ul>
            </div>

            <!-- Pull-quote: the opening of the synopsis, set large -->
            <blockquote
              v-if="synopsis"
              data-reveal
              class="border-l-2 border-ember pl-6 font-serif text-2xl leading-[1.5] text-bone-100 sm:text-[1.7rem]"
            >
              {{ pullQuote(synopsis, 240) }}
            </blockquote>

            <!-- Full synopsis as body prose -->
            <div v-if="synopsis" data-reveal class="mt-10">
              <p class="kicker mb-4">The synopsis</p>
              <p class="max-w-measure whitespace-pre-line text-[1.02rem] leading-[1.75] text-bone-300">
                {{ synopsis }}
              </p>
            </div>
            <p v-else class="text-muted">No synopsis has been filed for this title.</p>

            <!-- Background note, if the catalogue carries one -->
            <div v-if="anime.background" data-reveal class="mt-10">
              <p class="kicker mb-4">Production notes</p>
              <p class="max-w-measure text-[0.98rem] leading-[1.7] text-muted">
                {{ pullQuote(anime.background, 600) }}
              </p>
            </div>

            <!-- Inline cinematic trailer -->
            <div v-if="hasTrailer && anime.trailer" data-reveal class="mt-14">
              <p class="kicker mb-4">In motion</p>
              <TrailerEmbed :trailer="anime.trailer" :poster="cover" :title="anime.title" />
            </div>
          </div>

          <!-- Credits rail (sticky on desktop) -->
          <div class="lg:sticky lg:top-24 lg:self-start">
            <StatRail :anime="anime" />
            <a
              :href="anime.url"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-7 flex w-full items-center justify-center gap-2 rounded-sm border border-ink-500 px-5 py-3 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-bone-200 transition-colors duration-300 hover:border-ember hover:text-ember"
            >
              View on MyAnimeList ↗
            </a>
          </div>
        </div>
      </div>

      <!-- C · The cast -->
      <section v-if="characters.length" class="container-spread mt-28">
        <header class="mb-10 border-b border-ink-600 pb-5">
          <p class="kicker">The cast</p>
          <h2 class="mt-3 font-serif text-3xl font-semibold text-bone-100">Principal credits</h2>
        </header>
        <CastRail :characters="characters" />
      </section>

      <!-- D · Also screening (recommendations) -->
      <section v-if="recs.length" class="container-spread mt-28">
        <header class="mb-10 border-b border-ink-600 pb-5">
          <p class="kicker">Also screening</p>
          <h2 class="mt-3 font-serif text-3xl font-semibold text-bone-100">
            If you liked this title
          </h2>
        </header>
        <ul class="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
          <li v-for="rec in recs" :key="rec.entry.mal_id">
            <NuxtLink
              :to="`/anime/${rec.entry.mal_id}`"
              class="group block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-soft focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
            >
              <div class="overflow-hidden rounded-[2px]">
                <div class="origin-center transition-transform duration-700 ease-house group-hover:scale-[1.05]">
                  <CoverImage
                    :src="rec.entry.images.webp?.large_image_url ?? rec.entry.images.jpg.image_url"
                    :images="rec.entry.images"
                    :alt="`Cover art for ${rec.entry.title}`"
                    ratio="3 / 4"
                    sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw"
                  />
                </div>
              </div>
              <p class="mt-3 line-clamp-2 font-serif text-sm leading-snug text-bone-200 transition-colors group-hover:text-ember">
                {{ rec.entry.title }}
              </p>
            </NuxtLink>
          </li>
        </ul>
      </section>
    </article>
  </div>
</template>
