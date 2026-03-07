import { WORD_BANK } from '../data/wordBank'

export function filterWordsByLetters(bank: string[], letters: string[]): string[] {
  const letterSet = new Set(letters.map(l => l.toLowerCase()))
  return bank.filter(word =>
    word.toLowerCase().split('').every(ch => letterSet.has(ch))
  )
}

export function pickWords(pool: string[], count: number, difficulty: number): string[] {
  const sorted = [...pool].sort((a, b) =>
    difficulty <= 2 ? a.length - b.length : b.length - a.length
  )
  const shuffled = sorted.sort((a, b) =>
    a.length !== b.length ? (difficulty <= 2 ? a.length - b.length : b.length - a.length)
      : Math.random() - 0.5
  )
  return shuffled.slice(0, count)
}

export function getWordPool(unlockedLetters: string[], count: number, difficulty: number): string[] {
  const filtered = filterWordsByLetters(WORD_BANK, unlockedLetters)
  return pickWords(filtered, Math.min(count, filtered.length), difficulty)
}

export function calculateWpm(wordCount: number, elapsedMs: number): number {
  const minutes = elapsedMs / 60000
  return Math.round(wordCount / minutes)
}