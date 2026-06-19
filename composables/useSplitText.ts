/**
 * Pure text-splitting for the character-aware title reveal.
 *
 * Splits a string into words, and each word into characters, so the component
 * can wrap each character in an inline-block span and stagger its entrance while
 * keeping words unbreakable (no character orphaned onto the next line mid-word).
 * Pure and exported so the tokenisation is unit-tested in isolation.
 */

export interface CharToken {
  /** The character glyph. */
  char: string
  /** Global character index across the whole string (drives stagger delay). */
  index: number
}

export interface WordToken {
  chars: CharToken[]
}

/** Split a title into words → characters, preserving a running global index. */
export function splitWords(text: string): WordToken[] {
  const words = text.split(/(\s+)/).filter((w) => w.length > 0)
  let index = 0
  return words
    .filter((w) => !/^\s+$/.test(w))
    .map((word) => ({
      chars: Array.from(word).map((char) => ({ char, index: index++ })),
    }))
}

/** Total animated character count, for computing the final stagger's delay. */
export function charCount(words: WordToken[]): number {
  return words.reduce((sum, w) => sum + w.chars.length, 0)
}
