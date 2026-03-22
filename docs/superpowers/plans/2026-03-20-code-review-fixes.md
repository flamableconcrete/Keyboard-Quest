# Code Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve all Critical and Important issues found during post-refactoring code review plus remove dead code callouts.

**Architecture:** Eight independent, surgical edits — each touching one file or one pattern. No new abstractions introduced. Order matters only for Task 2 (MapNavigationController must be extended before LevelResultScene is updated).

**Tech Stack:** TypeScript, Phaser 3, Vitest — run tests with `npm run test`

---

## Task 1: Make `_preCreateCalled` guard unconditional

**Files:**
- Modify: `src/scenes/BaseLevelScene.ts:163`

The guard currently only fires in `import.meta.env.DEV`, meaning a production misconfiguration causes a silent null-dereference instead of a helpful error. The check is a single boolean — it is cheap in all environments.

- [ ] **Step 1: Read the guard**

Open `src/scenes/BaseLevelScene.ts` and locate line 163:
```typescript
if (import.meta.env.DEV && !this._preCreateCalled) {
```

- [ ] **Step 2: Remove the DEV gate**

Replace with:
```typescript
if (!this._preCreateCalled) {
```

The full block becomes:
```typescript
protected endLevel(passed: boolean) {
  if (!this._preCreateCalled) {
    throw new Error(
      `${this.scene.key}: endLevel() called before preCreate(). ` +
      `Did you forget to call super.preCreate() in create()?`
    )
  }
  if (this.finished) return
  ...
```

- [ ] **Step 3: Run the existing BaseLevelScene tests**

```bash
npx vitest run src/scenes/BaseLevelScene.test.ts
```
Expected: all pass. The existing test asserts the error is thrown — it passes both before and after this change because Vitest evaluates `import.meta.env.DEV` as `true` in the test environment. After this fix the guard also fires in production builds where it matters.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/BaseLevelScene.ts
git commit -m "fix: make _preCreateCalled guard unconditional (fires in production too)"
```

---

## Task 2: Wire `MapNavigationController.getNewUnlocks` into `LevelResultScene`

**Files:**
- Modify: `src/controllers/MapNavigationController.ts`
- Modify: `src/controllers/MapNavigationController.test.ts`
- Modify: `src/scenes/LevelResultScene.ts`

`getNewUnlocks` covers the "next level in same world" case but not the "boss unlocks first level of next world" case. Fix the controller first, then replace the private `unlockNextLevels` method in `LevelResultScene` with it.

- [ ] **Step 1: Write failing tests for the boss case**

The existing test file uses a `mockProfile(unlockedIds: string[])` helper (not `makeProfile`). It also already imports `getLevelsForWorld` and `world1Levels = getLevelsForWorld(1)`. Use those patterns.

Read `src/data/levels/world1.ts` and `src/data/levels/world2.ts` to get the actual boss level ID and the first world-2 level ID before writing the test — use the real data rather than string guesses.

Add to `src/controllers/MapNavigationController.test.ts`:

```typescript
// Add at the top alongside existing const:
const world1Levels = getLevelsForWorld(1)  // already exists — reuse it
const world2Levels = getLevelsForWorld(2)  // add this
const w1BossLevel = world1Levels[world1Levels.length - 1]  // last level in world 1

