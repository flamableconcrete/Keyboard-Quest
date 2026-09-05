import { describe, expect, it } from 'vitest'
import { frameForElapsedTime } from './animatedTiles'

describe('frameForElapsedTime', () => {
  it('cycles frames at the configured duration', () => {
    expect(frameForElapsedTime([10, 11], 500, 0)).toBe(10)
    expect(frameForElapsedTime([10, 11], 500, 499)).toBe(10)
    expect(frameForElapsedTime([10, 11], 500, 500)).toBe(11)
    expect(frameForElapsedTime([10, 11], 500, 1000)).toBe(10)
  })

  it('returns the first frame for empty or invalid timing inputs', () => {
    expect(frameForElapsedTime([], 500, 1000)).toBeUndefined()
    expect(frameForElapsedTime([10, 11], 0, 1000)).toBe(10)
  })
})
