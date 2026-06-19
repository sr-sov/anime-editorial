<script setup lang="ts">
import { computed } from 'vue'
import type { AnimeCharacter } from '~/types/jikan'

/**
 * The cast block of a feature spread — principal characters with their lead
 * Japanese voice actor, set as a quiet credits grid. Mains first, capped so the
 * spread stays editorial rather than a full database dump.
 */
const props = withDefaults(
  defineProps<{ characters: AnimeCharacter[]; limit?: number }>(),
  { limit: 8 },
)

const principals = computed(() =>
  [...props.characters]
    .sort((a, b) => {
      // Mains before supporting; then by favorites.
      const mainA = a.role === 'Main' ? 1 : 0
      const mainB = b.role === 'Main' ? 1 : 0
      if (mainA !== mainB) return mainB - mainA
      return (b.favorites ?? 0) - (a.favorites ?? 0)
    })
    .slice(0, props.limit),
)

function seiyuu(c: AnimeCharacter): string | null {
  const jp = c.voice_actors?.find((v) => v.language === 'Japanese')
  return jp?.person.name ?? null
}
</script>

<template>
  <div
    class="grid grid-cols-2 gap-x-8 gap-y-7 sm:grid-cols-3 lg:grid-cols-4"
  >
    <figure
      v-for="c in principals"
      :key="c.character.mal_id"
      class="flex items-center gap-3.5"
    >
      <div class="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-ink-700">
        <img
          v-if="c.character.images.webp?.image_url || c.character.images.jpg.image_url"
          :src="c.character.images.webp?.image_url ?? c.character.images.jpg.image_url ?? undefined"
          :alt="c.character.name"
          loading="lazy"
          decoding="async"
          class="h-full w-full object-cover"
        />
      </div>
      <figcaption class="min-w-0">
        <p class="truncate font-serif text-sm font-medium text-bone-100">
          {{ c.character.name }}
        </p>
        <p class="truncate font-mono text-[0.62rem] uppercase tracking-[0.1em] text-ember">
          {{ c.role }}
        </p>
        <p v-if="seiyuu(c)" class="mt-0.5 truncate text-[0.72rem] text-muted">
          {{ seiyuu(c) }}
        </p>
      </figcaption>
    </figure>
  </div>
</template>
