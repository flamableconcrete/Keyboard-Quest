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

export function computeWorldWidth(levelCount: number, extraWidth = 0): number {
  return WORLD_MARGIN + levelCount * NODE_H_SPACING + WORLD_MARGIN + extraWidth
}

export function computeWorldWidths(levelCounts: number[], extraWidths: number[] = []): number[] {
  return levelCounts.map((count, i) => computeWorldWidth(count, extraWidths[i] ?? 0))
}

export function computeWorldXOffsets(levelCounts: number[], extraWidths: number[] = []): number[] {
  const widths = computeWorldWidths(levelCounts, extraWidths)
  const offsets: number[] = []
  let cumulative = 0
  for (const w of widths) {
    offsets.push(cumulative)
    cumulative += w
  }
  return offsets
}

export function computeTotalMapWidth(levelCounts: number[], extraWidths: number[] = []): number {
  return computeWorldWidths(levelCounts, extraWidths).reduce((a, b) => a + b, 0)
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

// Extra width per world (index 4 = world 5 needs room for the large final boss node)
const EXTRA_WIDTHS = [0, 0, 0, 0, 250]

const WIDTHS = computeWorldWidths(LEVEL_COUNTS, EXTRA_WIDTHS)
const X_OFFSETS = computeWorldXOffsets(LEVEL_COUNTS, EXTRA_WIDTHS)

export const UNIFIED_MAP: UnifiedMapConfig = {
  worlds: [WORLD1_MAP, WORLD2_MAP, WORLD3_MAP, WORLD4_MAP, WORLD5_MAP],
  xOffsets: X_OFFSETS,
  widths: WIDTHS,
  totalWidth: computeTotalMapWidth(LEVEL_COUNTS, EXTRA_WIDTHS),
  worldTransitions: [
    // W1→W2: W1 boss (1994,190) → W2 l1 unified (2350,560)
    { cx: 2172, cy: 375 },
    // W2→W3: W2 boss unified (4720,170) → W3 l1 unified (4990,600)
    { cx: 4855, cy: 385 },
    // W3→W4: W3 boss unified (7280,160) → W4 l1 unified (7490,450)
    { cx: 7385, cy: 305 },
    // W4→W5: W4 boss unified (9810,170) → W5 l1 unified (9980,620)
    { cx: 9895, cy: 395 },
  ],
}
