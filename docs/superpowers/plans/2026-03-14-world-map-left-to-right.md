# World Map Left-to-Right Layout Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign node positions for worlds 2–5 so the overland map path progresses left-to-right from level 1 through the boss, with no crossing paths.

**Architecture:** Update `nodePositions`, `pathSegments`, and the `buildGround()` path tile section in each world's map data file. Also update cross-world transition bezier points in `unified.ts`. No gameplay logic changes.

**Tech Stack:** TypeScript, Phaser 3, Vitest

---

## Chunk 1: Regression tests + World 2

### Task 1: Add layout constraint tests

**Files:**
- Modify: `src/data/maps/unified.test.ts`

- [ ] **Step 1a: Add imports to the TOP of `src/data/maps/unified.test.ts`**

Insert these four lines immediately after the existing imports (after line 9, `} from './unified'`):

```typescript
import { WORLD2_MAP } from './world2'
import { WORLD3_MAP } from './world3'
import { WORLD4_MAP } from './world4'
import { WORLD5_MAP } from './world5'
import type { WorldMapData } from './types'
```

- [ ] **Step 1b: Append the describe block to the BOTTOM of `src/data/maps/unified.test.ts`**

Add this after the last closing `})` in the file:

```typescript
describe('world map nodePositions layout constraints', () => {
  const worlds: [string, WorldMapData, number][] = [
    ['world2', WORLD2_MAP, 2650],
    ['world3', WORLD3_MAP, 2500],
    ['world4', WORLD4_MAP, 2500],
    ['world5', WORLD5_MAP, 2350],
  ]

  worlds.forEach(([name, map, maxWidth]) => {
    describe(name, () => {
      it('x values strictly increase (left-to-right, no crossings)', () => {
        for (let i = 1; i < map.nodePositions.length; i++) {
          expect(map.nodePositions[i].x).toBeGreaterThan(map.nodePositions[i - 1].x)
        }
      })

      it('y values stay within canvas bounds [30, 680]', () => {
        for (const pos of map.nodePositions) {
          expect(pos.y).toBeGreaterThanOrEqual(30)
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/data/maps/unified.test.ts
```

Expected: The new x-ordering and y-bounds tests FAIL for worlds 2–5 (wrong layouts). The `pathSegments count` test may already pass for some worlds — this is expected, it just means the node count hasn't changed. Existing utility tests pass.

---

### Task 2: Update World 2 layout

**Files:**
- Modify: `src/data/maps/world2.ts`

World 2 has 15 nodes (l1, l2, l3, mb1, l4, l5, l6, mb2, l7, l8, mb3, l9, l10, mb4, boss).
Grid: COLS=83, ROWS=23, tile=32px.

Tile column/row for each node (col=round(x/32), row=round(y/32)):
```
l1(150,560)   col=5,  row=18
l2(350,450)   col=11, row=14
l3(540,330)   col=17, row=10
mb1(730,220)  col=23, row=7
l4(870,370)   col=27, row=12
l5(1000,490)  col=31, row=15
l6(1200,360)  col=38, row=11
mb2(1390,230) col=43, row=7
l7(1520,390)  col=48, row=12
l8(1680,510)  col=53, row=16
mb3(1860,360) col=58, row=11
l9(2020,230)  col=63, row=7
l10(2200,360) col=69, row=11
mb4(2370,220) col=74, row=7
boss(2520,80) col=79, row=3
```

- [ ] **Step 3: Replace the path section in `buildGround()` and remove the special-node path**

Find the comment `// ── Path snakes from bottom-right to top-left ──────────` through the line `vPath(g, 42, 18, 20, PATH_V)` and the `hPath(g, 20, 35, 50, PATH_H)` line that follows it (special-node path). Replace the entire block with:

