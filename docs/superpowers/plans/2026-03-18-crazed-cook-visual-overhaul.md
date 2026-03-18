# Crazed Cook Visual Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redraw orcs with axes and an attack animation, redesign the kitchen background with 10 named stations, and replace cook bobbing with waypoint movement between those stations.

**Architecture:** A new `src/data/cookStations.ts` file holds station coordinates shared by the art generator and the scene. `crazedCookArt.ts` gets a full rewrite of both the orc texture and the kitchen background. `CrazedCookLevel.ts` gains an attack tween on patience drain and a waypoint movement loop for each cook sprite.

**Tech Stack:** Phaser 3, TypeScript, Vitest

**Spec:** `docs/superpowers/specs/2026-03-18-crazed-cook-visual-overhaul-design.md`

---

## Chunk 1: Station data + movement helper

### Task 1: Create cook station data file

**Files:**
- Create: `src/data/cookStations.ts`

- [ ] **Step 1: Create `src/data/cookStations.ts`**

```typescript
// src/data/cookStations.ts

export interface CookStation {
  name: string
  x: number    // center X of the station art in the background
  workX: number // X where a cook stands when "at" this station
  workY: number // Y where a cook stands when "at" this station
}

// Back counter stations (y≈210 work position, in front of the counter)
// Middle island stations (y≈295 work position, south face of island)
// Floor/wall stations (y≈330 work position)
export const COOK_STATIONS: CookStation[] = [
  { name: 'stove_left',    x: 80,   workX: 80,   workY: 210 },
  { name: 'sink',          x: 240,  workX: 240,  workY: 210 },
  { name: 'spice_rack',    x: 420,  workX: 420,  workY: 210 },
  { name: 'herb_bundles',  x: 580,  workX: 580,  workY: 210 },
  { name: 'fridge',        x: 760,  workX: 760,  workY: 210 },
  { name: 'stove_right',   x: 920,  workX: 920,  workY: 210 },
  { name: 'cauldron',      x: 300,  workX: 300,  workY: 295 },
  { name: 'cutting_board', x: 560,  workX: 560,  workY: 295 },
  { name: 'mortar_pestle', x: 820,  workX: 820,  workY: 295 },
  { name: 'barrel_rack',   x: 160,  workX: 160,  workY: 330 },
  { name: 'oven',          x: 1100, workX: 1100, workY: 330 },
]
```

- [ ] **Step 2: Commit**

```bash
git add src/data/cookStations.ts
git commit -m "feat: add cook station data"
```

---

### Task 2: Create cook movement helper + tests

**Files:**
- Create: `src/utils/cookMovement.ts`
- Create: `src/utils/cookMovement.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
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
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/utils/cookMovement.test.ts
```

Expected: FAIL — `cookMovement` module not found

- [ ] **Step 3: Implement `src/utils/cookMovement.ts`**

```typescript
// src/utils/cookMovement.ts

/**
 * Computes tween duration (ms) for a cook moving between two points.
 * baseMsPerHundredPx: how many ms to travel 100px (cook-specific base speed)
 * Minimum 150ms regardless of distance.
 */
export function calcMoveDuration(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  baseMsPerHundredPx: number
): number {
  const dist = Math.hypot(toX - fromX, toY - fromY)
  return Math.max(150, (dist / 100) * baseMsPerHundredPx)
}

/**
 * Picks a random station index from [0, stationCount), guaranteed != currentIndex.
 */
export function pickNextStationIndex(currentIndex: number, stationCount: number): number {
  let next: number
  do {
    next = Math.floor(Math.random() * stationCount)
  } while (next === currentIndex)
  return next
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/utils/cookMovement.test.ts
```

