# Rend's Crag & Grizzlefang's Den Background Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the bare-bones volcanic arena background for Rend's Crag with a rich obsidian-spire / vivid-lava scene, and shift Grizzlefang's Den from near-invisible dark-on-dark to a warm red-brown forest with a glowing blood moon.

**Architecture:** Both changes live entirely in `src/utils/bossBackgrounds.ts`. Rend's Crag is a full function replacement (rename `drawVolcanicArenaBg` → `drawVolcanicCragBg`, rewrite body, update the dispatch map). Grizzlefang's Den is a colour-only edit of `drawDarkForestBg` — structure and all animations stay intact.

**Tech Stack:** Phaser 3 Graphics API (`fillStyle`, `fillRect`, `fillCircle`, `fillTriangle`, `fillEllipse`, `lineStyle`, `lineBetween`), `scene.add.rectangle`, `scene.tweens.add`, `scene.time.addEvent`. Tests use Vitest + vi.fn() mocks.

---

## File Map

| File | Action |
|---|---|
| `src/utils/bossBackgrounds.ts` | Rename `drawVolcanicArenaBg` → `drawVolcanicCragBg` + full rewrite (lines 1975–2044); update `miniBossVariants` map (line 2100); update all colour values in `drawDarkForestBg` (lines 1264–1439) |
| `src/utils/bossBackgrounds.test.ts` | Create — smoke + behavioural tests for both functions |

---

## Task 1: Write failing tests for the Rend's Crag background

**Files:**
- Create: `src/utils/bossBackgrounds.test.ts`

The key behavioural difference: the current `drawVolcanicArenaBg` calls `scene.add.rectangle` exactly **1 time** at setup. The new `drawVolcanicCragBg` will call it **4 times** (fire column, ground bloom, crack-light pulse, heat haze). Testing that count gives a red → green signal without coupling to pixel values.

The `drawDarkForestBg` test is a smoke test only (colour values are untestable as units) — it will stay green through both the before and after states.

- [ ] **Step 1: Create the test file**

```typescript
// src/utils/bossBackgrounds.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { drawMiniBossBg, drawDarkForestBg } from './bossBackgrounds'

// ── Phaser mock ───────────────────────────────────────────────────────────────
vi.mock('phaser', () => ({
  default: {},
}))

function makeMockGraphics() {
  const g: Record<string, ReturnType<typeof vi.fn>> = {}
  for (const m of [
    'fillStyle', 'fillRect', 'fillCircle', 'fillTriangle', 'fillEllipse',
    'lineStyle', 'lineBetween', 'setAlpha', 'setPosition', 'destroy',
  ]) {
    g[m] = vi.fn().mockReturnThis()
  }
  return g
}

function makeMockScene() {
  const graphics = makeMockGraphics()
  const rectangle = {
    setAlpha: vi.fn().mockReturnThis(),
    setPosition: vi.fn().mockReturnThis(),
  }
  return {
    scale: { width: 1280, height: 720 },
    add: {
      graphics: vi.fn().mockReturnValue(graphics),
      rectangle: vi.fn().mockReturnValue(rectangle),
    },
    tweens: { add: vi.fn() },
    time:   { addEvent: vi.fn(), delayedCall: vi.fn() },
  }
}

// ── Rend's Crag (drawMiniBossBg dispatch) ────────────────────────────────────
describe('drawMiniBossBg — rend_the_red', () => {
  let scene: ReturnType<typeof makeMockScene>

  beforeEach(() => { scene = makeMockScene() })

  it('creates exactly 4 animated rectangles at setup (fire column, ground bloom, crack light, heat haze)', () => {
    drawMiniBossBg(scene as any, 'rend_the_red')
    expect(scene.add.rectangle).toHaveBeenCalledTimes(4)
  })

  it('starts the ember particle timer', () => {
    drawMiniBossBg(scene as any, 'rend_the_red')
    expect(scene.time.addEvent).toHaveBeenCalledTimes(1)
  })
})

// ── Grizzlefang's Den ────────────────────────────────────────────────────────
describe('drawDarkForestBg', () => {
  it('runs without throwing', () => {
    const scene = makeMockScene()
    expect(() => drawDarkForestBg(scene as any)).not.toThrow()
  })
})
```

- [ ] **Step 2: Run the tests — confirm the Rend's Crag test fails**

```bash
npx vitest run src/utils/bossBackgrounds.test.ts
```