```typescript
  // ── Path snakes left-to-right ─────────────────────────────
  // l1(5,18) → l2(11,14)
  hPath(g, 18, 5, 11, PATH_H); g[18][11] = PATH_CORNER; vPath(g, 11, 14, 18, PATH_V)
  // l2(11,14) → l3(17,10)
  hPath(g, 14, 11, 17, PATH_H); g[14][17] = PATH_CORNER; vPath(g, 17, 10, 14, PATH_V)
  // l3(17,10) → mb1(23,7)
  hPath(g, 10, 17, 23, PATH_H); g[10][23] = PATH_CORNER; vPath(g, 23, 7, 10, PATH_V)
  // mb1(23,7) → l4(27,12)
  hPath(g, 7, 23, 27, PATH_H); g[7][27] = PATH_CORNER; vPath(g, 27, 7, 12, PATH_V)
  // l4(27,12) → l5(31,15)
  hPath(g, 12, 27, 31, PATH_H); g[12][31] = PATH_CORNER; vPath(g, 31, 12, 15, PATH_V)
  // l5(31,15) → l6(38,11)
  hPath(g, 15, 31, 38, PATH_H); g[15][38] = PATH_CORNER; vPath(g, 38, 11, 15, PATH_V)
  // l6(38,11) → mb2(43,7)
  hPath(g, 11, 38, 43, PATH_H); g[11][43] = PATH_CORNER; vPath(g, 43, 7, 11, PATH_V)
  // mb2(43,7) → l7(48,12)
  hPath(g, 7, 43, 48, PATH_H); g[7][48] = PATH_CORNER; vPath(g, 48, 7, 12, PATH_V)
  // l7(48,12) → l8(53,16)
  hPath(g, 12, 48, 53, PATH_H); g[12][53] = PATH_CORNER; vPath(g, 53, 12, 16, PATH_V)
  // l8(53,16) → mb3(58,11)
  hPath(g, 16, 53, 58, PATH_H); g[16][58] = PATH_CORNER; vPath(g, 58, 11, 16, PATH_V)
  // mb3(58,11) → l9(63,7)
  hPath(g, 11, 58, 63, PATH_H); g[11][63] = PATH_CORNER; vPath(g, 63, 7, 11, PATH_V)
  // l9(63,7) → l10(69,11)
  hPath(g, 7, 63, 69, PATH_H); g[7][69] = PATH_CORNER; vPath(g, 69, 7, 11, PATH_V)
  // l10(69,11) → mb4(74,7)
  hPath(g, 11, 69, 74, PATH_H); g[11][74] = PATH_CORNER; vPath(g, 74, 7, 11, PATH_V)
  // mb4(74,7) → boss(79,3)
  hPath(g, 7, 74, 79, PATH_H); g[7][79] = PATH_CORNER; vPath(g, 79, 3, 7, PATH_V)
```

- [ ] **Step 4: Replace `nodePositions` array**

Find the `nodePositions:` array in `WORLD2_MAP` and replace it entirely:

```typescript
  // Path snakes left-to-right
  nodePositions: [
    { x: 150,  y: 560 }, // l1 — fen entrance (left)
    { x: 350,  y: 450 }, // l2
    { x: 540,  y: 330 }, // l3
    { x: 730,  y: 220 }, // mb1
    { x: 870,  y: 370 }, // l4
    { x: 1000, y: 490 }, // l5
    { x: 1200, y: 360 }, // l6
    { x: 1390, y: 230 }, // mb2
    { x: 1520, y: 390 }, // l7
    { x: 1680, y: 510 }, // l8
    { x: 1860, y: 360 }, // mb3
    { x: 2020, y: 230 }, // l9
    { x: 2200, y: 360 }, // l10
    { x: 2370, y: 220 }, // mb4
    { x: 2520, y: 80  }, // boss (right)
  ],
```

- [ ] **Step 5: Replace `pathSegments` array**

Find `function buildPathSegments(): PathSegment[]` in world2.ts and replace the return array:

