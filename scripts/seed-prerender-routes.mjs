/**
 * Build-time seed for the prerender route list.
 *
 * Fetches the top ~40 anime ids from Jikan and writes them to
 * `prerender-routes.json` as `/anime/<id>` paths. The nitro `prerender:routes`
 * hook (nuxt.config) reads that file and enqueues the detail routes, so a
 * direct/cold load of a popular title returns a real, server-painted 200 (fixes
 * deep-links, SEO, social cards, and the mobile LCP) — while the long tail still
 * falls back to the SPA 404.html shell.
 *
 * Respects Jikan's documented rate guard (~3 req/s): a single page of 25 covers
 * the top run, so we make ONE request and pad with a small delay. If the API is
 * unreachable at build time we degrade to an empty list (the homepage + /browse
 * still prerender; detail routes resolve client-side) so the build never fails.
 */
import { writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../prerender-routes.json')
const JIKAN = process.env.JIKAN_BASE || 'https://api.jikan.moe/v4'

/** The committed fallback list — never clobber a good list with an empty one. */
async function existingRoutes() {
  try {
    if (!existsSync(OUT)) return []
    const parsed = JSON.parse(await readFile(OUT, 'utf8'))
    return Array.isArray(parsed) ? parsed.filter((r) => typeof r === 'string') : []
  } catch {
    return []
  }
}

/** Pull the top N ids. Jikan caps `limit` at 25, so page twice for ~40. */
async function fetchTopIds(target = 40) {
  const ids = []
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  for (let page = 1; ids.length < target && page <= 2; page += 1) {
    const url = `${JIKAN}/top/anime?page=${page}&limit=25&sfw=true`
    const res = await fetch(url, { headers: { accept: 'application/json' } })
    if (!res.ok) throw new Error(`Jikan ${res.status} for ${url}`)
    const json = await res.json()
    for (const a of json.data ?? []) {
      if (typeof a.mal_id === 'number') ids.push(a.mal_id)
    }
    if (page < 2) await sleep(700) // pad well under the 3 req/s ceiling
  }
  return ids.slice(0, target)
}

async function main() {
  try {
    const ids = await fetchTopIds(40)
    const routes = ids.map((id) => `/anime/${id}`)
    await writeFile(OUT, JSON.stringify(routes, null, 2) + '\n', 'utf8')
    console.log(`[seed-prerender] seeded ${routes.length} detail routes from Jikan`)
  } catch (err) {
    // CRITICAL: a fetch failure must NOT clobber the committed list. Keep the
    // existing routes so the build still prerenders the popular deep links.
    const kept = await existingRoutes()
    console.warn(
      `[seed-prerender] could not reach Jikan (${err.message}); ` +
        `keeping the committed list (${kept.length} routes).`,
    )
    // Leave the file untouched (it already holds `kept`); only write if absent.
    if (!existsSync(OUT)) await writeFile(OUT, '[]\n', 'utf8')
  }
}

main().catch(async (err) => {
  // Never fail the build on a seed error; preserve whatever is committed.
  console.warn(`[seed-prerender] unexpected error: ${err?.message}`)
  if (!existsSync(OUT)) await writeFile(OUT, '[]\n', 'utf8')
  process.exit(0)
})
