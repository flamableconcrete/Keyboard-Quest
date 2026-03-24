import { describe, it, expect } from 'vitest'
import {
  computeWorldWidth,
  computeWorldWidths,
  computeWorldXOffsets,
  computeTotalMapWidth,
  computeTileCols,
  worldIndexAtScrollX,
} from './unified'
import { WORLD1_MAP } from './world1'
import { WORLD2_MAP } from './world2'
import { WORLD3_MAP } from './world3'
import { WORLD4_MAP } from './world4'
import { WORLD5_MAP } from './world5'
import type { WorldMapData } from './types'

const LEVEL_COUNTS = [12, 15, 14, 15, 13]

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
    expect(computeWorldWidths(LEVEL_COUNTS)).toEqual([2200, 2650, 2500, 2650, 2350])
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
    expect(offsets).toEqual([0, 2200, 4850, 7350, 10000])
  })
})

describe('computeTotalMapWidth', () => {
  it('sums all world widths', () => {
    expect(computeTotalMapWidth(LEVEL_COUNTS)).toBe(12350)
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
  it('returns 0 when camera center is in world 1', () => {
    expect(worldIndexAtScrollX(0, [0, 2200, 4850, 7350, 10000], 12350, 1280)).toBe(0)
    expect(worldIndexAtScrollX(500, [0, 2200, 4850, 7350, 10000], 12350, 1280)).toBe(0)
  })
  it('returns 1 when camera center crosses into world 2', () => {
    expect(worldIndexAtScrollX(1560, [0, 2200, 4850, 7350, 10000], 12350, 1280)).toBe(1)
  })
  it('returns last world index when near end of map', () => {
    expect(worldIndexAtScrollX(11070, [0, 2200, 4850, 7350, 10000], 12350, 1280)).toBe(4)
  })
  it('clamps to valid range', () => {
    expect(worldIndexAtScrollX(-100, [0, 2200, 4850, 7350, 10000], 12350, 1280)).toBe(0)
    expect(worldIndexAtScrollX(99999, [0, 2200, 4850, 7350, 10000], 12350, 1280)).toBe(4)
  })
})

describe('world map nodePositions layout constraints', () => {
  const worlds: [string, WorldMapData, number][] = [
    ['world1', WORLD1_MAP, 2200],
    ['world2', WORLD2_MAP, 2650],
    ['world3', WORLD3_MAP, 2500],
    ['world4', WORLD4_MAP, 2650],
    ['world5', WORLD5_MAP, 2600],
  ]

  worlds.forEach(([name, map, maxWidth]) => {
    describe(name, () => {
      it('x values strictly increase (left-to-right, no crossings)', () => {
        for (let i = 1; i < map.nodePositions.length; i++) {
          expect(map.nodePositions[i].x).toBeGreaterThan(map.nodePositions[i - 1].x)
        }
      })

      it('y values stay within canvas bounds [150, 680] (≥150 avoids HUD overlap)', () => {
        for (const pos of map.nodePositions) {
          expect(pos.y).toBeGreaterThanOrEqual(150)
          expect(pos.y).toBeLessThanOrEqual(680)
        }
      })

      it('x values stay within world pixel width', () => {
        for (const pos of map.nodePositions) {
          expect(pos.x).toBeGreaterThan(0)
          expect(pos.x).toBeLessThan(maxWidth)
        }
      })

      it('pathSegments count equals nodePositions.length - 1', () => {
        expect(map.pathSegments.length).toBe(map.nodePositions.length - 1)
      })
    })
  })
})