```typescript
// cy offsets bow outward: -40 when going up (destination y < source y), +40 when going down
function buildPathSegments(): PathSegment[] {
  return [
    { cx: 250,  cy: 465 }, // l1 → l2   (going up)
    { cx: 445,  cy: 350 }, // l2 → l3   (going up)
    { cx: 635,  cy: 235 }, // l3 → mb1  (going up)
    { cx: 800,  cy: 335 }, // mb1 → l4  (going down)
    { cx: 935,  cy: 470 }, // l4 → l5   (going down)
    { cx: 1100, cy: 385 }, // l5 → l6   (going up)
    { cx: 1295, cy: 255 }, // l6 → mb2  (going up)
    { cx: 1455, cy: 350 }, // mb2 → l7  (going down)
    { cx: 1600, cy: 490 }, // l7 → l8   (going down)
    { cx: 1770, cy: 395 }, // l8 → mb3  (going up)
    { cx: 1940, cy: 255 }, // mb3 → l9  (going up)
    { cx: 2110, cy: 335 }, // l9 → l10  (going down)
    { cx: 2285, cy: 250 }, // l10 → mb4 (going up)
    { cx: 2445, cy: 110 }, // mb4 → boss (going up)
  ]
}
```

- [ ] **Step 6: Run the tests**

```bash
npx vitest run src/data/maps/unified.test.ts
```

Expected: All world2 layout tests PASS. Worlds 3–5 still fail.

- [ ] **Step 7: Commit**

```bash
git add src/data/maps/world2.ts src/data/maps/unified.test.ts
git commit -m "feat(world2): redesign map layout left-to-right"
```

---

## Chunk 2: Worlds 3 and 4

### Task 3: Update World 3 layout

**Files:**
- Modify: `src/data/maps/world3.ts`

World 3 has 14 nodes (l1, l2, l3, mb1, l4, l5, mb2, l6, l7, mb3, l8, l9, mb4, boss).
Grid: COLS=79, ROWS=23, tile=32px.

Tile column/row for each node:
```
l1(140,600)   col=4,  row=19
l2(320,490)   col=10, row=15
l3(510,370)   col=16, row=12
mb1(710,250)  col=22, row=8
l4(880,400)   col=28, row=13
l5(1060,530)  col=33, row=17
mb2(1260,360) col=39, row=11
l6(1420,500)  col=44, row=16
l7(1600,340)  col=50, row=11
mb3(1780,200) col=56, row=6
l8(1940,320)  col=61, row=10
l9(2100,190)  col=66, row=6
mb4(2270,100) col=71, row=3
boss(2430,40) col=76, row=1
```

- [ ] **Step 1: Replace the path section in `buildGround()`**

Find the comment `// ── Path spirals upward from bottom-center ─────────────` through (but NOT including) the `// ── Lava flows` comment. Replace the entire block with:

