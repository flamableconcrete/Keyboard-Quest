# Unified Overland Map Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the per-world OverlandMapScene (which restarts on world change) with a single continuously scrollable map spanning all 5 worlds, pannable by click-drag or edge scrolling.

**Architecture:** All 5 worlds are rendered side-by-side in one Phaser scene at computed x-offsets. MapRenderer gains an `xOffset` parameter so each world's tiles/decorations/paths land at the correct global position. OverlandMapScene is refactored to render all worlds at once, configure a scrolling camera, and move Tavern/Stable/Shop to HUD buttons.

**Tech Stack:** Phaser 3, TypeScript, Vite. Tests via Vitest (`npm run test`). Run dev server with `npm run dev`.

**Spec:** `docs/superpowers/specs/2026-03-14-unified-overland-map-design.md`

---

## Computed world dimensions (reference — do not change these values)

These values drive the whole implementation. Derive them once here to avoid drift:

| World | Levels | Width (px) | COLS | X-offset |
|-------|--------|-----------|------|----------|
| 1     | 12     | 2200       | 69   | 0        |
| 2     | 15     | 2650       | 83   | 2200     |
| 3     | 14     | 2500       | 79   | 4850     |
| 4     | 14     | 2500       | 79   | 7350     |
| 5     | 13     | 2350       | 74   | 9850     |
| Total |        | **12200**  |      |          |

Formula: `worldWidth = 200 + (numLevels × 150) + 200`. COLS = `ceil(width / 32)`.

---

## Chunk 1: Foundation — types, unified config, and MapRenderer xOffset

### Task 1: Remove `specialNodes` from `WorldMapData`, add `WorldTransition` type

**Files:**
- Modify: `src/data/maps/types.ts`

- [ ] **Step 1: Update types**

In `src/data/maps/types.ts`, make these two changes:

1. Remove the `specialNodes` field from `WorldMapData`:
```typescript
// DELETE this line from WorldMapData:
specialNodes: Record<string, MapNodePosition>
```

2. Add `WorldTransition` interface (insert before `WorldMapData`):
```typescript
/** Bezier control point (absolute unified coords) connecting a world boss to next world's first node */
export interface WorldTransition {
  cx: number
  cy: number
}
```

- [ ] **Step 2: Remove `specialNodes` from all world data files**

For each of `src/data/maps/world1.ts` through `world5.ts`, find the `specialNodes:` property in the exported map data object and delete it entirely (the object key and its value). Do not touch anything else in those files yet — node positions and COLS will be updated in Chunk 2.

- [ ] **Step 3: Verify no type errors**

```bash
npm run build 2>&1 | tail -20
```
Expected: may have errors in OverlandMapScene from `specialNodes` usage in `drawSpecialNodes()`, but no errors in `types.ts` or world map files.

- [ ] **Step 4: Commit**

```bash
git add src/data/maps/types.ts src/data/maps/world1.ts src/data/maps/world2.ts src/data/maps/world3.ts src/data/maps/world4.ts src/data/maps/world5.ts
git commit -m "refactor(map): remove specialNodes from WorldMapData type and all world data files"
```

---

### Task 2: Create `unified.ts` with world-width utilities and tests

**Files:**
- Create: `src/data/maps/unified.ts`
- Create: `src/data/maps/unified.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/data/maps/unified.test.ts`:

```typescript
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
    expect(computeTileCols(2200)).toBe(69)   // 2200/32 = 68.75 → 69
    expect(computeTileCols(2650)).toBe(83)   // 2650/32 = 82.81 → 83
    expect(computeTileCols(2500)).toBe(79)   // 2500/32 = 78.125 → 79
    expect(computeTileCols(2350)).toBe(74)   // 2350/32 = 73.4375 → 74
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
```

- [ ] **Step 2: Run tests — expect all to fail**

```bash
npx vitest run src/data/maps/unified.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `unified.ts`**

Create `src/data/maps/unified.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests — expect all to pass**

```bash
npx vitest run src/data/maps/unified.test.ts
```
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/maps/unified.ts src/data/maps/unified.test.ts
git commit -m "feat(map): add unified map width/offset utilities with tests"
```

---

### Task 3: Add `xOffset` to `MapRenderer`

**Files:**
- Modify: `src/utils/mapRenderer.ts`

- [ ] **Step 1: Add `xOffset` constructor parameter and apply it everywhere**

In `src/utils/mapRenderer.ts`, make these changes:

1. Add field and update constructor:
```typescript
// Add field after existing fields:
private xOffset: number

