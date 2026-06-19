<script setup lang="ts">
import type { Anime, Genre } from '~/types/jikan'

/**
 * The Index — the full, searchable run of titles.
 *
 * Reuses the proven base data pattern: one `useAsyncData` keyed on the active
 * list (query + genre), accumulating pages for "Set the next page". Search is
 * debounced; the genre rail filters on the same endpoint. All states explicit:
 * loading / error+retry / empty / loaded.
 */
const { getTopAnime, searchAnime, getGenres } = useJikan()

const searchInput = ref('')
const debouncedSearch = useDebouncedRef(searchInput, 400)
const selectedGenre = ref<number | null>(null)
const page = ref(1)

watch([debouncedSearch, selectedGenre], () => {
  page.value = 1
})

const trimmedQuery = computed(() => debouncedSearch.value.trim())
const isFiltering = computed(
  () => trimmedQuery.value.length > 0 || selectedGenre.value !== null,
)
const listKey = computed(
  () => `index:${trimmedQuery.value}:${selectedGenre.value ?? 'all'}`,
)

// Genres for the rail.
const {
  data: genreData,
  pending: genresPending,
  error: genresError,
  refresh: refreshGenres,
} = await useAsyncData<Genre[]>(
  'genres',
  async () => (await getGenres()).data,
  { default: () => [] },
)

// The accumulating listing.
const items = ref<Anime[]>([])
const hasNextPage = ref(false)
const loadingMore = ref(false)

const { pending, error, refresh } = await useAsyncData(
  listKey,
  async () => {
    const res = isFiltering.value
      ? await searchAnime({
          q: trimmedQuery.value || undefined,
          genres: selectedGenre.value ? String(selectedGenre.value) : undefined,
          order_by: 'score',
          sort: 'desc',
          page: page.value,
        })
      : await getTopAnime(page.value)

    hasNextPage.value = res.pagination.has_next_page
    if (page.value === 1) {
      items.value = res.data
    } else {
      const seen = new Set(items.value.map((a) => a.mal_id))
      items.value = [...items.value, ...res.data.filter((a) => !seen.has(a.mal_id))]
    }
    return res.data
  },
  { watch: [listKey] },
)

async function loadMore() {
  if (loadingMore.value || !hasNextPage.value) return
  loadingMore.value = true
  page.value += 1
  try {
    await refresh()
  } finally {
    loadingMore.value = false
  }
}

function retry() {
  page.value = 1
  refresh()
}

const heading = computed(() => {
  if (trimmedQuery.value) return `“${trimmedQuery.value}”`
  if (selectedGenre.value) {
    const g = genreData.value.find((x) => x.mal_id === selectedGenre.value)
    return g ? g.name : 'Filtered'
  }
  return 'Every title, ranked'
})

const showInitialLoading = computed(
  () => pending.value && page.value === 1 && items.value.length === 0,
)
const showError = computed(() => !!error.value && items.value.length === 0)
const showEmpty = computed(
  () => !pending.value && !error.value && items.value.length === 0,
)

useHead({
  title: 'The Index · Reel — The Anime Annual',
  meta: [
    {
      name: 'description',
      content:
        'Search and filter the full run of anime titles, ranked by score, in Reel — the anime annual.',
    },
  ],
})
</script>

<template>
  <div class="container-spread pb-12 pt-32">
    <!-- Masthead for the section -->
    <header class="border-b border-ink-600 pb-10">
      <p class="kicker">The Index</p>
      <h1
        class="mt-4 max-w-[18ch] font-serif text-[clamp(2.4rem,6vw,4.5rem)] font-semibold leading-[1.02] tracking-[-0.02em] text-bone-100"
      >
        The complete run, set in order.
      </h1>
      <p class="mt-5 max-w-prose text-base leading-relaxed text-muted">
        Search by title or filter by subject. Results are drawn live from the
        MyAnimeList catalogue and ranked by score.
      </p>
    </header>

    <!-- Controls -->
    <div class="grid gap-10 py-10 lg:grid-cols-[1.1fr_1.4fr] lg:items-end">
      <IndexSearch v-model="searchInput" />
      <div>
        <ErrorState
          v-if="genresError"
          title="The subject list slipped"
          message="Genres failed to load. Search still works."
          @retry="() => refreshGenres()"
        />
        <GenreRail
          v-else
          v-model="selectedGenre"
          :genres="genreData"
          :loading="genresPending"
        />
      </div>
    </div>

    <!-- Listing header -->
    <div class="mb-10 flex items-baseline justify-between gap-6 border-t border-ink-600 pt-6">
      <h2 class="font-serif text-2xl font-semibold text-bone-100">{{ heading }}</h2>
      <p v-if="items.length" class="font-mono text-[0.72rem] uppercase tracking-[0.14em] text-muted">
        {{ items.length }} in view
      </p>
    </div>

    <!-- States -->
    <LoadingGrid v-if="showInitialLoading" :count="9" />

    <ErrorState v-else-if="showError" @retry="retry()" />

    <EmptyState
      v-else-if="showEmpty"
      :title="isFiltering ? 'Nothing matched' : 'Nothing to show'"
      :message="
        isFiltering
          ? 'No titles matched the search and filter. Try a different name or lift the subject.'
          : 'The ranked feed came back empty — please try again.'
      "
    />

    <template v-else>
      <EditorialGrid :key="listKey" :items="items" />

      <!-- Pagination -->
      <div class="mt-20 flex justify-center">
        <button
          v-if="hasNextPage"
          type="button"
          class="group inline-flex items-center gap-3 rounded-sm border border-ink-500 px-7 py-3.5 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-bone-200 transition-colors duration-300 hover:border-ember hover:text-ember disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="loadingMore"
          @click="loadMore"
        >
          <svg
            v-if="loadingMore"
            class="h-3.5 w-3.5 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
          </svg>
          {{ loadingMore ? 'Setting the next page…' : 'Set the next page' }}
        </button>
        <p
          v-else-if="items.length"
          class="font-mono text-[0.72rem] uppercase tracking-[0.14em] text-muted-dim"
        >
          End of the index.
        </p>
      </div>
    </template>
  </div>
</template>