```typescript
  // ── Path snakes left-to-right ─────────────────────────────
  // l1(4,19) → l2(10,15)
  hPath(g, 19, 4, 10, PATH_H); g[19][10] = PATH_CORNER; vPath(g, 10, 15, 19, PATH_V)
  // l2(10,15) → l3(16,12)
  hPath(g, 15, 10, 16, PATH_H); g[15][16] = PATH_CORNER; vPath(g, 16, 12, 15, PATH_V)
  // l3(16,12) → mb1(22,8)
  hPath(g, 12, 16, 22, PATH_H); g[12][22] = PATH_CORNER; vPath(g, 22, 8, 12, PATH_V)
  // mb1(22,8) → l4(28,13)
  hPath(g, 8, 22, 28, PATH_H); g[8][28] = PATH_CORNER; vPath(g, 28, 8, 13, PATH_V)
  // l4(28,13) → l5(33,17)
  hPath(g, 13, 28, 33, PATH_H); g[13][33] = PATH_CORNER; vPath(g, 33, 13, 17, PATH_V)
  // l5(33,17) → mb2(39,11)
  hPath(g, 17, 33, 39, PATH_H); g[17][39] = PATH_CORNER; vPath(g, 39, 11, 17, PATH_V)
  // mb2(39,11) → l6(44,16)
  hPath(g, 11, 39, 44, PATH_H); g[11][44] = PATH_CORNER; vPath(g, 44, 11, 16, PATH_V)
  // l6(44,16) → l7(50,11)
  hPath(g, 16, 44, 50, PATH_H); g[16][50] = PATH_CORNER; vPath(g, 50, 11, 16, PATH_V)
  // l7(50,11) → mb3(56,6)
  hPath(g, 11, 50, 56, PATH_H); g[11][56] = PATH_CORNER; vPath(g, 56, 6, 11, PATH_V)
  // mb3(56,6) → l8(61,10)
  hPath(g, 6, 56, 61, PATH_H); g[6][61] = PATH_CORNER; vPath(g, 61, 6, 10, PATH_V)
  // l8(61,10) → l9(66,6)
  hPath(g, 10, 61, 66, PATH_H); g[10][66] = PATH_CORNER; vPath(g, 66, 6, 10, PATH_V)
  // l9(66,6) → mb4(71,3)
  hPath(g, 6, 66, 71, PATH_H); g[6][71] = PATH_CORNER; vPath(g, 71, 3, 6, PATH_V)
  // mb4(71,3) → boss(76,1)
  hPath(g, 3, 71, 76, PATH_H); g[3][76] = PATH_CORNER; vPath(g, 76, 1, 3, PATH_V)
```

Also remove the special-node path lines near the end of `buildGround()`:
```typescript
  // Path down to special nodes
  vPath(g, 40, 19, 21, PATH_V)
  hPath(g, 21, 32, 47, PATH_H)
```

- [ ] **Step 2: Replace `nodePositions` array**

```typescript
  // Path snakes left-to-right (volcanic peaks)
  nodePositions: [
    { x: 140,  y: 600 }, // l1 — volcanic foothills (left)
    { x: 320,  y: 490 }, // l2
    { x: 510,  y: 370 }, // l3
    { x: 710,  y: 250 }, // mb1
    { x: 880,  y: 400 }, // l4
    { x: 1060, y: 530 }, // l5
    { x: 1260, y: 360 }, // mb2
    { x: 1420, y: 500 }, // l6
    { x: 1600, y: 340 }, // l7
    { x: 1780, y: 200 }, // mb3
    { x: 1940, y: 320 }, // l8
    { x: 2100, y: 190 }, // l9
    { x: 2270, y: 100 }, // mb4
    { x: 2430, y: 40  }, // boss — volcanic summit (right)
  ],
```

- [ ] **Step 3: Replace `pathSegments`**

```typescript
// cy offsets bow outward: -40 when going up, +40 when going down
function buildPathSegments(): PathSegment[] {
  return [
    { cx: 230,  cy: 505 }, // l1 → l2   (going up)
    { cx: 415,  cy: 390 }, // l2 → l3   (going up)
    { cx: 610,  cy: 270 }, // l3 → mb1  (going up)
    { cx: 795,  cy: 365 }, // mb1 → l4  (going down)
    { cx: 970,  cy: 505 }, // l4 → l5   (going down)
    { cx: 1160, cy: 405 }, // l5 → mb2  (going up)
    { cx: 1340, cy: 470 }, // mb2 → l6  (going down)
    { cx: 1510, cy: 380 }, // l6 → l7   (going up)
    { cx: 1690, cy: 230 }, // l7 → mb3  (going up)
    { cx: 1860, cy: 300 }, // mb3 → l8  (going down)
    { cx: 2020, cy: 215 }, // l8 → l9   (going up)
    { cx: 2185, cy: 105 }, // l9 → mb4  (going up)
    { cx: 2350, cy: 30  }, // mb4 → boss (going up)
  ]
}
```

- [ ] **Step 4: Run the tests**