describe('getNewUnlocks — boss level', () => {
  it('unlocks first level of next world when completing a world boss', () => {
    const ctrl = new MapNavigationController(mockProfile([w1BossLevel.id]))
    const result = ctrl.getNewUnlocks(w1BossLevel.id, 1, true)
    expect(result).toHaveLength(1)
    expect(result[0]).toBe(world2Levels[0].id)
  })

  it('returns [] for boss completion if next world first level is already unlocked', () => {
    const ctrl = new MapNavigationController(mockProfile([w1BossLevel.id, world2Levels[0].id]))
    const result = ctrl.getNewUnlocks(w1BossLevel.id, 1, true)
    expect(result).toHaveLength(0)
  })
})
```

Run and confirm it fails:

```bash
npx vitest run src/controllers/MapNavigationController.test.ts
```

- [ ] **Step 2: Confirm tests fail**

Expected: 2 failing tests (`unlocks first level of next world`, `returns [] for boss completion...`). If they pass, `getNewUnlocks` already handles this case — skip Step 3 and proceed to Step 4.

- [ ] **Step 3: Update `getNewUnlocks` signature**

In `src/controllers/MapNavigationController.ts`, update the method signature to accept `isBoss`:

```typescript
getNewUnlocks(justCompletedId: string, world: number, isBoss = false): string[] {
  const levels = getLevelsForWorld(world)
  const idx = levels.findIndex(l => l.id === justCompletedId)
  if (idx < 0) return []

  const nextLevel = levels[idx + 1]
  if (nextLevel) {
    if (this.isUnlocked(nextLevel.id)) return []
    return [nextLevel.id]
  }

  // No next level in this world — if this is a boss, unlock first level of next world
  if (isBoss) {
    const nextWorldLevels = getLevelsForWorld(world + 1)
    if (nextWorldLevels && nextWorldLevels.length > 0) {
      const first = nextWorldLevels[0]
      if (!this.isUnlocked(first.id)) return [first.id]
    }
  }

  return []
}
```

- [ ] **Step 4: Run controller tests**

```bash
npx vitest run src/controllers/MapNavigationController.test.ts
```
Expected: all pass.

- [ ] **Step 5: Replace `unlockNextLevels` in `LevelResultScene`**

In `src/scenes/LevelResultScene.ts`:

1. Add import at the top:
```typescript
import { MapNavigationController } from '../controllers/MapNavigationController'
```

2. Replace the call site (line 102):
```typescript
// Before:
this.unlockNextLevels(level)

// After:
const navCtrl = new MapNavigationController(this.profile)
const newUnlocks = navCtrl.getNewUnlocks(level.id, level.world, level.isBoss ?? false)
for (const id of newUnlocks) {
  if (!this.profile.unlockedLevelIds.includes(id)) {
    this.profile.unlockedLevelIds.push(id)
  }
}
```

3. Delete the private `unlockNextLevels` method (lines 261–280).

- [ ] **Step 6: Run all tests**

```bash
npm run test
```
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add src/controllers/MapNavigationController.ts src/controllers/MapNavigationController.test.ts src/scenes/LevelResultScene.ts
git commit -m "fix: wire MapNavigationController.getNewUnlocks into LevelResultScene, remove duplicate unlockNextLevels"
```

---

## Task 3: Import `GOLD_PER_KILL` at all call sites

**Files (~22 files — all modify the same one-liner):**
- `src/scenes/level-types/*.ts` (9 files — excludes `CharacterCreatorLevel.ts` which Task 4 rewrites entirely)
- `src/scenes/boss-types/*.ts` (12 files)

`constants.ts` exports `GOLD_PER_KILL = 5` but every call site hardcodes `5` as a literal. This task wires the constant up.

**Note:** `CharacterCreatorLevel.ts` also has a `spawnGold(..., 5)` call, but Task 4 rewrites that entire file. Do not touch it in this task — let Task 4 include `GOLD_PER_KILL` in its rewrite.

- [ ] **Step 1: Confirm the full list of files**

```bash
grep -rn "spawnGold.*,\s*5" src/scenes/ --include="*.ts" -l
```

Note the list. Exclude `CharacterCreatorLevel.ts` from your sweep.

- [ ] **Step 2: Add import and replace literal in each file**

For each file in the list:

1. Add or extend the existing `import` from `../../constants` (or `../constants` for scenes directly under `scenes/`):
```typescript
import { GOLD_PER_KILL } from '../../constants'
```
(Use `'../constants'` for files in `src/scenes/` directly, `'../../constants'` for files in `src/scenes/level-types/` or `src/scenes/boss-types/`.)

2. Replace:
```typescript
this.goldManager.spawnGold(dropX, dropY, 5)
// or
this.goldManager.spawnGold(dropX, dropY, 5); // 5 gold per kill
// or
this.goldManager.spawnGold(dropX, dropY, 5) // 5 gold per kill
```
With:
```typescript
this.goldManager.spawnGold(dropX, dropY, GOLD_PER_KILL)
```