Expected output (abridged):
```
FAIL src/utils/bossBackgrounds.test.ts
  drawMiniBossBg — rend_the_red
    ✗ creates exactly 4 animated rectangles at setup
      AssertionError: expected 1 to equal 4
```

The `drawDarkForestBg` smoke test should pass. If it doesn't, check that the Phaser mock covers all methods the function calls.

---

## Task 2: Implement drawVolcanicCragBg (Rend's Crag full overhaul)

**Files:**
- Modify: `src/utils/bossBackgrounds.ts:1975–2102`

Replace the entire body of `drawVolcanicArenaBg` with the new implementation and rename the function. Then update the dispatch map.

- [ ] **Step 1: Replace lines 1975–2044 — rename and rewrite the function**

Find this block (lines 1975–2044):
```typescript
function drawVolcanicArenaBg(scene: Phaser.Scene): void {
  // ... (entire existing body)
}
```

Replace with:
```typescript
function drawVolcanicCragBg(scene: Phaser.Scene): void {
  const { width, height } = scene.scale
  const g = scene.add.graphics()

  // Layer 1: Sky — 5-band deep-red gradient
  const skySections: Array<[number, number, number]> = [
    [0,             height * 0.12, 0x0d0202],
    [height * 0.12, height * 0.25, 0x180404],
    [height * 0.25, height * 0.40, 0x260606],
    [height * 0.40, height * 0.52, 0x330808],
    [height * 0.52, height * 0.58, 0x3d0a08],
  ]
  for (const [y1, y2, color] of skySections) {
    g.fillStyle(color)
    g.fillRect(0, y1, width, y2 - y1 + 1)
  }

  // Ash cloud bands
  g.fillStyle(0x1a0404)
  for (let x = 0; x < width; x += 180) {
    const cy = 20 + ((x * 7) % 60)
    g.fillRect(x, cy, 160, 18)
    g.fillRect(x + 60, cy + 20, 100, 12)
  }

  // Distant volcano silhouette
  const volcX = width * 0.5, volcBaseY = height * 0.58
  g.fillStyle(0x110202)
  g.fillTriangle(
    volcX - 90, volcBaseY,
    volcX,      volcBaseY - 140,
    volcX + 90, volcBaseY
  )
  g.fillRect(volcX - 110, volcBaseY - 20, 220, 20)

  // Left obsidian spire clusters (4 spires, tallest first)
  const leftSpires = [
    { x: 40,  h: 200, w: 28 },
    { x: 20,  h: 130, w: 18 },
    { x: 75,  h: 150, w: 20 },
    { x: 105, h: 120, w: 16 },
  ]
  for (const sp of leftSpires) {
    const baseY = height * 0.70
    g.fillStyle(0x0e0202)
    g.fillTriangle(sp.x, baseY, sp.x - sp.w / 2, baseY, sp.x - sp.w / 4, baseY - sp.h)
    g.fillStyle(0x882200)
    g.fillRect(sp.x - 2, baseY - sp.h, 3, Math.floor(sp.h * 0.4))
  }

  // Right obsidian spire clusters (mirrored)
  const rightSpires = [
    { x: width - 40,  h: 190, w: 28 },
    { x: width - 18,  h: 140, w: 18 },
    { x: width - 78,  h: 145, w: 20 },
    { x: width - 108, h: 115, w: 16 },
  ]
  for (const sp of rightSpires) {
    const baseY = height * 0.70
    g.fillStyle(0x0e0202)
    g.fillTriangle(sp.x, baseY, sp.x + sp.w / 2, baseY, sp.x + sp.w / 4, baseY - sp.h)
    g.fillStyle(0x882200)
    g.fillRect(sp.x - 1, baseY - sp.h, 3, Math.floor(sp.h * 0.4))
  }

  // Lava floor base + rock texture
  g.fillStyle(0x0e0202)
  g.fillRect(0, height * 0.70, width, height * 0.30)
  g.fillStyle(0x120303)
  for (let x = 0; x < width; x += 80) {
    g.fillRect(x,      height * 0.72, 70, 4)
    g.fillRect(x + 35, height * 0.78, 50, 3)
  }

  // Primary lava cracks — bright vivid orange-red
  g.fillStyle(0xff4400)
  const primaryCracks: Array<[number, number, number, number]> = [
    [80,   height * 0.72, 200, 3],
    [350,  height * 0.75, 180, 3],
    [620,  height * 0.71, 220, 3],
    [900,  height * 0.74, 170, 3],
    [1100, height * 0.78, 140, 3],
  ]
  for (const [x, y, w, h] of primaryCracks) g.fillRect(x, y, w, h)

  // Secondary cracks — branching
  g.fillStyle(0xff6600)
  const secondaryCracks: Array<[number, number, number, number]> = [
    [120,  height * 0.73, 80,  2],
    [240,  height * 0.76, 60,  2],
    [430,  height * 0.72, 90,  2],
    [580,  height * 0.78, 70,  2],
    [700,  height * 0.74, 100, 2],
    [840,  height * 0.76, 65,  2],
    [980,  height * 0.72, 80,  2],
    [1050, height * 0.77, 55,  2],
  ]
  for (const [x, y, w, h] of secondaryCracks) g.fillRect(x, y, w, h)

  // Bright hotspot tips at crack origins
  g.fillStyle(0xffaa00)
  g.fillRect(80,  height * 0.72, 12, 3)
  g.fillRect(350, height * 0.75, 10, 3)
  g.fillRect(620, height * 0.71, 14, 3)
  g.fillRect(900, height * 0.74, 11, 3)

  // ── Animated elements ────────────────────────────────────────────────────────

  // 1) Distant fire column (behind volcano peak)
  const fireCol = scene.add.rectangle(volcX, height * 0.44, 10, 60, 0xff4400, 0.4)
  scene.tweens.add({
    targets: fireCol,
    alpha: 0.75,
    scaleY: 1.3,
    duration: 1800,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  })

  // 2) Ground lava-bloom glow
  const groundBloom = scene.add.rectangle(width / 2, height * 0.82, width, height * 0.35, 0xff4400, 0.14)
  scene.tweens.add({
    targets: groundBloom,
    alpha: 0.24,
    duration: 1600,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  })

  // 3) Crack-light pulse
  const crackLight = scene.add.rectangle(width / 2, height * 0.73, width * 0.7, 4, 0xff6600, 0.20)
  scene.tweens.add({
    targets: crackLight,
    alpha: 0.45,
    duration: 900,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  })

  // 4) Full-width heat haze
  const haze = scene.add.rectangle(width / 2, height * 0.50, width, height * 0.30, 0xff3300, 0.04)
  scene.tweens.add({
    targets: haze,
    alpha: 0.08,
    duration: 6000,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  })

  // Ember particle system (up to 16 embers)
  let embersAlive = 0
  const MAX_EMBERS = 16
  scene.time.addEvent({
    delay: 300,
    loop: true,
    callback: () => {
      if (embersAlive >= MAX_EMBERS) return
      const ex = 50 + Math.random() * (width - 100)
      const color = Math.random() < 0.5 ? 0xff6600 : 0xffaa00
      const ember = scene.add.rectangle(ex, height * 0.88, 3, 3, color, 0.9)
      embersAlive++
      scene.tweens.add({
        targets: ember,
        y: height * 0.25 + Math.random() * (height * 0.25),
        x: ex + (Math.random() - 0.5) * 80,
        alpha: 0,
        duration: 1500 + Math.random() * 1000,
        ease: 'Quad.easeOut',
        onComplete: () => { ember.destroy(); embersAlive-- },
      })
    },
  })
}
```

