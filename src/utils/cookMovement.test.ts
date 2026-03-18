// src/utils/cookMovement.test.ts
import { describe, it, expect } from 'vitest'
import { calcMoveDuration, pickNextStationIndex } from './cookMovement'

describe('calcMoveDuration', () => {
  it('returns baseMsPerHundredPx for exactly 100px distance', () => {
    expect(calcMoveDuration(0, 0, 100, 0, 160)).toBe(160)
  })

  it('scales with distance', () => {
    expect(calcMoveDuration(0, 0, 200, 0, 160)).toBe(320)
  })

  it('uses diagonal distance', () => {
    // 3-4-5 triangle: dist = 500
    expect(calcMoveDuration(0, 0, 300, 400, 160)).toBe(800)
  })

  it('returns minimum 150ms for very short distances', () => {
    expect(calcMoveDuration(0, 0, 5, 0, 160)).toBe(150)
  })
})

describe('pickNextStationIndex', () => {
  it('never returns the current index', () => {
    for (let i = 0; i < 50; i++) {
      expect(pickNextStationIndex(3, 10)).not.toBe(3)
    }
  })

  it('returns a valid index within bounds', () => {
    for (let i = 0; i < 50; i++) {
      const idx = pickNextStationIndex(0, 10)
      expect(idx).toBeGreaterThanOrEqual(0)
      expect(idx).toBeLessThan(10)
    }
  })

  it('works with a 2-station pool', () => {
    for (let i = 0; i < 20; i++) {
      expect(pickNextStationIndex(0, 2)).toBe(1)
      expect(pickNextStationIndex(1, 2)).toBe(0)
    }
  })

  it('throws when stationCount < 2', () => {
    expect(() => pickNextStationIndex(0, 1)).toThrow()
    expect(() => pickNextStationIndex(0, 0)).toThrow()
  })
})
