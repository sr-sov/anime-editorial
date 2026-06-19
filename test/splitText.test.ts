import { describe, it, expect } from 'vitest'
import { splitWords, charCount } from '~/composables/useSplitText'

describe('splitWords', () => {
  it('splits a phrase into words, each with its characters', () => {
    const words = splitWords('Cowboy Bebop')
    expect(words).toHaveLength(2)
    expect(words[0].chars.map((c) => c.char).join('')).toBe('Cowboy')
    expect(words[1].chars.map((c) => c.char).join('')).toBe('Bebop')
  })

  it('assigns a continuous global index across all characters', () => {
    const words = splitWords('ab cd')
    const indices = words.flatMap((w) => w.chars.map((c) => c.index))
    // 'a','b','c','d' -> 0,1,2,3 (the space is not animated)
    expect(indices).toEqual([0, 1, 2, 3])
  })

  it('collapses runs of whitespace and ignores them as tokens', () => {
    const words = splitWords('  Spirited   Away  ')
    expect(words.map((w) => w.chars.map((c) => c.char).join(''))).toEqual([
      'Spirited',
      'Away',
    ])
  })

  it('handles an empty string without throwing', () => {
    expect(splitWords('')).toEqual([])
    expect(charCount(splitWords(''))).toBe(0)
  })

  it('preserves multibyte characters as single glyphs', () => {
    const words = splitWords('鋼の')
    expect(words).toHaveLength(1)
    expect(words[0].chars).toHaveLength(2)
    expect(words[0].chars[1].char).toBe('の')
  })
})

describe('charCount', () => {
  it('counts every animated character across words', () => {
    expect(charCount(splitWords('Cowboy Bebop'))).toBe(11)
    expect(charCount(splitWords('a b c'))).toBe(3)
  })
})
