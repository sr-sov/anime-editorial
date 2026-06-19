<script setup lang="ts">
/** The magazine frame: a transparent masthead over content, a colophon below. */
</script>

<template>
  <div class="flex min-h-screen flex-col bg-ink-900">
    <TheMasthead />
    <main class="flex-1">
      <slot />
    </main>
    <TheColophon />
  </div>
</template>
