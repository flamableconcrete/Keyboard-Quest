import { describe, it, expect } from 'vitest'
import { calcAccuracyStars, calcSpeedStars, calcXpReward, calcCharacterLevel } from './scoring'

describe('calcAccuracyStars', () => {
  it('returns 5 stars for 100% accuracy', () => {
    expect(calcAccuracyStars(100, 100)).toBe(5)
  })
  it('returns 1 star for very low accuracy', () => {
    expect(calcAccuracyStars(50, 100)).toBe(1)
  })
  it('returns 3 stars for 80% accuracy', () => {
    expect(calcAccuracyStars(80, 100)).toBe(3)
  })
})

describe('calcSpeedStars', () => {
  it('returns 5 stars for 60+ WPM', () => {
    expect(calcSpeedStars(60)).toBe(5)
  })
  it('returns 1 star for under 10 WPM', () => {
    expect(calcSpeedStars(5)).toBe(1)
  })
  it('returns 3 stars for 30 WPM', () => {
    expect(calcSpeedStars(30)).toBe(3)
  })
})

describe('calcXpReward', () => {
  it('scales with total stars', () => {
    expect(calcXpReward(5, 5, 100)).toBeGreaterThan(calcXpReward(3, 3, 100))
  })
  it('gives base XP for 1 star each', () => {
    expect(calcXpReward(1, 1, 100)).toBeGreaterThan(0)
  })
})

describe('calcCharacterLevel', () => {
  it('returns level 1 at 0 xp', () => {
    expect(calcCharacterLevel(0)).toBe(1)
  })
  it('returns level 50 at max xp', () => {
    expect(calcCharacterLevel(999999)).toBe(50)
  })
  it('increases with xp', () => {
    expect(calcCharacterLevel(1000)).toBeGreaterThan(calcCharacterLevel(100))
  })
})