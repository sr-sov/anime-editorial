<script setup lang="ts">
import { ref } from 'vue'

/**
 * The index search field — a typeset, underlined editorial input (no boxy
 * control). Two-way bound; clears with Escape; carries its own label and a
 * clear affordance. Debouncing lives in the parent (useDebouncedRef).
 */
const model = defineModel<string>({ required: true })
const inputRef = ref<HTMLInputElement | null>(null)

function clear() {
  model.value = ''
  inputRef.value?.focus()
}
</script>

<template>
  <div class="relative">
    <label
      for="index-search"
      class="kicker block"
    >
      Search the index
    </label>
    <div class="relative mt-3 flex items-center border-b border-ink-500 focus-within:border-ember">
      <svg
        class="h-4 w-4 shrink-0 text-muted"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path stroke-linecap="round" d="m21 21-4.3-4.3" />
      </svg>
      <input
        id="index-search"
        ref="inputRef"
        v-model="model"
        type="search"
        inputmode="search"
        autocomplete="off"
        placeholder="A title, e.g. Mononoke"
        class="w-full bg-transparent px-3 py-3 font-serif text-2xl text-bone-100 placeholder:text-ink-500 focus:outline-none"
        @keydown.esc="clear"
      />
      <button
        v-if="model"
        type="button"
        class="shrink-0 rounded-sm p-1 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ember"
        @click="clear"
      >
        Clear
      </button>
    </div>
  </div>
</template>
