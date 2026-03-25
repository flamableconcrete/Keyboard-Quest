# HUD Safe Zone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add HUD safe-zone constants, a dev-time console.warn guard in `BaseLevelScene.preCreate()`, and fix `CrazedCookLevel` so the hero/party no longer renders below the bottom HUD gold line.

**Architecture:** Three sequential changes touching three files. Constants first (no deps), then `BaseLevelScene` (imports the new constants), then `CrazedCookLevel` (coordinate fix). No new abstractions or interfaces needed.

**Tech Stack:** TypeScript, Phaser 3, Vitest

---

## File Map

| File | Change |
| --- | --- |
| `src/constants.ts` | Add `HUD_SAFE_Y_TOP` and `HUD_SAFE_Y_BOTTOM_OFFSET` |
| `src/scenes/BaseLevelScene.ts` | Import new constants; fix default avatarY; update JSDoc; add runtime warn |
| `src/scenes/level-types/CrazedCookLevel.ts` | Change avatarY from `height - 120` to `height * 0.65`; delete backing panel rectangle |

---

### Task 1: Add safe-zone constants

**Files:**
- Modify: `src/constants.ts`

The safe zone is derived entirely from existing constants, so the new ones are just named aliases. Add them after the existing `HUD_BOTTOM_BAR_H` line.

- [ ] **Step 1: Add the two constants to `src/constants.ts`**

Open `src/constants.ts`. After this existing block:

```ts
/** Height of the top HUD panel bar in pixels */
export const HUD_TOP_BAR_H = 56
/** Height of the bottom HUD panel bar in pixels */
export const HUD_BOTTOM_BAR_H = 130
```

Add:

```ts
/** Top boundary of the HUD-safe playfield (pixels from top of canvas).
 *  Avatar Y values must be >= this. */
export const HUD_SAFE_Y_TOP = HUD_TOP_BAR_H           // 56

/** Distance from the bottom of the canvas to the HUD-safe playfield boundary.
 *  Compute the safe bottom at call site: safeBottom = height - HUD_SAFE_Y_BOTTOM_OFFSET.
 *  Avatar Y values must be <= safeBottom. */
export const HUD_SAFE_Y_BOTTOM_OFFSET = HUD_BOTTOM_BAR_H  // 130
```

- [ ] **Step 2: Run the test suite to confirm nothing broke**

```bash
npm run test
```

Expected: all tests pass (no changes to behavior yet).

- [ ] **Step 3: Commit**

```bash
git add src/constants.ts
git commit -m "feat: add HUD_SAFE_Y_TOP and HUD_SAFE_Y_BOTTOM_OFFSET constants"
```

---

### Task 2: Fix default avatarY + add runtime guard in `BaseLevelScene`

**Files:**
- Modify: `src/scenes/BaseLevelScene.ts`
- Test: `src/scenes/BaseLevelScene.test.ts` (run existing — no new tests per spec)

**Context:** `BaseLevelScene.preCreate()` resolves `avatarY` with a default of `height - 100` (720 − 100 = 620), which is 30px below the bottom gold line at y=590. The fix changes the default to `Math.round(height * 0.65)` (468). A `console.warn` is added so future out-of-bounds values are immediately visible in the dev console.

- [ ] **Step 1: Add the new constants to the import block**

In `src/scenes/BaseLevelScene.ts`, find the existing import from `'../constants'`:

```ts
import {
  LEVEL_AVATAR_SCALE,
  LEVEL_END_DELAY_MS,
  PET_SPEED_BASE,
  PET_SPEED_COEFF,
  GOLD_PER_KILL,
} from '../constants'
```

Add `HUD_SAFE_Y_TOP` and `HUD_SAFE_Y_BOTTOM_OFFSET`:

```ts
import {
  LEVEL_AVATAR_SCALE,
  LEVEL_END_DELAY_MS,
  PET_SPEED_BASE,
  PET_SPEED_COEFF,
  GOLD_PER_KILL,
  HUD_SAFE_Y_TOP,
  HUD_SAFE_Y_BOTTOM_OFFSET,
} from '../constants'
```

- [ ] **Step 2: Fix the default avatarY and add the runtime guard**

Inside `preCreate()`, find these two lines:

```ts
const ax = avatarX ?? 100
const ay = avatarY ?? (height - 100)
```

Replace with:

```ts
const ax = avatarX ?? 100
const ay = avatarY ?? Math.round(height * 0.65)

const safeBottom = height - HUD_SAFE_Y_BOTTOM_OFFSET
if (ay < HUD_SAFE_Y_TOP || ay > safeBottom) {
  console.warn(
    `[${this.scene.key}] avatarY=${ay} is outside HUD safe zone ` +
    `(${HUD_SAFE_Y_TOP}–${safeBottom}). Hero/party may overlap HUD.`
  )
}
```

- [ ] **Step 3: Update the JSDoc `@param avatarY` line**

Find the JSDoc comment above `preCreate()`. It contains a line like:

```
 * @param avatarY  Y position of the player avatar sprite (default: height - 100)
```

Change it to:

```
 * @param avatarY  Y position of the player avatar sprite (default: height * 0.65 ≈ 468)
```

- [ ] **Step 4: Run existing tests**

```bash
npm run test
```

Expected: all tests pass. The existing `BaseLevelScene.test.ts` calls `preCreate(100, 400, ...)` — y=400 is inside the safe zone (56–590) so the warn does not fire and nothing changes for that test.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/BaseLevelScene.ts
git commit -m "fix: correct BaseLevelScene default avatarY and add HUD safe-zone guard"
```

---

### Task 3: Fix CrazedCookLevel

**Files:**
- Modify: `src/scenes/level-types/CrazedCookLevel.ts`

**Context:** Two problems to fix:
1. `preCreate(80, height - 120, ...)` → y=600, below the y=590 gold line. Change to `height * 0.65` (y=468).
2. A leftover dark rectangle (`this.add.rectangle(width / 2, height - 58, 500, 56, 0x000000, 0.55)`) from before `LevelHUD` existed. It spans y=634–690, entirely inside the bottom HUD bar. Delete it.

- [ ] **Step 1: Fix the avatarY in `preCreate()`**

In `CrazedCookLevel.ts`, find:

```ts
this.preCreate(80, height - 120, {
```

Change to:

```ts
this.preCreate(80, height * 0.65, {
```

- [ ] **Step 2: Remove the leftover backing panel**

Find and delete this line:

```ts
this.add.rectangle(width / 2, height - 58, 500, 56, 0x000000, 0.55).setOrigin(0.5)
```

It has a comment above it:

```ts
// Dark backing panel behind the word display
```

Delete that comment line too.

- [ ] **Step 3: Run tests**

```bash
npm run test
```

Expected: all tests pass (CrazedCookLevel has no unit tests).

- [ ] **Step 4: Visual verification**

Start the dev server and navigate to a CrazedCookLevel:

```bash
npm run dev
```

Open the game in a browser. Play through to a level that uses `CrazedCookLevel` (world 1, "Crazed Cook's Camp"). Verify:
- Hero, pet, and companion sprites sit above the bottom gold line
- No dark rectangle bleed inside the HUD bottom bar
- No `console.warn` fires in the browser console

- [ ] **Step 5: Commit**

```bash
git add src/scenes/level-types/CrazedCookLevel.ts
git commit -m "fix: move CrazedCookLevel hero into HUD safe zone, remove stale backing panel"
```
