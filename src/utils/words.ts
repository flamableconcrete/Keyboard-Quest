import { WORD_BANK } from '../data/wordBank'

export function filterWordsByLetters(bank: string[], letters: string[], maxLength?: number): string[] {
  const letterSet = new Set(letters.map(l => l.toLowerCase()))
  return bank.filter(word => {
    if (maxLength && word.length > maxLength) return false
    return word.toLowerCase().split('').every(ch => letterSet.has(ch))
  })
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

export function getWordPool(unlockedLetters: string[], count: number, difficulty: number, maxLength?: number): string[] {
  let filtered = filterWordsByLetters(WORD_BANK, unlockedLetters, maxLength)

  // Fallback: If no words match the criteria, use the base home row letters
  if (filtered.length === 0) {
    const fallbackLetters = ['a', 's', 'd', 'f', 'j', 'k', 'l']
    filtered = filterWordsByLetters(WORD_BANK, fallbackLetters, maxLength)

    // If it's still somehow empty (e.g. extremely strict maxLength), just grab any words
    if (filtered.length === 0) {
      filtered = [...WORD_BANK]
    }
  }

  // If the filtered pool doesn't have enough words to fulfill the count without repeats,
  // we could potentially repeat words. However, the existing logic caps it at filtered.length.
  // We'll leave the pickWords call as is but ensure we return at least one word.
  const selected = pickWords(filtered, Math.min(count, filtered.length), difficulty)

  // Absolute fallback to ensure we never return an empty array if count > 0
  if (selected.length === 0 && count > 0) {
    selected.push(WORD_BANK[0])
  }

  return selected
}

export function calculateWpm(wordCount: number, elapsedMs: number): number {
  const minutes = elapsedMs / 60000
  return Math.round(wordCount / minutes)
}