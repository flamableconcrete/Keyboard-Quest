# Skeleton Swarm: Spread, Idle & Walk Animations — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 8-frame idle and walk pixel art animations to SkeletonSwarm skeletons, and prevent skeleton overlap via label-aware dynamic spacing (regular mode) and a per-frame separation force (advanced mode).

**Architecture:** New animation frames are generated as individual named textures in `skeletonSwarmArt.ts`. A shared `drawSkeletonBase` helper minimises code duplication across 16 frames. Skeleton sprites are upgraded from `Image` to `Sprite`. Spacing/separation logic is extracted to a pure utility module for testability.

**Tech Stack:** Phaser 3, TypeScript, Vitest

---

## File Structure

| File | Role |
|------|------|
| `src/art/skeletonSwarmArt.ts` | Add `generateSkeletonIdleFrames()` and `generateSkeletonWalkFrames()` — pure texture generators |
| `src/utils/skeletonSpacing.ts` | **NEW** — `computeSlotPositions` and `applySeparationForce` pure helpers |
| `src/utils/skeletonSpacing.test.ts` | **NEW** — Vitest unit tests for spacing helpers |
| `src/scenes/level-types/SkeletonSwarmLevel.ts` | All game-logic changes: interface, spawn, animations, spacing, separation, state tracking |

---

## Chunk 1: Art Frames

### Task 1: Add skeleton idle frame generator

**Files:**
- Modify: `src/art/skeletonSwarmArt.ts`

Produces 8 textures (`ss_skeleton_idle_0` … `ss_skeleton_idle_7`) showing the right arm and weapon bobbing gently up and down over one full cycle.

- [ ] **Step 1.1: Add `drawSkeletonBase` helper and `generateSkeletonIdleFrames` function**

Add the following to `src/art/skeletonSwarmArt.ts`, after `generateRisingSkeletonTexture` and before `generateBoneFragmentTexture`:

```typescript
/**
 * Draws the static parts of the skeleton (skull, ribcage, armor, pelvis, left arm, legs)
 * onto the given graphics object at pixel scale `s`.
 * Variable parts (right arm, weapon) are NOT drawn here — callers handle them.
 */
function drawSkeletonBase(g: Phaser.GameObjects.Graphics, s: number) {
  // Skull
  g.fillStyle(0xddccaa)
  g.fillRect(2 * s, 0 * s, 6 * s, 5 * s)
  g.fillRect(1 * s, 1 * s, 8 * s, 3 * s)
  // Eye sockets
  g.fillStyle(0x00ccff)
  g.fillRect(2 * s, 1 * s, 2 * s, 2 * s)
  g.fillRect(6 * s, 1 * s, 2 * s, 2 * s)
  // Jaw
  g.fillStyle(0xddccaa)
  g.fillRect(2 * s, 4 * s, 6 * s, 2 * s)
  g.fillStyle(0xbbaa88)
  g.fillRect(3 * s, 5 * s, 4 * s, 1 * s)
  // Neck
  g.fillStyle(0xddccaa)
  g.fillRect(4 * s, 6 * s, 2 * s, 2 * s)
  // Ribcage
  g.fillStyle(0xddccaa)
  g.fillRect(2 * s, 8 * s, 6 * s, 6 * s)
  g.fillStyle(0xbbaa88)
  g.fillRect(2 * s, 9 * s, 6 * s, 1 * s)
  g.fillRect(2 * s, 11 * s, 6 * s, 1 * s)
  g.fillRect(2 * s, 13 * s, 6 * s, 1 * s)
  // Armor scraps
  g.fillStyle(0x445566)
  g.fillRect(1 * s, 8 * s, 2 * s, 4 * s)
  g.fillRect(7 * s, 8 * s, 2 * s, 3 * s)
  g.fillStyle(0x334455)
  g.fillRect(1 * s, 11 * s, 2 * s, 1 * s)
  // Left arm (static)
  g.fillStyle(0xddccaa)
  g.fillRect(0 * s, 8 * s, 2 * s, 6 * s)
  g.fillStyle(0xbbaa88)
  g.fillRect(0 * s, 12 * s, 2 * s, 1 * s)
  // Pelvis
  g.fillStyle(0xddccaa)
  g.fillRect(2 * s, 14 * s, 6 * s, 2 * s)
}

function generateSkeletonIdleFrames(scene: Phaser.Scene) {
  const s = 4
  // Right arm Y offset per frame (in s-units). Range: 0 (base) to -3 (peak up).
  // Cycle: hold → rise → peak → fall → hold
  const yOffs = [0, -1, -2, -3, -3, -2, -1, 0]

  for (let i = 0; i < 8; i++) {
    const off = yOffs[i]
    const g = scene.add.graphics()

    drawSkeletonBase(g, s)

    // Legs (static in idle)
    g.fillStyle(0xddccaa)
    g.fillRect(2 * s, 16 * s, 2 * s, 4 * s)
    g.fillRect(6 * s, 16 * s, 2 * s, 4 * s)
    g.fillStyle(0xbbaa88)
    g.fillRect(2 * s, 19 * s, 2 * s, 1 * s)
    g.fillRect(6 * s, 19 * s, 2 * s, 1 * s)

    // Right arm (animated — shifts up with off)
    g.fillStyle(0xddccaa)
    g.fillRect(8 * s, (8 + off) * s, 2 * s, 6 * s)

    // Weapon: blade + tip
    g.fillStyle(0xaaaaaa)
    g.fillRect(9 * s, (4 + off) * s, 2 * s, 4 * s)
    g.fillRect(10 * s, (3 + off) * s, 1 * s, 2 * s)
    // Weapon: haft (runs from arm top to bottom of canvas)
    g.fillStyle(0x885533)
    g.fillRect(9 * s, (8 + off) * s, 2 * s, (12 - off) * s)

    g.generateTexture(`ss_skeleton_idle_${i}`, 12 * s, 20 * s)
    g.destroy()
  }
}
```

Also add the call inside `generateSkeletonSwarmTextures`, after `generateRisingSkeletonTexture(scene)`:

```typescript
generateSkeletonIdleFrames(scene)
```

- [ ] **Step 1.2: Verify the build compiles**

```bash
npm run build
```

Expected: no TypeScript errors. Warnings about unused variables are OK; errors are not.

- [ ] **Step 1.3: Commit**

```bash
git add src/art/skeletonSwarmArt.ts
git commit -m "feat: add 8-frame skeleton idle animation textures"
```

---

### Task 2: Add skeleton walk frame generator

**Files:**
- Modify: `src/art/skeletonSwarmArt.ts`

Produces 8 textures (`ss_skeleton_walk_0` … `ss_skeleton_walk_7`) showing a full stride cycle: legs alternate forward/back, right arm swings in opposition.

- [ ] **Step 2.1: Add `generateSkeletonWalkFrames` function**

Add the following to `src/art/skeletonSwarmArt.ts`, directly after `generateSkeletonIdleFrames`:

```typescript
function generateSkeletonWalkFrames(scene: Phaser.Scene) {
  const s = 4

  // Per-frame leg data: [leftLegX, leftLegH, rightLegX, rightLegH, rightArmYOff]
  // leftLegX / rightLegX: X position of leg in s-units (base: left=2, right=6)
  // leftLegH / rightLegH: leg height in s-units (base: 4; 3 = foot raised mid-stride)
  // rightArmYOff: right arm Y offset in s-units (swings opposite to legs)
  const frames: [number, number, number, number, number][] = [
    [2, 4, 6, 4,  0],  // frame 0: neutral
    [1, 3, 6, 4, -1],  // frame 1: left leg stepping forward (raised)
    [1, 3, 7, 4, -2],  // frame 2: left at peak, right trailing back
    [2, 4, 7, 4, -1],  // frame 3: left returning, right still back
    [2, 4, 6, 4,  0],  // frame 4: neutral
    [3, 4, 5, 3,  1],  // frame 5: right leg stepping forward (raised), left trailing
    [3, 4, 5, 3,  0],  // frame 6: right at peak, left still back
    [2, 4, 5, 4, -1],  // frame 7: right returning
  ]

  for (let i = 0; i < 8; i++) {
    const [lx, lh, rx, rh, armOff] = frames[i]
    const g = scene.add.graphics()

    drawSkeletonBase(g, s)

    // Left leg (animated)
    g.fillStyle(0xddccaa)
    g.fillRect(lx * s, (20 - lh) * s, 2 * s, lh * s)
    g.fillStyle(0xbbaa88)
    g.fillRect(lx * s, 19 * s, 2 * s, 1 * s)

    // Right leg (animated)
    g.fillStyle(0xddccaa)
    g.fillRect(rx * s, (20 - rh) * s, 2 * s, rh * s)
    g.fillStyle(0xbbaa88)
    g.fillRect(rx * s, 19 * s, 2 * s, 1 * s)

    // Right arm (animated — swings with armOff)
    g.fillStyle(0xddccaa)
    g.fillRect(8 * s, (8 + armOff) * s, 2 * s, 6 * s)

    // Weapon blade + tip
    g.fillStyle(0xaaaaaa)
    g.fillRect(9 * s, (4 + armOff) * s, 2 * s, 4 * s)
    g.fillRect(10 * s, (3 + armOff) * s, 1 * s, 2 * s)
    // Weapon haft
    g.fillStyle(0x885533)
    g.fillRect(9 * s, (8 + armOff) * s, 2 * s, (12 - armOff) * s)

    g.generateTexture(`ss_skeleton_walk_${i}`, 12 * s, 20 * s)
    g.destroy()
  }
}
```

Also add the call inside `generateSkeletonSwarmTextures`, after `generateSkeletonIdleFrames(scene)`:

```typescript
generateSkeletonWalkFrames(scene)
```

- [ ] **Step 2.2: Verify the build compiles**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 2.3: Commit**

```bash
git add src/art/skeletonSwarmArt.ts
git commit -m "feat: add 8-frame skeleton walk animation textures"
```

---

## Chunk 2: Scene Logic

### Task 3: Create spacing utility with tests

**Files:**
- Create: `src/utils/skeletonSpacing.ts`
- Create: `src/utils/skeletonSpacing.test.ts`

Pure functions for slot computation and separation force — no Phaser dependency, fully testable.

- [ ] **Step 3.1: Write the failing tests first**