- [ ] **Step 3: Verify no literal `5)` gold drops remain**

```bash
grep -rn "spawnGold.*,\s*5[^0-9]" src/scenes/ --include="*.ts"
```
Expected: no output.

- [ ] **Step 4: Run all tests**

```bash
npm run test
```
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/
git commit -m "fix: replace hardcoded gold-per-kill literal with GOLD_PER_KILL constant"
```

---

## Task 4: Migrate `CharacterCreatorLevel` to extend `BaseLevelScene`

**Files:**
- Modify: `src/scenes/level-types/CharacterCreatorLevel.ts`

The only level scene not inheriting from `BaseLevelScene`. It manually re-declares `profileSlot`, `level`, `engine`, `goldManager`, and `finished` — all already on the base class. The scene intentionally skips `preCreate()` (no avatar, no word pool needed) and bypasses `endLevel()` (hardcoded 5-star result). Both exceptions should be documented in comments.

- [ ] **Step 1: Read the full file**

Read `src/scenes/level-types/CharacterCreatorLevel.ts` in full to understand its current structure.

- [ ] **Step 2: Confirm `goldManager` is never assigned**

```bash
grep -n "goldManager" src/scenes/level-types/CharacterCreatorLevel.ts
```

Expected: only a declaration (e.g. `goldManager`) and optional-chain usages like `goldManager?.update()`. If `goldManager` is assigned anywhere (e.g. `this.goldManager = new GoldManager(...)`), the rewrite below drops live behaviour — understand that assignment before proceeding.

- [ ] **Step 3: Rewrite**

Replace the class with:

```typescript
// src/scenes/level-types/CharacterCreatorLevel.ts
import { TypingEngine } from '../../components/TypingEngine'
import { BaseLevelScene } from '../BaseLevelScene'

export class CharacterCreatorLevel extends BaseLevelScene {
  constructor() { super('CharacterCreatorLevel') }

  create() {
    const { width, height } = this.scale

    // NOTE: preCreate() is intentionally NOT called here.
    // This scene has no avatar, companion, word pool, or spells — base-class setup
    // would add unnecessary visual elements. goldManager is therefore also absent.

    this.add.rectangle(width / 2, height / 2, width, height, 0x222222)

    this.add.text(width / 2, height / 2 - 100, 'Your journey begins now...', {
      fontSize: '28px', color: '#ffffff'
    }).setOrigin(0.5)

    this.add.text(width / 2, height / 2 - 40, 'Type start to embark on your quest!', {
      fontSize: '22px', color: '#aaaaaa'
    }).setOrigin(0.5)

    this.engine = new TypingEngine({
      scene: this,
      x: width / 2,
      y: height / 2 + 60,
      fontSize: 40,
      onWordComplete: this.onWordComplete.bind(this),
      onWrongKey: this.onWrongKey.bind(this),
    })

    this.engine.setWord('start')
  }

  protected onWordComplete(_word: string, _elapsed: number) {
    if (this.finished) return
    this.finished = true
    this.engine.destroy()

    // NOTE: endLevel() is intentionally NOT called here.
    // This intro level always awards 5/5 stars — no speed pressure for new players.
    this.time.delayedCall(500, () => {
      this.scene.start('LevelResult', {
        extraGold: 0,
        level: this.level,
        profileSlot: this.profileSlot,
        accuracyStars: 5,
        speedStars: 5,
        passed: true,
      })
    })
  }

  protected onWrongKey(): void {}

  update(_time: number, delta: number) {
    super.update(_time, delta)
  }
}
```

- [ ] **Step 4: Build to check types**

```bash
npm run build
```
Expected: no TypeScript errors.

- [ ] **Step 5: Run tests**

```bash
npm run test
```
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/scenes/level-types/CharacterCreatorLevel.ts
git commit -m "refactor: migrate CharacterCreatorLevel to extend BaseLevelScene"
```

---

## Task 5: Remove redundant `finished` guard from `MonsterManualLevel.endLevel`