constructor(scene: Phaser.Scene, mapData: WorldMapData, xOffset = 0) {
  this.scene = scene
  this.mapData = mapData
  this.xOffset = xOffset
}
```

2. In `renderGrid()`, add xOffset to the x position:
```typescript
// Change:
const img = this.scene.add.image(
  col * TILE_SIZE,
  row * TILE_SIZE,
  tilesetKey,
  tileIndex,
)
// To:
const img = this.scene.add.image(
  this.xOffset + col * TILE_SIZE,
  row * TILE_SIZE,
  tilesetKey,
  tileIndex,
)
```

3. In `placeDecorationSprite()`, add xOffset:
```typescript
// Change:
const img = this.scene.add.image(deco.x, deco.y, tilesetKey, deco.tileIndex)
// To:
const img = this.scene.add.image(this.xOffset + deco.x, deco.y, tilesetKey, deco.tileIndex)
```

4. In `createAtmosphereEmitter()`, add xOffset to zone x:
```typescript
// Change:
source: new Phaser.Geom.Rectangle(
  cfg.zone.x,
  cfg.zone.y,
  cfg.zone.width,
  cfg.zone.height,
)
// To:
source: new Phaser.Geom.Rectangle(
  this.xOffset + cfg.zone.x,
  cfg.zone.y,
  cfg.zone.width,
  cfg.zone.height,
)
```

5. In `renderPaths()`, add xOffset to all node positions and control points:
```typescript
// Replace the renderPaths method signature and body start:
renderPaths(
  levels: { id: string }[],
  completedIds: Set<string>,
): Phaser.Curves.Path {
  const { nodePositions, pathSegments } = this.mapData
  const ox = this.xOffset  // shorthand
  const gfx = this.scene.add.graphics()
  this.pathGraphics.push(gfx)

  const first = nodePositions[0] ?? { x: 0, y: 0 }
  const compositePath = new Phaser.Curves.Path(ox + first.x, first.y)

  for (let i = 0; i < levels.length - 1; i++) {
    const from = nodePositions[i]
    const to = nodePositions[i + 1]
    if (!from || !to) continue

    const segment = pathSegments[i]
    const isCompleted = completedIds.has(levels[i].id)
    const color = isCompleted ? 0xaa8844 : 0x665533
    const alpha = isCompleted ? 1 : 0.6

    gfx.lineStyle(6, color, alpha)

    const fx = ox + from.x, fy = from.y
    const tx = ox + to.x,   ty = to.y

    if (segment?.cx !== undefined && segment?.cy !== undefined) {
      const bezier = new Phaser.Curves.QuadraticBezier(
        new Phaser.Math.Vector2(fx, fy),
        new Phaser.Math.Vector2(ox + segment.cx, segment.cy),
        new Phaser.Math.Vector2(tx, ty),
      )
      gfx.beginPath()
      const points = bezier.getPoints(32)
      gfx.moveTo(points[0].x, points[0].y)
      for (let p = 1; p < points.length; p++) {
        gfx.lineTo(points[p].x, points[p].y)
      }
      gfx.strokePath()
      compositePath.quadraticBezierTo(tx, ty, ox + segment.cx, segment.cy)
    } else {
      gfx.beginPath()
      gfx.moveTo(fx, fy)
      gfx.lineTo(tx, ty)
      gfx.strokePath()
      compositePath.lineTo(tx, ty)
    }
  }

  return compositePath
}
```

- [ ] **Step 2: Verify type-check passes**

```bash
npx tsc --noEmit
```
Expected: no new errors from MapRenderer.

- [ ] **Step 3: Verify existing single-world usage still works**

`OverlandMapScene` still creates `new MapRenderer(this, mapData)` with no xOffset — default=0 means existing behavior is unchanged.

```bash
npm run build 2>&1 | grep -i error | head -20
```
Expected: same errors as before this task (none from mapRenderer.ts).

- [ ] **Step 4: Commit**

```bash
git add src/utils/mapRenderer.ts
git commit -m "feat(MapRenderer): add xOffset parameter for unified map positioning"
```

---

## Chunk 2: World data migration

Each world's map file needs:
1. `COLS` updated to the new column count
2. Node positions scaled proportionally to the new width (scale from 1280px)
3. Path segment control points scaled proportionally
4. `specialNodes` property removed from the exported map data object
5. Tile grid path-drawing column references scaled proportionally

For node and path segment scaling, use this formula throughout:
```
newX = Math.round(oldX * (newWidth / 1280))
```

For tile grid column references (used in `hPath`, `vPath`, and `g[row][col]` assignments), use:
```
newCol = Math.round(oldCol * (newCols / 40))
```

### Task 4: Migrate World 1 map data

**Files:**
- Modify: `src/data/maps/world1.ts`

World 1: `newWidth = 2200`, `newCols = 69`, scale factor from 1280 = 1.71875, col scale from 40 = 1.725

- [ ] **Step 1: Update `COLS` constant**

```typescript
// Replace:
const COLS = 40
// With:
const COLS = 69  // ceil(2200 / 32) — do not add a WORLD_WIDTH constant, it has no uses
```

- [ ] **Step 2: Update tile grid column references in `buildGround()`**

Scale **every** column index argument in `hPath`, `vPath`, and **all** direct `g[row][col]` assignments by `69/40 ≈ 1.725`. This includes three categories of direct assignments — do not skip any:
- `PATH_CORNER` corner assignments (e.g., `g[18][8] = PATH_CORNER`)
- `WATER` tile assignments (e.g., `g[20][18] = WATER`)
- `GRASS_ALT` scatter assignments in `altPositions` (the `c` coordinate of each `[r, c]` pair)

Y (row) values stay unchanged throughout. Column scaling examples:

```typescript
// hPath / vPath:
hPath(g, 18, 4, 8, PATH_H)    →  hPath(g, 18, 7, 14, PATH_H)
vPath(g, 8, 16, 18, PATH_V)   →  vPath(g, 14, 16, 18, PATH_V)
hPath(g, 16, 8, 12, PATH_H)   →  hPath(g, 16, 14, 21, PATH_H)
// Special-node path columns:
vPath(g, 15, 18, 20, PATH_V)  →  vPath(g, 26, 18, 20, PATH_V)
hPath(g, 20, 14, 23, PATH_H)  →  hPath(g, 20, 24, 40, PATH_H)
// GRASS_ALT scatter — scale c in each [r, c] pair:
[1, 5]  →  [1, 9]
[2, 12] →  [2, 21]
// ... and so on for all 43 pairs
```

- [ ] **Step 3: Update decoration x positions**

Scale every `x:` value in `buildDecorations()` by `2200/1280 ≈ 1.71875`. Round to nearest integer.

Example:
```typescript
// placeTree calls (old → new x):
placeTree(40, 80)    →  placeTree(69, 80)
placeTree(100, 120)  →  placeTree(172, 120)
placeTree(200, 60)   →  placeTree(344, 60)
// ... and so on for all decorations
```

- [ ] **Step 4: Update atmosphere zone x positions**

Scale `zone.x` values in `buildAtmosphere()` by `2200/1280`. Update full-width `zone.width` values (currently 1280) to `2200` (the new world width, `COLS * 32 = 69 * 32 = 2208`, but use 2200 to match the design constant):

```typescript
// Old: zone: { x: 0, y: 200, width: 1280, height: 520 }
// New: zone: { x: 0, y: 200, width: 2200, height: 520 }
// Old: zone: { x: 0, y: 0, width: 1280, height: 720 }
// New: zone: { x: 0, y: 0, width: 2200, height: 720 }
```

- [ ] **Step 5: Update node positions**

Scale each node's `x` by `2200/1280`, keep `y` unchanged:

```typescript
nodePositions: [
  { x: 241,  y: 590 }, // l1
  { x: 447,  y: 530 }, // l2
  { x: 636,  y: 500 }, // l3
  { x: 859,  y: 460 }, // mb1
  { x: 1066, y: 430 }, // l4
  { x: 1272, y: 380 }, // l5
  { x: 1444, y: 340 }, // mb2
  { x: 1220, y: 280 }, // l6
  { x: 1427, y: 250 }, // l7
  { x: 1616, y: 290 }, // mb3
  { x: 1822, y: 240 }, // l8
  { x: 1994, y: 190 }, // boss
],
```

- [ ] **Step 6: Update path segment control points**

Scale each `cx` by `2200/1280`, keep `cy` unchanged:

```typescript
pathSegments: [
  { cx: 327,  cy: 580 }, // l1→l2
  { cx: 533,  cy: 500 }, // l2→l3
  { cx: 739,  cy: 470 }, // l3→mb1  (430 × 2200/1280 = 739)
  { cx: 963,  cy: 460 }, // mb1→l4  (560 × 2200/1280 = 963)
  { cx: 1169, cy: 390 }, // l4→l5   (680 × 2200/1280 = 1169)
  { cx: 1358, cy: 350 }, // l5→mb2  (790 × 2200/1280 = 1358)
  { cx: 1375, cy: 280 }, // mb2→l6  (800 × 2200/1280 = 1375)
  { cx: 1323, cy: 250 }, // l6→l7   (770 × 2200/1280 = 1323)
  { cx: 1530, cy: 280 }, // l7→mb3  (890 × 2200/1280 = 1530)
  { cx: 1719, cy: 250 }, // mb3→l8  (1000 × 2200/1280 = 1719)
  { cx: 1908, cy: 200 }, // l8→boss (1110 × 2200/1280 = 1908)
],
```

- [ ] **Step 7: Remove `specialNodes` from export** *(skip if Chunk 1 Task 1 Step 2 was completed — the property was already deleted)*

If not already done: delete the `specialNodes:` property from the `WORLD1_MAP` export object entirely.

- [ ] **Step 8: Verify type-check**

```bash
npx tsc --noEmit 2>&1 | grep world1
```
Expected: no errors from world1.ts.

- [ ] **Step 9: Commit**

```bash
git add src/data/maps/world1.ts
git commit -m "refactor(world1): expand map to 2200px, scale node positions and tile grid"
```

---

### Task 5: Migrate Worlds 2–5 map data

**Files:**
- Modify: `src/data/maps/world2.ts`, `world3.ts`, `world4.ts`, `world5.ts`

Apply the same process as Task 4 for each world. Reference values:

| World | newWidth | newCols | NodeScale | ColScale |
|-------|----------|---------|-----------|----------|
| 2     | 2650     | 83      | 2650/1280 ≈ 2.070 | 83/40 = 2.075 |
| 3     | 2500     | 79      | 2500/1280 ≈ 1.953 | 79/40 = 1.975 |
| 4     | 2500     | 79      | 2500/1280 ≈ 1.953 | 79/40 = 1.975 |
| 5     | 2350     | 74      | 2350/1280 ≈ 1.836 | 74/40 = 1.850 |

Use these spot-check values to verify your first and last node positions are correct after scaling (read each world file's current `nodePositions` to find the source x values):

| World | Anchor check |
|-------|-------------|
| 2     | first node x = `Math.round(W2_l1_x * 2650/1280)`, boss node x = `Math.round(W2_boss_x * 2650/1280)` |
| 3     | first node x = `Math.round(W3_l1_x * 2500/1280)`, boss node x = `Math.round(W3_boss_x * 2500/1280)` |
| 4     | first node x = `Math.round(W4_l1_x * 2500/1280)`, boss node x = `Math.round(W4_boss_x * 2500/1280)` |
| 5     | first node x = `Math.round(W5_l1_x * 2350/1280)`, boss node x = `Math.round(W5_boss_x * 2350/1280)` |

For each world file:
- [ ] Update `COLS` constant to new value (do NOT add a `WORLD_WIDTH` constant)
- [ ] Scale all tile-grid column references in `buildGround()` — **all three categories**: `hPath`/`vPath` column args, direct `g[row][col]` assignments (PATH_CORNER and WATER), and scatter tile `c` values in `altPositions`
- [ ] Scale all decoration `x:` values in `buildDecorations()`
- [ ] Scale atmosphere `zone.x` and update full-width `zone.width` to `newWidth`
- [ ] Scale all node position `x` values (keep `y` unchanged)
- [ ] Scale all path segment `cx` values (keep `cy` unchanged)
- [ ] Remove `specialNodes` property *(skip if Chunk 1 Task 1 already removed it)*
- [ ] Run `npx tsc --noEmit` after each world — expect no errors for that file

- [ ] **Commit after all four worlds**

```bash
git add src/data/maps/world2.ts src/data/maps/world3.ts src/data/maps/world4.ts src/data/maps/world5.ts
git commit -m "refactor(worlds 2-5): expand maps to new widths, scale positions"
```

> **Note:** Tile grid visual correctness (dirt paths connecting nodes) is not verifiable until Chunk 3 Task 12's smoke test. TypeScript errors catch structural issues only.

---

## Chunk 3: OverlandMapScene full refactor

> Before starting Chunk 3, run `npm run build` and confirm there are no unexpected errors outside OverlandMapScene. The TypeScript errors in OverlandMapScene from the removed `specialNodes` will be fixed in this chunk.

### Task 6: Add `worldTransitions` to `unified.ts`

**Files:**
- Modify: `src/data/maps/unified.ts`

`worldTransitions` must be authored after node positions are finalized in Chunk 2. Each entry is the bezier control point (in absolute unified coords) between a world boss and the next world's first node.

- [ ] **Step 1: Compute unified-coord boss and first-node positions**

Using the node positions from the migrated world files and the x-offsets from the reference table:

| Transition | From (boss, unified x) | To (W(N+1)_L1, unified x) | Control point |
|-----------|------------------------|--------------------------|---------------|
| W1→W2 | x=1994+0=1994, y=190 | x=241+2200=2441, y=590 | cx=2217, cy=390 |
| W2→W3 | (W2 boss node x) + 2200 | (W3 l1 node x) + 4850 | midpoint cx, cy |
| W3→W4 | (W3 boss node x) + 4850 | (W4 l1 node x) + 7350 | midpoint cx, cy |
| W4→W5 | (W4 boss node x) + 7350 | (W5 l1 node x) + 9850 | midpoint cx, cy |

For each: `cx = (fromX + toX) / 2`, `cy = (fromY + toY) / 2`. Compute W2–W5 boss and first-node x/y from their respective migrated world files (same scaling formula as Task 5).

- [ ] **Step 2: Add worldTransitions data to `unified.ts`**

After computing the 4 control points, add to `unified.ts`:

```typescript
import { WORLD1_MAP } from './world1'
import { WORLD2_MAP } from './world2'
import { WORLD3_MAP } from './world3'
import { WORLD4_MAP } from './world4'
import { WORLD5_MAP } from './world5'
import { getLevelsForWorld } from '../levels'

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
    // W1→W2: computed from W1 boss and W2 first node in unified coords
    { cx: /* computed value */, cy: /* computed value */ },
    // W2→W3
    { cx: /* computed value */, cy: /* computed value */ },
    // W3→W4
    { cx: /* computed value */, cy: /* computed value */ },
    // W4→W5
    { cx: /* computed value */, cy: /* computed value */ },
  ],
}
```

Fill in the computed cx/cy values.

- [ ] **Step 3: Verify no import cycles**

```bash
npx tsc --noEmit 2>&1 | head -30
```
Expected: no circular dependency errors.

- [ ] **Step 4: Commit**

```bash
git add src/data/maps/unified.ts
git commit -m "feat(unified): add UNIFIED_MAP config with worldTransitions"
```

---

### Task 7: Refactor OverlandMapScene — unified rendering

**Files:**
- Modify: `src/scenes/OverlandMapScene.ts`

This is the biggest task. Work through it in sub-steps.

- [ ] **Step 1: Update imports**

Replace the 5 world map imports and existing imports with:

```typescript
import { UNIFIED_MAP, worldIndexAtScrollX } from '../data/maps/unified'
import { ALL_LEVELS, getLevelsForWorld } from '../data/levels'
```

Remove individual `WORLD1_MAP` through `WORLD5_MAP` imports and `WORLD_NAMES`.

- [ ] **Step 2: Update scene fields**

Replace `private currentWorld!: number` with:
```typescript
private mapRenderers: MapRenderer[] = []
private worldPaths: Phaser.Curves.Path[] = []
```

The scene no longer tracks a single current world.

- [ ] **Step 3: Replace `getMapData()` with `buildUnifiedMap()`**

Delete `getMapData()`. Add a new method:

```typescript
private buildUnifiedMap(): void {
  const { worlds, xOffsets, widths } = UNIFIED_MAP

  worlds.forEach((mapData, i) => {
    const xOffset = xOffsets[i]
    const renderer = new MapRenderer(this, mapData, xOffset)
    renderer.renderTileLayers()
    renderer.renderDecorations()
    renderer.startAtmosphere()
    renderer.startAnimatedTiles()
    this.mapRenderers.push(renderer)

    // Draw blend gradient at right edge of this world (except last world)
    if (i < worlds.length - 1) {
      this.drawBlendZone(xOffset + widths[i] - 150, i)
    }
  })
}
```

- [ ] **Step 4: Add `drawBlendZone()` method**

```typescript
private readonly BLEND_COLORS = [0x88cc66, 0x334455, 0xcc5522, 0x336633, 0x220044]

