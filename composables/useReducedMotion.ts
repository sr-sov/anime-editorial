import { onMounted, onUnmounted, ref } from 'vue'

/**
 * Reactive `prefers-reduced-motion` flag. Defaults to `true` (the safe,
 * static path) until mounted on the client, so SSR/first-paint never animates.
 * Every motion composable consults this and renders the final, static frame
 * when it is true — a real fallback, not a shortened duration.
 */
export function useReducedMotion() {
  const reduced = ref(true)
  let mql: MediaQueryList | undefined
  const update = () => {
    if (mql) reduced.value = mql.matches
  }

  onMounted(() => {
    mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    update()
    mql.addEventListener('change', update)
  })
  onUnmounted(() => {
    mql?.removeEventListener('change', update)
  })

  return { reduced }
}
