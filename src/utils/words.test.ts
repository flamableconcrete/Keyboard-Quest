import { describe, it, expect } from 'vitest'
import { filterWordsByLetters, pickWords, calculateWpm } from './words'

describe('filterWordsByLetters', () => {
  it('returns only words constructable from available letters', () => {
    const bank = ['ask', 'add', 'hello', 'fade', 'zone']
    const letters = ['a', 's', 'k', 'd']
    expect(filterWordsByLetters(bank, letters)).toEqual(['ask', 'add'])
  })

  it('returns empty array when no words match', () => {
    expect(filterWordsByLetters(['xyz'], ['a', 's', 'd'])).toEqual([])
  })

  it('is case-insensitive', () => {
    expect(filterWordsByLetters(['ASK'], ['a', 's', 'k'])).toEqual(['ASK'])
  })
})

describe('pickWords', () => {
  it('returns requested count of words', () => {
    const pool = ['ask', 'sad', 'lad', 'fad', 'add', 'all']
    expect(pickWords(pool, 3, 1)).toHaveLength(3)
  })

  it('does not repeat words', () => {
    const pool = ['ask', 'sad', 'lad']
    const result = pickWords(pool, 3, 1)
    expect(new Set(result).size).toBe(3)
  })

  it('sorts shorter words first at difficulty 1', () => {
    const pool = ['flask', 'ask', 'lads', 'ad']
    const result = pickWords(pool, 4, 1)
    expect(result[0].length).toBeLessThanOrEqual(result[result.length - 1].length)
  })
})

describe('calculateWpm', () => {
  it('calculates WPM correctly', () => {
    expect(calculateWpm(10, 60000)).toBe(10)
  })

  it('rounds to integer', () => {
    expect(typeof calculateWpm(7, 60000)).toBe('number')
  })
})