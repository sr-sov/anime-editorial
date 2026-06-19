<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { splitWords } from '~/composables/useSplitText'
import { useReducedMotion } from '~/composables/useReducedMotion'

/**
 * Character-aware title reveal (the editorial signature).
 *
 * Each character rises and fades in on the house curve, staggered ~26ms apart,
 * masked by an overflow-clipped wrapper so glyphs slide up from behind a line.
 * Words never break mid-character. Reduced-motion renders the final state with
 * no transform. Re-runs when `text` changes (detail page open) or when `play`
 * flips true (hero, after the cover plate has settled).
 *
 * Renders as a single heading element (`as`), so document outline stays correct.
 */
const props = withDefaults(
  defineProps<{
    text: string
    as?: string
    /** Gate the animation until the parent is ready (e.g. image decoded). */
    play?: boolean
    /** Per-character stagger, ms. */
    stagger?: number
    /** Delay before the first character, ms. */
    delay?: number
    /**
     * Play the entrance reveal on the FIRST client mount. Off by default: the
     * title is a large LCP candidate, and animating it in from hidden delays
     * Largest-Contentful-Paint. The reveal still plays on `text` changes (an
     * in-session route navigation), where the View Transition already carries
     * the drama. Opt in only for non-LCP decorative titles.
     */
    revealOnMount?: boolean
  }>(),
  { as: 'h1', play: true, stagger: 26, delay: 0, revealOnMount: false },
)

const { reduced } = useReducedMotion()
// SSR/SEO/LCP: the server (and the first client frame, pre-mount) paints the
// FINAL, visible title — never an opacity:0 heading that would tank LCP and
// hide text from crawlers. The glyph-stagger animation is layered on only after
// the component mounts on the client, by flipping `animate` true.
const animate = ref(false)
const started = ref(true)
const words = computed(() => splitWords(props.text))

function start() {
  if (reduced.value) {
    started.value = true
    return
  }
  // Two frames so the initial (hidden) state is committed before we reveal.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      started.value = true
    }),
  )
}

function reset() {
  if (!animate.value) return // pre-mount: stay in the painted final state
  started.value = false
  nextTick(start)
}

onMounted(() => {
  animate.value = true
  // First mount: keep the server-painted title (LCP-fast) UNLESS the caller
  // opts into an entrance reveal. Subsequent `text` changes always reveal.
  if (props.revealOnMount && !reduced.value && props.play) {
    started.value = false
    nextTick(start)
  }
})

watch(
  () => props.play,
  (v) => {
    if (v && animate.value && !started.value) start()
  },
)
watch(() => props.text, reset)
</script>

<template>
  <component
    :is="as"
    class="split"
    :class="{ 'is-started': started, 'is-animate': animate }"
    :aria-label="text"
  >
    <span aria-hidden="true" class="split__words">
      <span v-for="(word, wi) in words" :key="`${wi}-${word.chars.length}`" class="split__word">
        <span
          v-for="token in word.chars"
          :key="token.index"
          class="split__char"
          :style="{ transitionDelay: `${props.delay + token.index * props.stagger}ms` }"
          >{{ token.char }}</span
        >
      </span>
    </span>
  </component>
</template>

<style scoped>
.split {
  /* Wrapper itself is transparent; the masking happens per word. */
  display: inline;
}
.split__words {
  display: inline;
}
.split__word {
  display: inline-flex;
  overflow: hidden; /* the mask: chars slide up from behind this clip */
  vertical-align: top;
  padding-bottom: 0.12em; /* room for descenders inside the clip */
  margin-right: 0.26em;
}
.split__word:last-child {
  margin-right: 0;
}
.split__char {
  display: inline-block;
}
/* Hidden initial state applies ONLY once the client takes over (.is-animate),
   so the server-painted title is fully visible for LCP/SEO. */
.is-animate .split__char {
  transform: translateY(110%);
  opacity: 0;
  transition:
    transform 0.92s var(--ease-house),
    opacity 0.92s var(--ease-house);
  will-change: transform, opacity;
}
.is-animate.is-started .split__char {
  transform: translateY(0);
  opacity: 1;
}

/* Real reduced-motion fallback: no transform, no transition, instant. */
@media (prefers-reduced-motion: reduce) {
  .split__char {
    transition: none !important;
    transform: none !important;
    opacity: 1 !important;
  }
}
</style>
