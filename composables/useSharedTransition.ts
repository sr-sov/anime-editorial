import { useRouter } from 'vue-router'

/**
 * Shared-element-style page transition (grid tile → feature spread).
 *
 * Uses the native View Transitions API: we tag the clicked cover plate and the
 * destination hero with the SAME `view-transition-name`, so the browser morphs
 * one into the other while cross-fading the rest of the page. The name is keyed
 * by anime id, so only the tile you clicked participates.
 *
 * Progressive enhancement: where `startViewTransition` is unsupported (Firefox,
 * Safari < 18, or reduced-motion), we just navigate — the route still has the
 * `spread` cross-dissolve, so it degrades to a clean fade, never a hard cut.
 */
export function useSharedTransition() {
  const router = useRouter()

  function prefersReduced(): boolean {
    return (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
  }

  /** Name used on BOTH the source tile image and the detail hero image. */
  function nameFor(id: number | string): string {
    return `cover-${id}`
  }

  /**
   * Navigate to `to`, morphing the element identified by `id`. The caller must
   * have already set `view-transition-name: cover-<id>` on the source element
   * (we do this via :style bindings on the tile + the detail hero).
   */
  async function go(to: string, _id: number | string): Promise<void> {
    const doc = document as Document & {
      startViewTransition?: (cb: () => Promise<void> | void) => {
        finished: Promise<void>
      }
    }

    if (!doc.startViewTransition || prefersReduced()) {
      await router.push(to)
      return
    }

    const transition = doc.startViewTransition(async () => {
      await router.push(to)
      // Let the destination commit before the browser snapshots the new state.
      await nextTick()
    })
    try {
      await transition.finished
    } catch {
      /* a superseded transition rejects; navigation already happened. */
    }
  }

  return { go, nameFor }
}
