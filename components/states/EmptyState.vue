<script setup lang="ts">
/** Neutral empty state — e.g. a search with no matches. */
withDefaults(
  defineProps<{
    title?: string
    message?: string
  }>(),
  {
    title: 'Nothing in the index',
    message: 'No titles matched. Try a different name or lift a filter.',
  },
)
</script>

<template>
  <div
    class="flex flex-col items-center justify-center border border-dashed border-ink-500 bg-ink-800/40 px-6 py-20 text-center"
    role="status"
  >
    <p class="kicker">Blank page</p>
    <h2 class="mt-4 font-serif text-xl text-bone-100">{{ title }}</h2>
    <p class="mt-2 max-w-prose text-sm leading-relaxed text-muted">{{ message }}</p>
    <slot />
  </div>
</template>