private drawBlendZone(seamX: number, fromWorldIdx: number): void {
  const gfx = this.add.graphics().setDepth(500)
  const fromColor = this.BLEND_COLORS[fromWorldIdx]
  const toColor = this.BLEND_COLORS[fromWorldIdx + 1]
  const steps = 30
  const stepWidth = 300 / steps

  for (let s = 0; s < steps; s++) {
    const t = s / steps
    // Lerp color channels
    const fr = (fromColor >> 16) & 0xff, fg = (fromColor >> 8) & 0xff, fb = fromColor & 0xff
    const tr = (toColor >> 16) & 0xff,   tg = (toColor >> 8) & 0xff,   tb = toColor & 0xff
    const r = Math.round(fr + (tr - fr) * t)
    const g = Math.round(fg + (tg - fg) * t)
    const b = Math.round(fb + (tb - fb) * t)
    const color = (r << 16) | (g << 8) | b
    gfx.fillStyle(color, 0.45)
    gfx.fillRect(seamX + s * stepWidth, 0, stepWidth + 1, 720)
  }
}
```

- [ ] **Step 5: Render all nodes in `create()` and fix avatar start position**

Replace the single-world node-drawing block with a loop over all worlds. Also update the avatar start-position lookup (currently at lines 112–122 of `create()`) to apply xOffset so the avatar spawns at the correct unified coordinate:

```typescript
// In create(), after buildUnifiedMap():
UNIFIED_MAP.worlds.forEach((mapData, i) => {
  const xOffset = UNIFIED_MAP.xOffsets[i]
  const worldNum = i + 1
  const levels = getLevelsForWorld(worldNum)
  const positions = mapData.nodePositions.map(p => ({ x: p.x + xOffset, y: p.y }))

  // Paths (completedIds only needed for path color styling, not for drawNodes)
  const completedIds = new Set<string>(
    levels.filter(l => !!this.profile.levelResults[l.id]).map(l => l.id)
  )
  const renderer = this.mapRenderers[i]
  const path = renderer.renderPaths(levels, completedIds)
  this.worldPaths.push(path)

  // Nodes
  this.drawNodes(levels, positions)
})

