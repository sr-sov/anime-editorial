<script setup lang="ts">
/**
 * Error state with a retry affordance. Emits `retry` so the parent can
 * re-run its data fetch (or any recovery action).
 */
withDefaults(
  defineProps<{
    title?: string
    message?: string
  }>(),
  {
    title: 'The presses jammed',
    message:
      'We could not reach the anime database. This is usually a brief rate limit or a network blip — try again in a moment.',
  },
)

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div
    class="flex flex-col items-center justify-center border border-ember/30 bg-ember/[0.04] px-6 py-16 text-center"
    role="alert"
  >
    <p class="kicker">Errata</p>
    <h2 class="mt-4 font-serif text-xl text-bone-100">{{ title }}</h2>
    <p class="mt-2 max-w-prose text-sm leading-relaxed text-muted">{{ message }}</p>
    <button
      type="button"
      class="mt-6 inline-flex items-center gap-2 rounded-sm border border-ember/60 px-5 py-2.5 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-ember transition-colors duration-300 hover:bg-ember hover:text-ink-950"
      @click="emit('retry')"
    >
      <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 3v5h5" />
      </svg>
      Try again
    </button>
  </div>
</template>