Create `src/utils/skeletonSpacing.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { computeSlotPositions, applySeparationForce } from './skeletonSpacing'

describe('computeSlotPositions', () => {
  const BATTLE_X = 350
  const LABEL_PAD = 24
  const MIN_SPACING = 80
  const MAX_X = 1220 // scene.scale.width - 60

  it('returns empty array for no skeletons', () => {
    expect(computeSlotPositions([], BATTLE_X, LABEL_PAD, MIN_SPACING, MAX_X)).toEqual([])
  })

  it('places single skeleton at BATTLE_X', () => {
    expect(computeSlotPositions([60], BATTLE_X, LABEL_PAD, MIN_SPACING, MAX_X)).toEqual([350])
  })

  it('spaces two skeletons by labelWidth + LABEL_PAD when wider than MIN_SPACING', () => {
    // first label is 80px wide → slot gap = 80 + 24 = 104 (> MIN_SPACING 80)
    const result = computeSlotPositions([80, 60], BATTLE_X, LABEL_PAD, MIN_SPACING, MAX_X)
    expect(result[0]).toBe(350)
    expect(result[1]).toBe(350 + 80 + 24) // 454
  })

  it('uses MIN_SPACING when label + pad is narrower', () => {
    // first label is 40px wide → 40 + 24 = 64, less than MIN_SPACING 80
    const result = computeSlotPositions([40, 40], BATTLE_X, LABEL_PAD, MIN_SPACING, MAX_X)
    expect(result[0]).toBe(350)
    expect(result[1]).toBe(350 + 80) // 430 — MIN_SPACING wins
  })

  it('clamps slot when label-driven position exceeds MAX_X', () => {
    // slot[0]=350, slot[1]=350+500+24=874 (fits), slot[2]=874+500+24=1398 → clamped to 1220
    const result = computeSlotPositions([500, 500, 500], BATTLE_X, LABEL_PAD, MIN_SPACING, MAX_X)
    expect(result[0]).toBe(350)
    expect(result[1]).toBe(874)
    expect(result[2]).toBe(MAX_X) // 1398 clamped to 1220
  })

  it('clamps to MAX_X and propagates clamped value for subsequent slots', () => {
    // label widths chosen so slot[1] is just within bounds but slot[2] would exceed
    const result = computeSlotPositions([800, 800, 800], BATTLE_X, LABEL_PAD, MIN_SPACING, MAX_X)
    // slot[0] = 350
    // slot[1] = 350 + 800 + 24 = 1174  (< 1220, not clamped)
    // slot[2] = 1174 + 800 + 24 = 1998 → clamped to 1220
    expect(result[0]).toBe(350)
    expect(result[1]).toBe(1174)
    expect(result[2]).toBe(1220)
  })

  it('propagates clamped value: further slots also clamp', () => {
    const result = computeSlotPositions([800, 800, 800, 800], BATTLE_X, LABEL_PAD, MIN_SPACING, MAX_X)
    // slot[2] = 1220 (clamped), slot[3] = 1220 + 800 + 24 = 2044 → clamped to 1220
    expect(result[2]).toBe(1220)
    expect(result[3]).toBe(1220)
  })
})

describe('applySeparationForce', () => {
  const LABEL_PAD = 24
  const MIN_X = 285  // BARRIER_X + 20
  const MAX_X = 1220

  it('returns positions unchanged when no overlap', () => {
    // Two skeletons 200px apart with 60px labels: minGap = (60+60)/2 + 24 = 84, gap = 200 > 84
    const result = applySeparationForce([300, 500], [60, 60], LABEL_PAD, MIN_X, MAX_X)
    expect(result[0]).toBe(300)
    expect(result[1]).toBe(500)
  })

  it('pushes overlapping pair apart by half the overlap each', () => {
    // Two skeletons 50px apart, labels 60px each: minGap = (60+60)/2 + 24 = 84, overlap = 84-50 = 34
    // a pushed left by 17 → 400-17=383 (well above MIN_X=285, no clamping)
    // b pushed right by 17 → 450+17=467
    const result = applySeparationForce([400, 450], [60, 60], LABEL_PAD, MIN_X, MAX_X)
    expect(result[0]).toBeCloseTo(383)
    expect(result[1]).toBeCloseTo(467)
  })

  it('clamps left skeleton to MIN_X', () => {
    // Skeleton a would be pushed left of MIN_X
    const result = applySeparationForce([290, 295], [60, 60], LABEL_PAD, MIN_X, MAX_X)
    expect(result[0]).toBeGreaterThanOrEqual(MIN_X)
  })

  it('clamps right skeleton to MAX_X', () => {
    const result = applySeparationForce([1210, 1215], [60, 60], LABEL_PAD, MIN_X, MAX_X)
    expect(result[1]).toBeLessThanOrEqual(MAX_X)
  })

  it('handles three skeletons — resolves consecutive pairs', () => {
    // Three skeletons at x=300, labels 60px each.
    // minGap = (60+60)/2 + 24 = 84 per pair.
    // Pair(0,1): overlap=84, a→300-42=258→clamped to 285, b→300+42=342.
    // Pair(1,2): new gap=300-342=-42, overlap=84+42=126, b→342-63=279→clamped to 285, c→300+63=363.
    const result = applySeparationForce([300, 300, 300], [60, 60, 60], LABEL_PAD, MIN_X, MAX_X)
    // The right-most skeleton must have been pushed rightward
    expect(result[2]).toBeGreaterThan(300)
    // The left-most skeleton must be clamped at MIN_X
    expect(result[0]).toBe(MIN_X)
  })
})
```

