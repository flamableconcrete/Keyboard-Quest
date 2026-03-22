# Shared Infrastructure Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate remaining duplication across level and boss scenes by pushing shared patterns (timers, camera flash, gold drops, HP setup) into base classes and constants, so individual scenes contain only scene-specific logic.

**Architecture:** Additive changes to `BaseLevelScene`, `BaseBossScene`, and `constants.ts`. Each helper method is `protected` so scenes can opt in without being forced. A separate cleanup task rewrites `main.ts` scene registration for readability.

**Tech Stack:** TypeScript, Phaser 3, Vitest — run tests with `npm run test`

**Prerequisites:** ✅ Complete — `2026-03-20-code-review-fixes.md` is fully merged (all 9 tasks done as of 2026-03-20).

---

## Task 1: Add `setupLevelTimer` helper to `BaseLevelScene`

**Files:**
- Modify: `src/scenes/BaseLevelScene.ts`
- Modify: `src/scenes/BaseLevelScene.test.ts`
- Modify: `src/scenes/level-types/GoblinWhackerLevel.ts` (example migration to validate the helper)
- Modify: `src/scenes/level-types/CrazedCookLevel.ts` (second migration to validate)

**Background:** Timer management (`timerEvent`, `timeLeft`, `timerText`) is duplicated verbatim across at least 9 level scenes. Pattern:
```typescript
this.timeLeft = this.level.timeLimit
this.timerEvent = this.time.addEvent({
  delay: 1000, repeat: this.level.timeLimit - 1,
  callback: () => {
    this.timeLeft--
    this.timerText.setText(`${this.timeLeft}s`)
    if (this.timeLeft <= 0) this.endLevel(false)
  }
})
```

The helper returns the timer event so scenes can remove it in their `endLevel` override.

- [ ] **Step 1: Write a failing test for `setupLevelTimer`**

Read `src/scenes/BaseLevelScene.test.ts` before writing anything — understand the existing mock infrastructure. Key facts about it:
- Phaser is fully mocked via `vi.mock('phaser', ...)` at the top of the file
- Tests use a `TestLevelScene` concrete subclass that exposes internals via getters
- There is no `fakeTimeTick` helper — Phaser's `time.addEvent` is a mock object; the callback is captured and invoked manually
- Internal state is manipulated directly via `(scene as any).field = ...`

Add the test by extending `TestLevelScene` to expose `setupLevelTimer` and capture the callback:

```typescript
describe('BaseLevelScene.setupLevelTimer', () => {
  it('calls endLevel(false) when timer expires', () => {
    const scene = new TestLevelScene()
    ;(scene as any).init({ level: mockLevel, profileSlot: 0 })
    ;(scene as any)._preCreateCalled = true

    // Mock the timer: capture the callback when addEvent is called
    let timerCallback: (() => void) | null = null
    ;(scene as any).time = {
      addEvent: (_opts: { delay: number; repeat: number; callback: () => void }) => {
        timerCallback = _opts.callback
        return { remove: () => {} }
      },
      delayedCall: (_ms: number, cb: () => void) => cb(),
    }
    ;(scene as any).scene = { start: () => {}, key: 'Test' }

    // Mock endLevel to spy on it
    const endLevelSpy = vi.fn()
    ;(scene as any).endLevel = endLevelSpy

    const fakeText = { setText: () => {} }
    ;(scene as any).setupLevelTimer(3, fakeText)

    expect(timerCallback).not.toBeNull()

    // Fire the callback 3 times (simulating 3 seconds)
    timerCallback!()
    timerCallback!()
    timerCallback!()

    expect(endLevelSpy).toHaveBeenCalledWith(false)
  })
})
```