```bash
npx vitest run src/data/maps/unified.test.ts
```

Expected: World 2 and World 3 layout tests pass. Worlds 4–5 still fail.

- [ ] **Step 5: Commit**

```bash
git add src/data/maps/world3.ts
git commit -m "feat(world3): redesign map layout left-to-right"
```

---

### Task 4: Update World 4 layout

**Files:**
- Modify: `src/data/maps/world4.ts`

World 4 has 14 nodes (l1, l2, l3, mb1, l4, l5, mb2, l6, l7, mb3, l8, l9, mb4, boss).
Grid: COLS=79, ROWS=23, tile=32px.

Tile column/row for each node:
```
l1(140,450)   col=4,  row=14
l2(330,320)   col=10, row=10
l3(520,460)   col=16, row=14
mb1(700,300)  col=22, row=9
l4(880,450)   col=28, row=14
l5(1070,300)  col=33, row=9
mb2(1260,460) col=39, row=14
l6(1430,290)  col=45, row=9
l7(1610,440)  col=50, row=14
mb3(1790,270) col=56, row=8
l8(1960,410)  col=61, row=13
l9(2130,260)  col=67, row=8
mb4(2300,150) col=72, row=5
boss(2460,80) col=77, row=3
```

- [ ] **Step 1: Replace the path section in `buildGround()`**

Find the comment `// ── Path weaves horizontally through middle ────────────` through (but NOT including) `// Deep moss pools`. Replace with:

```typescript
  // ── Path snakes left-to-right ─────────────────────────────
  // l1(4,14) → l2(10,10)
  hPath(g, 14, 4, 10, PATH_H); g[14][10] = PATH_CORNER; vPath(g, 10, 10, 14, PATH_V)
  // l2(10,10) → l3(16,14)
  hPath(g, 10, 10, 16, PATH_H); g[10][16] = PATH_CORNER; vPath(g, 16, 10, 14, PATH_V)
  // l3(16,14) → mb1(22,9)
  hPath(g, 14, 16, 22, PATH_H); g[14][22] = PATH_CORNER; vPath(g, 22, 9, 14, PATH_V)
  // mb1(22,9) → l4(28,14)
  hPath(g, 9, 22, 28, PATH_H); g[9][28] = PATH_CORNER; vPath(g, 28, 9, 14, PATH_V)
  // l4(28,14) → l5(33,9)
  hPath(g, 14, 28, 33, PATH_H); g[14][33] = PATH_CORNER; vPath(g, 33, 9, 14, PATH_V)
  // l5(33,9) → mb2(39,14)
  hPath(g, 9, 33, 39, PATH_H); g[9][39] = PATH_CORNER; vPath(g, 39, 9, 14, PATH_V)
  // mb2(39,14) → l6(45,9)
  hPath(g, 14, 39, 45, PATH_H); g[14][45] = PATH_CORNER; vPath(g, 45, 9, 14, PATH_V)
  // l6(45,9) → l7(50,14)
  hPath(g, 9, 45, 50, PATH_H); g[9][50] = PATH_CORNER; vPath(g, 50, 9, 14, PATH_V)
  // l7(50,14) → mb3(56,8)
  hPath(g, 14, 50, 56, PATH_H); g[14][56] = PATH_CORNER; vPath(g, 56, 8, 14, PATH_V)
  // mb3(56,8) → l8(61,13)
  hPath(g, 8, 56, 61, PATH_H); g[8][61] = PATH_CORNER; vPath(g, 61, 8, 13, PATH_V)
  // l8(61,13) → l9(67,8)
  hPath(g, 13, 61, 67, PATH_H); g[13][67] = PATH_CORNER; vPath(g, 67, 8, 13, PATH_V)
  // l9(67,8) → mb4(72,5)
  hPath(g, 8, 67, 72, PATH_H); g[8][72] = PATH_CORNER; vPath(g, 72, 5, 8, PATH_V)
  // mb4(72,5) → boss(77,3)
  hPath(g, 5, 72, 77, PATH_H); g[5][77] = PATH_CORNER; vPath(g, 77, 3, 5, PATH_V)
```

