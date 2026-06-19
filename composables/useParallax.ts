import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'
import { useReducedMotion } from './useReducedMotion'

/**
 * A single, deliberate hero parallax (L1: "one hero, one moment").
 *
 * Maps the element's position in the viewport to a vertical translate, applied
 * via `transform` only inside a rAF (never on the scroll event directly), so we
 * never trigger layout and stay on the compositor. The mapping is keyed to
 * scroll *position*, not a time-based lerp, so it is framerate-independent by
 * construction. Reduced-motion holds the element at its rest transform.
 *
 * @param speed  fraction of scroll distance to translate (0.12 = gentle, filmic)
 */
export function useParallax(speed = 0.12): { target: Ref<HTMLElement | null> } {
  const target = ref<HTMLElement | null>(null)
  const { reduced } = useReducedMotion()
  let frame = 0
  let ticking = false

  function apply() {
    ticking = false
    const el = target.value
    if (!el || reduced.value) return
    const rect = el.getBoundingClientRect()
    const viewportH = window.innerHeight || 1
    // Progress from -1 (just below) to 1 (just above), 0 when centred.
    const progress = (rect.top + rect.height / 2 - viewportH / 2) / viewportH
    const shift = -progress * rect.height * speed
    el.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0)`
  }

  function onScroll() {
    if (ticking) return
    ticking = true
    frame = requestAnimationFrame(apply)
  }

  let attached = false
  let idle = 0
  function attach() {
    if (attached || reduced.value) return
    attached = true
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    apply()
  }

  onMounted(() => {
    if (reduced.value) return
    // Gate the scroll listener until AFTER first paint so the parallax never
    // competes with hydration/LCP work on the critical path. requestIdleCallback
    // where available; a rAF fallback otherwise.
    const ric = (window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
    }).requestIdleCallback
    if (ric) idle = ric(attach, { timeout: 1200 })
    else idle = requestAnimationFrame(() => requestAnimationFrame(attach))
  })
  onBeforeUnmount(() => {
    const cic = (window as Window & {
      cancelIdleCallback?: (h: number) => void
    }).cancelIdleCallback
    if (cic) cic(idle)
    else cancelAnimationFrame(idle)
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
    cancelAnimationFrame(frame)
  })

  return { target }
}
