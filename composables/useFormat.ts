import type { Anime } from '~/types/jikan'

/**
 * Small presentation helpers shared by cards and the detail page. Kept as a
 * composable (rather than scattered inline) so formatting stays consistent.
 */
export function useFormat() {
  /** "8.74" or "—" when a score is missing (unaired / unrated). */
  function score(value: number | null | undefined): string {
    return typeof value === 'number' ? value.toFixed(2) : '—'
  }

  /** Prefer the explicit `year`, else fall back to the aired-from year. */
  function year(anime: Pick<Anime, 'year' | 'aired'>): string {
    if (anime.year) return String(anime.year)
    const from = anime.aired?.prop?.from?.year
    return from ? String(from) : '—'
  }

  /** Compact member/favorite counts, e.g. 1_200_000 -> "1.2M". */
  function compact(value: number | null | undefined): string {
    if (typeof value !== 'number') return '—'
    return new Intl.NumberFormat('en', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  }

  /** "24 eps", "1 ep", or "? eps" when episode count is unknown. */
  function episodes(value: number | null | undefined): string {
    if (typeof value !== 'number') return '? eps'
    return `${value} ep${value === 1 ? '' : 's'}`
  }

  /**
   * A two-letter season/year stamp for the masthead, e.g. "Spring 2024".
   * Capitalises the API's lowercase season string.
   */
  function seasonStamp(
    anime: Pick<Anime, 'season' | 'year' | 'aired'>,
  ): string {
    const y = year(anime)
    if (!anime.season) return y === '—' ? 'Undated' : y
    const s = anime.season.charAt(0).toUpperCase() + anime.season.slice(1)
    return `${s} ${y}`
  }

  /**
   * Trim a synopsis to a clean pull-quote: drop the trailing MAL "(Source: …)"
   * boilerplate and cap at a word boundary near `max` chars.
   */
  function pullQuote(
    synopsis: string | null | undefined,
    max = 280,
  ): string {
    if (!synopsis) return ''
    const cleaned = synopsis.replace(/\s*\[?\(?Source:.*$/is, '').trim()
    if (cleaned.length <= max) return cleaned
    const cut = cleaned.slice(0, max)
    const lastSpace = cut.lastIndexOf(' ')
    return `${cut.slice(0, lastSpace > 0 ? lastSpace : max).trim()}…`
  }

  /**
   * Index ordinal for the editorial running order, e.g. 1 -> "01", 12 -> "12".
   * Used as a typeset folio number on grid tiles.
   */
  function folio(n: number): string {
    return String(n).padStart(2, '0')
  }

  return { score, year, compact, episodes, seasonStamp, pullQuote, folio }
}