Expected: all 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/cookMovement.ts src/utils/cookMovement.test.ts
git commit -m "feat: add cook movement helpers with tests"
```

---

## Chunk 2: Kitchen background art overhaul

### Task 3: Rewrite `generateKitchenBackground` with cohesive layout

The kitchen area occupies y=0–360. The serving counter is at y=360, height 40 (unchanged). The redesign adds:
- A dark stone back wall (y=0–100)
- A continuous back counter surface (y=100–130)
- Six back-counter stations along it
- A central prep island (y=200–240)
- Three island stations on it
- Two floor/wall stations

**Files:**
- Modify: `src/art/crazedCookArt.ts` — `generateKitchenBackground` only

Note: `generateKitchenBackground` is called from `generateCrazedCookTextures` and bakes everything into a static texture named `'kitchen_bg'`. No post-generation tweens are possible on this texture. All art is static fillRect calls.

Import `COOK_STATIONS` at the top of `crazedCookArt.ts` — use `station.x` as the center X for drawing each station's art.

- [ ] **Step 1: Add import to `crazedCookArt.ts`**

At the top of `src/art/crazedCookArt.ts`, add:
```typescript
import { COOK_STATIONS } from '../data/cookStations'
```

- [ ] **Step 2: Replace `generateKitchenBackground` with the new version**

Replace the entire `generateKitchenBackground` function body with:

```typescript
function generateKitchenBackground(scene: Phaser.Scene) {
  const { width, height } = scene.scale
  const g = scene.add.graphics()

  // ── Seating zone (bottom half, below counter at y=360) ──────────────────
  const counterY = 360
  const seatTile = 16
  for (let row = 0; row * seatTile < height - counterY - 40; row++) {
    for (let col = 0; col * seatTile < width; col++) {
      g.fillStyle(0x9e9e8a)
      g.fillRect(col * seatTile, counterY + 40 + row * seatTile, seatTile, seatTile)
      g.fillStyle(0x888878)
      g.fillRect(col * seatTile, counterY + 40 + row * seatTile, seatTile, 1)
      g.fillRect(col * seatTile, counterY + 40 + row * seatTile, 1, seatTile)
    }
  }

  // ── Serving counter band (unchanged) ────────────────────────────────────
  g.fillStyle(0x8b6340)
  g.fillRect(0, counterY, width, 40)
  g.fillStyle(0xaa7a50)
  g.fillRect(0, counterY, width, 4)
  g.fillStyle(0x6a4a28)
  g.fillRect(0, counterY + 36, width, 4)

  // ── Kitchen floor (y=130 to y=360) ──────────────────────────────────────
  const floorY = 130
  const tileSize = 24
  for (let row = 0; row * tileSize < counterY - floorY; row++) {
    for (let col = 0; col * tileSize < width; col++) {
      const isDark = (row + col) % 2 === 0
      g.fillStyle(isDark ? 0x4a3728 : 0x3a2a1e)
      g.fillRect(col * tileSize, floorY + row * tileSize, tileSize, tileSize)
    }
  }

  // ── Back wall (y=0 to y=130) ─────────────────────────────────────────────
  // Stone wall — alternating dark stone blocks
  const stoneH = 20
  const stoneW = 40
  for (let row = 0; row * stoneH < floorY; row++) {
    const offset = (row % 2) * (stoneW / 2)
    for (let col = -1; col * stoneW < width; col++) {
      g.fillStyle(row % 2 === 0 ? 0x2a2318 : 0x1e1a10)
      g.fillRect(col * stoneW + offset, row * stoneH, stoneW - 2, stoneH - 2)
    }
  }

  // ── Back counter surface (y=100 to y=130) ───────────────────────────────
  g.fillStyle(0x7a5530)
  g.fillRect(0, 100, width, 30)
  g.fillStyle(0x9a6a40)
  g.fillRect(0, 100, width, 4) // highlight
  g.fillStyle(0x5a3a20)
  g.fillRect(0, 126, width, 4) // shadow

  // ── Back-counter station art ─────────────────────────────────────────────
  // Station names in order: stove_left(0), sink(1), spice_rack(2),
  //   herb_bundles(3), fridge(4), stove_right(5)

  // Helper: stove (used for both stove_left and stove_right)
  const drawStove = (cx: number) => {
    // Body
    g.fillStyle(0x222222)
    g.fillRect(cx - 28, 62, 56, 38)
    // Burner backgrounds
    g.fillStyle(0x111111)
    g.fillRect(cx - 22, 68, 20, 20)
    g.fillRect(cx + 2,  68, 20, 20)
    // Burner glow (red/orange)
    g.fillStyle(0xcc3300)
    g.fillRect(cx - 20, 70, 16, 16)
    g.fillRect(cx + 4,  70, 16, 16)
    // Flame highlights
    g.fillStyle(0xff8800)
    g.fillRect(cx - 17, 73, 10, 10)
    g.fillRect(cx + 7,  73, 10, 10)
    g.fillStyle(0xffcc00)
    g.fillRect(cx - 14, 76, 4, 4)
    g.fillRect(cx + 10, 76, 4, 4)
    // Knobs
    g.fillStyle(0x444444)
    g.fillRect(cx - 16, 92, 6, 6)
    g.fillRect(cx + 10, 92, 6, 6)
  }
  drawStove(COOK_STATIONS[0].x) // stove_left
  drawStove(COOK_STATIONS[5].x) // stove_right

  // Sink
  const sinkX = COOK_STATIONS[1].x
  g.fillStyle(0x888888) // outer basin
  g.fillRect(sinkX - 24, 70, 48, 30)
  g.fillStyle(0x6699cc) // water
  g.fillRect(sinkX - 20, 74, 40, 22)
  g.fillStyle(0x4477aa) // water shadow
  g.fillRect(sinkX - 20, 92, 40, 4)
  g.fillStyle(0x555555) // tap base
  g.fillRect(sinkX - 2, 62, 4, 10)
  g.fillStyle(0x888888) // tap arm
  g.fillRect(sinkX - 8, 62, 16, 4)

  // Spice rack (wall-mounted shelves above counter)
  const spiceX = COOK_STATIONS[2].x
  g.fillStyle(0x5a3a18) // shelf board top
  g.fillRect(spiceX - 30, 40, 60, 5)
  g.fillStyle(0x5a3a18) // shelf board mid
  g.fillRect(spiceX - 30, 65, 60, 5)
  g.fillStyle(0x5a3a18) // shelf board bot
  g.fillRect(spiceX - 30, 90, 60, 5)
  // Jars on shelves — alternating colors
  const jarColors = [0xcc2222, 0x22aacc, 0xddaa00, 0x44cc44, 0xcc6600]
  for (let i = 0; i < 5; i++) {
    g.fillStyle(jarColors[i])
    g.fillRect(spiceX - 28 + i * 12, 46, 8, 14)
    g.fillStyle(0xcccccc)
    g.fillRect(spiceX - 28 + i * 12, 44, 8, 4) // lid
  }
  for (let i = 0; i < 4; i++) {
    g.fillStyle(jarColors[(i + 2) % 5])
    g.fillRect(spiceX - 24 + i * 14, 71, 10, 14)
    g.fillStyle(0xcccccc)
    g.fillRect(spiceX - 24 + i * 14, 69, 10, 4)
  }

  // Herb bundles (hanging from ceiling beam)
  const herbX = COOK_STATIONS[3].x
  g.fillStyle(0x3a2208) // ceiling beam
  g.fillRect(herbX - 36, 0, 72, 12)
  // Three bundles hanging down
  const bundleOffsets = [-20, 0, 20]
  bundleOffsets.forEach(ox => {
    g.fillStyle(0x5a3a18) // string
    g.fillRect(herbX + ox, 12, 2, 20)
    g.fillStyle(0x3a6630) // herb clump
    g.fillRect(herbX + ox - 6, 26, 14, 12)
    g.fillStyle(0x2a4a24) // dark shadow on herbs
    g.fillRect(herbX + ox - 4, 34, 10, 4)
    g.fillStyle(0x5a8850) // herb highlight
    g.fillRect(herbX + ox - 4, 26, 6, 4)
  })

  // Fridge (tall wooden ice-box)
  const fridgeX = COOK_STATIONS[4].x
  g.fillStyle(0x7a6040) // body
  g.fillRect(fridgeX - 22, 30, 44, 70)
  // Metal bands
  g.fillStyle(0x888888)
  g.fillRect(fridgeX - 22, 44, 44, 4)
  g.fillRect(fridgeX - 22, 68, 44, 4)
  g.fillRect(fridgeX - 22, 90, 44, 4)
  // Door panel
  g.fillStyle(0x6a5030)
  g.fillRect(fridgeX - 18, 34, 36, 56)
  // Handle
  g.fillStyle(0xaaaaaa)
  g.fillRect(fridgeX + 8, 58, 4, 14)
  // Top highlight
  g.fillStyle(0x9a7a50)
  g.fillRect(fridgeX - 22, 30, 44, 4)

  // ── Prep island (y=200–240, x=160–1040) ──────────────────────────────────
  const islandX1 = 160
  const islandX2 = 1040
  const islandY1 = 200
  const islandY2 = 240
  g.fillStyle(0x8b6340) // island top
  g.fillRect(islandX1, islandY1, islandX2 - islandX1, islandY2 - islandY1)
  g.fillStyle(0xaa7a50) // highlight
  g.fillRect(islandX1, islandY1, islandX2 - islandX1, 4)
  g.fillStyle(0x6a4a28) // shadow
  g.fillRect(islandX1, islandY2 - 4, islandX2 - islandX1, 4)
  // Side panels
  g.fillStyle(0x6a4a28)
  g.fillRect(islandX1, islandY1, 8, islandY2 - islandY1)
  g.fillRect(islandX2 - 8, islandY1, 8, islandY2 - islandY1)

  // ── Island station art ───────────────────────────────────────────────────

  // Cauldron
  const cauldronX = COOK_STATIONS[6].x
  // Flames under cauldron
  g.fillStyle(0xcc3300)
  g.fillRect(cauldronX - 18, 228, 36, 10)
  g.fillStyle(0xff8800)
  g.fillRect(cauldronX - 14, 224, 28, 10)
  g.fillStyle(0xffcc00)
  g.fillRect(cauldronX - 8, 220, 16, 8)
  // Pot body
  g.fillStyle(0x222222)
  g.fillRect(cauldronX - 22, 200, 44, 26)
  // Pot belly bulge
  g.fillStyle(0x333333)
  g.fillRect(cauldronX - 24, 208, 48, 14)
  // Pot rim
  g.fillStyle(0x444444)
  g.fillRect(cauldronX - 20, 198, 40, 6)
  // Bubbles
  g.fillStyle(0x558855)
  g.fillRect(cauldronX - 8, 200, 6, 6)
  g.fillRect(cauldronX + 4, 202, 4, 4)
  g.fillRect(cauldronX - 2, 196, 6, 6)
  // Handles
  g.fillStyle(0x333333)
  g.fillRect(cauldronX - 28, 206, 6, 6)
  g.fillRect(cauldronX + 22, 206, 6, 6)

  // Cutting board
  const boardX = COOK_STATIONS[7].x
  g.fillStyle(0xc8a060) // board surface
  g.fillRect(boardX - 30, 204, 60, 30)
  g.fillStyle(0xaa8040) // board edge shadow
  g.fillRect(boardX - 30, 230, 60, 4)
  g.fillRect(boardX + 26, 204, 4, 30)
  // Knife marks (dark lines)
  g.fillStyle(0x886630)
  g.fillRect(boardX - 20, 210, 1, 18)
  g.fillRect(boardX - 10, 208, 1, 20)
  g.fillRect(boardX,      210, 1, 16)
  g.fillRect(boardX + 10, 212, 1, 14)
  g.fillRect(boardX + 18, 209, 1, 18)
  // Knife lying on board
  g.fillStyle(0xaaaaaa) // blade
  g.fillRect(boardX - 24, 216, 36, 4)
  g.fillStyle(0x8b5e2a) // handle
  g.fillRect(boardX - 24, 214, 10, 8)

  // Mortar & pestle
  const mortarX = COOK_STATIONS[8].x
  // Pestle handle
  g.fillStyle(0x888888)
  g.fillRect(mortarX - 2, 200, 6, 18)
  // Pestle head
  g.fillStyle(0xaaaaaa)
  g.fillRect(mortarX - 6, 214, 14, 8)
  // Bowl body
  g.fillStyle(0x888888)
  g.fillRect(mortarX - 20, 218, 40, 20)
  // Bowl interior (dark)
  g.fillStyle(0x555555)
  g.fillRect(mortarX - 16, 222, 32, 12)
  // Bowl base
  g.fillStyle(0x666666)
  g.fillRect(mortarX - 14, 234, 28, 6)
  // Powder inside
  g.fillStyle(0xddcc88)
  g.fillRect(mortarX - 12, 224, 24, 6)

  // ── Floor/wall station art ────────────────────────────────────────────────

  // Barrel rack
  const barrelX = COOK_STATIONS[9].x
  // Rack frame
  g.fillStyle(0x3a2208)
  g.fillRect(barrelX - 36, 260, 72, 80)
  g.fillRect(barrelX - 36, 300, 72, 6) // middle shelf
  // Back barrels (top row)
  const barrelColors = [0x7a4a18, 0x5a3a10, 0x8a5a20]
  barrelColors.forEach((col, i) => {
    g.fillStyle(col)
    g.fillRect(barrelX - 28 + i * 20, 264, 16, 30)
    // Barrel bands
    g.fillStyle(0x444422)
    g.fillRect(barrelX - 28 + i * 20, 270, 16, 3)
    g.fillRect(barrelX - 28 + i * 20, 284, 16, 3)
  })
  // Bottom barrels
  barrelColors.forEach((col, i) => {
    g.fillStyle(col)
    g.fillRect(barrelX - 28 + i * 20, 308, 16, 28)
    g.fillStyle(0x444422)
    g.fillRect(barrelX - 28 + i * 20, 314, 16, 3)
    g.fillRect(barrelX - 28 + i * 20, 326, 16, 3)
  })
  // Labels on top row
  g.fillStyle(0xddcc88)
  g.fillRect(barrelX - 24, 275, 8, 6)
  g.fillRect(barrelX - 4,  275, 8, 6)
  g.fillRect(barrelX + 16, 275, 8, 6)

  // Oven (stone arch)
  const ovenX = COOK_STATIONS[10].x
  // Outer stone arch body
  g.fillStyle(0x555550)
  g.fillRect(ovenX - 40, 258, 80, 80)
  // Arch opening
  g.fillStyle(0xff6600) // fire glow
  g.fillRect(ovenX - 26, 280, 52, 50)
  g.fillStyle(0xff9900)
  g.fillRect(ovenX - 20, 288, 40, 36)
  g.fillStyle(0xffcc44)
  g.fillRect(ovenX - 10, 296, 20, 20)
  // Arch top (semicircle approximated with rectangles)
  g.fillStyle(0x555550)
  g.fillRect(ovenX - 30, 270, 60, 12)
  g.fillRect(ovenX - 26, 262, 52, 10)
  g.fillRect(ovenX - 18, 258, 36, 6)
  // Stone texture dots
  g.fillStyle(0x444440)
  g.fillRect(ovenX - 38, 260, 8, 8)
  g.fillRect(ovenX + 30, 260, 8, 8)
  g.fillRect(ovenX - 38, 300, 8, 8)
  g.fillRect(ovenX + 30, 300, 8, 8)
  // Ash on floor of oven
  g.fillStyle(0x333330)
  g.fillRect(ovenX - 22, 322, 44, 6)

  g.generateTexture('kitchen_bg', width, height)
  g.destroy()
}
```

- [ ] **Step 3: Run the dev server and visually verify the kitchen**

```bash
npm run dev
```

Open the browser, navigate to the Crazed Cook level, and confirm:
- Back wall with stone block pattern visible at top
- Back counter running full width with all 6 back-counter stations (two stoves, sink, spice rack with colored jars, herb bundles, fridge)
- Prep island table visible in the middle
- Cauldron, cutting board, mortar & pestle visible on the island
- Barrel rack and oven visible in the lower area
- Serving counter and seating zone unchanged at the bottom

- [ ] **Step 4: Commit**

```bash
git add src/art/crazedCookArt.ts src/data/cookStations.ts
git commit -m "feat: rewrite kitchen background with 10 named stations"
```

---

## Chunk 3: Orc visual redesign

### Task 4: Redraw orc with larger canvas and battle axe

**Files:**
- Modify: `src/art/crazedCookArt.ts` — `generateOrcCustomerTexture` only
- Modify: `src/scenes/level-types/CrazedCookLevel.ts` — `spawnOrc` orc Y position

Note: The orc texture name `'orc_customer'` stays the same. The new canvas is 20×24 pixels at scale 3 = 60×72px. The orc Image uses origin (0.5, 0.5), so the spawn Y must be adjusted so the orc's bottom edge (~y + 36) sits at the counter top (y=360). Target spawn Y: approximately 324 (360 - 36). Tune visually.

- [ ] **Step 1: Replace `generateOrcCustomerTexture` in `crazedCookArt.ts`**

Replace the entire function:

```typescript
function generateOrcCustomerTexture(scene: Phaser.Scene) {
  const s = 3
  const g = scene.add.graphics()

  // ── Head ─────────────────────────────────────────────────────────────────
  // Heavy brow ridge
  g.fillStyle(0x556030)
  g.fillRect(2 * s, 2 * s, 14 * s, 3 * s)

  // Head main
  g.fillStyle(0x6b7c3a)
  g.fillRect(2 * s, 4 * s, 14 * s, 9 * s)

  // Wide ears
  g.fillRect(0 * s, 5 * s, 2 * s, 4 * s)
  g.fillRect(16 * s, 5 * s, 2 * s, 4 * s)

  // Forehead warts
  g.fillStyle(0x4a5828)
  g.fillRect(4 * s, 3 * s, 1 * s, 1 * s)
  g.fillRect(9 * s, 2 * s, 1 * s, 1 * s)
  g.fillRect(13 * s, 3 * s, 1 * s, 1 * s)

  // Beady yellow eyes (deeper under brow)
  g.fillStyle(0xddcc00)
  g.fillRect(4 * s, 6 * s, 3 * s, 3 * s)
  g.fillRect(11 * s, 6 * s, 3 * s, 3 * s)
  // Pupils
  g.fillStyle(0x000000)
  g.fillRect(5 * s, 7 * s, 1 * s, 1 * s)
  g.fillRect(12 * s, 7 * s, 1 * s, 1 * s)
  // Angry brow lines over eyes
  g.fillStyle(0x3a4820)
  g.fillRect(4 * s, 5 * s, 3 * s, 1 * s)
  g.fillRect(11 * s, 5 * s, 3 * s, 1 * s)

  // Wide flat nose
  g.fillStyle(0x4a5a28)
  g.fillRect(7 * s, 8 * s, 4 * s, 3 * s)
  // Nostrils
  g.fillStyle(0x2a3a18)
  g.fillRect(7 * s, 10 * s, 1 * s, 1 * s)
  g.fillRect(10 * s, 10 * s, 1 * s, 1 * s)

  // Scowling mouth
  g.fillStyle(0x2a3a18)
  g.fillRect(5 * s, 11 * s, 8 * s, 2 * s)

  // Large bottom tusks (prominent)
  g.fillStyle(0xeeeedd)
  g.fillRect(6 * s, 10 * s, 2 * s, 4 * s)
  g.fillRect(10 * s, 10 * s, 2 * s, 4 * s)

  // ── Body / torso ──────────────────────────────────────────────────────────
  g.fillStyle(0x6b7c3a)
  g.fillRect(3 * s, 13 * s, 12 * s, 7 * s)

  // Leather vest
  g.fillStyle(0x3e2a10)
  g.fillRect(4 * s, 13 * s, 10 * s, 6 * s)
  // Vest highlight
  g.fillStyle(0x5a3e18)
  g.fillRect(5 * s, 14 * s, 2 * s, 4 * s)

  // ── Left arm (empty fist on counter) ─────────────────────────────────────
  g.fillStyle(0x6b7c3a)
  g.fillRect(0 * s, 15 * s, 3 * s, 5 * s)
  g.fillStyle(0x556030)
  g.fillRect(0 * s, 19 * s, 3 * s, 3 * s)

  // ── Right arm (raised, holding axe) ──────────────────────────────────────
  g.fillStyle(0x6b7c3a)
  g.fillRect(15 * s, 12 * s, 3 * s, 6 * s)
  // Fist
  g.fillStyle(0x556030)
  g.fillRect(15 * s, 17 * s, 3 * s, 3 * s)

  // ── Battle axe ────────────────────────────────────────────────────────────
  // Handle (brown, along right side, extending up)
  g.fillStyle(0x6a3a10)
  g.fillRect(16 * s, 2 * s, 2 * s, 16 * s)
  // Axe blade (steel wedge, above shoulder)
  g.fillStyle(0x999999)
  g.fillRect(14 * s, 0 * s, 4 * s, 6 * s)
  g.fillStyle(0xbbbbbb) // blade highlight edge
  g.fillRect(14 * s, 0 * s, 1 * s, 6 * s)
  // Blade beard (lower curved bit)
  g.fillStyle(0x999999)
  g.fillRect(14 * s, 4 * s, 6 * s, 3 * s)
  g.fillStyle(0x777777) // shadow on blade
  g.fillRect(17 * s, 1 * s, 1 * s, 5 * s)

  g.generateTexture('orc_customer', 20 * s, 24 * s)
  g.destroy()
}
```

- [ ] **Step 2: Adjust orc spawn Y in `CrazedCookLevel.ts`**

In `spawnOrc`, find this line:
```typescript
const orcSprite = this.add.image(seatX, 160, 'orc_customer').setScale(2)
```

The new texture is 72px tall at scale 2 = 144px display height. With origin (0.5, 0.5) the bottom edge is at `y + 72`. To sit above the patience bar at y=100 with the bottom near y=320, set spawn Y = 248:
```typescript
const orcSprite = this.add.image(seatX, 248, 'orc_customer').setScale(2)
```

Tune this value visually after running the dev server.

- [ ] **Step 3: Run dev server and visually verify orc**

```bash
npm run dev
```

Confirm:
- Orc reads as a proper orc (heavy brow, prominent tusks, green-grey)
- Battle axe visible over the right shoulder
- Orc size fits nicely in the seating area without overlapping tickets

- [ ] **Step 4: Commit**

```bash
git add src/art/crazedCookArt.ts src/scenes/level-types/CrazedCookLevel.ts
git commit -m "feat: redraw orc customer with axe and heavier silhouette"
```

---

## Chunk 4: Attack animation + cook waypoint movement

### Task 5: Orc attack animation on patience drain

**Files:**
- Modify: `src/scenes/level-types/CrazedCookLevel.ts`

Replace `handleWalkoff` with `handleAttack`. The logic is:
1. Immediately remove from orders list and handle active-order focus (same as before — prevents double-trigger from update loop)
2. Start tween: red flash → scale lunge → screen shake → despawn on complete

- [ ] **Step 1: Rename `handleWalkoff` → `handleAttack` and update the call site in `update`**

In `update`, change:
```typescript
if (order.patience <= 0) {
  this.handleWalkoff(order)
}
```
to:
```typescript
if (order.patience <= 0) {
  this.handleAttack(order)
}
```

- [ ] **Step 2: Replace the `handleWalkoff` method body**

Delete the old `handleWalkoff` method and replace with:

```typescript
private handleAttack(order: OrcOrder) {
  // Remove from orders immediately to prevent re-entry from update loop
  this.orders = this.orders.filter(o => o !== order)
  const wasActive = order === this.activeOrder

  // Clear active order focus if needed
  if (wasActive) {
    this.engine.clearWord()
    const remaining = this.orders
    const lowest = remaining.length > 0
      ? remaining.reduce((a, b) => a.seat < b.seat ? a : b)
      : null
    this.activeOrder = null
    if (lowest) this.setActiveOrder(lowest)
  }

  // Destroy ticket and patience bar immediately
  order.ticket.bg.destroy()
  order.ticket.lines.forEach(l => l.destroy())
  order.ticket.underlines.forEach(u => u.destroy())
  order.patienceBar.destroy()
  order.patienceBarBg.destroy()

  // Attack tween sequence
  order.orcSprite.setTint(0xff0000)
  this.tweens.add({
    targets: order.orcSprite,
    scaleX: 2.8,
    scaleY: 2.8,
    duration: 200,
    ease: 'Power2',
    onStart: () => {
      this.cameras.main.shake(150, 0.01)
    },
    onComplete: () => {
      order.orcSprite.destroy()

      this.walkoffs++

      if (this.walkoffs >= this.maxWalkoffs) {
        this.endLevel(false)
        return
      }

      const seat = order.seat
      this.time.delayedCall(1500, () => {
        if (!this.finished && !this.orders.find(o => o.seat === seat)) {
          this.spawnOrc(seat)
        }
      })
    },
  })
}
```

- [ ] **Step 3: Run dev server and verify attack animation**

```bash
npm run dev
```

Let an orc's patience drain fully. Confirm:
- Orc turns red and lunges (scales up) before disappearing
- Screen shakes briefly
- New orc respawns after delay
- Losing (3 walkoffs) still triggers game over

- [ ] **Step 4: Commit**

```bash
git add src/scenes/level-types/CrazedCookLevel.ts
git commit -m "feat: orc attack animation on patience drain"
```

---

### Task 6: Cook waypoint movement between kitchen stations

**Files:**
- Modify: `src/scenes/level-types/CrazedCookLevel.ts`

Replace the three bobbing tweens with a `startCookWander` method that loops each cook through random stations. Import `COOK_STATIONS` and `calcMoveDuration`/`pickNextStationIndex`.

- [ ] **Step 1: Add imports to `CrazedCookLevel.ts`**

At the top of the file, add:
```typescript
import { COOK_STATIONS } from '../data/cookStations'
import { calcMoveDuration, pickNextStationIndex } from '../utils/cookMovement'
```

- [ ] **Step 2: Add `COOK_BASE_SPEEDS` constant and `startCookWander` method**

Add this constant near the top of the file (after other constants):
```typescript
// ms per 100px for each cook — staggered so they don't move in lockstep
const COOK_BASE_SPEEDS = [160, 130, 190] // cook_ladle, cook_knife, cook_spoon
```

Add this method to the `CrazedCookLevel` class:
```typescript
private startCookWander(cook: Phaser.GameObjects.Image, baseMsPerHundredPx: number, startStationIdx: number) {
  let currentIdx = startStationIdx

  const wander = () => {
    if (this.finished) return
    const nextIdx = pickNextStationIndex(currentIdx, COOK_STATIONS.length)
    const station = COOK_STATIONS[nextIdx]
    const duration = calcMoveDuration(cook.x, cook.y, station.workX, station.workY, baseMsPerHundredPx)

    this.tweens.add({
      targets: cook,
      x: station.workX,
      y: station.workY,
      duration,
      ease: 'Linear',
      onComplete: () => {
        currentIdx = nextIdx
        const pause = Phaser.Math.Between(150, 500)
        this.time.delayedCall(pause, wander)
      },
    })
  }

  wander()
}
```

- [ ] **Step 3: Replace bobbing tweens with `startCookWander` calls in `create`**

Find and remove the existing cook spawn block:
```typescript
// Cook sprites with bobbing tweens
const cookKeys = ['cook_ladle', 'cook_knife', 'cook_spoon']
const cookXs = [200, 560, 920]
cookKeys.forEach((key, i) => {
  const cook = this.add.image(cookXs[i], 460, key).setScale(2)
  this.tweens.add({
    targets: cook,
    y: 460 + 4,
    yoyo: true,
    repeat: -1,
    duration: 600 + i * 150,
    ease: 'Sine.easeInOut',
  })
})
```

Replace with:
```typescript
// Cook sprites with waypoint wandering
const cookKeys = ['cook_ladle', 'cook_knife', 'cook_spoon']
const startStations = [0, 6, 3] // stove_left, cauldron, herb_bundles — spread them out initially
cookKeys.forEach((key, i) => {
  const station = COOK_STATIONS[startStations[i]]
  const cook = this.add.image(station.workX, station.workY, key).setScale(2)
  this.startCookWander(cook, COOK_BASE_SPEEDS[i], startStations[i])
})
```

- [ ] **Step 4: Run dev server and verify cook movement**

```bash
npm run dev
```

Confirm:
- All three cooks move around the kitchen area independently
- They visit different stations (stove, sink, cutting board, etc.)
- They don't move in lockstep — their speeds and timing differ
- They stay in the kitchen zone (above the serving counter)
- Movement stops gracefully when the level ends (the `if (this.finished) return` guard)

- [ ] **Step 5: Run the test suite to make sure nothing is broken**

```bash
npm run test
```

Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add src/scenes/level-types/CrazedCookLevel.ts
git commit -m "feat: cooks wander between kitchen stations"
```

---

## Final verification

- [ ] **Run the full game end-to-end**

```bash
npm run dev
```

Play the Crazed Cook level and verify all three features together:
1. Kitchen has a cohesive layout with 10 recognizable stations
2. Cooks run around between stations continuously
3. Orcs look like proper orcs with axes
4. Letting an orc's patience drain triggers the attack animation (red lunge + screen shake)
5. Game win/lose conditions still work correctly

- [ ] **Run full build check**

```bash
npm run build
```

Expected: no TypeScript errors, build succeeds.