Run and confirm the test fails (method doesn't exist yet):
```bash
npx vitest run src/scenes/BaseLevelScene.test.ts
```

- [ ] **Step 2: Implement `setupLevelTimer` in `BaseLevelScene`**

Add to `src/scenes/BaseLevelScene.ts` (after `preCreate`, before `endLevel`):

```typescript
/**
 * Set up a countdown timer that calls endLevel(false) when it reaches zero.
 * Returns the TimerEvent so the caller can remove it in endLevel cleanup.
 *
 * Usage in create():
 *   if (this.level.timeLimit) {
 *     this.timerEvent = this.setupLevelTimer(this.level.timeLimit, timerText)
 *   }
 */
protected setupLevelTimer(
  seconds: number,
  displayText: Phaser.GameObjects.Text
): Phaser.Time.TimerEvent {
  let timeLeft = seconds
  displayText.setText(`${timeLeft}s`)
  return this.time.addEvent({
    delay: 1000,
    repeat: seconds - 1,
    callback: () => {
      timeLeft--
      displayText.setText(`${timeLeft}s`)
      if (timeLeft <= 0) this.endLevel(false)
    },
  })
}
```

- [ ] **Step 3: Run the test**

```bash
npx vitest run src/scenes/BaseLevelScene.test.ts
```
Expected: new test passes.

- [ ] **Step 4: Migrate `GoblinWhackerLevel` to use the helper**

Read `src/scenes/level-types/GoblinWhackerLevel.ts` and find the inline timer setup. Replace it with:
```typescript
if (this.level.timeLimit) {
  this.timerEvent = this.setupLevelTimer(this.level.timeLimit, this.timerText)
}
```

Remove the inlined `timeLeft`, timer callback, and manual `timerText.setText` that were previously in that block. Verify the `endLevel` override still removes `this.timerEvent?.remove()`.

- [ ] **Step 5: Migrate `CrazedCookLevel` to use the helper**

Same operation on `src/scenes/level-types/CrazedCookLevel.ts`.

- [ ] **Step 6: Run all tests**

```bash
npm run test
```
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add src/scenes/BaseLevelScene.ts src/scenes/BaseLevelScene.test.ts \
        src/scenes/level-types/GoblinWhackerLevel.ts \
        src/scenes/level-types/CrazedCookLevel.ts
git commit -m "refactor: add setupLevelTimer helper to BaseLevelScene, migrate 2 levels"
```

**Follow-up (not in this task):** Migrate the remaining 7 timer-using scenes using the same pattern.

---

## Task 2: Add `spawnWordGold` and `flashOnWrongKey` helpers to `BaseLevelScene`

**Files:**
- Modify: `src/scenes/BaseLevelScene.ts`
- Modify: `src/scenes/BaseLevelScene.test.ts`
- Modify: `src/scenes/level-types/MonsterManualLevel.ts` (example migration)
- Modify: `src/scenes/level-types/DungeonEscapeLevel.ts` (second migration)

Two patterns appear in nearly every `onWordComplete` / `onWrongKey` implementation:

**Gold drop (every level):**
```typescript
if (this.goldManager) {
  const dropX = this.scale.width / 2 + (Math.random() * 200 - 100)
  const dropY = this.scale.height / 2 + (Math.random() * 100 - 50)
  this.goldManager.spawnGold(dropX, dropY, GOLD_PER_KILL)
}
```

**Camera flash on wrong key (most levels):**
```typescript
this.cameras.main.flash(80, 120, 0, 0)
```

- [ ] **Step 1: Add `spawnWordGold` to `BaseLevelScene`**

```typescript
import { GOLD_PER_KILL } from '../constants'

/** Spawn a gold drop near the center of the screen. Call from onWordComplete. */
protected spawnWordGold(): void {
  if (!this.goldManager) return
  const cx = this.scale.width / 2
  const cy = this.scale.height / 2
  const dropX = cx + (Math.random() * 200 - 100)
  const dropY = cy + (Math.random() * 100 - 50)
  this.goldManager.spawnGold(dropX, dropY, GOLD_PER_KILL)
}
```

- [ ] **Step 2: Add `flashOnWrongKey` to `BaseLevelScene`**

```typescript
/** Flash the screen red briefly. Call from onWrongKey. */
protected flashOnWrongKey(): void {
  this.cameras.main.flash(80, 120, 0, 0)
}
```

- [ ] **Step 3: Write tests**

In `src/scenes/BaseLevelScene.test.ts`, add tests for both helpers. The `spawnWordGold` test should spy on `goldManager.spawnGold` and assert it is called once with `GOLD_PER_KILL` as the third argument. The `flashOnWrongKey` test should spy on `cameras.main.flash`.

```typescript
describe('BaseLevelScene.spawnWordGold', () => {
  it('calls goldManager.spawnGold with GOLD_PER_KILL', () => {
    const scene = new TestLevelScene()
    ;(scene as any).init({ level: mockLevel, profileSlot: 0 })
    const spawnSpy = vi.fn()
    ;(scene as any).goldManager = { spawnGold: spawnSpy }
    ;(scene as any).scale = { width: 1280, height: 720 }

    ;(scene as any).spawnWordGold()

    expect(spawnSpy).toHaveBeenCalledOnce()
    expect(spawnSpy.mock.calls[0][2]).toBe(GOLD_PER_KILL)
  })

  it('does nothing if goldManager is absent', () => {
    const scene = new TestLevelScene()
    ;(scene as any).goldManager = null
    ;(scene as any).scale = { width: 1280, height: 720 }
    expect(() => (scene as any).spawnWordGold()).not.toThrow()
  })
})
```

Add `import { GOLD_PER_KILL } from '../constants'` to the test file imports.

Run:
```bash
npx vitest run src/scenes/BaseLevelScene.test.ts
```
Expected: new tests pass.

- [ ] **Step 4: Migrate `MonsterManualLevel`**

In `onWordComplete`, replace the gold-drop block with `this.spawnWordGold()`.
In `onWrongKey`, replace the flash with `this.flashOnWrongKey()`.

- [ ] **Step 5: Migrate `DungeonEscapeLevel`**

Same operation.

- [ ] **Step 6: Run all tests**

```bash
npm run test
```
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add src/scenes/BaseLevelScene.ts src/scenes/BaseLevelScene.test.ts \
        src/scenes/level-types/MonsterManualLevel.ts \
        src/scenes/level-types/DungeonEscapeLevel.ts
git commit -m "refactor: add spawnWordGold/flashOnWrongKey helpers to BaseLevelScene, migrate 2 levels"
```

**Follow-up:** Apply same migration to remaining scenes.

---

## Task 3: Add `setupBossHP` and `setupBossTimer` helpers to `BaseBossScene`

**Files:**
- Read first: `src/scenes/BaseBossScene.ts`
- Read first: `src/scenes/boss-types/MiniBossTypical.ts` (typical HP + timer usage)
- Modify: `src/scenes/BaseBossScene.ts`
- Modify: `src/scenes/BaseBossScene.test.ts` (or create if absent)
- Modify: `src/scenes/boss-types/MiniBossTypical.ts` (example migration)

**Background:** All 12 boss scenes manually manage `bossHp`, `bossMaxHp`, `playerHp`, `hpText`, `bossHpText`, and a Phaser countdown timer. The patterns are nearly identical across all of them.

- [ ] **Step 1: Read the existing base class and a boss file**

Read `src/scenes/BaseBossScene.ts` and `src/scenes/boss-types/MiniBossTypical.ts` fully before writing anything.

- [ ] **Step 2: Write a failing test for `setupBossTimer`**

Create `src/scenes/BaseBossScene.test.ts` if it doesn't exist (mirror `BaseLevelScene.test.ts` structure). Add a test that calls `setupBossTimer(10, callback)` and verifies the callback fires after 10 ticks.

Run and confirm fail:
```bash
npx vitest run src/scenes/BaseBossScene.test.ts
```

- [ ] **Step 3: Add `setupBossTimer` to `BaseBossScene`**

```typescript
/**
 * Set up a boss countdown timer. The `onTick` callback receives the current
 * seconds remaining. Returns the TimerEvent.
 */
protected setupBossTimer(
  seconds: number,
  timerText: Phaser.GameObjects.Text,
  onExpire: () => void
): Phaser.Time.TimerEvent {
  let timeLeft = seconds
  timerText.setText(`${timeLeft}s`)
  return this.time.addEvent({
    delay: 1000,
    repeat: seconds - 1,
    callback: () => {
      timeLeft--
      timerText.setText(`${timeLeft}s`)
      if (timeLeft <= 0) onExpire()
    },
  })
}
```

- [ ] **Step 4: Write a failing test for `setupBossHP`**

Add a test that calls `setupBossHP(6)` and asserts initial state (bossMaxHp = 6, bossHp = 6, playerHp = 3).

- [ ] **Step 5: Add `setupBossHP` to `BaseBossScene`**

```typescript
export interface BossHPState {
  bossHp: number
  bossMaxHp: number
  playerHp: number
}

/**
 * Returns an initialized HP state object. The SCENE owns this object and
 * updates its values directly (hp.bossHp--, hp.playerHp--) as the fight
 * progresses. This is NOT a controller — it does not own the state after
 * returning it. This is intentionally different from the controller pattern
 * used elsewhere: boss HP is deeply intertwined with rendering and Phaser
 * tween state, making a pure controller impractical.
 */
protected setupBossHP(bossWordCount: number, playerStartHp = 3): BossHPState {
  return {
    bossHp: bossWordCount,
    bossMaxHp: bossWordCount,
    playerHp: playerStartHp,
  }
}
```

- [ ] **Step 6: Run tests**

```bash
npx vitest run src/scenes/BaseBossScene.test.ts
```
Expected: all pass.

- [ ] **Step 7: Migrate `MiniBossTypical` to use helpers**

Read `src/scenes/boss-types/MiniBossTypical.ts`. Replace:
- The manual timer setup with `this.setupBossTimer(...)`
- The HP initialization block with `const hp = this.setupBossHP(this.wordQueue.length)`
- Update references from `this.bossHp` to `hp.bossHp` etc., or destructure

- [ ] **Step 8: Run all tests**

```bash
npm run test
```
Expected: all pass.

- [ ] **Step 9: Commit**

```bash
git add src/scenes/BaseBossScene.ts src/scenes/BaseBossScene.test.ts \
        src/scenes/boss-types/MiniBossTypical.ts
git commit -m "refactor: add setupBossHP/setupBossTimer helpers to BaseBossScene, migrate MiniBossTypical"
```

**Follow-up:** Apply to remaining 11 boss scenes.

---

## Task 4: Add missing constants to `constants.ts`

**Files:**
- Modify: `src/constants.ts`
- Modify (spot-check 2–3 files that use the new constants)

Several values are hardcoded across multiple scenes but not yet in `constants.ts`. Add them here; wiring up call sites is a follow-up sweep.

- [ ] **Step 1: Grep for the patterns**

```bash
grep -rn "playerHp = 3\|playerHp=3" src/scenes/ --include="*.ts"
grep -rn "width + 30\|width+30" src/scenes/ --include="*.ts"
grep -rn "battleX.*300\|battleX.*350" src/scenes/ --include="*.ts"
```

Note the counts.

- [ ] **Step 2: Add constants to `src/constants.ts`**

```typescript
/** Default player HP at the start of a level */
export const DEFAULT_PLAYER_HP = 3

/** X offset from canvas right edge for enemy spawn position */
export const ENEMY_SPAWN_X_OFFSET = 30

/** Default boss/enemy stop X in battle scenes */
export const BATTLE_STOP_X = 350

/** Skeleton barrier X position (right edge of safe zone) */
export const SKELETON_BARRIER_X = 265
```

- [ ] **Step 3: Wire up `DEFAULT_PLAYER_HP` and `BATTLE_STOP_X` in call sites**

Wire `DEFAULT_PLAYER_HP` in two scenes: `SkeletonSwarmLevel` and `GoblinWhackerLevel`.

Wire `BATTLE_STOP_X` in `WaveController.ts` line 45 (currently `config.battleX ?? 350`) — replace `350` with `BATTLE_STOP_X`. This closes the gap where `BATTLE_STOP_X` is defined but the most important consumer (`WaveController`) still hardcodes the value.

- [ ] **Step 4: Run tests**

```bash
npm run test
```
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/constants.ts src/scenes/level-types/SkeletonSwarmLevel.ts src/scenes/level-types/GoblinWhackerLevel.ts
git commit -m "refactor: add DEFAULT_PLAYER_HP, ENEMY_SPAWN_X_OFFSET, BATTLE_STOP_X, SKELETON_BARRIER_X constants; wire into WaveController and 2 scenes"
```

---

## Task 5: Clean up `main.ts` scene registration

**Files:**
- Modify: `src/main.ts`

All 50+ scenes are registered in a single array literal on one very long line. Group them by category for readability.

- [ ] **Step 1: Read `src/main.ts`**

Read the full file, note the scene list structure, and identify scene categories.

- [ ] **Step 2: Restructure scene registration**

Replace the monolithic `scene: [...]` array with grouped constants defined above the Phaser config. Based on the current imports in `src/main.ts`:

```typescript
const utilityScenes = [
  BootScene, PreloadScene, MainMenuScene, ProfileSelectScene,
  AvatarCustomizerScene, OverlandMapScene, LevelIntroScene,
  LevelResultScene, LevelScene, BossBattleScene, CharacterScene,
  TavernScene, StableScene, CutsceneScene, VictoryScene,
  SettingsScene, ShopScene, TrophyRoomScene,
  MobileLevelIntroScene, MobileOverlandMapScene, PauseScene,
]

const levelTypeScenes = [
  GoblinWhackerLevel, SkeletonSwarmLevel, MonsterArenaLevel,
  UndeadSiegeLevel, SlimeSplittingLevel, DungeonPlatformerLevel,
  DungeonEscapeLevel, PotionBrewingLabLevel, MagicRuneTypingLevel,
  MonsterManualLevel, WoodlandFestivalLevel, CrazedCookLevel,
  GuildRecruitmentLevel,
  // CharacterCreatorLevel is handled by LevelScene dispatcher — add here if present in imports
]

const bossTypeScenes = [
  MiniBossTypical, GrizzlefangBoss, HydraBoss, SlimeKingBoss,
  ClockworkDragonBoss, BaronTypoBoss, SpiderBoss, FlashWordBoss,
  BoneKnightBoss, DiceLichBoss, AncientDragonBoss, TypemancerBoss,
]
```

Then in the Phaser config:
```typescript
scene: [...utilityScenes, ...levelTypeScenes, ...bossTypeScenes],
```

**Important:** Read the actual `src/main.ts` before making changes and verify the groupings match the real imports exactly. The groupings above are derived from the current file and should be accurate, but scene additions since this plan was written may differ.

- [ ] **Step 3: Build**

```bash
npm run build
```
Expected: no errors (no logic changed, only formatting).

- [ ] **Step 4: Commit**

```bash
git add src/main.ts
git commit -m "refactor: group scene registration in main.ts into utility/level/boss arrays"
```

---

## Task 6: Add per-level-type config interfaces

**Files:**
- Modify: `src/types/index.ts`
- No scene changes required — this is additive type safety

Several `LevelConfig` fields are only meaningful for specific level types (`waveCount`, `timeLimit`, `orderQuota`, `castleHp`) but are declared as optional on the base interface. Scenes access them without checking. Add narrowed interfaces.

- [ ] **Step 1: Read `src/types/index.ts`**

Find the `LevelConfig` interface and note which fields are level-type-specific.

- [ ] **Step 2: Add narrowed interfaces**

In `src/types/index.ts`, below `LevelConfig`:

```typescript
/** Config for wave-based levels (SkeletonSwarm, UndeadSiege, etc.) */
export interface WaveLevelConfig extends LevelConfig {
  waveCount: number
}

/** Config for timed levels (GoblinWhacker, CrazedCook, etc.) */
export interface TimedLevelConfig extends LevelConfig {
  timeLimit: number
}

/** Config for order-quota levels (CrazedCook) */
export interface OrderLevelConfig extends TimedLevelConfig {
  orderQuota: number
}

/** Config for siege levels with castle HP (UndeadSiege) */
export interface SiegeLevelConfig extends WaveLevelConfig {
  castleHp: number
}
```

- [ ] **Step 3: Update one scene to use a narrowed type**

In `src/scenes/level-types/SkeletonSwarmLevel.ts`, update the `init` signature to receive `WaveLevelConfig` instead of `LevelConfig`:
```typescript
init(data: { level: WaveLevelConfig; profileSlot: number }) {
```

This will cause a TypeScript error if any call site passes a config without `waveCount` — which is the desired check.

- [ ] **Step 4: Build**

```bash
npm run build
```
Fix any type errors that surface (if a level data entry is missing `waveCount`, add it).

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/scenes/level-types/SkeletonSwarmLevel.ts
git commit -m "feat: add WaveLevelConfig, TimedLevelConfig, OrderLevelConfig, SiegeLevelConfig narrowed interfaces"
```
