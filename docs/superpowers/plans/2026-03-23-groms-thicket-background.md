# Grom's Thicket Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the sparse `drawForestClearingBg` function with a rich, animated "dangerous ancient forest" background for the Knuckle mini-boss encounter.

**Architecture:** All changes are contained in a single function (`drawForestClearingBg`) in `src/utils/bossBackgrounds.ts`. The new implementation builds 10 depth layers — a persistent static `Graphics` base plus separate animated scene objects (fog rectangles, mote pool, eye pairs, sway branches) following existing patterns from `drawDarkForestBg` and `drawMoonlitGladeBg` in the same file.

**Tech Stack:** Phaser 3, TypeScript — `scene.add.graphics()`, `scene.add.rectangle()`, `scene.tweens.add()`, `scene.time.delayedCall()`, `scene.time.addEvent()`

---

## File Map

| Action | Path | What changes |
|--------|------|-------------|
| Modify | `src/utils/bossBackgrounds.ts` | Replace body of `drawForestClearingBg` (lines ~1149–1214) |

No other files touched. Function signature `drawForestClearingBg(scene: Phaser.Scene): void` is unchanged.

---

## Codebase Notes (read before implementing)

- **`g.destroy()` pattern**: Most peer functions call `g.destroy()` after the static draw block. Unlike those peers, **do NOT call `g.destroy()` here** — the static `Graphics` object must remain in the scene to keep its pixels visible. Animated objects (shaft, fog, motes, eyes, branches) are all separate `scene.add.*` instances.
- **Hex colors** are passed as numbers (`0x0f2810`), not strings.
- **`scene.add.rectangle(x, y, w, h, fillColor, fillAlpha)`** — creates a `Rectangle` shape GameObject; used for fog layers. Origin defaults to center (`0.5, 0.5`), so position is the rect's center.
- **`scene.add.graphics()`** — creates a `Graphics` object. Draw calls use the object's local origin `(0, 0)` unless `.setPosition()` is called. To draw at world coordinates, leave the object at `(0,0)` and use world coordinates in `fillRect`/`fillEllipse`/etc.
- **Tween angle** on a Graphics object rotates it around its Phaser position. For branch sway, draw the branch starting at local `(0, 0)` and set the object's position to the branch's pivot point (trunk attachment).
- **`fillEllipse(x, y, width, height)`** — confirmed used in this file (e.g. steam vents).
- **`fillTriangle(x1, y1, x2, y2, x3, y3)`** — confirmed used in `LevelIntroScene.ts`.
- **`lineBetween(x1, y1, x2, y2)`** + **`lineStyle(width, color, alpha)`** — confirmed used in this file for line drawing.

---

## Task 1: Replace static base (layers 1–6)

**Files:**
- Modify: `src/utils/bossBackgrounds.ts` (the `drawForestClearingBg` function)

- [ ] **Step 1: Delete the existing function body**

  In `bossBackgrounds.ts`, find `drawForestClearingBg` (~line 1149) and replace its entire body with the stub below. Keep the function signature unchanged.

  ```typescript
  function drawForestClearingBg(scene: Phaser.Scene): void {
    const { width, height } = scene.scale
    // TODO: implement
  }
  ```

