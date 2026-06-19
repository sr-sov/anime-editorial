<script setup lang="ts">
import { computed } from 'vue'
import type { Anime } from '~/types/jikan'
import { useFormat } from '~/composables/useFormat'
import { useSharedTransition } from '~/composables/useSharedTransition'

/**
 * One entry in the editorial index. Three sizes drive the asymmetric layout:
 *  - `feature`: a wide, two-column lead with the synopsis pulled in,
 *  - `standard`: the workhorse plate,
 *  - `quiet`: a slim plate for the dense lower run.
 *
 * The cover image carries a `view-transition-name` so it morphs into the detail
 * hero on click (shared-element transition). The whole tile is one link, but we
 * intercept the click to run the transition; the href stays real for keyboard,
 * middle-click, and no-JS.
 */
const props = withDefaults(
  defineProps<{
    anime: Anime
    /** Running-order number, shown as a typeset folio. */
    index: number
    variant?: 'feature' | 'standard' | 'quiet'
    /** Eager-load the first row's images. */
    priority?: boolean
  }>(),
  { variant: 'standard', priority: false },
)

const { score, year, folio, pullQuote } = useFormat()
const { go, nameFor } = useSharedTransition()

const to = computed(() => `/anime/${props.anime.mal_id}`)
const cover = computed(
  () =>
    props.anime.images.webp?.large_image_url ??
    props.anime.images.jpg.large_image_url ??
    props.anime.images.jpg.image_url ??
    null,
)
const lead = computed(() => props.anime.genres?.[0]?.name ?? props.anime.type ?? 'Feature')
const isFeature = computed(() => props.variant === 'feature')

function onActivate(e: MouseEvent) {
  // Let modified clicks (new tab) and middle clicks behave natively.
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
  e.preventDefault()
  go(to.value, props.anime.mal_id)
}
</script>

<template>
  <article
    data-reveal
    :class="[
      'group relative',
      isFeature ? 'sm:col-span-2 sm:grid sm:grid-cols-2 sm:items-center sm:gap-8' : '',
    ]"
  >
    <NuxtLink
      :to="to"
      :aria-label="anime.title"
      class="block overflow-hidden rounded-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-soft focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
      @click="onActivate"
    >
      <div
        class="relative overflow-hidden rounded-[2px]"
        :style="{ viewTransitionName: `cover-${anime.mal_id}` }"
      >
        <!-- A slow zoom on hover: the plate breathes, nothing else moves. -->
        <div
          class="origin-center transition-transform duration-[1100ms] ease-house group-hover:scale-[1.05]"
        >
          <CoverImage
            :src="cover"
            :images="anime.images"
            :alt="`Cover art for ${anime.title}`"
            :ratio="isFeature ? '4 / 5' : '3 / 4'"
            :sizes="isFeature ? '(min-width: 640px) 60vw, 90vw' : '(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw'"
            :priority="priority"
          />
        </div>
        <span
          class="pointer-events-none absolute left-3 top-3 font-mono text-[0.62rem] tracking-[0.18em] text-bone-100/90 mix-blend-difference"
        >
          {{ folio(index) }}
        </span>
      </div>
    </NuxtLink>

    <div :class="['mt-4', isFeature ? 'sm:mt-0' : '']">
      <p class="kicker">{{ lead }}</p>
      <!-- One focusable link per tile (the cover plate above), so the ~30-tile
           index keeps keyboard tab stops to one per entry. The heading is plain
           text; the cover link is named by the title via its aria-label. -->
      <h3
        :class="[
          'mt-2 font-serif font-semibold leading-tight text-bone-100 transition-colors duration-300 group-hover:text-ember',
          isFeature ? 'text-3xl sm:text-4xl' : 'text-xl',
        ]"
      >
        {{ anime.title }}
      </h3>

      <p
        v-if="isFeature && anime.synopsis"
        class="mt-4 max-w-prose text-[0.95rem] leading-relaxed text-muted"
      >
        {{ pullQuote(anime.synopsis, 220) }}
      </p>

      <dl
        class="mt-3 flex items-center gap-x-4 gap-y-1 font-mono text-[0.72rem] text-muted"
      >
        <div class="flex items-center gap-1.5">
          <dt class="sr-only">Score</dt>
          <dd class="text-ember">★ {{ score(anime.score) }}</dd>
        </div>
        <span aria-hidden="true" class="text-ink-500">·</span>
        <div>
          <dt class="sr-only">Year</dt>
          <dd>{{ year(anime) }}</dd>
        </div>
        <template v-if="anime.type">
          <span aria-hidden="true" class="text-ink-500">·</span>
          <div>
            <dt class="sr-only">Format</dt>
            <dd>{{ anime.type }}</dd>
          </div>
        </template>
      </dl>
    </div>
  </article>
</template>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
