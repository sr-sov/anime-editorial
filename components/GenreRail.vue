<script setup lang="ts">
import type { Genre } from '~/types/jikan'

/**
 * Genre filter as a typeset rail of text toggles (not pills). One active genre
 * at a time; "All" clears. Keyboard-operable, aria-pressed reflects state.
 * A curated subset keeps the rail editorial rather than a wall of every genre.
 */
const props = defineProps<{
  genres: Genre[]
  loading?: boolean
}>()

const model = defineModel<number | null>({ required: true })

// Keep the rail tasteful: the genres a film reader actually browses by.
const CURATED = [
  'Action',
  'Adventure',
  'Drama',
  'Fantasy',
  'Sci-Fi',
  'Mystery',
  'Romance',
  'Slice of Life',
  'Supernatural',
  'Sports',
]

const shown = computed(() => {
  const byName = new Map(props.genres.map((g) => [g.name, g]))
  return CURATED.map((name) => byName.get(name)).filter(
    (g): g is Genre => Boolean(g),
  )
})

function toggle(id: number) {
  model.value = model.value === id ? null : id
}
</script>

<template>
  <div>
    <p class="kicker">Filter by subject</p>

    <div v-if="loading" class="mt-3 flex flex-wrap gap-x-5 gap-y-2" aria-hidden="true">
      <div v-for="n in 8" :key="n" class="skeleton h-5 w-20 rounded-sm" />
    </div>

    <div
      v-else
      class="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2.5 font-serif text-lg"
      role="group"
      aria-label="Filter by genre"
    >
      <button
        type="button"
        class="rounded-sm transition-colors duration-300 hover:text-bone-100"
        :class="model === null ? 'text-ember' : 'text-muted'"
        :aria-pressed="model === null"
        @click="model = null"
      >
        All
      </button>
      <span aria-hidden="true" class="text-ink-500">·</span>
      <template v-for="(g, i) in shown" :key="g.mal_id">
        <button
          type="button"
          class="rounded-sm transition-colors duration-300 hover:text-bone-100"
          :class="model === g.mal_id ? 'text-ember' : 'text-muted'"
          :aria-pressed="model === g.mal_id"
          @click="toggle(g.mal_id)"
        >
          {{ g.name }}
        </button>
        <span v-if="i < shown.length - 1" aria-hidden="true" class="text-ink-500">·</span>
      </template>
    </div>
  </div>
</template>
