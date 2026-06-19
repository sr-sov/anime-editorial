<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * The magazine masthead. Transparent over the cinematic hero, then settles to a
 * hairline-ruled bar with a faint backdrop once the reader scrolls past the fold.
 * Chrome that disappears — the cover art is the star.
 */
const scrolled = ref(false)
let raf = 0
let ticking = false

function onScroll() {
  if (ticking) return
  ticking = true
  raf = requestAnimationFrame(() => {
    scrolled.value = window.scrollY > 24
    ticking = false
  })
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  cancelAnimationFrame(raf)
})
</script>

<template>
  <header
    class="fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-500 ease-house"
    :class="
      scrolled
        ? 'border-b border-ink-600 bg-ink-950/80 backdrop-blur-md'
        : 'border-b border-transparent bg-transparent'
    "
  >
    <div class="container-spread flex h-16 items-center justify-between">
      <!-- No aria-label: the accessible name comes from the visible text
           ("Reel The Anime Annual"), satisfying Label-in-Name (WCAG 2.5.3). The
           "Annual" span is visually hidden on mobile but stays in the a11y tree
           (sr-only) so the name is stable across breakpoints. -->
      <NuxtLink to="/" class="group flex items-baseline gap-2.5 rounded-sm">
        <span class="font-serif text-2xl font-semibold tracking-tight text-bone-100">
          Reel
        </span>
        <span
          class="sr-only font-mono text-[0.62rem] uppercase tracking-kicker text-muted sm:not-sr-only"
        >
          The Anime Annual
        </span>
      </NuxtLink>

      <nav class="flex items-center gap-6" aria-label="Primary">
        <NuxtLink
          to="/"
          class="rounded-sm font-mono text-[0.7rem] uppercase tracking-[0.16em] text-bone-300 transition-colors duration-300 hover:text-bone-100"
        >
          Cover
        </NuxtLink>
        <NuxtLink
          to="/browse"
          class="rounded-sm font-mono text-[0.7rem] uppercase tracking-[0.16em] text-bone-300 transition-colors duration-300 hover:text-bone-100"
        >
          The Index
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>