**Files:**
- Modify: `src/scenes/level-types/MonsterManualLevel.ts:57–58`

`BaseLevelScene.endLevel` already checks `if (this.finished) return` on line 169. The same check in `MonsterManualLevel` is redundant and misleading — it implies the pre-save logic also needs guarding, when the base class already handles it.

- [ ] **Step 1: Remove the duplicate guard**

In `src/scenes/level-types/MonsterManualLevel.ts`, find:
```typescript
protected endLevel(passed: boolean) {
  if (this.finished) return

  const profile = loadProfile(this.profileSlot)
```

Change to:
```typescript
protected endLevel(passed: boolean) {
  const profile = loadProfile(this.profileSlot)
```

- [ ] **Step 2: Run tests**

```bash
npm run test
```
Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/level-types/MonsterManualLevel.ts
git commit -m "fix: remove redundant finished guard from MonsterManualLevel.endLevel (base class handles it)"
```

---

## Task 6: Delete empty pass-through `endLevel` overrides

**Files:**
- Modify: `src/scenes/level-types/MonsterArenaLevel.ts`
- Modify: `src/scenes/level-types/SkeletonSwarmLevel.ts`

Both overrides contain only `super.endLevel(passed)` — no cleanup, no extra logic. Inherited methods are called automatically; these overrides add noise and make it look like something important is happening when it isn't.

Note: `SlimeSplittingLevel.endLevel` removes a timer before calling super — keep that one.

- [ ] **Step 1: Delete from MonsterArenaLevel**

In `src/scenes/level-types/MonsterArenaLevel.ts`, delete:
```typescript
  protected endLevel(passed: boolean) {
    super.endLevel(passed)
  }
```

- [ ] **Step 2: Delete from SkeletonSwarmLevel**

In `src/scenes/level-types/SkeletonSwarmLevel.ts`, delete:
```typescript
  protected endLevel(passed: boolean) {
    super.endLevel(passed)
  }
```

- [ ] **Step 3: Run tests**

```bash
npm run test
```
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/level-types/MonsterArenaLevel.ts src/scenes/level-types/SkeletonSwarmLevel.ts
git commit -m "refactor: delete empty pass-through endLevel overrides (base class is inherited directly)"
```

---

## Task 7: Remove dead `InventoryController.getStatDelta`

**Files:**
- Modify: `src/controllers/InventoryController.ts:45–64`
- Modify: `src/controllers/InventoryController.test.ts` (no change needed unless tests reference it)

`getStatDelta` is public, well-formed, but has zero call sites in the codebase and no test coverage. YAGNI — remove it until CharacterScene actually needs it.

- [ ] **Step 1: Verify there are no call sites and no tests**

```bash
grep -rn "getStatDelta" src/ --include="*.ts"
```
Expected output: only the declaration in `src/controllers/InventoryController.ts`. If any call site or test is found, skip this task.

```bash
grep -n "getStatDelta" src/controllers/InventoryController.test.ts
```
Expected: no output. If any test references it, do not delete the method — add a call site to CharacterScene instead.

- [ ] **Step 2: Delete the method**

In `src/controllers/InventoryController.ts`, delete lines 45–64:
```typescript
  /** Returns a stat delta description when equipping an item vs. current. */
  getStatDelta(slot: EquipmentSlot, newItemId: string): Record<string, number> {
    ...
  }
```

- [ ] **Step 3: Run tests**

```bash
npm run test
```
Expected: all pass (no test referenced the deleted method).

- [ ] **Step 4: Commit**

```bash
git add src/controllers/InventoryController.ts
git commit -m "refactor: remove dead InventoryController.getStatDelta (no call sites)"
```

---

## Task 8: Consolidate skeleton speed formula into constants

**Files:**
- Modify: `src/constants.ts`
- Modify: `src/controllers/WaveController.ts:48`
- Modify: `src/scenes/level-types/SkeletonSwarmLevel.ts:278`
- Modify: `src/controllers/WaveController.test.ts` (may need updates)

Both files compute `60 + worldNumber * 10` independently. Neither references `constants.ts`. Add named constants and import them.

