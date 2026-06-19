<script setup lang="ts">
import { computed, nextTick, watch } from 'vue'
import type { Anime } from '~/types/jikan'
import { useReveal } from '~/composables/useReveal'

/**
 * The editorial index grid — a magazine layout, not a uniform card wall.
 *
 * Every Nth tile (default the 1st of each run of 7) is promoted to a wide
 * `feature` plate with its synopsis pulled in; the rest alternate standard
 * weight, so the column rhythm reads as an art-directed spread. The reveal
 * observer is re-registered when items grow (pagination) so appended tiles
 * still animate in.
 */
const props = withDefaults(
  defineProps<{
    items: Anime[]
    /** Offset so running-order folios continue across paginated loads. */
    startIndex?: number
    /** Promote the very first tile to a feature (used on the cover page). */
    leadFeature?: boolean
  }>(),
  { startIndex: 0, leadFeature: false },
)

const { register } = useReveal()

// Decide each tile's weight. Features punctuate the grid; the first tile can be
// promoted on the landing page. We keep features on a 7-beat so a feature lands
// roughly once per visual "row band".
function variantFor(localIndex: number): 'feature' | 'standard' | 'quiet' {
  if (props.leadFeature && localIndex === 0) return 'feature'
  const beat = (localIndex - (props.leadFeature ? 1 : 0)) % 7
  if (beat === 3) return 'feature'
  if (beat === 1 || beat === 5) return 'quiet'
  return 'standard'
}

const tiles = computed(() =>
  props.items.map((anime, i) => ({
    anime,
    variant: variantFor(i),
    folioIndex: props.startIndex + i + 1,
    priority: i < 3,
  })),
)

// Re-run the reveal observer when new tiles render (pagination / refetch).
watch(
  () => props.items.length,
  () => nextTick(() => register()),
)
</script>

<template>
  <ul class="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
    <li
      v-for="tile in tiles"
      :key="tile.anime.mal_id"
      :class="tile.variant === 'feature' ? 'sm:col-span-2 lg:col-span-2' : ''"
    >
      <EditorialTile
        :anime="tile.anime"
        :index="tile.folioIndex"
        :variant="tile.variant"
        :priority="tile.priority"
      />
    </li>
  </ul>
</template>
