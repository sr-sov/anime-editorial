<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{ error: NuxtError }>()

function goHome() {
  // clearError navigates back into the app and resets the error boundary.
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-ink-900">
    <TheMasthead />
    <main
      class="container-spread flex flex-1 flex-col items-center justify-center py-32 text-center"
    >
      <p class="kicker">Errata</p>
      <p
        class="mt-6 font-serif text-[6rem] font-semibold leading-none text-bone-100"
      >
        {{ error.statusCode || 'Error' }}
      </p>
      <h1 class="mt-4 font-serif text-2xl text-bone-200">
        {{ error.statusCode === 404 ? 'This page was never set in type.' : 'A page of the issue came loose.' }}
      </h1>
      <p class="mt-3 max-w-prose text-muted">
        {{
          error.statusCode === 404
            ? 'The spread you asked for is not in this issue. Return to the cover and start again.'
            : 'Something went wrong rendering this spread. Head back to the cover and try again.'
        }}
      </p>
      <button
        type="button"
        class="mt-10 inline-flex items-center gap-2 rounded-sm border border-ember/60 bg-ember/10 px-6 py-3 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-ember transition-colors duration-300 hover:bg-ember hover:text-ink-950"
        @click="goHome"
      >
        Back to the cover
      </button>
    </main>
    <TheColophon />
  </div>
</template>