- [ ] **Step 3.2: Run tests to confirm they fail (module not found)**

```bash
npx vitest run src/utils/skeletonSpacing.test.ts
```

Expected: FAIL — `Cannot find module './skeletonSpacing'`

- [ ] **Step 3.3: Implement `src/utils/skeletonSpacing.ts`**

```typescript
/**
 * Computes target X positions for skeletons in regular mode queue.
 * Queue grows rightward: index 0 is at BATTLE_X (closest to barrier).
 *
 * @param labelWidths  Array of Text.width values for each skeleton, in queue order
 * @param battleX      X position for the first skeleton (BATTLE_X constant)
 * @param labelPad     Minimum padding added to labelWidth to get slot gap
 * @param minSpacing   Minimum slot width regardless of label width
 * @param maxX         Right-edge clamp (scene.scale.width - 60)
 * @returns            Array of target X values, one per skeleton
 */
export function computeSlotPositions(
  labelWidths: number[],
  battleX: number,
  labelPad: number,
  minSpacing: number,
  maxX: number,
): number[] {
  if (labelWidths.length === 0) return []

  const positions: number[] = []
  let cursor = battleX

  for (let i = 0; i < labelWidths.length; i++) {
    const clamped = Math.min(cursor, maxX)
    positions.push(clamped)
    const gap = Math.max(labelWidths[i] + labelPad, minSpacing)
    cursor = clamped + gap
  }

  return positions
}

/**
 * Applies one separation-force pass to prevent label overlap in advanced mode.
 * Input array is sorted by ascending X before the pass; the returned positions
 * correspond to the same sort order as the input.
 *
 * @param positions   Current X positions of skeletons (may be in any order)
 * @param labelWidths Corresponding Text.width values
 * @param labelPad    Total padding between adjacent label edges
 * @param minX        Lower clamp (BARRIER_X + 20 = 285)
 * @param maxX        Upper clamp (scene.scale.width - 60)
 * @returns           New positions after separation, in the same order as input
 */
export function applySeparationForce(
  positions: number[],
  labelWidths: number[],
  labelPad: number,
  minX: number,
  maxX: number,
): number[] {
  if (positions.length <= 1) return [...positions]

  // Build index array sorted by ascending X
  const indices = positions.map((_, i) => i).sort((a, b) => positions[a] - positions[b])
  const result = [...positions]

  for (let i = 0; i < indices.length - 1; i++) {
    const ai = indices[i]
    const bi = indices[i + 1]
    const minGap = (labelWidths[ai] + labelWidths[bi]) / 2 + labelPad
    const overlap = minGap - (result[bi] - result[ai])
    if (overlap > 0) {
      result[ai] = Math.max(result[ai] - overlap / 2, minX)
      result[bi] = Math.min(result[bi] + overlap / 2, maxX)
    }
  }

  return result
}
```

- [ ] **Step 3.4: Run tests and confirm they pass**

```bash
npx vitest run src/utils/skeletonSpacing.test.ts
```

Expected: all tests PASS.

- [ ] **Step 3.5: Commit**

```bash
git add src/utils/skeletonSpacing.ts src/utils/skeletonSpacing.test.ts
git commit -m "feat: add skeleton spacing utility with tests"
```

---

### Task 4: Update Skeleton interface, spawnSkeleton, and animation registration

**Files:**
- Modify: `src/scenes/level-types/SkeletonSwarmLevel.ts`

- [ ] **Step 4.1: Update imports**

At the top of `SkeletonSwarmLevel.ts`, add the spacing import after the existing imports:

