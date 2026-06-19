import { onBeforeUnmount, onMounted } from 'vue'

/**
 * Scroll-reveal via a single shared IntersectionObserver.
 *
 * Any element carrying `data-reveal` (and optionally `style="--reveal-delay:.."`)
 * gets `.is-revealed` when it scrolls into view. The transition itself lives in
 * CSS (assets/css/main.css), so reduced-motion users — whose global rule zeroes
 * transition-duration — simply see the final state appear with no movement.
 *
 * One observer for the whole page keeps this cheap; elements unobserve once
 * revealed so we never thrash on scroll. Call `register()` after content renders
 * (e.g. in a `watch`/`nextTick`) to pick up async-rendered nodes.
 */
export function useReveal(options: { rootMargin?: string; threshold?: number } = {}) {
  let observer: IntersectionObserver | undefined

  function ensureObserver() {
    if (observer || typeof window === 'undefined') return
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed')
            observer?.unobserve(entry.target)
          }
        }
      },
      {
        rootMargin: options.rootMargin ?? '0px 0px -12% 0px',
        threshold: options.threshold ?? 0.12,
      },
    )
  }

  /** Observe every not-yet-revealed [data-reveal] in the document (or a scope). */
  function register(scope: ParentNode | null = document) {
    if (typeof window === 'undefined' || !scope) return
    ensureObserver()
    const targets = scope.querySelectorAll<HTMLElement>(
      '[data-reveal]:not(.is-revealed)',
    )
    targets.forEach((el) => observer?.observe(el))
  }

  onMounted(() => register())
  onBeforeUnmount(() => observer?.disconnect())

  return { register }
}