- [ ] **Step 2: Update the dispatch map (line ~2100)**

Find:
```typescript
  rend_the_red: drawVolcanicArenaBg,
```

Replace with:
```typescript
  rend_the_red: drawVolcanicCragBg,
```

- [ ] **Step 3: Run the tests — confirm all pass**

```bash
npx vitest run src/utils/bossBackgrounds.test.ts
```

Expected:
```
✓ drawMiniBossBg — rend_the_red > creates exactly 4 animated rectangles at setup
✓ drawMiniBossBg — rend_the_red > starts the ember particle timer
✓ drawDarkForestBg > runs without throwing
```

- [ ] **Step 4: Run the full test suite to confirm no regressions**

```bash
npm run test
```

Expected: all previously passing tests still pass.

- [ ] **Step 5: Commit**

```bash
git add src/utils/bossBackgrounds.ts src/utils/bossBackgrounds.test.ts
git commit -m "feat: overhaul Rend's Crag background with volcanic crag scene (bright lava, obsidian spires)"
```

---

## Task 3: Update drawDarkForestBg colour palette (Grizzlefang's Den)

**Files:**
- Modify: `src/utils/bossBackgrounds.ts:1264–1439`

All changes are colour-value substitutions — no structural changes to the function body. Make each change exactly as listed below.

