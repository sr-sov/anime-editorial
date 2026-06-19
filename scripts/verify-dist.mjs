/**
 * Post-generate verification gate (run after `npm run generate`).
 *
 * Two guarantees the adversarial review demanded, checked against the REAL
 * static output in `.output/public`:
 *
 *  1. DEEP-LINK 200 + OWN CONTENT — a seeded `/anime/<id>` route is prerendered
 *     to a real file whose <title> and og:image are the title's OWN (not the
 *     generic homepage card, not a 404 shell). This is the regression that the
 *     SPA-only build shipped (deep links 404'd); it must never come back.
 *  2. AXE CLEAN — the homepage and a detail deep link have zero serious/critical
 *     axe-core violations, tested against the prerendered HTML in a real
 *     (headless) browser via the system chromium.
 *
 * Exits non-zero on any failure so CI fails loudly.
 */
import { createServer } from 'node:http'
import { readFile, stat, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join, extname } from 'node:path'
import puppeteer from 'puppeteer-core'
import axeCore from 'axe-core'

const axeSource = axeCore.source

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const DIST = resolve(ROOT, '.output/public')
const BASE = '/anime-editorial'
const PORT = 4319

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
}

function findChromium() {
  const candidates = [
    process.env.CHROME_PATH,
    '/snap/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
  ].filter(Boolean)
  for (const c of candidates) if (existsSync(c)) return c
  // Fall back to a Puppeteer-managed cache if present.
  return undefined
}

/** Tiny static server that maps the GH Pages sub-path + SPA fallback. */
function serveDist() {
  return new Promise((resolveServer) => {
    const server = createServer(async (req, res) => {
      try {
        let urlPath = decodeURIComponent((req.url || '/').split('?')[0])
        if (urlPath.startsWith(BASE)) urlPath = urlPath.slice(BASE.length) || '/'
        let filePath = join(DIST, urlPath)
        const asStat = existsSync(filePath) ? await stat(filePath) : null
        if (asStat?.isDirectory() || urlPath.endsWith('/')) {
          filePath = join(filePath, 'index.html')
        }
        if (!existsSync(filePath)) {
          // SPA fallback, exactly like GitHub Pages serves 404.html.
          filePath = join(DIST, '404.html')
          if (!existsSync(filePath)) {
            res.statusCode = 404
            res.end('not found')
            return
          }
          res.statusCode = 404
        }
        const body = await readFile(filePath)
        res.setHeader('content-type', MIME[extname(filePath)] || 'application/octet-stream')
        res.end(body)
      } catch (err) {
        res.statusCode = 500
        res.end(String(err))
      }
    })
    server.listen(PORT, () => resolveServer(server))
  })
}

/**
 * Survey the prerendered detail pages. Returns the count, plus one id that
 * server-rendered the FULL spread (an <article>, not a skeleton/error), so the
 * content + axe checks run against a representative real page.
 */
async function surveyDetails() {
  const animeDir = join(DIST, 'anime')
  if (!existsSync(animeDir)) return { total: 0, withSpread: 0, goodId: null }
  const ids = await readdir(animeDir)
  let total = 0
  let withSpread = 0
  let goodId = null
  for (const id of ids) {
    const file = join(animeDir, id, 'index.html')
    if (!existsSync(file)) continue
    total += 1
    const html = await readFile(file, 'utf8')
    if (/<article/i.test(html) && /· Reel<\/title>/i.test(html)) {
      withSpread += 1
      if (!goodId) goodId = id
    }
  }
  return { total, withSpread, goodId }
}

