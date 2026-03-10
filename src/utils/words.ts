import { WORD_BANK } from '../data/wordBank'

export function filterWordsByLetters(bank: string[], letters: string[]): string[] {
  const letterSet = new Set(letters.map(l => l.toLowerCase()))
  return bank.filter(word =>
    word.toLowerCase().split('').every(ch => letterSet.has(ch))
  )
}

export function pickWords(pool: string[], count: number, difficulty: number): string[] {
  // Shuffle the pool initially
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  // Sort by length based on difficulty to group shorter or longer words towards the front
  shuffled.sort((a, b) =>
    difficulty <= 2 ? a.length - b.length : b.length - a.length
  )

  // Take a larger slice to allow variety (e.g., 2.5x the required count, min 10 extra)
  const candidateCount = Math.min(shuffled.length, Math.max(count * 2, count + 10))
  const candidates = shuffled.slice(0, candidateCount)

  // Shuffle candidates to pick a random subset
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]]
  }

  // Select the final count of words
  const selected = candidates.slice(0, count)

  // Sort the final selection again so the player experiences a progressive length difficulty within the level
  selected.sort((a, b) =>
    difficulty <= 2 ? a.length - b.length : b.length - a.length
  )

  return selected
}

export function getWordPool(unlockedLetters: string[], count: number, difficulty: number): string[] {
  const filtered = filterWordsByLetters(WORD_BANK, unlockedLetters)
  return pickWords(filtered, Math.min(count, filtered.length), difficulty)
}

export function calculateWpm(wordCount: number, elapsedMs: number): number {
  const minutes = elapsedMs / 60000
  return Math.round(wordCount / minutes)
}