```typescript
import { computeSlotPositions, applySeparationForce } from '../../utils/skeletonSpacing'
```

- [ ] **Step 4.2: Update the `Skeleton` interface**

Replace the existing `Skeleton` interface (lines 16–26):

```typescript
interface Skeleton {
  word: string
  x: number
  speed: number
  sprite: Phaser.GameObjects.Sprite   // was Image
  label: Phaser.GameObjects.Text
  hp: number
  aura: Phaser.GameObjects.Ellipse
  auraTween: Phaser.Tweens.Tween | null
  isRiser: boolean
  isMoving: boolean    // tracks current animation state; false = idle, true = walk
  prevX: number        // x at start of last frame, used for animation state detection
}
```

- [ ] **Step 4.3: Add LABEL_PAD and MIN_SPACING constants to the class**

In the class body, after the existing `private readonly BARRIER_X = 265` line, add:

```typescript
private readonly LABEL_PAD = 24
private readonly MIN_SPACING = 80
```

- [ ] **Step 4.4: Guard all animation registrations in `create()`**

In `create()`, locate the existing `this.anims.create({ key: 'ss_fire_anim', ... })` block (around line 101) and wrap it:

```typescript
if (!this.anims.exists('ss_fire_anim')) {
  this.anims.create({
    key: 'ss_fire_anim',
    frames: [
      { key: 'ss_fire_0' }, { key: 'ss_fire_1' },
      { key: 'ss_fire_2' }, { key: 'ss_fire_1' },
    ],
    frameRate: 8,
    repeat: -1,
  })
}
```

Then, directly after the fire-anim block, register the two new animations:

```typescript
if (!this.anims.exists('ss_idle_anim')) {
  this.anims.create({
    key: 'ss_idle_anim',
    frames: Array.from({ length: 8 }, (_, i) => ({ key: `ss_skeleton_idle_${i}` })),
    frameRate: 3,
    repeat: -1,
  })
}
if (!this.anims.exists('ss_walk_anim')) {
  this.anims.create({
    key: 'ss_walk_anim',
    frames: Array.from({ length: 8 }, (_, i) => ({ key: `ss_skeleton_walk_${i}` })),
    frameRate: 8,
    repeat: -1,
  })
}
```

Also update the fire sprite creation lines (a few lines below) to use `.play('ss_fire_anim')` on sprites — the existing code already does this, so no change needed there.

- [ ] **Step 4.5: Update `spawnSkeleton` to create a Sprite and initialise new fields**

Locate the `spawnSkeleton` method. Replace the `sprite` creation line:

```typescript
// OLD:
const sprite = this.add.image(startX, startY, isRiser ? 'ss_skeleton_rising' : 'ss_skeleton').setDepth(2)
```

with:

```typescript
// NEW:
const sprite = this.add.sprite(
  startX,
  startY,
  isRiser ? 'ss_skeleton_rising' : 'ss_skeleton_idle_0',
).setDepth(2)
```

In the `skeleton` object literal, add the two new fields:

```typescript
const skeleton: Skeleton = {
  word,
  x: startX,
  speed: 60 + this.level.world * 10,
  sprite,
  label,
  hp: 1,
  aura,
  auraTween: null,
  isRiser,
  isMoving: false,   // NEW
  prevX: startX,     // NEW
}
```

For **marcher** skeletons, immediately after `this.skeletons.push(skeleton)` (and before the `if (!this.activeSkeleton)` line), add:

```typescript
if (!isRiser) {
  sprite.play('ss_idle_anim')
}
```

For **riser** skeletons, update the `onComplete` callback in the rise tween to guard and bootstrap animation:

```typescript
onComplete: () => {
  if (!sprite.active) return          // guard: skeleton may have been defeated mid-rise
  skeleton.isRiser = false
  sprite.play('ss_idle_anim')         // bootstrap animation; state-tracking takes over next frame
}
```

(Remove the old `sprite.setTexture('ss_skeleton')` line — `play()` handles the texture switch.)