- [ ] **Step 1: Update the sky gradient colours (lines ~1272–1275)**

Find:
```typescript
  const skySections: Array<[number, number, number]> = [
    [0,             height * 0.15, 0x04050a],
    [height * 0.15, height * 0.30, 0x060810],
    [height * 0.30, height * 0.45, 0x070914],
    [height * 0.45, height * 0.56, 0x090b18],
  ]
```

Replace with:
```typescript
  const skySections: Array<[number, number, number]> = [
    [0,             height * 0.15, 0x160806],
    [height * 0.15, height * 0.30, 0x220a08],
    [height * 0.30, height * 0.45, 0x2a1008],
    [height * 0.45, height * 0.56, 0x200c06],
  ]
```

- [ ] **Step 2: Update the blood moon colours (lines ~1284–1287) and cloud occlusion (line ~1289)**

Find:
```typescript
  g.fillStyle(0x440000); g.fillCircle(moonX, moonY, 38)
  g.fillStyle(0x772200); g.fillCircle(moonX, moonY, 30)
  g.fillStyle(0xaa4400); g.fillCircle(moonX, moonY, 22)
  g.fillStyle(0xcc6622); g.fillCircle(moonX, moonY, 14)
  // Cloud occlusion
  g.fillStyle(0x04050a)
```

Replace with:
```typescript
  g.fillStyle(0x882200); g.fillCircle(moonX, moonY, 38)
  g.fillStyle(0xaa2800); g.fillCircle(moonX, moonY, 30)
  g.fillStyle(0xdd4400); g.fillCircle(moonX, moonY, 22)
  g.fillStyle(0xff8844); g.fillCircle(moonX, moonY, 14)
  // Cloud occlusion
  g.fillStyle(0x1e0c0a)
```

- [ ] **Step 3: Update the far tree layer colour (line ~1294)**

Find:
```typescript
  g.fillStyle(0x040608)
  for (let x = 0; x < width; x += 56) {
```

Replace with:
```typescript
  g.fillStyle(0x160804)
  for (let x = 0; x < width; x += 56) {
```

- [ ] **Step 4: Update the mid tree layer colour (line ~1304)**

Find:
```typescript
  g.fillStyle(0x060a0e)
  for (let x = -20; x < width; x += 76) {
```

Replace with:
```typescript
  g.fillStyle(0x1a0a04)
  for (let x = -20; x < width; x += 76) {
```

- [ ] **Step 5: Update the foreground trunk colour (line ~1314)**

Find:
```typescript
  g.fillStyle(0x030406)
  for (let i = 0; i < 4; i++) {
```

Replace with:
```typescript
  g.fillStyle(0x0c0402)
  for (let i = 0; i < 4; i++) {
```

- [ ] **Step 6: Update the ground gradient colours (lines ~1326–1330)**

Find:
```typescript
  const groundSections: Array<[number, number, number]> = [
    [height * 0.56, height * 0.66, 0x060908],
    [height * 0.66, height * 0.76, 0x040706],
    [height * 0.76, height * 0.88, 0x030505],
    [height * 0.88, height,        0x020403],
  ]
```

Replace with:
```typescript
  const groundSections: Array<[number, number, number]> = [
    [height * 0.56, height * 0.66, 0x1c0a06],
    [height * 0.66, height * 0.76, 0x160806],
    [height * 0.76, height * 0.88, 0x100604],
    [height * 0.88, height,        0x0c0402],
  ]
```

- [ ] **Step 7: Update undergrowth tufts and root lines (lines ~1336, ~1342)**

Find:
```typescript
  g.fillStyle(0x060a08)
  for (let x = 0; x < width; x += 48) {
    const bh = 16 + ((x * 3) % 22)
    g.fillRect(x, height * 0.56, 42, bh)
  }
  // Exposed roots from ogre-trunk columns
  g.lineStyle(3, 0x030604, 1)
```

Replace with:
```typescript
  g.fillStyle(0x180a04)
  for (let x = 0; x < width; x += 48) {
    const bh = 16 + ((x * 3) % 22)
    g.fillRect(x, height * 0.56, 42, bh)
  }
  // Exposed roots from ogre-trunk columns
  g.lineStyle(3, 0x0e0602, 1)
```

- [ ] **Step 8: Update the moon shaft colour and alpha values (lines ~1353, ~1356, ~1359)**