Also remove the special-node path lines:
```typescript
  // Path to special nodes
  vPath(g, 40, 14, 20, PATH_V)
  hPath(g, 20, 32, 47, PATH_H)
```

- [ ] **Step 2: Replace `nodePositions` array**

```typescript
  // Path snakes left-to-right (forest winding)
  nodePositions: [
    { x: 140,  y: 450 }, // l1 — forest entrance (left)
    { x: 330,  y: 320 }, // l2
    { x: 520,  y: 460 }, // l3
    { x: 700,  y: 300 }, // mb1
    { x: 880,  y: 450 }, // l4
    { x: 1070, y: 300 }, // l5
    { x: 1260, y: 460 }, // mb2
    { x: 1430, y: 290 }, // l6
    { x: 1610, y: 440 }, // l7
    { x: 1790, y: 270 }, // mb3
    { x: 1960, y: 410 }, // l8
    { x: 2130, y: 260 }, // l9
    { x: 2300, y: 150 }, // mb4
    { x: 2460, y: 80  }, // boss (right)
  ],
```

- [ ] **Step 3: Replace `pathSegments`**

```typescript
// cy offsets bow outward: -40 when going up, +40 when going down
function buildPathSegments(): PathSegment[] {
  return [
    { cx: 235,  cy: 345 }, // l1 → l2   (going up)
    { cx: 425,  cy: 430 }, // l2 → l3   (going down)
    { cx: 610,  cy: 340 }, // l3 → mb1  (going up)
    { cx: 790,  cy: 415 }, // mb1 → l4  (going down)
    { cx: 975,  cy: 335 }, // l4 → l5   (going up)
    { cx: 1165, cy: 420 }, // l5 → mb2  (going down)
    { cx: 1345, cy: 335 }, // mb2 → l6  (going up)
    { cx: 1520, cy: 405 }, // l6 → l7   (going down)
    { cx: 1700, cy: 315 }, // l7 → mb3  (going up)
    { cx: 1875, cy: 380 }, // mb3 → l8  (going down)
    { cx: 2045, cy: 295 }, // l8 → l9   (going up)
    { cx: 2215, cy: 165 }, // l9 → mb4  (going up)
    { cx: 2380, cy: 75  }, // mb4 → boss (going up)
  ]
}
```

- [ ] **Step 4: Run the tests**

```bash
npx vitest run src/data/maps/unified.test.ts
```

Expected: Worlds 2, 3, 4 layout tests pass. World 5 still fails.

- [ ] **Step 5: Commit**

```bash
git add src/data/maps/world4.ts
git commit -m "feat(world4): redesign map layout left-to-right"
```

---

## Chunk 3: World 5 + unified transitions

### Task 5: Update World 5 layout

**Files:**
- Modify: `src/data/maps/world5.ts`

World 5 has 13 nodes (l1, l2, l3, mb1, l4, l5, mb2, l6, l7, mb3, l8, mb4, boss).
Grid: COLS=74, ROWS=23, tile=32px.

Note: The void zone (`VOID_1`) fills cols 0–5 and 68–73 for cosmetic atmosphere. Path tiles placed in these columns will overwrite void tiles (this is intentional — the boss ascent passes through the void zone).

Tile column/row for each node:
```
l1(130,620)   col=4,  row=19
l2(330,500)   col=10, row=16
l3(530,390)   col=17, row=12
mb1(720,270)  col=23, row=8
l4(900,400)   col=28, row=13
l5(1090,270)  col=34, row=8
mb2(1270,150) col=40, row=5
l6(1440,280)  col=45, row=9
l7(1620,160)  col=51, row=5
mb3(1800,80)  col=56, row=3
l8(1970,190)  col=62, row=6
mb4(2140,80)  col=67, row=3
boss(2300,30) col=72, row=1
```