- [ ] **Step 4.6: Verify the build compiles**

```bash
npm run build
```

Expected: no TypeScript errors. The game is not fully functional yet (spacing logic not updated), but it should compile.

- [ ] **Step 4.7: Commit**

```bash
git add src/scenes/level-types/SkeletonSwarmLevel.ts
git commit -m "feat: upgrade skeleton sprites to Sprite type, register idle/walk animations"
```

---

### Task 5: Replace fixed spacing with label-aware spacing in regular mode

**Files:**
- Modify: `src/scenes/level-types/SkeletonSwarmLevel.ts`

- [ ] **Step 5.1: Replace the regular-mode update block**

In `update()`, locate the `else` branch that handles regular mode (around lines 433–443):

```typescript
// OLD:
} else {
  // Regular mode: lead stops at BATTLE_X, others queue behind with spacing
  this.skeletons.forEach((s, i) => {
    const targetX = this.BATTLE_X + i * this.SKELETON_SPACING
    if (s.x > targetX) {
      s.x -= s.speed * (delta / 1000)
      if (s.x < targetX) s.x = targetX
    }
    s.sprite.setX(s.x)
    s.label.setX(s.x)
    s.aura.setX(s.x)
  })
}
```

Replace with:

```typescript
// NEW:
} else {
  // Regular mode: label-aware dynamic slot positions
  const labelWidths = this.skeletons.map(s => s.label.width)
  const targetXs = computeSlotPositions(
    labelWidths,
    this.BATTLE_X,
    this.LABEL_PAD,
    this.MIN_SPACING,
    this.scale.width - 60,
  )
  this.skeletons.forEach((s, i) => {
    const targetX = targetXs[i]
    if (s.x > targetX) {
      s.x -= s.speed * (delta / 1000)
      if (s.x < targetX) s.x = targetX
    }
    s.sprite.setX(s.x)
    s.label.setX(s.x)
    s.aura.setX(s.x)
  })
}
```

Also remove the now-unused `private readonly SKELETON_SPACING = 120` class constant — it is not used anywhere after this change and leaving it causes lint noise.

- [ ] **Step 5.2: Verify build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 5.3: Commit**

```bash
git add src/scenes/level-types/SkeletonSwarmLevel.ts
git commit -m "feat: replace fixed skeleton spacing with label-aware dynamic slots"
```

---

### Task 6: Add separation force in advanced mode

**Files:**
- Modify: `src/scenes/level-types/SkeletonSwarmLevel.ts`

- [ ] **Step 6.1: Update the advanced-mode update block**

In `update()`, locate the `if (this.gameMode === 'advanced')` block (around lines 423–431):

```typescript
// OLD:
if (this.gameMode === 'advanced') {
  const reached: Skeleton[] = []
  this.skeletons.forEach(s => {
    s.x -= s.speed * (delta / 1000)
    s.sprite.setX(s.x)
    s.label.setX(s.x)
    s.aura.setX(s.x)
    if (s.x <= this.maxSkeletonReach) reached.push(s)
  })
  reached.forEach(s => { if (s.sprite.active) this.skeletonReachedPlayer(s) })
}
```

Replace with:

```typescript
// NEW:
if (this.gameMode === 'advanced') {
  // Move all skeletons
  this.skeletons.forEach(s => { s.x -= s.speed * (delta / 1000) })

  // Separation force: push overlapping skeletons apart (one pass, sorted by x)
  const positions = this.skeletons.map(s => s.x)
  const labelWidths = this.skeletons.map(s => s.label.width)
  const separated = applySeparationForce(
    positions,
    labelWidths,
    this.LABEL_PAD,
    this.BARRIER_X + 20,
    this.scale.width - 60,
  )
  this.skeletons.forEach((s, i) => { s.x = separated[i] })

  // Apply positions and collect damage events
  const reached: Skeleton[] = []
  this.skeletons.forEach(s => {
    s.sprite.setX(s.x)
    s.label.setX(s.x)
    s.aura.setX(s.x)
    if (s.x <= this.maxSkeletonReach) reached.push(s)
  })
  reached.forEach(s => { if (s.sprite.active) this.skeletonReachedPlayer(s) })
}
```

