import { describe, it, expect } from 'vitest'
import {
  NODE_H_SPACING,
  WORLD_MARGIN,
  TILE_SIZE,
  computeWorldWidth,
  computeWorldWidths,
  computeWorldXOffsets,
  computeTotalMapWidth,
  computeTileCols,
  worldIndexAtScrollX,
} from './unified'

const LEVEL_COUNTS = [12, 15, 14, 14, 13]

describe('computeWorldWidth', () => {
  it('returns MARGIN + levels*SPACING + MARGIN', () => {
    expect(computeWorldWidth(12)).toBe(2200)
    expect(computeWorldWidth(15)).toBe(2650)
    expect(computeWorldWidth(14)).toBe(2500)
    expect(computeWorldWidth(13)).toBe(2350)
  })
})

describe('computeWorldWidths', () => {
  it('maps level counts to widths', () => {
    expect(computeWorldWidths(LEVEL_COUNTS)).toEqual([2200, 2650, 2500, 2500, 2350])
  })
})

describe('computeWorldXOffsets', () => {
  it('first world starts at 0', () => {
    const offsets = computeWorldXOffsets(LEVEL_COUNTS)
    expect(offsets[0]).toBe(0)
  })
  it('second world starts after first world width', () => {
    const offsets = computeWorldXOffsets(LEVEL_COUNTS)
    expect(offsets[1]).toBe(2200)
  })
  it('third world starts at sum of first two', () => {
    const offsets = computeWorldXOffsets(LEVEL_COUNTS)
    expect(offsets[2]).toBe(4850)
  })
  it('returns correct offsets for all 5 worlds', () => {
    const offsets = computeWorldXOffsets(LEVEL_COUNTS)
    expect(offsets).toEqual([0, 2200, 4850, 7350, 9850])
  })
})

describe('computeTotalMapWidth', () => {
  it('sums all world widths', () => {
    expect(computeTotalMapWidth(LEVEL_COUNTS)).toBe(12200)
  })
})

describe('computeTileCols', () => {
  it('returns ceil(worldWidth / TILE_SIZE)', () => {
    expect(computeTileCols(2200)).toBe(69) // 2200/32 = 68.75 → 69
    expect(computeTileCols(2650)).toBe(83) // 2650/32 = 82.81 → 83
    expect(computeTileCols(2500)).toBe(79) // 2500/32 = 78.125 → 79
    expect(computeTileCols(2350)).toBe(74) // 2350/32 = 73.4375 → 74
  })
})

describe('worldIndexAtScrollX', () => {
  // xOffsets = [0, 2200, 4850, 7350, 9850], totalWidth = 12200
  // viewport width = 1280 (default)
  it('returns 0 when camera center is in world 1', () => {
    expect(worldIndexAtScrollX(0, [0, 2200, 4850, 7350, 9850], 12200, 1280)).toBe(0)
    expect(worldIndexAtScrollX(500, [0, 2200, 4850, 7350, 9850], 12200, 1280)).toBe(0)
  })
  it('returns 1 when camera center crosses into world 2', () => {
    // camera center = scrollX + 640. Center at 2200 means scrollX = 1560
    expect(worldIndexAtScrollX(1560, [0, 2200, 4850, 7350, 9850], 12200, 1280)).toBe(1)
  })
  it('returns last world index when near end of map', () => {
    expect(worldIndexAtScrollX(10920, [0, 2200, 4850, 7350, 9850], 12200, 1280)).toBe(4)
  })
  it('clamps to valid range', () => {
    expect(worldIndexAtScrollX(-100, [0, 2200, 4850, 7350, 9850], 12200, 1280)).toBe(0)
    expect(worldIndexAtScrollX(99999, [0, 2200, 4850, 7350, 9850], 12200, 1280)).toBe(4)
  })
})