Find:
```typescript
  moonShaft.fillStyle(0xaa3300, 1)
  moonShaft.fillTriangle(moonX - 15, 0, moonX + 15, 0, moonX - 12, height)
  moonShaft.fillTriangle(moonX + 15, 0, moonX + 38, height, moonX - 12, height)
  moonShaft.setAlpha(0.06)
  scene.tweens.add({
    targets: moonShaft,
    alpha: 0.11,
```

Replace with:
```typescript
  moonShaft.fillStyle(0xcc3300, 1)
  moonShaft.fillTriangle(moonX - 15, 0, moonX + 15, 0, moonX - 12, height)
  moonShaft.fillTriangle(moonX + 15, 0, moonX + 38, height, moonX - 12, height)
  moonShaft.setAlpha(0.10)
  scene.tweens.add({
    targets: moonShaft,
    alpha: 0.18,
```

- [ ] **Step 9: Update the fog layer colours and alpha values (lines ~1367–1370)**

Find:
```typescript
  const fog1 = scene.add.rectangle(width / 2,       height * 0.60, width + 200, 36, 0x0a1408, 1)
  const fog2 = scene.add.rectangle(width / 2 + 20,  height * 0.66, width + 200, 26, 0x080e06, 1)
  const fog3 = scene.add.rectangle(width / 2 - 15,  height * 0.72, width * 0.9, 20, 0x060c05, 1)
  fog1.setAlpha(0.28); fog2.setAlpha(0.22); fog3.setAlpha(0.16)
```

Replace with:
```typescript
  const fog1 = scene.add.rectangle(width / 2,       height * 0.60, width + 200, 36, 0x280c06, 1)
  const fog2 = scene.add.rectangle(width / 2 + 20,  height * 0.66, width + 200, 26, 0x1e0804, 1)
  const fog3 = scene.add.rectangle(width / 2 - 15,  height * 0.72, width * 0.9, 20, 0x180604, 1)
  fog1.setAlpha(0.35); fog2.setAlpha(0.28); fog3.setAlpha(0.22)
```

- [ ] **Step 10: Update firefly colour (line ~1379)**

Find:
```typescript
    ff.fillStyle(0xffff88, 1)
```

Replace with:
```typescript
    ff.fillStyle(0xffcc44, 1)
```

- [ ] **Step 11: Update glowing eye colour and add outer glow halo (lines ~1410–1415)**

Find:
```typescript
    eyeGfx.fillStyle(0xff4400, 1)
    eyeGfx.fillEllipse(ex - 5, ey, 10, 7)
    eyeGfx.fillEllipse(ex + 7, ey, 10, 7)
    eyeGfx.fillStyle(0x220000, 1)
    eyeGfx.fillEllipse(ex - 5, ey, 5, 4)
    eyeGfx.fillEllipse(ex + 7, ey, 5, 4)
```

Replace with:
```typescript
    eyeGfx.fillStyle(0x661100, 0.4)
    eyeGfx.fillEllipse(ex - 5, ey, 16, 11)
    eyeGfx.fillEllipse(ex + 7, ey, 16, 11)
    eyeGfx.fillStyle(0xff3300, 1)
    eyeGfx.fillEllipse(ex - 5, ey, 10, 7)
    eyeGfx.fillEllipse(ex + 7, ey, 10, 7)
    eyeGfx.fillStyle(0x220000, 1)
    eyeGfx.fillEllipse(ex - 5, ey, 5, 4)
    eyeGfx.fillEllipse(ex + 7, ey, 5, 4)
```

- [ ] **Step 12: Run the tests — confirm all still pass**

```bash
npm run test
```

Expected: all tests pass (including the smoke test for `drawDarkForestBg`).

- [ ] **Step 13: Commit**

```bash
git add src/utils/bossBackgrounds.ts
git commit -m "feat: brighten Grizzlefang's Den — warm red-brown palette, vivid blood moon, visible fog and fireflies"
```

---

## Visual Verification Checklist

After both tasks, run `npm run dev` and navigate to each boss level to confirm:

- [ ] **Rend's Crag** (`w1_mb3`): obsidian spire clusters visible on left/right flanks; lava crack floor with vivid orange-red light; embers rising from floor; heat haze shimmer present
- [ ] **Grizzlefang's Den** (`w1_boss`): tree silhouettes clearly readable against the background; blood moon visibly glowing red-orange; fog strips visible as warm mist; fireflies amber-coloured; glowing eye pairs have visible red glow halos
