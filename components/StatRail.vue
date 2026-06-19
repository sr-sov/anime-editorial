<script setup lang="ts">
import { computed } from 'vue'
import type { Anime } from '~/types/jikan'
import { useFormat } from '~/composables/useFormat'

/**
 * The typeset stats sidebar of a feature spread — a definition list set in mono,
 * the way a film annual prints its credits block. Only rows with real values
 * are shown (no "—" noise); the score is the one emphasised line.
 */
const props = defineProps<{ anime: Anime }>()
const { score, compact, episodes, seasonStamp } = useFormat()

interface Row {
  label: string
  value: string
}

const rows = computed<Row[]>(() => {
  const a = props.anime
  const out: Row[] = []
  if (a.type) out.push({ label: 'Format', value: a.type })
  out.push({ label: 'Episodes', value: episodes(a.episodes) })
  if (a.status) out.push({ label: 'Status', value: a.status })
  out.push({ label: 'Premiered', value: seasonStamp(a) })
  if (a.duration) out.push({ label: 'Runtime', value: a.duration.replace(' per ep', '/ep') })
  if (a.rating) out.push({ label: 'Rating', value: a.rating })
  if (a.source) out.push({ label: 'Source', value: a.source })
  if (a.studios?.length)
    out.push({ label: 'Studio', value: a.studios.map((s) => s.name).join(', ') })
  if (typeof a.rank === 'number') out.push({ label: 'Ranked', value: `#${a.rank}` })
  if (a.members) out.push({ label: 'Members', value: compact(a.members) })
  if (a.favorites) out.push({ label: 'Favorites', value: compact(a.favorites) })
  return out
})
</script>

<template>
  <aside aria-label="Title credits" class="font-mono">
    <!-- Headline score, set large. -->
    <div class="border-b border-ink-600 pb-6">
      <p class="text-[0.62rem] uppercase tracking-[0.16em] text-muted">MAL score</p>
      <p class="mt-2 flex items-baseline gap-2 font-serif text-5xl font-semibold text-ember">
        {{ score(anime.score) }}
        <span v-if="anime.scored_by" class="font-mono text-xs font-normal text-muted">
          / {{ compact(anime.scored_by) }} votes
        </span>
      </p>
    </div>

    <dl class="mt-6 space-y-3.5 text-[0.78rem]">
      <div
        v-for="row in rows"
        :key="row.label"
        class="flex items-baseline justify-between gap-4 border-b border-dashed border-ink-600/70 pb-2"
      >
        <dt class="shrink-0 text-[0.62rem] uppercase tracking-[0.14em] text-muted">
          {{ row.label }}
        </dt>
        <dd class="text-right text-bone-200">{{ row.value }}</dd>
      </div>
    </dl>
  </aside>
</template>