- [ ] **Step 2: Write the static base layers**

  Replace the `// TODO` with the full static base. The `g` object must NOT be destroyed — it stays in the scene.

  ```typescript
  function drawForestClearingBg(scene: Phaser.Scene): void {
    const { width, height } = scene.scale

    // ── Static base — single persistent Graphics object (do NOT destroy) ──────
    const g = scene.add.graphics()

    // Layer 1: Sky — 4-band stacked-rect gradient (GoblinWhacker technique)
    const skySections: Array<[number, number, number]> = [
      [0,             height * 0.18, 0x050c03],
      [height * 0.18, height * 0.35, 0x081508],
      [height * 0.35, height * 0.50, 0x0c200a],
      [height * 0.50, height * 0.58, 0x102808],
    ]
    for (const [y1, y2, color] of skySections) {
      g.fillStyle(color)
      g.fillRect(0, y1, width, y2 - y1 + 1)
    }

    // Layer 2: Canopy overhang — irregular silhouette using two additive sin terms
    // Narrow vertical slices build the organic lower edge (GoblinWhacker mountain technique)
    g.fillStyle(0x0d1e0b)
    for (let x = 0; x <= width * 0.42; x += 6) {
      const edgeY = 30 + Math.sin(x * 0.06) * 18 + Math.sin(x * 0.13) * 10
      g.fillRect(x, 0, 6, edgeY)
    }
    for (let x = width; x >= width * 0.52; x -= 6) {
      const edgeY = 35 + Math.sin(x * 0.07) * 20 + Math.sin(x * 0.11) * 12
      g.fillRect(x - 6, 0, 6, edgeY)
    }

    // Layer 3: Far trees — sin-varied heights, darkest
    g.fillStyle(0x0f2810)
    for (let x = 0; x < width; x += 28) {
      const th = 55 + Math.sin(x * 0.09) * 25 + Math.sin(x * 0.21) * 12
      g.fillRect(x, height * 0.58 - th, 24, th + height * 0.45)
    }

    // Layer 4: Mid trees — slightly lighter, with two branch forks each
    g.fillStyle(0x0a1e08)
    for (let x = 8; x < width; x += 42) {
      const th = 80 + Math.sin(x * 0.07) * 30 + Math.sin(x * 0.18) * 15
      g.fillRect(x, height * 0.58 - th, 32, th + height * 0.42)
      g.fillRect(x + 10, height * 0.58 - th + 20, 30, 4)  // right fork
      g.fillRect(x - 18, height * 0.58 - th + 38, 20, 3)  // left fork
    }

    // Layer 5: Foreground trunk columns — 6 each side, branches cross inward
    g.fillStyle(0x060e04)
    for (let i = 0; i < 6; i++) {
      g.fillRect(i * 16 - 6,          0, 17, height)  // left column
      g.fillRect(width - i * 16 - 11, 0, 17, height)  // right column
      if (i < 3) {
        // Inward branches (drawn into static base; swaying branches are separate objects in Task 3)
        g.fillRect(i * 16 + 8,          height * 0.20 + i * 18, 50, 6)
        g.fillRect(i * 16 + 6,          height * 0.38 + i * 12, 38, 5)
        g.fillRect(width - i * 16 - 58, height * 0.25 + i * 14, 50, 6)
        g.fillRect(width - i * 16 - 44, height * 0.40 + i * 10, 38, 5)
      }
    }

    // Layer 6: Ground — 4-band gradient
    const groundSections: Array<[number, number, number]> = [
      [height * 0.55, height * 0.65, 0x1a2e0c],
      [height * 0.65, height * 0.78, 0x142408],
      [height * 0.78, height * 0.88, 0x0e1c06],
      [height * 0.88, height,        0x091504],
    ]
    for (const [y1, y2, color] of groundSections) {
      g.fillStyle(color)
      g.fillRect(0, y1, width, y2 - y1 + 1)
    }

    // Exposed roots — 5 lines from foreground tree bases across floor
    g.lineStyle(3, 0x0a1204, 1)
    const rootLines: Array<[number, number, number, number]> = [
      [18,          height * 0.57, 65,          height * 0.72],
      [28,          height * 0.59, 110,         height * 0.80],
      [width - 55,  height * 0.57, width - 15,  height * 0.74],
      [width - 30,  height * 0.59, width - 80,  height * 0.78],
      [80,          height * 0.56, 160,         height * 0.76],
    ]
    for (const [x1, y1, x2, y2] of rootLines) {
      g.lineBetween(x1, y1, x2, y2)
    }
  }
  ```

- [ ] **Step 3: Build and check TypeScript**

  ```bash
  npm run build
  ```
  Expected: No TypeScript errors. Vite build completes.

- [ ] **Step 4: Verify visually in dev server**

  ```bash
  npm run dev
  ```
  Navigate to Grom's Thicket (World 1 → mini-boss `knuckle_keeper_of_e`). You should see:
  - Dark layered sky fading from near-black to forest-green
  - Irregular canopy overhangs from both sides with organic edge
  - Three depth layers of tree silhouettes (far/mid/close), getting darker as they approach
  - Foreground trunk columns framing the center
  - Dark graduated ground with root lines at the base of the left/right columns
  - The center should be open (clearing) where the boss appears

- [ ] **Step 5: Commit**

  ```bash
  git add src/utils/bossBackgrounds.ts
  git commit -m "feat: Grom's Thicket — static base layers (sky, canopy, trees, ground)"
  ```

---

## Task 2: Add animated light shaft and fog layers (layers 7–8)

**Files:**
- Modify: `src/utils/bossBackgrounds.ts` (append to end of `drawForestClearingBg`, after the roots block)

- [ ] **Step 1: Add the sickly light shaft**

  After the closing `}` of the roots `for` loop, add:

  ```typescript
    // ── Layer 7: Sickly light shaft — trapezoid, slow alpha pulse ─────────────
    const shaft = scene.add.graphics()
    shaft.fillStyle(0x88cc44, 1)
    shaft.fillTriangle(width * 0.44, 0, width * 0.56, 0, width * 0.35, height)
    shaft.fillTriangle(width * 0.56, 0, width * 0.65, height, width * 0.35, height)
    shaft.setAlpha(0.08)
    scene.tweens.add({
      targets: shaft,
      alpha: 0.14,
      duration: 4000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  ```

