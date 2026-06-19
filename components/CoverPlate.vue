<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Anime } from '~/types/jikan'
import { useFormat } from '~/composables/useFormat'
import { useParallax } from '~/composables/useParallax'

/**
 * The cover plate — the cinematic, full-bleed featured title. One hero, one
 * moment: a masked image reveal (the plate wipes up from black), a staggered
 * SplitText title, and a single deliberate parallax on the artwork as you
 * scroll. Everything is transform/opacity; reduced-motion renders it static.
 */
const props = defineProps<{ anime: Anime }>()

const { score, seasonStamp, pullQuote, compact } = useFormat()
const { target: parallaxEl } = useParallax(0.14)

const decoded = ref(false)
const mounted = ref(false)
// The masked image wipe is a client-only enhancement, but clipping the hero
// (the LCP element) delays Largest-Contentful-Paint. So we only arm the wipe
// when the image was NOT already painted by the server (i.e. a fresh client-
// side navigation to the cover). On a cold/prerendered load the hero stays
// fully painted -> fast LCP, and the parallax + entrance staggers carry motion.
const armWipe = ref(false)

const cover = computed(
  () =>
    props.anime.images.webp?.large_image_url ??
    props.anime.images.jpg.large_image_url ??
    props.anime.images.jpg.image_url ??
    null,
)

// Preload the hero plate (the LCP candidate) so the browser starts fetching it
// from the prerendered HTML, not after parse+hydration. Emitted server-side, so
// the static cover page ships the correct per-issue URL.
useHead({
  link: cover.value
    ? [{ rel: 'preload', as: 'image', href: cover.value, fetchpriority: 'high' }]
    : [],
})

const studio = computed(() => props.anime.studios?.[0]?.name ?? null)
// Play the title reveal once the artwork has decoded (no pop-in race).
const play = computed(() => mounted.value && decoded.value)

function onImgLoad(e: Event) {
  const img = e.target as HTMLImageElement
  // decode() resolves once painted; fall back to the load event.
  img.decode?.().then(() => (decoded.value = true)).catch(() => (decoded.value = true))
  decoded.value = true
}

onMounted(() => {
  mounted.value = true
  // If there is no artwork, don't block the title reveal on a decode.
  if (!cover.value) decoded.value = true
  // Arm the masked wipe only when this is a client-side navigation (NOT the
  // initial hydration of the prerendered cover), so cold-load LCP isn't held
  // back by clipping the hero. `isHydrating` is true during first hydration.
  const { isHydrating } = useNuxtApp()
  if (!isHydrating) {
    decoded.value = false
    armWipe.value = true
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        decoded.value = true
      }),
    )
  }
})
</script>

<template>
  <section
    class="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden"
    aria-labelledby="cover-title"
  >
    <!-- Full-bleed artwork. Two nested layers keep concerns apart: the outer
         layer runs the parallax (transform set by JS on scroll); the inner
         layer runs the one-shot clip-path mask reveal. They never fight over
         the same property. -->
    <div class="absolute inset-0 -z-10">
      <div ref="parallaxEl" class="absolute inset-0 will-change-transform">
        <div
          class="plate-mask absolute inset-0"
          :class="{ 'plate-mask--in': decoded, 'plate-mask--animate': armWipe }"
        >
          <img
            v-if="cover"
            :src="cover"
            :alt="`Cover art for ${anime.title}`"
            fetchpriority="high"
            decoding="async"
            class="h-[118%] w-full object-cover object-center"
            @load="onImgLoad"
          />
          <div v-else class="h-full w-full bg-ink-700" />
        </div>
      </div>
      <!-- Cinematic gradient so the type always sits on a dark base. -->
      <div
        class="absolute inset-0"
        aria-hidden="true"
        style="
          background:
            linear-gradient(to top, rgba(11, 10, 9, 0.97) 4%, rgba(11, 10, 9, 0.4) 42%, rgba(11, 10, 9, 0.08) 72%),
            linear-gradient(to right, rgba(11, 10, 9, 0.7) 0%, rgba(11, 10, 9, 0) 55%);
        "
      />
    </div>

    <div class="container-spread pb-20 pt-28 sm:pb-24">
      <p
        class="kicker mb-5 transition-all duration-700 ease-house"
        :class="play ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'"
        :style="{ transitionDelay: '120ms' }"
      >
        On the cover · {{ seasonStamp(anime) }}
      </p>

      <SplitReveal
        id="cover-title"
        :text="anime.title"
        as="h1"
        :play="play"
        :stagger="30"
        :delay="180"
        class="max-w-[16ch] font-serif text-[clamp(2.6rem,8vw,6.5rem)] font-semibold leading-[0.95] tracking-[-0.02em] text-bone-100"
      />

      <div
        class="mt-7 grid max-w-4xl gap-7 transition-all duration-700 ease-house sm:grid-cols-[1.6fr_1fr] sm:items-end"
        :class="play ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'"
        :style="{ transitionDelay: '620ms' }"
      >
        <p
          v-if="anime.synopsis"
          class="font-serif text-lg italic leading-relaxed text-bone-200/90"
        >
          “{{ pullQuote(anime.synopsis, 200) }}”
        </p>

        <dl
          class="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-ink-600 pt-4 font-mono text-[0.74rem] text-bone-300"
        >
          <div>
            <dt class="text-[0.62rem] uppercase tracking-[0.16em] text-muted">Rated</dt>
            <dd class="mt-1 text-base text-ember">★ {{ score(anime.score) }}</dd>
          </div>
          <div v-if="studio">
            <dt class="text-[0.62rem] uppercase tracking-[0.16em] text-muted">Studio</dt>
            <dd class="mt-1 text-bone-100">{{ studio }}</dd>
          </div>
          <div v-if="anime.members">
            <dt class="text-[0.62rem] uppercase tracking-[0.16em] text-muted">Members</dt>
            <dd class="mt-1 text-bone-100">{{ compact(anime.members) }}</dd>
          </div>
        </dl>
      </div>

      <NuxtLink
        :to="`/anime/${anime.mal_id}`"
        class="group mt-9 inline-flex items-center gap-3 rounded-sm border border-bone-100/25 px-6 py-3 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-bone-100 transition-all duration-500 ease-house hover:border-ember hover:bg-ember hover:text-ink-950"
        :class="play ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'"
        :style="{ transitionDelay: '760ms' }"
      >
        Read the feature
        <span class="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">→</span>
      </NuxtLink>
    </div>
  </section>
</template>

<style scoped>
/* The masked image reveal: the plate wipes up from black, then the parallax
   takes over. clip-path animates on the compositor; no layout cost.
   The hidden start state applies ONLY once the client mounts (.plate-mask--
   animate), so the server-painted hero is fully visible for first-paint LCP. */
.plate-mask {
  clip-path: inset(0 0 0 0);
  transform: scale(1);
}
.plate-mask--animate {
  clip-path: inset(100% 0 0 0);
  transform: scale(1.08);
  transition:
    clip-path 1.3s var(--ease-house),
    transform 1.6s var(--ease-house);
}
.plate-mask--animate.plate-mask--in {
  clip-path: inset(0 0 0 0);
  transform: scale(1);
}

@media (prefers-reduced-motion: reduce) {
  .plate-mask {
    clip-path: none !important;
    transform: none !important;
    transition: none !important;
  }
}
</style>
