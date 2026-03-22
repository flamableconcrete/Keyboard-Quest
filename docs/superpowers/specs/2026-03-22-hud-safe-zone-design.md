# HUD Safe Zone — Design Spec

**Date:** 2026-03-22
**Status:** Approved

## Problem

The redesigned `LevelHUD` draws a top bar (56px) and a bottom bar (130px) across
the canvas, each bounded by a gold border line. Content rendered between those
lines is the visible playfield. Any level scene that positions the hero, pet, or
companion outside that range will have sprites clipped by or sitting on top of
the HUD panels.

**Affected scenes (at time of writing):**

| Scene | avatarY value | Safe? |
| --- | --- | --- |
| `CrazedCookLevel` | `height - 120` = **600** | ❌ 10px below bottom gold line (590) |
| `BaseLevelScene` default | `height - 100` = **620** | ❌ 30px below gold line (no scene currently relies on this, but it is a latent hazard) |
| All other scenes (explicit) | `height * 0.55`–`0.65` = 396–468 | ✅ |
| Boss scenes | `height / 2 - 50` = 310 | ✅ |

All non-Cook level scenes explicitly pass `avatarY` to `preCreate()`, so they
are unaffected by the current bad default. `BaseBossScene.preCreate()` likewise
always passes an explicit value before calling `super.preCreate()`. The unsafe
default is corrected here as a latent hazard.

## Canvas & HUD Dimensions

- Canvas: 1280 × 720
- `HUD_TOP_BAR_H` = 56 → top gold line at **y=56**
- `HUD_BOTTOM_BAR_H` = 130 → bottom gold line at **y=590** (`height - 130`)
- **Safe playfield:** y=56 to y=590 (534px tall)

## Design

### 1. New constants (`src/constants.ts`)

```ts
/** Top of the HUD-safe playfield (pixels from top of canvas) */
export const HUD_SAFE_Y_TOP = HUD_TOP_BAR_H            // 56

/** Distance from the bottom of the canvas to the HUD safe playfield boundary.
 *  Subtract from scene height at call site: safeBottom = height - HUD_SAFE_Y_BOTTOM_OFFSET */
export const HUD_SAFE_Y_BOTTOM_OFFSET = HUD_BOTTOM_BAR_H  // 130
```

`HUD_SAFE_Y_TOP` is a fixed pixel value. `HUD_SAFE_Y_BOTTOM_OFFSET` is
canvas-height-relative so it stays stateless (Phaser `height` is only available
inside a scene).

### 2. Fix default avatarY + runtime guard in `BaseLevelScene.preCreate()`

#### Import

Add `HUD_SAFE_Y_TOP` and `HUD_SAFE_Y_BOTTOM_OFFSET` to the existing
import from `'../constants'` at the top of `BaseLevelScene.ts`.

#### Default change

The existing default `height - 100` (620) is unsafe. Change
it to `Math.round(height * 0.65)` (468), matching the majority of explicit level
scene placements.

#### Runtime guard

After resolving `ay`, add a warn using the already-bound
`height` from `const { height } = this.scale`:

```ts
// existing line — height is already in scope here
const { height } = this.scale

const ay = avatarY ?? Math.round(height * 0.65)  // was: height - 100

const safeBottom = height - HUD_SAFE_Y_BOTTOM_OFFSET
if (ay < HUD_SAFE_Y_TOP || ay > safeBottom) {
  console.warn(
    `[${this.scene.key}] avatarY=${ay} is outside HUD safe zone ` +
    `(${HUD_SAFE_Y_TOP}–${safeBottom}). Hero/party may overlap HUD.`
  )
}
```

#### JSDoc

Update the `@param avatarY` line in the `preCreate()` JSDoc comment
from `(default: height - 100)` to `(default: height * 0.65)`.

No behavior change beyond the default correction. The warn fires in development
only when a scene passes a bad explicit value.

### 3. `CrazedCookLevel` fixes

#### a. Move hero/party into safe zone

```ts
// Before
this.preCreate(80, height - 120, { ... })  // y=600 — below gold line

// After
this.preCreate(80, height * 0.65, { ... }) // y=468 — consistent with other levels
```

At y=468 the hero stands just above the orc customers (y=475), which reads
naturally in the seating zone.

#### b. Remove leftover dark backing panel

```ts
// Remove this line — added before LevelHUD existed.
// At height=720: center y=662, spans y=634–690, entirely within the HUD
// bottom bar (y=590–720). LevelHUD fills that bar at HUD_BG_ALPHA=0.88,
// making this rectangle partially visible noise. Just delete it.
this.add.rectangle(width / 2, height - 58, 500, 56, 0x000000, 0.55).setOrigin(0.5)
```

## Testing

- `BaseLevelScene.test.ts` — existing test calls `preCreate(100, 400, ...)`;
  y=400 is within the safe zone (56–590), so the new warn does not fire. No
  test update needed.
- `CrazedCookLevel` has no unit tests. The coordinate changes are verified
  visually in the browser.
- No new tests are added — the warn is a dev-console aid, not a testable
  invariant.

## Non-goals

- Clamping avatarY automatically (hides bugs rather than surfacing them)
- Auditing non-avatar art assets (cook sprites, orc sprites, kitchen background
  are all within bounds and untouched)
- Changes to any level scene other than `CrazedCookLevel` (all others already
  use safe explicit Y values)

## Files changed

| File | Change |
| --- | --- |
| `src/constants.ts` | Add `HUD_SAFE_Y_TOP`, `HUD_SAFE_Y_BOTTOM_OFFSET` |
| `src/scenes/BaseLevelScene.ts` | Add imports; fix default avatarY; update JSDoc; add runtime warn |
| `src/scenes/level-types/CrazedCookLevel.ts` | Fix avatarY, remove backing panel |