- [ ] **Step 1: Replace the path section in `buildGround()`**

Find the comment `// ── Path ascends steeply from bottom to top (tower climb) ──` through (but NOT including) `// ── Void / starfield areas`). Replace with:

```typescript
  // ── Path ascends left-to-right (tower staircase) ───────────
  // l1(4,19) → l2(10,16)
  hPath(g, 19, 4, 10, PATH_H); g[19][10] = PATH_CORNER; vPath(g, 10, 16, 19, PATH_V)
  // l2(10,16) → l3(17,12)
  hPath(g, 16, 10, 17, PATH_H); g[16][17] = PATH_CORNER; vPath(g, 17, 12, 16, PATH_V)
  // l3(17,12) → mb1(23,8)
  hPath(g, 12, 17, 23, PATH_H); g[12][23] = PATH_CORNER; vPath(g, 23, 8, 12, PATH_V)
  // mb1(23,8) → l4(28,13)
  hPath(g, 8, 23, 28, PATH_H); g[8][28] = PATH_CORNER; vPath(g, 28, 8, 13, PATH_V)
  // l4(28,13) → l5(34,8)
  hPath(g, 13, 28, 34, PATH_H); g[13][34] = PATH_CORNER; vPath(g, 34, 8, 13, PATH_V)
  // l5(34,8) → mb2(40,5)
  hPath(g, 8, 34, 40, PATH_H); g[8][40] = PATH_CORNER; vPath(g, 40, 5, 8, PATH_V)
  // mb2(40,5) → l6(45,9)
  hPath(g, 5, 40, 45, PATH_H); g[5][45] = PATH_CORNER; vPath(g, 45, 5, 9, PATH_V)
  // l6(45,9) → l7(51,5)
  hPath(g, 9, 45, 51, PATH_H); g[9][51] = PATH_CORNER; vPath(g, 51, 5, 9, PATH_V)
  // l7(51,5) → mb3(56,3)
  hPath(g, 5, 51, 56, PATH_H); g[5][56] = PATH_CORNER; vPath(g, 56, 3, 5, PATH_V)
  // mb3(56,3) → l8(62,6)
  hPath(g, 3, 56, 62, PATH_H); g[3][62] = PATH_CORNER; vPath(g, 62, 3, 6, PATH_V)
  // l8(62,6) → mb4(67,3)
  hPath(g, 6, 62, 67, PATH_H); g[6][67] = PATH_CORNER; vPath(g, 67, 3, 6, PATH_V)
  // mb4(67,3) → boss(72,1)
  hPath(g, 3, 67, 72, PATH_H); g[3][72] = PATH_CORNER; vPath(g, 72, 1, 3, PATH_V)
```

Also remove the special-node path lines:
```typescript
  // Path to special nodes
  vPath(g, 26, 20, 22, PATH_V)
  hPath(g, 22, 22, 33, PATH_H)
```

- [ ] **Step 2: Replace `nodePositions` array**

```typescript
  // Path ascends left-to-right — tower staircase
  nodePositions: [
    { x: 130,  y: 620 }, // l1 — tower base (left)
    { x: 330,  y: 500 }, // l2
    { x: 530,  y: 390 }, // l3
    { x: 720,  y: 270 }, // mb1
    { x: 900,  y: 400 }, // l4
    { x: 1090, y: 270 }, // l5
    { x: 1270, y: 150 }, // mb2
    { x: 1440, y: 280 }, // l6
    { x: 1620, y: 160 }, // l7
    { x: 1800, y: 80  }, // mb3
    { x: 1970, y: 190 }, // l8
    { x: 2140, y: 80  }, // mb4
    { x: 2300, y: 30  }, // boss — Typemancer's throne (right)
  ],
```

- [ ] **Step 3: Replace `pathSegments`**

