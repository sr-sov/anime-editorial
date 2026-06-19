import { describe, it, expect } from 'vitest'
import { useFormat } from '~/composables/useFormat'

const { score, year, compact, episodes, seasonStamp, pullQuote, folio } =
  useFormat()

describe('useFormat', () => {
  it('formats scores to two decimals, em dash when missing', () => {
    expect(score(8.736)).toBe('8.74')
    expect(score(null)).toBe('—')
    expect(score(undefined)).toBe('—')
  })

  it('prefers the explicit year, falls back to aired, then to em dash', () => {
    expect(year({ year: 2011, aired: null } as never)).toBe('2011')
    expect(
      year({ year: null, aired: { prop: { from: { year: 2009 } } } } as never),
    ).toBe('2009')
    expect(
      year({ year: null, aired: { prop: { from: { year: null } } } } as never),
    ).toBe('—')
  })

  it('compacts large counts and handles missing values', () => {
    expect(compact(1_200_000)).toBe('1.2M')
    expect(compact(950)).toBe('950')
    expect(compact(null)).toBe('—')
  })

  it('pluralises episode counts', () => {
    expect(episodes(24)).toBe('24 eps')
    expect(episodes(1)).toBe('1 ep')
    expect(episodes(null)).toBe('? eps')
  })

  it('capitalises the season and joins it to the year', () => {
    expect(seasonStamp({ season: 'spring', year: 2024, aired: null } as never)).toBe(
      'Spring 2024',
    )
    // No season: falls back to the bare year.
    expect(seasonStamp({ season: null, year: 1997, aired: null } as never)).toBe(
      '1997',
    )
    // No season and no year: a readable placeholder, not an em dash.
    expect(
      seasonStamp({
        season: null,
        year: null,
        aired: { prop: { from: { year: null } } },
      } as never),
    ).toBe('Undated')
  })

  it('strips the MAL "(Source: …)" boilerplate from a pull-quote', () => {
    expect(pullQuote('A quiet film. (Source: ANN)')).toBe('A quiet film.')
    expect(pullQuote('Another. [Written by MAL Rewrite]', 500)).toContain('Another.')
  })

  it('truncates a long pull-quote at a word boundary with an ellipsis', () => {
    const long = 'one two three four five six seven eight nine ten'
    const out = pullQuote(long, 18)
    expect(out.endsWith('…')).toBe(true)
    expect(out.length).toBeLessThanOrEqual(19) // 18 + the ellipsis
    expect(out).not.toMatch(/\s…$/) // trimmed before the ellipsis
  })

  it('returns an empty string for a missing synopsis', () => {
    expect(pullQuote(null)).toBe('')
    expect(pullQuote(undefined)).toBe('')
  })

  it('zero-pads folio numbers to two digits', () => {
    expect(folio(1)).toBe('01')
    expect(folio(12)).toBe('12')
    expect(folio(100)).toBe('100')
  })
})
