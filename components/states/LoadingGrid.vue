<script setup lang="ts">
/** Skeleton placeholder shown while the index loads — mirrors the cover-plate rhythm. */
withDefaults(defineProps<{ count?: number }>(), { count: 9 })
</script>

<template>
  <div
    class="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3"
    aria-hidden="true"
  >
    <div v-for="n in count" :key="n" class="space-y-4">
      <div class="skeleton aspect-[3/4] w-full rounded-[2px]" />
      <div class="space-y-2.5">
        <div class="skeleton h-2 w-16 rounded-sm" />
        <div class="skeleton h-4 w-4/5 rounded-sm" />
        <div class="skeleton h-3 w-1/2 rounded-sm" />
      </div>
    </div>
  </div>
</template>