```typescript
// cy offsets bow outward: -40 when going up, +40 when going down
function buildPathSegments(): PathSegment[] {
  return [
    { cx: 230,  cy: 520 }, // l1 → l2   (going up)
    { cx: 430,  cy: 405 }, // l2 → l3   (going up)
    { cx: 625,  cy: 290 }, // l3 → mb1  (going up)
    { cx: 810,  cy: 375 }, // mb1 → l4  (going down)
    { cx: 995,  cy: 295 }, // l4 → l5   (going up)
    { cx: 1180, cy: 170 }, // l5 → mb2  (going up)
    { cx: 1355, cy: 255 }, // mb2 → l6  (going down)
    { cx: 1530, cy: 180 }, // l6 → l7   (going up)
    { cx: 1710, cy: 80  }, // l7 → mb3  (going up)
    { cx: 1885, cy: 175 }, // mb3 → l8  (going down)
    { cx: 2055, cy: 95  }, // l8 → mb4  (going up)
    { cx: 2220, cy: 15  }, // mb4 → boss (going up)
  ]
}
```

- [ ] **Step 4: Run the tests**

```bash
npx vitest run src/data/maps/unified.test.ts
```

Expected: ALL world layout tests pass.

- [ ] **Step 5: Run the full test suite**

```bash
npm run test
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/data/maps/world5.ts
git commit -m "feat(world5): redesign map layout left-to-right"
```

---

### Task 6: Update cross-world transition bezier points

**Files:**
- Modify: `src/data/maps/unified.ts`

The `worldTransitions` array connects each world's boss node to the next world's l1 node. After the layout changes, the source/destination coordinates have moved.

World x-offsets (unchanged): W1=0, W2=2200, W3=4850, W4=7350, W5=9850

New unified coordinates:
- W1 boss: (1994, 190) — unchanged
- W2 l1:   (150+2200, 560)  = (2350, 560)
- W2 boss: (2520+2200, 80)  = (4720, 80)
- W3 l1:   (140+4850, 600)  = (4990, 600)
- W3 boss: (2430+4850, 40)  = (7280, 40)
- W4 l1:   (140+7350, 450)  = (7490, 450)
- W4 boss: (2460+7350, 80)  = (9810, 80)
- W5 l1:   (130+9850, 620)  = (9980, 620)

Midpoint control points:
- W1→W2: (1994+2350)/2=2172, (190+560)/2=375
- W2→W3: (4720+4990)/2=4855, (80+600)/2=340
- W3→W4: (7280+7490)/2=7385, (40+450)/2=245
- W4→W5: (9810+9980)/2=9895, (80+620)/2=350

- [ ] **Step 1: Replace the `worldTransitions` array in `UNIFIED_MAP`**

Find the `worldTransitions:` array in `UNIFIED_MAP` and replace it:

```typescript
  worldTransitions: [
    // W1→W2: W1 boss (1994,190) → W2 l1 unified (2350,560)
    { cx: 2172, cy: 375 },
    // W2→W3: W2 boss unified (4720,80) → W3 l1 unified (4990,600)
    { cx: 4855, cy: 340 },
    // W3→W4: W3 boss unified (7280,40) → W4 l1 unified (7490,450)
    { cx: 7385, cy: 245 },
    // W4→W5: W4 boss unified (9810,80) → W5 l1 unified (9980,620)
    { cx: 9895, cy: 350 },
  ],
```

- [ ] **Step 2: Run the full test suite**

```bash
npm run test
```

Expected: All tests pass (the `unified.ts` change is data-only, no logic changes).

- [ ] **Step 3: Build to verify no TypeScript errors**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/data/maps/unified.ts
git commit -m "feat(unified): update cross-world transition bezier points for new layouts"
```

---

## Final verification

- [ ] Start the dev server and visually confirm each world's map:

```bash
npm run dev
```

Walk through: overland map → scroll right through worlds 2–5 → verify each world's path goes left-to-right from l1 to boss.
