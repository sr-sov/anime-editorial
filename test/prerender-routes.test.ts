import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Guards the deep-link contract the adversarial review demanded:
 * the build must enumerate real detail routes to prerender, so a directly-typed
 * `/anime/<id>` returns a server-painted 200 (not the SPA 404 the base shipped).
 *
 * The exhaustive behavioural check (a real prerendered file with its own
 * title/OG + axe-clean) lives in `scripts/verify-dist.mjs`, run after
 * `npm run generate`. This unit test keeps the seed file honest cheaply, on
 * every push, without a full build.
 */
const seedPath = fileURLToPath(new URL('../prerender-routes.json', import.meta.url))

describe('prerender route seed', () => {
  it('the committed seed file exists', () => {
    expect(existsSync(seedPath)).toBe(true)
  })

  it('seeds a list of real /anime/<id> detail routes', () => {
    const routes = JSON.parse(readFileSync(seedPath, 'utf8')) as string[]
    expect(Array.isArray(routes)).toBe(true)
    // The deep-link fix is only meaningful if SOME detail routes are enumerated.
    expect(routes.length).toBeGreaterThan(0)
    for (const r of routes) {
      expect(r).toMatch(/^\/anime\/\d+$/)
    }
  })

  it('has no duplicate routes (each prerendered once)', () => {
    const routes = JSON.parse(readFileSync(seedPath, 'utf8')) as string[]
    expect(new Set(routes).size).toBe(routes.length)
  })
})
