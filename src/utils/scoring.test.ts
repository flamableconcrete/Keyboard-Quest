import { describe, it, expect } from 'vitest'
import { calcAccuracyStars, calcSpeedStars, calcXpReward, calcCharacterLevel, checkWorldMastery } from './scoring'
import { ProfileData } from '../types'
import { getLevelsForWorld } from '../data/levels'

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

describe('checkWorldMastery', () => {
  it('returns true if all levels in the world have 5 accuracy and 5 speed stars', () => {
    const world1Levels = getLevelsForWorld(1)
    const results: Record<string, any> = {}
    world1Levels.forEach(l => {
      results[l.id] = { accuracyStars: 5, speedStars: 5, completedAt: 123, companionUsed: false }
    })

    const profile: Partial<ProfileData> = {
      levelResults: results
    }

    expect(checkWorldMastery(profile as ProfileData, 1)).toBe(true)
  })

  it('returns false if any level in the world has less than 10 total stars', () => {
    const world1Levels = getLevelsForWorld(1)
    const results: Record<string, any> = {}
    world1Levels.forEach(l => {
      results[l.id] = { accuracyStars: 5, speedStars: 5, completedAt: 123, companionUsed: false }
    })
    
    // Make one level fail the mastery
    results[world1Levels[0].id].accuracyStars = 4

    const profile: Partial<ProfileData> = {
      levelResults: results
    }

    expect(checkWorldMastery(profile as ProfileData, 1)).toBe(false)
  })

  it('returns false if a level in the world is missing results', () => {
    const world1Levels = getLevelsForWorld(1)
    const results: Record<string, any> = {}
    // Only complete all but first one
    for (let i = 1; i < world1Levels.length; i++) {
      results[world1Levels[i].id] = { accuracyStars: 5, speedStars: 5, completedAt: 123, companionUsed: false }
    }

    const profile: Partial<ProfileData> = {
      levelResults: results
    }

    expect(checkWorldMastery(profile as ProfileData, 1)).toBe(false)
  })
})