- [ ] **Step 6.2: Verify build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 6.3: Commit**

```bash
git add src/scenes/level-types/SkeletonSwarmLevel.ts
git commit -m "feat: add per-frame separation force in advanced mode to prevent skeleton overlap"
```

---

### Task 7: Add prevX snapshot and animation state tracking

**Files:**
- Modify: `src/scenes/level-types/SkeletonSwarmLevel.ts`

- [ ] **Step 7.1: Add prevX snapshot at the start of `update()`**

At the very beginning of `update()`, before the `this.goldManager?.update(delta)` line, add:

```typescript
// Snapshot positions before any movement — used for animation state detection
this.skeletons.forEach(s => { s.prevX = s.x })
```

- [ ] **Step 7.2: Add animation state tracking at the end of the movement blocks**

After both the `if (this.gameMode === 'advanced')` block and the `else` block (regular mode) have finished updating positions, add:

```typescript
// Animation state: switch between walk and idle based on whether skeleton moved this frame
this.skeletons.forEach(s => {
  if (s.isRiser) return  // riser is mid-rise tween; onComplete bootstraps animation
  const moved = Math.abs(s.x - s.prevX) > 0.5
  if (moved !== s.isMoving) {
    s.isMoving = moved
    s.sprite.play(moved ? 'ss_walk_anim' : 'ss_idle_anim')
  }
})
```

Place this block immediately after the closing `}` of the `} else { ... }` regular-mode block, so it runs for both modes after all positions are finalised. The exact insertion point in `update()` should be after the reached/damage processing and before any other post-movement logic.

- [ ] **Step 7.3: Verify build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 7.4: Run all tests**

```bash
npm run test
```

Expected: all tests PASS, including `skeletonSpacing.test.ts`.

- [ ] **Step 7.5: Commit**

```bash
git add src/scenes/level-types/SkeletonSwarmLevel.ts
git commit -m "feat: add animation state tracking (idle/walk) for skeleton sprites"
```

---

### Task 8: Manual verification

- [ ] **Step 8.1: Start the dev server**

```bash
npm run dev
```

Open the game in a browser. Navigate to a SkeletonSwarm level.

- [ ] **Step 8.2: Verify idle animation**

With the game running: spawn skeletons in regular mode. Once they reach their queue positions and stop moving, confirm each skeleton plays the idle arm-bob animation (weapon rises and falls repeatedly at ~3fps).

- [ ] **Step 8.3: Verify walk animation**

While skeletons are still moving toward their queue positions, confirm each skeleton plays the walk animation (legs alternate, arm swings at ~8fps). Verify the animation switches to idle once the skeleton is stationary.

- [ ] **Step 8.4: Verify no overlap with long words**

In `src/data/levels/world1.ts` (or whichever world uses SkeletonSwarm), temporarily add some long words (e.g. `'grandmother'`, `'encyclopedia'`) to the word list. Confirm that skeletons with these labels do not overlap each other — there should be visible spacing between the word labels.

Revert any temporary word list changes after verifying.

- [ ] **Step 8.5: Verify riser animation**

Confirm that riser skeletons show the static `ss_skeleton_rising` texture during the rise tween, then smoothly transition to the idle or walk animation after fully emerging.

- [ ] **Step 8.6: Verify second-visit behaviour**

Navigate away from the level (back to overland map) and then re-enter it. Open the browser developer console. Confirm there are no warnings about duplicate texture keys or animation keys.

- [ ] **Step 8.7: Final commit**

```bash
git add src/scenes/level-types/SkeletonSwarmLevel.ts
git commit -m "feat: skeleton swarm spread, idle, and walk animations complete"
```