// Avatar start position — replace the existing startPos lookup block with:
let startPos = { x: UNIFIED_MAP.xOffsets[0] + (UNIFIED_MAP.worlds[0].nodePositions[0]?.x ?? 0),
                 y: UNIFIED_MAP.worlds[0].nodePositions[0]?.y ?? 0 }
this.currentNodeIndex = 0
if (this.profile.currentLevelNodeId) {
  for (let i = 0; i < UNIFIED_MAP.worlds.length; i++) {
    const xOffset = UNIFIED_MAP.xOffsets[i]
    const levels = getLevelsForWorld(i + 1)
    const idx = levels.findIndex(l => l.id === this.profile.currentLevelNodeId)
    if (idx !== -1 && UNIFIED_MAP.worlds[i].nodePositions[idx]) {
      startPos = {
        x: UNIFIED_MAP.worlds[i].nodePositions[idx].x + xOffset,
        y: UNIFIED_MAP.worlds[i].nodePositions[idx].y,
      }
      this.currentNodeIndex = idx
      break
    }
  }
}
```

- [ ] **Step 6: Remove `drawWorldArrows()` and `drawSpecialNodes()`; fix `specialNodes` reference in avatar block**

Delete both methods entirely. Remove their calls from `create()`.

Also find and remove the `else if (mapData.specialNodes[...])` fallback in the old avatar-position block — it was looking up special node positions by `currentLevelNodeId`. That block is fully replaced by the new loop in Step 5, so delete the old avatar-start lookup block in its entirety.

- [ ] **Step 7: Remove `currentWorld` from `init()`**

```typescript
init(data: { profileSlot: number }) {
  AudioHelper.playBGM(this, 'bgm_map')
  this.profileSlot = data.profileSlot
  const profile = loadProfile(this.profileSlot)
  if (!profile) {
    this.scene.start('ProfileSelect')
    return
  }
  this.profile = profile
}
```

- [ ] **Step 8: Set camera bounds**

At the start of `create()`, after the fade-in, add:

```typescript
this.cameras.main.setBounds(0, 0, UNIFIED_MAP.totalWidth, 720)
```

- [ ] **Step 9: Verify build**

```bash
npm run build 2>&1 | tail -30
```
Fix any remaining type errors. The scene won't be fully functional yet (camera snap and HUD missing), but it should compile.

- [ ] **Step 10: Commit**

```bash
git add src/scenes/OverlandMapScene.ts
git commit -m "feat(OverlandMapScene): render all 5 worlds side-by-side, remove world-switching"
```

---

### Task 8: Camera snap on load + click-drag + edge scroll

**Files:**
- Modify: `src/scenes/OverlandMapScene.ts`

- [ ] **Step 1: Add scene fields for panning state**

```typescript
private isPanning = false
private panStartX = 0
private panCamStartX = 0
private readonly EDGE_SCROLL_THRESHOLD = 60
private readonly EDGE_SCROLL_MAX_SPEED = 12
```

- [ ] **Step 2: Add camera snap in `create()` (after `setBounds`)**

```typescript
// Snap camera to center of player's current world
const currentWorld = this.profile.currentWorld ?? 1
const worldIdx = currentWorld - 1
const xOffset = UNIFIED_MAP.xOffsets[worldIdx]
const worldWidth = UNIFIED_MAP.widths[worldIdx]
const { width: vw } = this.scale
this.cameras.main.scrollX = xOffset + worldWidth / 2 - vw / 2
```

- [ ] **Step 3: Add click-drag input handlers in `create()`**

```typescript
// Click-drag panning
this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
  if (this.isGliding) return
  this.isPanning = false
  this.panStartX = ptr.x
  this.panCamStartX = this.cameras.main.scrollX
})

