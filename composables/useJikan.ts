import type {
  Anime,
  AnimeCharacter,
  AnimeQuery,
  AnimeRecommendation,
  Genre,
  JikanListResponse,
  JikanSingleResponse,
} from '~/types/jikan'

/**
 * useJikan — a thin, typed client for the Jikan v4 API.
 *
 * Responsibilities:
 *  - typed fetchers for the four endpoints this app uses,
 *  - a tiny in-memory response cache (per session) to avoid refetching,
 *  - a client-side request-rate guard so we never burst past Jikan's
 *    documented limits (~3 req/s, 60/min). Debouncing of user input is
 *    handled separately (see `useDebounce`) — this guard is the backstop.
 *
 * All requests run with `$fetch` so the app works as a static SPA: the data
 * is fetched in the browser at runtime, no Nitro server route involved.
 */

// ---- Module-level singletons (shared across all callers in a session) ----

const cache = new Map<string, unknown>()

/**
 * Build a stable cache key from a path plus sorted, cleaned query params.
 * Pure and exported so the keying logic can be unit-tested in isolation.
 */
export function buildCacheKey(
  path: string,
  params?: Record<string, unknown>,
): string {
  if (!params) return path
  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .sort(([a], [b]) => a.localeCompare(b))
  const qs = entries.map(([k, v]) => `${k}=${String(v)}`).join('&')
  return qs ? `${path}?${qs}` : path
}

/**
 * Minimum spacing between outbound requests. Jikan documents ~3 req/s but ALSO
 * enforces a ~60/min ceiling with burst detection. In the browser the user
 * never bursts 40 requests, so the tight ~3 req/s pace is right. During SSR /
 * prerender we fan out the whole top-40 in one process, which trips the burst
 * limiter (429), so we pace much more conservatively there.
 */
const isServer = typeof window === 'undefined'
const MIN_REQUEST_SPACING_MS = isServer ? 900 : 360
let lastRequestAt = 0
let queueTail: Promise<void> = Promise.resolve()

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Serialize outbound requests and space them out. Each call chains onto the
 * previous one, so concurrent callers are throttled rather than dropped.
 */
function scheduleSlot(): Promise<void> {
  const run = queueTail.then(async () => {
    const now = Date.now()
    const wait = Math.max(0, lastRequestAt + MIN_REQUEST_SPACING_MS - now)
    if (wait > 0) await sleep(wait)
    lastRequestAt = Date.now()
  })
  // Keep the chain alive even if a slot rejects (it won't, but be safe).
  queueTail = run.catch(() => undefined)
  return run
}

export function useJikan() {
  const base = useRuntimeConfig().public.jikanBase as string

  /**
   * Core request: rate-guarded, cached, typed. Throws on non-2xx so callers
   * (and useAsyncData) can render an error state.
   */
  async function request<T>(
    path: string,
    params?: Record<string, unknown>,
  ): Promise<T> {
    const key = buildCacheKey(path, params)
    if (cache.has(key)) {
      return cache.get(key) as T
    }

    // Jikan's burst limiter (429) is the one failure that actually shows up,
    // especially when prerender fans out the top-40. Retry it explicitly with
    // exponential backoff, honoring Retry-After when present, so a prerendered
    // detail page reliably gets its data instead of falling back to a skeleton.
    const maxAttempts = isServer ? 5 : 2
    let attempt = 0
    // eslint-disable-next-line no-constant-condition
    while (true) {
      await scheduleSlot()
      try {
        const result = await $fetch<T>(`${base}${path}`, {
          // $fetch serializes params and drops undefined values for us.
          query: params,
          retry: 0, // we own the retry loop so we can back off on 429
          timeout: 15_000,
        })
        cache.set(key, result)
        return result
      } catch (err: unknown) {
        attempt += 1
        const status = (err as { response?: { status?: number }; statusCode?: number })
          ?.response?.status ?? (err as { statusCode?: number })?.statusCode
        const retryable = status === 429 || status === 425 || status === undefined
        if (!retryable || attempt >= maxAttempts) throw err
        const retryAfter = Number(
          (err as { response?: { headers?: { get?: (k: string) => string | null } } })
            ?.response?.headers?.get?.('retry-after'),
        )
        const backoff = Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : Math.min(8000, 700 * 2 ** attempt)
        await sleep(backoff)
      }
    }
  }

  // ---------------------------------------------------------------------
  // Public fetchers
  // ---------------------------------------------------------------------

  /** Popular anime feed: GET /top/anime?page=N */
  function getTopAnime(page = 1): Promise<JikanListResponse<Anime>> {
    return request<JikanListResponse<Anime>>('/top/anime', {
      page,
      limit: 24,
      sfw: true,
    })
  }

  /**
   * Search / filtered listing: GET /anime?q=&page=&genres=
   * Used for both the search box and the genre filter (Jikan supports both
   * on the same endpoint), so the discovery page has one code path.
   */
  function searchAnime(
    query: AnimeQuery,
  ): Promise<JikanListResponse<Anime>> {
    const params: Record<string, unknown> = {
      page: query.page ?? 1,
      limit: query.limit ?? 24,
      sfw: query.sfw ?? true,
    }
    if (query.q) params.q = query.q
    if (query.genres) params.genres = query.genres
    if (query.order_by) params.order_by = query.order_by
    if (query.sort) params.sort = query.sort
    return request<JikanListResponse<Anime>>('/anime', params)
  }

  /** Full detail: GET /anime/{id}/full */
  function getAnimeById(id: number | string): Promise<JikanSingleResponse<Anime>> {
    return request<JikanSingleResponse<Anime>>(`/anime/${id}/full`)
  }

  /** Genre list for the filter: GET /genres/anime */
  function getGenres(): Promise<JikanListResponse<Genre>> {
    return request<JikanListResponse<Genre>>('/genres/anime')
  }

  /** The current season's feed — the editorial "now showing" rail. */
  function getSeasonNow(page = 1): Promise<JikanListResponse<Anime>> {
    return request<JikanListResponse<Anime>>('/seasons/now', {
      page,
      limit: 24,
      sfw: true,
    })
  }

  /** Cast list for a title's detail spread: GET /anime/{id}/characters */
  function getCharacters(
    id: number | string,
  ): Promise<JikanListResponse<AnimeCharacter>> {
    return request<JikanListResponse<AnimeCharacter>>(`/anime/${id}/characters`)
  }

  /** "Also screening" recommendations: GET /anime/{id}/recommendations */
  function getRecommendations(
    id: number | string,
  ): Promise<JikanListResponse<AnimeRecommendation>> {
    return request<JikanListResponse<AnimeRecommendation>>(
      `/anime/${id}/recommendations`,
    )
  }

  return {
    getTopAnime,
    searchAnime,
    getAnimeById,
    getGenres,
    getSeasonNow,
    getCharacters,
    getRecommendations,
  }
}