- [ ] **Step 2: Add the three fog layers**

  ```typescript
    // ── Layer 8: Fog layers × 3 — drift at different speeds and phases ────────
    const fog1 = scene.add.rectangle(width / 2,      height * 0.57, width + 200, 22, 0x2a4a18, 0.28)
    const fog2 = scene.add.rectangle(width / 2 + 20,  height * 0.63, width + 200, 16, 0x223a12, 0.20)
    const fog3 = scene.add.rectangle(width / 2 - 10,  height * 0.69, width * 0.9, 13, 0x1a3010, 0.15)
    scene.tweens.add({ targets: fog1, x: width / 2 + 40, duration: 7000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    scene.tweens.add({ targets: fog2, x: width / 2 - 30, duration: 5500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    scene.tweens.add({ targets: fog3, x: width / 2 + 60, duration: 9000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
  ```

- [ ] **Step 3: Build**

  ```bash
  npm run build
  ```
  Expected: No errors.

- [ ] **Step 4: Verify visually**

  In the dev server, check Grom's Thicket again:
  - A faint green trapezoid of light slowly pulses in the center of the scene
  - Three horizontal fog bands roll slowly across the ground at slightly different y-levels and speeds
  - The three fog layers should move in opposite directions (alternating) creating a subtle rolling effect

- [ ] **Step 5: Commit**

  ```bash
  git add src/utils/bossBackgrounds.ts
  git commit -m "feat: Grom's Thicket — light shaft and fog layers"
  ```

---

## Task 3: Add green motes pool (layer 9)

**Files:**
- Modify: `src/utils/bossBackgrounds.ts` (append to `drawForestClearingBg`)

- [ ] **Step 1: Add recycled mote pool**

  The pool pre-creates all 12 mote objects. Each mote is repositioned and relaunched on completion — no create/destroy during gameplay (DungeonPlatformerLevel pattern).

  ```typescript
    // ── Layer 9: Green motes — recycled pool, spawn in center clearing ────────
    const MAX_MOTES = 12
    const MOTE_X1 = 100
    const MOTE_X2 = width - 100
    const MOTE_Y1 = height * 0.60
    const MOTE_Y2 = height * 0.68

    const motes: Phaser.GameObjects.Graphics[] = Array.from({ length: MAX_MOTES }, () => {
      const m = scene.add.graphics()
      m.fillStyle(0x66ff44, 0.75)
      m.fillCircle(0, 0, 3)
      m.setAlpha(0)
      return m
    })

    const launchMote = (index: number): void => {
      const mote = motes[index]
      const mx = MOTE_X1 + Math.random() * (MOTE_X2 - MOTE_X1)
      const my = MOTE_Y1 + Math.random() * (MOTE_Y2 - MOTE_Y1)
      mote.setPosition(mx, my)
      mote.setAlpha(0.75)
      scene.tweens.add({
        targets: mote,
        y: my - 80,
        x: mx + (Math.random() - 0.5) * 40,
        alpha: 0,
        duration: 3000 + Math.random() * 2000,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          scene.time.delayedCall(Math.random() * 2000, () => launchMote(index))
        },
      })
    }

    // Stagger initial launches so they don't all appear at once
    for (let i = 0; i < MAX_MOTES; i++) {
      scene.time.delayedCall(i * 600, () => launchMote(i))
    }
  ```

- [ ] **Step 2: Build**

  ```bash
  npm run build
  ```
  Expected: No errors.

- [ ] **Step 3: Verify visually**

  Green glowing dots should rise slowly from the ground fog in the center clearing area, drift slightly sideways, and fade out. They should stagger their appearances over the first ~7 seconds, then recycle continuously.

- [ ] **Step 4: Commit**

  ```bash
  git add src/utils/bossBackgrounds.ts
  git commit -m "feat: Grom's Thicket — recycled green mote pool"
  ```

---

## Task 4: Add watching eyes and branch sway (layer 10 + sway)

**Files:**
- Modify: `src/utils/bossBackgrounds.ts` (append to `drawForestClearingBg`)