this.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
  if (!ptr.isDown || this.isGliding) return
  const dx = ptr.x - this.panStartX
  if (!this.isPanning && Math.abs(dx) > 5) {
    this.isPanning = true
  }
  if (this.isPanning) {
    // Clamp explicitly — direct assignment bypasses Phaser's built-in bounds clamping
    this.cameras.main.scrollX = Phaser.Math.Clamp(
      this.panCamStartX - dx,
      0,
      UNIFIED_MAP.totalWidth - this.scale.width,
    )
  }
})

this.input.on('pointerup', () => {
  this.isPanning = false
})
```

- [ ] **Step 4: Add edge scrolling in `update()`**

```typescript
update(time: number) {
  // ... existing avatar bob code ...

  // Edge scrolling (disabled while gliding or panning)
  if (!this.isGliding && !this.isPanning) {
    const ptr = this.input.activePointer
    const maxScrollX = UNIFIED_MAP.totalWidth - this.scale.width
    if (ptr.x < this.EDGE_SCROLL_THRESHOLD) {
      const t = 1 - ptr.x / this.EDGE_SCROLL_THRESHOLD
      this.cameras.main.scrollX = Phaser.Math.Clamp(
        this.cameras.main.scrollX - t * this.EDGE_SCROLL_MAX_SPEED,
        0, maxScrollX,
      )
    } else if (ptr.x > this.scale.width - this.EDGE_SCROLL_THRESHOLD) {
      const t = 1 - (this.scale.width - ptr.x) / this.EDGE_SCROLL_THRESHOLD
      this.cameras.main.scrollX = Phaser.Math.Clamp(
        this.cameras.main.scrollX + t * this.EDGE_SCROLL_MAX_SPEED,
        0, maxScrollX,
      )
    }
  }
}
```

- [ ] **Step 5: Suppress node click when drag occurred**

In `drawNodes()`, the `pointerdown` handler on each node sprite should only fire the click if `!this.isPanning`:

```typescript
nodeSprite.on('pointerdown', () => {
  if (!this.isPanning) this.enterLevel(level, pos)
})
```

- [ ] **Step 6: Manual smoke test**

Start dev server (`npm run dev`), load a save, verify:
- Map loads centered on the player's world
- Click-drag pans the map
- Mouse near left/right edge scrolls

- [ ] **Step 7: Commit**

```bash
git add src/scenes/OverlandMapScene.ts
git commit -m "feat(OverlandMapScene): camera snap on load, click-drag pan, edge scroll"
```

---

### Task 9: HUD buttons — `drawHudButton()` + Tavern/Stable/Shop/Character

**Files:**
- Modify: `src/scenes/OverlandMapScene.ts`

- [ ] **Step 1: Add `drawHudButton()` helper**

```typescript
private drawHudButton(
  cx: number,
  cy: number,
  icon: string,
  tooltip: string,
  onClick: () => void,
): void {
  const border = this.add.circle(cx, cy, 38, 0xd4af37).setDepth(1999).setScrollFactor(0)
  border.setStrokeStyle(4, 0xffffff)

  const bg = this.add.circle(cx, cy, 34, 0x1a1a2e).setDepth(2000).setScrollFactor(0)

  const iconText = this.add.text(cx, cy, icon, { fontSize: '36px' })
    .setOrigin(0.5).setDepth(2001).setScrollFactor(0)

  const zone = this.add.zone(cx, cy, 90, 90)
    .setInteractive({ useHandCursor: true })
    .setDepth(2002).setScrollFactor(0)

  let tooltipObj: Phaser.GameObjects.Text | undefined

  zone.on('pointerover', () => {
    bg.setFillStyle(0x2a2a4e)
    border.setStrokeStyle(4, 0xffd700)
    this.tweens.add({ targets: iconText, scaleX: 1.2, scaleY: 1.2, duration: 150 })
    tooltipObj = this.add.text(cx, cy - 55, tooltip, {
      fontSize: '12px', color: '#ffffff', backgroundColor: '#000000',
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setDepth(2010).setScrollFactor(0)
  })

  zone.on('pointerout', () => {
    bg.setFillStyle(0x1a1a2e)
    border.setStrokeStyle(4, 0xffffff)
    this.tweens.add({ targets: iconText, scaleX: 1, scaleY: 1, duration: 150 })
    tooltipObj?.destroy()
    tooltipObj = undefined
  })

  zone.on('pointerdown', () => {
    this.tweens.add({
      targets: [border, bg, iconText],
      scaleX: 0.9, scaleY: 0.9,
      duration: 50,
      yoyo: true,
      onComplete: onClick,
    })
  })
}
```

- [ ] **Step 2: Replace `drawCharacterButton()` with HUD calls in `create()`**

Delete the existing `drawCharacterButton()` method entirely. In `create()`, replace its call with calls to `drawHudButton()` for all four buttons:

```typescript
const { width: w, height: h } = this.scale
// Rightmost = Character, then Shop, Stable, Tavern going left
this.drawHudButton(w - 60,  h - 60, '👤', 'CHARACTER', () => {
  this.scene.pause()
  this.scene.launch('Character', { profileSlot: this.profileSlot })
})
this.drawHudButton(w - 150, h - 60, '🛒', 'SHOP', () => {
  this.scene.start('Shop', { profileSlot: this.profileSlot })
})
this.drawHudButton(w - 240, h - 60, '🐴', 'STABLE', () => {
  this.scene.start('Stable', { profileSlot: this.profileSlot })
})
this.drawHudButton(w - 330, h - 60, '🍺', 'TAVERN', () => {
  this.scene.start('Tavern', { profileSlot: this.profileSlot })
})
```

- [ ] **Step 3: Fix settings and profiles buttons — add `setScrollFactor(0)`**

In `drawSettingsButton()` and `drawProfilesButton()`, add `.setScrollFactor(0)` to the text objects so they stay fixed on screen.

- [ ] **Step 4: Fix player info and gold labels — add `setScrollFactor(0)`**

In `create()`, find the player name, level, and gold `add.text()` calls and add `.setScrollFactor(0)` to each.

- [ ] **Step 5: Verify dev server — all 4 buttons appear and work**

Run `npm run dev`. Check that all 4 circular buttons appear at the bottom-right. Click each to confirm navigation.

- [ ] **Step 6: Commit**

```bash
git add src/scenes/OverlandMapScene.ts
git commit -m "feat(OverlandMapScene): add drawHudButton helper, replace special nodes with HUD buttons"
```

---

### Task 10: Mastery chest HUD fix + dynamic world title

**Files:**
- Modify: `src/scenes/OverlandMapScene.ts`

- [ ] **Step 1: Fix `drawMasteryChest()` — replace `this.currentWorld`, fix restart call, add `setScrollFactor(0)`**

`drawMasteryChest()` currently references `this.currentWorld` which is being removed. Make these changes:

1. Replace `const world = this.currentWorld` with `const world = this.profile.currentWorld ?? 1`

2. Find the `scene.restart(...)` call inside the pointerdown handler and update it:
```typescript
// Change:
this.scene.restart({ profileSlot: this.profileSlot, world: this.currentWorld })
// To:
this.scene.restart({ profileSlot: this.profileSlot })
```

3. Add `.setScrollFactor(0)` to every `this.add.rectangle()` and `this.add.text()` call within `drawMasteryChest()`. The chest position `(width - 80, 120)` stays unchanged — it's already in screen-space.

- [ ] **Step 2: Add dynamic world title**

Replace the static world title `add.text()` in `create()` with a stored reference:

```typescript
// Replace static title with:
private worldTitleText!: Phaser.GameObjects.Text

// In create():
const currentWorldIdx = (this.profile.currentWorld ?? 1) - 1
this.worldTitleText = this.add.text(
  this.scale.width / 2, 40,
  this.worldNameForIndex(currentWorldIdx),
  { fontSize: '28px', color: '#ffd700' }
).setOrigin(0.5).setDepth(2000).setScrollFactor(0)
```

- [ ] **Step 3: Add `worldNameForIndex()` helper**

```typescript
private readonly WORLD_NAMES = [
  'World 1 — The Heartland',
  'World 2 — The Shadowed Fen',
  'World 3 — The Ember Peaks',
  'World 4 — The Shrouded Wilds',
  "World 5 — The Typemancer's Tower",
]

private worldNameForIndex(idx: number): string {
  return this.WORLD_NAMES[idx] ?? `World ${idx + 1}`
}
```

- [ ] **Step 4: Update world title in `update()`**

```typescript
// In update(), add:
const visibleWorldIdx = worldIndexAtScrollX(
  this.cameras.main.scrollX,
  UNIFIED_MAP.xOffsets,
  UNIFIED_MAP.totalWidth,
  this.scale.width,
)
const name = this.worldNameForIndex(visibleWorldIdx)
if (this.worldTitleText.text !== name) {
  this.worldTitleText.setText(name)
}
```

- [ ] **Step 5: Verify dev server — title updates when scrolling between worlds**

Scroll the map across world boundaries. Confirm the title text updates.

- [ ] **Step 6: Commit**

```bash
git add src/scenes/OverlandMapScene.ts
git commit -m "feat(OverlandMapScene): fix mastery chest HUD anchor, add dynamic world title"
```

---

### Task 11: Cross-world camera tween before avatar glide

**Files:**
- Modify: `src/scenes/OverlandMapScene.ts`

The avatar path-following currently uses `this.worldPath` (a single world's composite path). With the unified map, the avatar uses the path for its current world. Cross-world glides use a direct tween via `glideDirectTo`.

- [ ] **Step 1: Update `glideAvatarTo()` to pick the right world path**

In the existing `glideAvatarTo()` body, the line `const levels = getLevelsForWorld(this.currentWorld)` must be replaced — `this.currentWorld` no longer exists and `levels` is needed to find the target level index. Use `ALL_LEVELS` (already imported per Task 7 Step 1) to look up the target level's world:

```typescript
// Replace these two lines near the top of glideAvatarTo():
//   const levels = getLevelsForWorld(this.currentWorld)
//   const targetLevelIdx = levels.findIndex(l => l.id === nodeId)
//   const canUsePath = this.worldPath && targetLevelIdx !== -1
// With:
const destLevel = ALL_LEVELS.find(l => l.id === nodeId)
const targetWorld = destLevel?.world ?? 1
const targetWorldPath = this.worldPaths[targetWorld - 1]
const worldLevels = getLevelsForWorld(targetWorld)
const targetLevelIdx = worldLevels.findIndex(l => l.id === nodeId)
const canUsePath = !!targetWorldPath && targetLevelIdx !== -1
```

Update later references from `this.worldPath` → `targetWorldPath`.

- [ ] **Step 2: Add off-screen destination detection in `enterLevel()`**

Before gliding, check if the destination node is within the current viewport. If not, tween the camera first:

```typescript
private enterLevel(level: LevelConfig, pos: { x: number; y: number }) {
  const cam = this.cameras.main
  const vw = this.scale.width
  const isOffScreen = pos.x < cam.scrollX || pos.x > cam.scrollX + vw

  if (isOffScreen) {
    // Tween camera to center on destination, then glide
    const targetScrollX = Phaser.Math.Clamp(
      pos.x - vw / 2,
      0,
      UNIFIED_MAP.totalWidth - vw,
    )
    this.tweens.add({
      targets: cam,
      scrollX: targetScrollX,
      duration: 600,
      ease: 'Sine.easeInOut',
      onComplete: () => this.glideAvatarTo(pos, level.id, () => {
        this.scene.start('LevelIntro', { level, profileSlot: this.profileSlot })
      }),
    })
  } else {
    this.glideAvatarTo(pos, level.id, () => {
      this.scene.start('LevelIntro', { level, profileSlot: this.profileSlot })
    })
  }
}
```

- [ ] **Step 3: Update `profile.currentWorld` when entering a level**

In `glideAvatarTo()`'s `finishGlide` callback, save the world of the destination level:

```typescript
const destLevel = ALL_LEVELS.find(l => l.id === nodeId)
if (destLevel) {
  this.profile.currentWorld = destLevel.world
}
// No extra saveProfile() needed — the existing call just below this will save it
```

- [ ] **Step 4: Verify cross-world navigation works**

In dev server: use browser console to give the player a completed W1 boss (`localStorage` edit or via profile), then verify clicking a W2 node causes the camera to pan there first before the avatar walks.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/OverlandMapScene.ts src/data/maps/unified.ts
git commit -m "feat(OverlandMapScene): cross-world camera tween before avatar glide"
```

---

### Task 12: Final cleanup and smoke test

- [ ] **Step 1: Run full test suite**

```bash
npm run test
```
Expected: all existing tests pass. The new `unified.test.ts` tests pass.

- [ ] **Step 2: Run type-check**

```bash
npm run build
```
Expected: clean build.

- [ ] **Step 3: Full play-through smoke test**

Start `npm run dev`. For a fresh save slot:
- World 1 map loads, camera centered on W1
- All W1 nodes visible, click-drag pans, edge scroll works
- World title changes as you scroll past W2 boundary
- Tavern/Stable/Shop/Character buttons all navigate correctly
- Click a level node — avatar glides, LevelIntro launches
- Complete a level — LevelResult shows, returning to map keeps camera position

- [ ] **Step 4: Final commit**

```bash
git add src/ docs/
git commit -m "feat: unified scrollable overland map spanning all 5 worlds"
```
