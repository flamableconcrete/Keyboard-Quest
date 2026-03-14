// src/data/maps/unified.ts
import type { WorldMapData, WorldTransition } from './types'

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
