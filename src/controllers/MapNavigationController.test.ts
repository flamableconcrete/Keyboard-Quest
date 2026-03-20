// src/controllers/MapNavigationController.test.ts
import { describe, it, expect } from 'vitest'
import { MapNavigationController } from './MapNavigationController'
import { ProfileData } from '../types'
import { getLevelsForWorld } from '../data/levels'

const world1Levels = getLevelsForWorld(1)

const mockProfile = (unlockedIds: string[]) => ({
  unlockedLevelIds: unlockedIds,
  levelResults: {},
  currentWorld: 1,
}) as unknown as ProfileData

describe('MapNavigationController — node unlocking', () => {
  it('returns true for already-unlocked levels', () => {
    const ctrl = new MapNavigationController(mockProfile([world1Levels[0].id]))
    expect(ctrl.isUnlocked(world1Levels[0].id)).toBe(true)
  })

  it('returns false for locked levels', () => {
    const ctrl = new MapNavigationController(mockProfile([world1Levels[0].id]))
    expect(ctrl.isUnlocked(world1Levels[1].id)).toBe(false)
  })
})

describe('MapNavigationController — pan bounds', () => {
  it('clampPan keeps scroll within bounds', () => {
    const ctrl = new MapNavigationController(mockProfile([]))
    const clamped = ctrl.clampPan(-5000, 0, 1280, 4000)
    expect(clamped.x).toBeGreaterThanOrEqual(-(4000 - 1280))
    expect(clamped.x).toBeLessThanOrEqual(0)
  })

  it('clampPan does not allow scrolling right of origin', () => {
    const ctrl = new MapNavigationController(mockProfile([]))
    const clamped = ctrl.clampPan(100, 0, 1280, 4000)
    expect(clamped.x).toBeLessThanOrEqual(0)
  })
})

describe('MapNavigationController — world transition', () => {
  it('canAdvanceToWorld returns false if any required level is incomplete', () => {
    const ctrl = new MapNavigationController(mockProfile([]))
    expect(ctrl.canAdvanceToWorld(2)).toBe(false)
  })

  it('canAdvanceToWorld returns true if all world 1 levels have completedAt', () => {
    const results: Record<string, unknown> = {}
    world1Levels.forEach(l => {
      results[l.id] = { accuracyStars: 3, speedStars: 3, completedAt: 123 }
    })
    const profile = {
      ...mockProfile(world1Levels.map(l => l.id)),
      levelResults: results,
    } as unknown as ProfileData
    const ctrl = new MapNavigationController(profile)
    expect(ctrl.canAdvanceToWorld(2)).toBe(true)
  })
})

describe('MapNavigationController — unlock propagation', () => {
  it('getNewUnlocks returns the next level id after completing a level', () => {
    const ctrl = new MapNavigationController(mockProfile([world1Levels[0].id]))
    const unlocks = ctrl.getNewUnlocks(world1Levels[0].id, 1)
    expect(unlocks).toContain(world1Levels[1].id)
  })

  it('getNewUnlocks returns empty array if next level is already unlocked', () => {
    const ctrl = new MapNavigationController(mockProfile([world1Levels[0].id, world1Levels[1].id]))
    const unlocks = ctrl.getNewUnlocks(world1Levels[0].id, 1)
    expect(unlocks).toHaveLength(0)
  })

  it('getNewUnlocks returns empty array at end of world', () => {
    const lastLevel = world1Levels[world1Levels.length - 1]
    const ctrl = new MapNavigationController(mockProfile([lastLevel.id]))
    const unlocks = ctrl.getNewUnlocks(lastLevel.id, 1)
    expect(unlocks).toHaveLength(0)
  })
})
