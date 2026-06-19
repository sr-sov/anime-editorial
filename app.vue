<script setup lang="ts">
// Root shell. Layouts provide the masthead/colophon frame; pages slot in with
// a slow editorial cross-dissolve (the `spread` transition, set in nuxt.config).
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