async function main() {
  if (!existsSync(DIST)) {
    console.error(`[verify-dist] no build at ${DIST} — run \`npm run generate\` first.`)
    process.exit(1)
  }

  const failures = []

  // ---- 0. Font preloads must point at files that actually exist ----
  // The font preloads in nuxt.config pin hashed filenames; if a dep bump
  // rehashes them, the preload would 404 (dead weight + no LCP benefit). Assert
  // every `rel="preload" as="font"` href resolves to a real file in the build.
  {
    const home = await readFile(join(DIST, 'index.html'), 'utf8')
    const preloads = [...home.matchAll(/<link[^>]+rel="preload"[^>]+as="font"[^>]*>/g)]
      .map((m) => m[0].match(/href="([^"]+)"/)?.[1])
      .filter(Boolean)
    if (preloads.length === 0) {
      failures.push('No font preloads found in the cover HTML (expected Fraunces + Hanken).')
    }
    for (const href of preloads) {
      const rel = href.replace(`${BASE}/`, '')
      if (!existsSync(join(DIST, rel))) {
        failures.push(`Preloaded font 404s: ${href} (hash drift — update nuxt.config).`)
      }
    }
    if (preloads.length && !failures.length) {
      console.log(`[verify-dist] ${preloads.length} font preload(s) resolve to real files ✓`)
    }
  }

  const { total, withSpread, goodId } = await surveyDetails()
  const detailId = goodId

  // ---- 1. Deep-link 200 + own content (static-HTML assertions) ----
  if (total === 0) {
    failures.push(
      'No prerendered /anime/<id> route found in the build. Detail deep-links ' +
        'would 404 on a cold load. (Seed may have failed — check prerender-routes.json.)',
    )
  } else if (!detailId) {
    failures.push(
      `None of the ${total} prerendered detail pages rendered the full spread ` +
        '(all fell back to a skeleton — likely a Jikan rate-limit during build).',
    )
  } else {
    const html = await readFile(join(DIST, 'anime', detailId, 'index.html'), 'utf8')
    const title = (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || '').trim()
    const ogImage = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1]

    if (!title || /^Reel — The Anime Annual$/.test(title) || !/· Reel/.test(title)) {
      failures.push(`Deep link /anime/${detailId} has no per-title <title> (got: "${title}").`)
    }
    if (!ogImage || !ogImage.includes('myanimelist')) {
      failures.push(`Deep link /anime/${detailId} is missing a per-title og:image.`)
    }
    // Guard against a partial rate-limit regression: most pages must be real.
    if (withSpread < Math.ceil(total * 0.8)) {
      failures.push(
        `Only ${withSpread}/${total} detail pages server-rendered the spread ` +
          '(>=80% expected — Jikan likely rate-limited the prerender).',
      )
    }
    if (!failures.length) {
      console.log(
        `[verify-dist] deep link /anime/${detailId} -> 200, title "${title}", own OG image ✓ ` +
          `(${withSpread}/${total} detail pages fully server-rendered)`,
      )
    }
  }

  // ---- 2. Axe clean (homepage + deep link) in a real browser ----
  const executablePath = findChromium()
  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  })

  const targets = [
    { name: 'home', path: `${BASE}/` },
    ...(detailId ? [{ name: 'detail', path: `${BASE}/anime/${detailId}/` }] : []),
  ]

  for (const t of targets) {
    const page = await browser.newPage()
    await page.setViewport({ width: 390, height: 844 })
    const resp = await page.goto(`http://localhost:${PORT}${t.path}`, {
      waitUntil: 'networkidle2',
      timeout: 45000,
    })
    if (!resp || resp.status() >= 400) {
      failures.push(`${t.name} (${t.path}) returned HTTP ${resp?.status()}`)
    }
    await page.evaluate(axeSource)
    const results = await page.evaluate(async () => {
      // eslint-disable-next-line no-undef
      return await axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      })
    })
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    )
    if (serious.length) {
      for (const v of serious) {
        failures.push(`axe [${t.name}] ${v.id} (${v.impact}): ${v.help} — ${v.nodes.length} node(s)`)
      }
    } else {
      console.log(`[verify-dist] axe clean on ${t.name} (${results.violations.length} minor/none) ✓`)
    }
    await page.close()
  }

  await browser.close()

  if (failures.length) {
    console.error('\n[verify-dist] FAILED:')
    for (const f of failures) console.error('  ✗ ' + f)
    process.exit(1)
  }
  console.log('\n[verify-dist] all checks passed ✓')
}

const server = await serveDist()
try {
  await main()
} finally {
  server.close()
}
