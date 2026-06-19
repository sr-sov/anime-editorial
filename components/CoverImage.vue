<script setup lang="ts">
import { computed, ref } from 'vue'
import type { JikanImages } from '~/types/jikan'

/**
 * A cover-plate image with no layout shift and a graceful decode fade.
 *
 * The wrapper reserves the aspect ratio so the grid never reflows. The image
 * fades from a warm ink placeholder once it decodes. `priority` images (the
 * hero) load eagerly and high-fetchpriority; everything else is lazy. On error
 * we hold the placeholder rather than showing a broken-image glyph.
 *
 * Responsive: pass `images` (the Jikan image set) and the component emits a
 * `srcset` from MAL's small/medium/large variants (~50 / 225 / 420 w) plus a
 * `sizes` matched to the grid breakpoints, so mobile downloads the 225w plate
 * instead of the 420w one. `src` alone still works (no srcset) for callers that
 * resolve a single URL.
 */
const props = withDefaults(
  defineProps<{
    src: string | null | undefined
    alt: string
    /** The full Jikan image set; enables responsive srcset when provided. */
    images?: JikanImages | null
    /** CSS aspect-ratio, e.g. '3 / 4'. */
    ratio?: string
    priority?: boolean
    /** Tailwind object-position helper override. */
    position?: string
    /** `sizes` attribute; defaults to the editorial grid's column widths. */
    sizes?: string
  }>(),
  {
    ratio: '3 / 4',
    priority: false,
    position: 'object-center',
    images: null,
    sizes: '(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw',
  },
)

const loaded = ref(false)
const failed = ref(false)

// Prefer webp (smaller) for the srcset, fall back to jpg. Each variant carries
// its real pixel width as the descriptor so the browser can pick correctly.
const srcset = computed(() => {
  const set = props.images?.webp ?? props.images?.jpg
  if (!set) return undefined
  const parts: string[] = []
  if (set.small_image_url) parts.push(`${set.small_image_url} 50w`)
  if (set.image_url) parts.push(`${set.image_url} 225w`)
  if (set.large_image_url) parts.push(`${set.large_image_url} 420w`)
  return parts.length > 1 ? parts.join(', ') : undefined
})

const hasSrc = computed(() => Boolean(props.src) && !failed.value)
// `ratio="auto"` lets the wrapper fill its parent (used for the detail hero,
// which sizes off the header height rather than a fixed plate ratio).
const isFill = computed(() => props.ratio === 'auto')
</script>

<template>
  <div
    class="relative overflow-hidden bg-ink-700"
    :class="isFill ? 'h-full w-full' : ''"
    :style="isFill ? undefined : { aspectRatio: ratio }"
  >
    <img
      v-if="hasSrc"
      :src="src!"
      :srcset="srcset"
      :sizes="srcset ? sizes : undefined"
      :alt="alt"
      :loading="priority ? 'eager' : 'lazy'"
      :fetchpriority="priority ? 'high' : 'auto'"
      decoding="async"
      class="h-full w-full object-cover transition-[opacity,transform] duration-700 ease-house"
      :class="[position, loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.04]']"
      @load="loaded = true"
      @error="failed = true"
    />
    <!-- Placeholder / failed fallback: a quiet plate, never a broken glyph. -->
    <div
      v-if="!hasSrc || !loaded"
      class="absolute inset-0 grid place-items-center bg-ink-700"
      aria-hidden="true"
    >
      <span class="font-serif text-3xl text-ink-500">楽</span>
    </div>
  </div>
</template>
