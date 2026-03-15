// src/data/maps/unified.ts
import type { WorldMapData, WorldTransition } from './types'
import { WORLD1_MAP } from './world1'
import { WORLD2_MAP } from './world2'
import { WORLD3_MAP } from './world3'
import { WORLD4_MAP } from './world4'
import { WORLD5_MAP } from './world5'
import { getLevelsForWorld } from '../levels'

// ── Constants ────────────────────────────────────────────────
export const NODE_H_SPACING = 150
export const WORLD_MARGIN = 200
export const TILE_SIZE = 32

// ── Width / offset utilities ─────────────────────────────────

export function computeWorldWidth(levelCount: number): number {
  return WORLD_MARGIN + levelCount * NODE_H_SPACING + WORLD_MARGIN
}

export function computeWorldWidths(levelCounts: number[]): number[] {
  return levelCounts.map(computeWorldWidth)
}

export function computeWorldXOffsets(levelCounts: number[]): number[] {
  const widths = computeWorldWidths(levelCounts)
  const offsets: number[] = []
  let cumulative = 0
  for (const w of widths) {
    offsets.push(cumulative)
    cumulative += w
  }
  return offsets
}

export function computeTotalMapWidth(levelCounts: number[]): number {
  return computeWorldWidths(levelCounts).reduce((a, b) => a + b, 0)
}

export function computeTileCols(worldWidth: number): number {
  return Math.ceil(worldWidth / TILE_SIZE)
}

/**
 * Returns the 0-based world index (0=W1 … 4=W5) whose section contains
 * the camera center (scrollX + viewportWidth/2).
 * Uses the boundary-crossing rule: the world whose xOffset boundary
 * the camera center has most recently crossed.
 */
export function worldIndexAtScrollX(
  scrollX: number,
  xOffsets: number[],
  totalMapWidth: number,
  viewportWidth: number,
): number {
  const center = scrollX + viewportWidth / 2
  const clamped = Math.max(0, Math.min(totalMapWidth - 1, center))
  let idx = 0
  for (let i = 0; i < xOffsets.length; i++) {
    if (clamped >= xOffsets[i]) {
      idx = i
    }
  }
  return idx
}

// ── Unified map config type ──────────────────────────────────

export interface UnifiedMapConfig {
  worlds: WorldMapData[]
  xOffsets: number[]
  widths: number[]
  totalWidth: number
  /** Cross-world bezier control points: index 0 = W1→W2, 1 = W2→W3, etc. */
  worldTransitions: WorldTransition[]
}

const LEVEL_COUNTS = [
  getLevelsForWorld(1).length,
  getLevelsForWorld(2).length,
  getLevelsForWorld(3).length,
  getLevelsForWorld(4).length,
  getLevelsForWorld(5).length,
]

const WIDTHS = computeWorldWidths(LEVEL_COUNTS)
const X_OFFSETS = computeWorldXOffsets(LEVEL_COUNTS)

export const UNIFIED_MAP: UnifiedMapConfig = {
  worlds: [WORLD1_MAP, WORLD2_MAP, WORLD3_MAP, WORLD4_MAP, WORLD5_MAP],
  xOffsets: X_OFFSETS,
  widths: WIDTHS,
  totalWidth: computeTotalMapWidth(LEVEL_COUNTS),
  worldTransitions: [
    // W1→W2: W1 boss (1994,190) → W2 l1 unified (2381+2200=4581, 590)
    { cx: 3288, cy: 390 },
    // W2→W3: W2 boss unified (787+2200=2987, 20) → W3 l1 unified (1133+4850=5983, 610)
    { cx: 4485, cy: 315 },
    // W3→W4: W3 boss unified (1680+4850=6530, 20) → W4 l1 unified (156+7350=7506, 450)
    { cx: 7018, cy: 235 },
    // W4→W5: W4 boss unified (2461+7350=9811, 120) → W5 l1 unified (1175+9850=11025, 660)
    { cx: 10418, cy: 390 },
  ],
}