- [ ] **Step 1: Add the three eye pairs**

  Each pair blinks in independently with randomised hold and gap timings. The eyes are drawn at their world coordinates directly into a Graphics object positioned at `(0,0)`.

  ```typescript
    // ── Layer 10: Watching eyes — 3 pairs blink independently in tree columns ─
    type EyeConfig = { ex: number; ey: number; initDelay: number }
    const eyeConfigs: EyeConfig[] = [
      { ex: 55,                ey: height * 0.38, initDelay: 0 },
      { ex: width - 60,        ey: height * 0.42, initDelay: 2500 },
      { ex: width * 0.5 + 10,  ey: height * 0.31, initDelay: 5000 },
    ]

    for (const { ex, ey, initDelay } of eyeConfigs) {
      const eyeGfx = scene.add.graphics()
      // Whites
      eyeGfx.fillStyle(0x99ff66, 1)
      eyeGfx.fillEllipse(ex - 5, ey, 10, 7)
      eyeGfx.fillEllipse(ex + 7, ey, 10, 7)
      // Pupils
      eyeGfx.fillStyle(0x001500, 1)
      eyeGfx.fillEllipse(ex - 5, ey, 5, 4)
      eyeGfx.fillEllipse(ex + 7, ey, 5, 4)
      eyeGfx.setAlpha(0)

      const scheduleBlink = (): void => {
        scene.tweens.add({
          targets: eyeGfx,
          alpha: 1,
          duration: 200,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            scene.time.delayedCall(2000 + Math.random() * 2000, () => {
              scene.tweens.add({
                targets: eyeGfx,
                alpha: 0,
                duration: 400,
                ease: 'Sine.easeInOut',
                onComplete: () => {
                  scene.time.delayedCall(3000 + Math.random() * 5000, scheduleBlink)
                },
              })
            })
          },
        })
      }

      scene.time.delayedCall(initDelay, scheduleBlink)
    }
  ```

- [ ] **Step 2: Add branch sway**

  Four separate `Graphics` objects — the innermost branches of the first 2 columns on each side. Drawn at local `(0, -3)` so the pivot point `(0, 0)` is at the branch base where it meets the trunk. Staggered delays prevent synchronised swaying.

  ```typescript
    // ── Branch sway — innermost branch of first 2 columns, each side ──────────
    type BranchDef = { bx: number; by: number; bw: number; delay: number }
    const swayBranches: BranchDef[] = [
      { bx: 8,           by: height * 0.20, bw: 50, delay: 0 },     // left col 0 upper
      { bx: 24,          by: height * 0.38, bw: 38, delay: 400 },   // left col 1 lower
      { bx: width - 58,  by: height * 0.25, bw: 50, delay: 800 },   // right col 0 upper
      { bx: width - 44,  by: height * 0.40, bw: 38, delay: 1200 },  // right col 1 lower
    ]

    for (const { bx, by, bw, delay } of swayBranches) {
      const branchGfx = scene.add.graphics()
      branchGfx.fillStyle(0x060e04, 1)
      branchGfx.fillRect(0, -3, bw, 6)  // pivot at left edge, centered vertically
      branchGfx.setPosition(bx, by)
      branchGfx.setAngle(-3)  // start at -3° so sway is symmetric around resting position
      scene.time.delayedCall(delay, () => {
        scene.tweens.add({
          targets: branchGfx,
          angle: 3,
          duration: 2500 + delay * 0.25,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        })
      })
    }
  ```

- [ ] **Step 3: Build**

  ```bash
  npm run build
  ```
  Expected: No errors.

- [ ] **Step 4: Final visual verification**

  Observe Grom's Thicket for at least 15 seconds. Confirm:
  - [ ] Eyes appear at 0s, ~2.5s, and ~5s and blink independently
  - [ ] The 4 branches sway gently with staggered timing — not in sync
  - [ ] Motes continue cycling in the clearing
  - [ ] Fog layers and light shaft animate continuously
  - [ ] No z-fighting between layers (each layer sits visually above the previous)
  - [ ] The typing area (center screen) is unobstructed and readable

- [ ] **Step 5: Commit**

  ```bash
  git add src/utils/bossBackgrounds.ts
  git commit -m "feat: Grom's Thicket — watching eyes and branch sway"
  ```

---

## Reference: Final function structure

```
drawForestClearingBg(scene)
  └── g (persistent Graphics — static base)
      ├── Layer 1: sky (4 bands)
      ├── Layer 2: canopy overhang (sin-varied slices)
      ├── Layer 3: far trees
      ├── Layer 4: mid trees + branch forks
      ├── Layer 5: foreground trunk columns + static branches
      └── Layer 6: ground (4 bands) + root lines
  ├── shaft (Graphics — light shaft trapezoid, alpha-tweened)
  ├── fog1/fog2/fog3 (Rectangle — x-tweened at different speeds)
  ├── motes[0..11] (Graphics[] — recycled pool, y/x/alpha-tweened)
  ├── eyeGfx × 3 (Graphics — alpha-tweened blink cycle)
  └── branchGfx × 4 (Graphics — angle-tweened sway)
```