- [ ] **Step 1: Add constants**

In `src/constants.ts`, append:
```typescript
/** Base skeleton movement speed (px/s) at world 1 */
export const SKELETON_SPEED_BASE = 60
/** Speed increase per world number */
export const SKELETON_SPEED_PER_WORLD = 10
```

- [ ] **Step 2: Update WaveController**

In `src/controllers/WaveController.ts`, add import:
```typescript
import { SKELETON_SPEED_BASE, SKELETON_SPEED_PER_WORLD } from '../constants'
```

Replace line 48:
```typescript
// Before:
this.speed = 60 + config.worldNumber * 10

// After:
this.speed = SKELETON_SPEED_BASE + config.worldNumber * SKELETON_SPEED_PER_WORLD
```

- [ ] **Step 3: Update SkeletonSwarmLevel**

In `src/scenes/level-types/SkeletonSwarmLevel.ts`, add or extend the constants import:
```typescript
import { SKELETON_SPEED_BASE, SKELETON_SPEED_PER_WORLD } from '../../constants'
```

Replace line 278:
```typescript
// Before:
speed: 60 + this.level.world * 10,

// After:
speed: SKELETON_SPEED_BASE + this.level.world * SKELETON_SPEED_PER_WORLD,
```

- [ ] **Step 4: Run tests**

```bash
npm run test
```
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/constants.ts src/controllers/WaveController.ts src/scenes/level-types/SkeletonSwarmLevel.ts
git commit -m "fix: extract skeleton speed formula into SKELETON_SPEED_BASE/PER_WORLD constants"
```

---

## Task 9: Fix dead `endDelayMs` option and normalize `engineY` destructuring

**Files:**
- Modify: `src/scenes/BaseLevelScene.ts:25–31, 75–83`

Two `PreCreateOptions` issues:
1. `endDelayMs?: number` is declared in the interface but never read — the class field `readonly endDelayMs` is what's actually used.
2. `engineY` is accessed via `options.engineY` directly instead of being destructured alongside the other options.

- [ ] **Step 1: Check no callers passed `endDelayMs` via options**

```bash
grep -rn "endDelayMs" src/ --include="*.ts"
```
Expected: only the class field declaration `protected readonly endDelayMs: number = LEVEL_END_DELAY_MS` (in `BaseLevelScene`) and the override `protected readonly endDelayMs: number = BOSS_END_DELAY_MS` (in `BaseBossScene`). If any caller passes it in an options object like `preCreate(x, y, { endDelayMs: 200 })`, that call is silently ignored — remove the option from those callers before proceeding (the delay is controlled by the class field, not the options interface).

- [ ] **Step 2: Remove dead `endDelayMs` from `PreCreateOptions`**

In `src/scenes/BaseLevelScene.ts`, find the interface:
```typescript
export interface PreCreateOptions {
  avatarScale?: number
  engineY?: number
  engineFontSize?: number
  handsYOffset?: number
  endDelayMs?: number   // ← remove this line
}
```

Remove the `endDelayMs` field.

- [ ] **Step 3: Move `engineY` into the destructure**

Find:
```typescript
const {
  avatarScale = LEVEL_AVATAR_SCALE,
  engineFontSize = LEVEL_ENGINE_FONT_SIZE,
  handsYOffset = TYPING_HANDS_Y_OFFSET,
} = options
// ...
const engineY = options.engineY ?? (height - LEVEL_ENGINE_Y_OFFSET)
```

Consolidate to:
```typescript
const {
  avatarScale = LEVEL_AVATAR_SCALE,
  engineFontSize = LEVEL_ENGINE_FONT_SIZE,
  handsYOffset = TYPING_HANDS_Y_OFFSET,
  engineY: engineYOverride,
} = options
const engineY = engineYOverride ?? (height - LEVEL_ENGINE_Y_OFFSET)
```

- [ ] **Step 4: Run tests**

```bash
npm run test
```
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/BaseLevelScene.ts
git commit -m "fix: remove dead endDelayMs from PreCreateOptions, normalize engineY destructuring"
```
