<script setup lang="ts">
import { computed, ref } from 'vue'

/**
 * A cover-plate image with no layout shift and a graceful decode fade.
 *
 * The wrapper reserves the aspect ratio so the grid never reflows. The image
 * fades from a warm ink placeholder once it decodes. `priority` images (the
 * hero) load eagerly and high-fetchpriority; everything else is lazy. On error
 * we hold the placeholder rather than showing a broken-image glyph.
 */
const props = withDefaults(
  defineProps<{
    src: string | null | undefined
    alt: string
    /** CSS aspect-ratio, e.g. '3 / 4'. */
    ratio?: string
    priority?: boolean
    /** Tailwind object-position helper override. */
    position?: string
  }>(),
  { ratio: '3 / 4', priority: false, position: 'object-center' },
)

const loaded = ref(false)
const failed = ref(false)
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
