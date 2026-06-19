<script setup lang="ts">
import { ref } from 'vue'
import type { JikanTrailer } from '~/types/jikan'

/**
 * Inline cinematic trailer — a click-to-load YouTube facade.
 *
 * We show the title's still (the cover plate, passed in) under a play control;
 * the iframe is only injected on activate, so the page ships zero third-party
 * JS and no layout shift until the reader chooses to watch. Keyboard-operable;
 * the facade is a real button.
 */
const props = defineProps<{
  trailer: JikanTrailer
  poster: string | null
  title: string
}>()

const playing = ref(false)

// Prefer the explicit embed_url; ensure autoplay + a clean chrome once clicked.
function embedSrc(): string {
  const base =
    props.trailer.embed_url ??
    (props.trailer.youtube_id
      ? `https://www.youtube.com/embed/${props.trailer.youtube_id}`
      : '')
  if (!base) return ''
  const sep = base.includes('?') ? '&' : '?'
  return `${base}${sep}autoplay=1&rel=0&modestbranding=1`
}
</script>

<template>
  <figure class="relative overflow-hidden rounded-[2px] border border-ink-600 bg-ink-800">
    <div class="relative aspect-video">
      <template v-if="!playing">
        <img
          v-if="poster"
          :src="poster"
          :alt="`Still from ${title}`"
          loading="lazy"
          decoding="async"
          class="h-full w-full object-cover opacity-70"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-ink-950/80 to-transparent" aria-hidden="true" />
        <button
          type="button"
          class="group absolute inset-0 flex flex-col items-center justify-center gap-4 text-bone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-soft focus-visible:ring-inset"
          @click="playing = true"
        >
          <span
            class="grid h-16 w-16 place-items-center rounded-full border border-bone-100/40 bg-ink-950/40 backdrop-blur-sm transition-all duration-500 ease-house group-hover:border-ember group-hover:bg-ember group-hover:text-ink-950"
          >
            <svg class="ml-0.5 h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span class="font-mono text-[0.7rem] uppercase tracking-[0.16em]">
            Watch the trailer
          </span>
        </button>
      </template>

      <iframe
        v-else
        :src="embedSrc()"
        :title="`${title} — trailer`"
        class="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        referrerpolicy="strict-origin-when-cross-origin"
      />
    </div>
  </figure>
</template>
