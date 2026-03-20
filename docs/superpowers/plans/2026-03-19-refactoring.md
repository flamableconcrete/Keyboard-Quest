# Refactoring: Maintainability Improvements — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate ~1,500 lines of boilerplate duplication across 26 level/boss scenes via base classes, and extract game logic from the 5 most complex scenes into pure TypeScript controllers for unit testing.

**Architecture:** Two abstract base classes (`BaseLevelScene`, `BaseBossScene`) consolidate shared scene lifecycle (init, avatar/companion setup, word pool, TypingEngine, endLevel routing). Five pure TS controllers (`WaveController`, `KitchenController`, `PlatformerController`, `InventoryController`, `MapNavigationController`) extract logic from the largest scenes so it can be tested without Phaser. A `constants.ts` file centralizes magic numbers.

**Tech Stack:** TypeScript, Phaser 3, Vitest — run tests with `npx vitest run <path>`

**Spec:** `docs/superpowers/specs/2026-03-19-refactoring-design.md`

---

## Chunk 1: Infrastructure (Constants + Base Classes + Tests)

### Task 1: Create constants file

**Files:**
- Create: `src/constants.ts`

- [ ] **Step 1: Create `src/constants.ts`**

```typescript
// src/constants.ts
// Centralized magic numbers for all level and boss scenes.

/** Avatar X position in standard level scenes */
export const LEVEL_AVATAR_X = 80
/** Avatar Y offset from pathY in standard level scenes */
export const LEVEL_AVATAR_SCALE = 1.5

/** Avatar X for boss scenes (fraction of canvas width) */
export const BOSS_AVATAR_X_FRAC = 0.25
/** Avatar Y offset from canvas center for boss scenes */
export const BOSS_AVATAR_Y_OFFSET = 50
/** Avatar scale for boss scenes */
export const BOSS_AVATAR_SCALE = 2.5

/** Y position of typing engine from canvas bottom, standard levels */
export const LEVEL_ENGINE_Y_OFFSET = 80
/** Font size for typing engine in standard levels */
export const LEVEL_ENGINE_FONT_SIZE = 40

/** Y position of typing engine from canvas bottom, boss scenes */
export const BOSS_ENGINE_Y_OFFSET = 160
/** Font size for typing engine in boss scenes */
export const BOSS_ENGINE_FONT_SIZE = 48

/** Y position of typing hands hints from canvas bottom */
export const TYPING_HANDS_Y_OFFSET = 100

/** Delay (ms) before transitioning to LevelResult in standard levels */
export const LEVEL_END_DELAY_MS = 500
/** Delay (ms) before transitioning to LevelResult in boss scenes */
export const BOSS_END_DELAY_MS = 1000

/** Gold earned per enemy/word defeated */
export const GOLD_PER_KILL = 5
/** Gold manager pet speed coefficient: base + level * this */
export const PET_SPEED_COEFF = 25
/** Gold manager pet speed base */
export const PET_SPEED_BASE = 100
```

- [ ] **Step 2: Commit**

```bash
git add src/constants.ts
git commit -m "feat: add constants file for shared magic numbers"
```

---

### Task 2: Create BaseLevelScene

**Files:**
- Create: `src/scenes/BaseLevelScene.ts`

- [ ] **Step 1: Create `src/scenes/BaseLevelScene.ts`**

```typescript
// src/scenes/BaseLevelScene.ts
import Phaser from 'phaser'
import { LevelConfig } from '../types'
import { TypingEngine } from '../components/TypingEngine'
import { SpellCaster } from '../components/SpellCaster'
import { SpellData } from '../types'
import { GoldManager } from '../utils/goldSystem'
import { loadProfile } from '../utils/profile'
import { getWordPool } from '../utils/words'
import { calcAccuracyStars, calcSpeedStars } from '../utils/scoring'
import { setupPause } from '../utils/pauseSetup'
import { generateAllCompanionTextures } from '../art/companionsArt'
import { CompanionAndPetRenderer } from '../components/CompanionAndPetRenderer'
import { TypingHands } from '../components/TypingHands'
import {
  LEVEL_ENGINE_Y_OFFSET,
  LEVEL_ENGINE_FONT_SIZE,
  LEVEL_AVATAR_SCALE,
  TYPING_HANDS_Y_OFFSET,
  LEVEL_END_DELAY_MS,
  PET_SPEED_BASE,
  PET_SPEED_COEFF,
} from '../constants'

export interface PreCreateOptions {
  avatarScale?: number
  engineY?: number
  engineFontSize?: number
  handsYOffset?: number
  endDelayMs?: number
}

export abstract class BaseLevelScene extends Phaser.Scene {
  protected level!: LevelConfig
  protected profileSlot!: number
  protected finished = false
  protected engine!: TypingEngine
  protected words: string[] = []
  protected wordQueue: string[] = []
  protected goldManager!: GoldManager
  protected spellCaster?: SpellCaster
  protected typingHands?: TypingHands
  private _preCreateCalled = false

  // Override in BaseBossScene to use a longer delay
  protected readonly endDelayMs = LEVEL_END_DELAY_MS

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.finished = false
    this._preCreateCalled = false
  }

  /**
   * Call at the TOP of your create() method.
   * Handles: pause, avatar, companion/pet, GoldManager, word pool,
   * TypingEngine, SpellCaster (conditional), TypingHands (conditional).
   *
   * @param avatarX  X position of the player avatar sprite (default: 100)
   * @param avatarY  Y position of the player avatar sprite (default: height - 100)
   * @param options  Optional overrides for scale, engine position, font size, etc.
   *
   * NOTE: If the player has spells, preCreate() will create a SpellCaster and call
   * handleSpellEffect() for spell events. Scenes that don't use spells can ignore
   * this — the default handleSpellEffect() is a no-op.
   */
  protected preCreate(
    avatarX?: number,
    avatarY?: number,
    options: PreCreateOptions = {}
  ) {
    this._preCreateCalled = true

    const {
      avatarScale = LEVEL_AVATAR_SCALE,
      engineFontSize = LEVEL_ENGINE_FONT_SIZE,
      handsYOffset = TYPING_HANDS_Y_OFFSET,
    } = options

    setupPause(this, this.profileSlot)
    const { width, height } = this.scale
    const engineY = options.engineY ?? (height - LEVEL_ENGINE_Y_OFFSET)

    // Resolve optional avatar position defaults
    const ax = avatarX ?? 100
    const ay = avatarY ?? (height - 100)

    const profile = loadProfile(this.profileSlot)

    // Avatar
    generateAllCompanionTextures(this)
    const avatarKey =
      profile?.avatarChoice && this.textures.exists(profile.avatarChoice)
        ? profile.avatarChoice
        : 'avatar_0'
    this.add.image(ax, ay, avatarKey).setScale(avatarScale).setDepth(5)

    // Companion / pet + gold manager
    const petRenderer = new CompanionAndPetRenderer(this, ax, ay, this.profileSlot)
    this.goldManager = new GoldManager(this)
    if (petRenderer.getPetSprite()) {
      const pet = profile?.pets.find(p => p.id === profile?.activePetId)
      if (pet) {
        this.goldManager.registerPet(
          petRenderer.getPetSprite()!,
          PET_SPEED_BASE + pet.level * PET_SPEED_COEFF,
          petRenderer.getStartPetX(),
          petRenderer.getStartPetY()
        )
      }
    }

    // Word pool
    const difficulty = Math.ceil(this.level.world / 2)
    const maxLength = this.level.world === 1 ? 5 : undefined
    this.words = getWordPool(
      this.level.unlockedLetters,
      this.level.wordCount,
      difficulty,
      maxLength
    )
    const shuffled = [...this.words]
    Phaser.Utils.Array.Shuffle(shuffled)
    this.wordQueue = shuffled

    // Typing engine
    this.engine = new TypingEngine({
      scene: this,
      x: width / 2,
      y: engineY,
      fontSize: engineFontSize,
      onWordComplete: this.onWordComplete.bind(this),
      onWrongKey: this.onWrongKey.bind(this),
    })

    // Spell caster (conditional)
    if (profile && profile.spells.length > 0) {
      this.spellCaster = new SpellCaster(this, this.profileSlot, this.engine)
      this.spellCaster.setEffectCallback(this.handleSpellEffect.bind(this))
    }

    // Typing hands (conditional)
    if (profile?.showFingerHints) {
      this.typingHands = new TypingHands(this, width / 2, height - handsYOffset)
    }
  }

  /**
   * Override to handle spell effect callbacks.
   * Default is a no-op (scenes without spells don't need to override this).
   */
  protected handleSpellEffect(_effect: SpellData['effect']): void {}

  /**
   * Call to end the level. Handles guard flag, shared cleanup,
   * scoring, and transition to LevelResult.
   *
   * Subclasses should do their OWN cleanup (remove timers, etc.)
   * and then call super.endLevel(passed).
   */
  protected endLevel(passed: boolean) {
    if (process.env.NODE_ENV !== 'production' && !this._preCreateCalled) {
      throw new Error(
        `${this.scene.key}: endLevel() called before preCreate(). ` +
        `Did you forget to call super.preCreate() in create()?`
      )
    }
    if (this.finished) return
    this.finished = true

    this.spellCaster?.destroy()
    this.typingHands?.fadeOut()
    this.engine.destroy()

    const elapsed = Date.now() - this.engine.sessionStartTime
    const acc = calcAccuracyStars(
      this.engine.correctKeystrokes,
      this.engine.totalKeystrokes
    )
    const spd = calcSpeedStars(
      Math.round(this.engine.completedWords / (elapsed / 60000)),
      this.level.world
    )

    const delay = this.endDelayMs
    this.time.delayedCall(delay, () => {
      this.scene.start('LevelResult', {
        extraGold: this.goldManager?.getCollectedGold() ?? 0,
        level: this.level,
        profileSlot: this.profileSlot,
        accuracyStars: acc,
        speedStars: spd,
        passed,
      })
    })
  }

  /** Advance GoldManager each frame. Subclasses should call super.update(). */
  update(_time: number, delta: number) {
    this.goldManager?.update(delta)
  }

  protected abstract onWordComplete(word: string, elapsed: number): void
  protected abstract onWrongKey(): void
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scenes/BaseLevelScene.ts
git commit -m "feat: add BaseLevelScene abstract base class"
```

---

### Task 3: Create BaseBossScene

**Files:**
- Create: `src/scenes/BaseBossScene.ts`

- [ ] **Step 1: Create `src/scenes/BaseBossScene.ts`**

```typescript
// src/scenes/BaseBossScene.ts
import { BaseLevelScene, PreCreateOptions } from './BaseLevelScene'
import {
  BOSS_AVATAR_SCALE,
  BOSS_ENGINE_Y_OFFSET,
  BOSS_ENGINE_FONT_SIZE,
  BOSS_END_DELAY_MS,
  BOSS_AVATAR_X_FRAC,
  BOSS_AVATAR_Y_OFFSET,
} from '../constants'

/**
 * Abstract base for all boss battle scenes.
 * Extends BaseLevelScene with boss-appropriate defaults:
 * - Avatar centered-left at 25% of canvas width
 * - Larger avatar scale (2.5x)
 * - Typing engine higher up with larger font
 * - Longer end-level delay (1000ms vs 500ms)
 *
 * Boss scenes inherit init(), endLevel(), update(), and preCreate().
 * Call preCreate() with no arguments to use boss defaults, or pass
 * explicit coordinates to override.
 */
export abstract class BaseBossScene extends BaseLevelScene {
  protected override readonly endDelayMs = BOSS_END_DELAY_MS

  /**
   * Boss-flavored preCreate with sensible defaults.
   * If called with no arguments, places avatar at (width*0.25, height/2-50)
   * with scale 2.5 and engine at (height-160) with font size 48.
   */
  protected override preCreate(
    avatarX?: number,
    avatarY?: number,
    options: PreCreateOptions = {}
  ) {
    const { width, height } = this.scale
    super.preCreate(
      avatarX ?? width * BOSS_AVATAR_X_FRAC,
      avatarY ?? (height / 2 - BOSS_AVATAR_Y_OFFSET),
      {
        avatarScale: BOSS_AVATAR_SCALE,
        engineY: height - BOSS_ENGINE_Y_OFFSET,
        engineFontSize: BOSS_ENGINE_FONT_SIZE,
        ...options,
      }
    )
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scenes/BaseBossScene.ts
git commit -m "feat: add BaseBossScene abstract base class"
```

---

### Task 4: Test BaseLevelScene guard and init

**Files:**
- Create: `src/scenes/BaseLevelScene.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/scenes/BaseLevelScene.test.ts
import { describe, it, expect, vi } from 'vitest'
import { BaseLevelScene } from './BaseLevelScene'
import { LevelConfig } from '../types'

// Minimal concrete subclass for testing (no Phaser rendering)
class TestLevelScene extends BaseLevelScene {
  protected onWordComplete(_word: string, _elapsed: number) {}
  protected onWrongKey() {}

  // Expose internals for testing
  get _finished() { return this.finished }
  get _level() { return this.level }
  get _profileSlot() { return this.profileSlot }

  // Simulate calling endLevel without preCreate (to test the guard)
  callEndLevelWithoutPreCreate(passed: boolean) {
    // Bypass Phaser's scene.start for unit test
    ;(this as any).engine = { destroy: () => {}, sessionStartTime: Date.now(), correctKeystrokes: 10, totalKeystrokes: 10, completedWords: 5 }
    ;(this as any).goldManager = { getCollectedGold: () => 0 }
    ;(this as any).time = { delayedCall: (_ms: number, cb: () => void) => cb() }
    ;(this as any).scene = { start: () => {} }
    ;(this as any).endLevel(passed)
  }
}

const mockLevel: Partial<LevelConfig> = {
  id: 'test_level',
  name: 'Test',
  world: 1,
  wordCount: 10,
  unlockedLetters: 'abcdefghijklmnopqrstuvwxyz',
}

describe('BaseLevelScene.init()', () => {
  it('stores level and profileSlot', () => {
    const scene = new TestLevelScene()
    ;(scene as any).init({ level: mockLevel as LevelConfig, profileSlot: 2 })
    expect(scene._level).toBe(mockLevel)
    expect(scene._profileSlot).toBe(2)
  })

  it('resets finished to false on re-init', () => {
    const scene = new TestLevelScene()
    ;(scene as any).finished = true
    ;(scene as any).init({ level: mockLevel as LevelConfig, profileSlot: 0 })
    expect(scene._finished).toBe(false)
  })
})

describe('BaseLevelScene._preCreateCalled guard', () => {
  it('throws if endLevel is called before preCreate in development', () => {
    process.env.NODE_ENV = 'development'
    const scene = new TestLevelScene()
    ;(scene as any).init({ level: mockLevel as LevelConfig, profileSlot: 0 })
    expect(() => scene.callEndLevelWithoutPreCreate(true)).toThrow(/preCreate/)
    process.env.NODE_ENV = 'test'
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/scenes/BaseLevelScene.test.ts
```
Expected: FAIL (BaseLevelScene.test.ts doesn't exist yet, or TestLevelScene can't instantiate without Phaser)

- [ ] **Step 3: Check if test passes as-is or needs Phaser mock**

If the tests fail due to Phaser import errors, add the following mock at the top of the test file:
```typescript
// Mock Phaser.Scene for unit tests
vi.mock('phaser', () => ({
  default: {
    Scene: class { constructor() {} },
    Utils: { Array: { Shuffle: (arr: unknown[]) => arr } },
    Math: { Between: (a: number) => a },
  }
}))
```

- [ ] **Step 4: Run tests again to verify pass**

```bash
npx vitest run src/scenes/BaseLevelScene.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/scenes/BaseLevelScene.test.ts
git commit -m "test: add BaseLevelScene unit tests for init and guard"
```

---

## Chunk 2: Level Scene Migrations

Migrate 13 of 14 level scenes to extend `BaseLevelScene` (CharacterCreatorLevel is excluded — too minimal to benefit). Complete the **reference migration** (GoblinWhackerLevel) in full detail, then apply the same pattern to the remaining 12 scenes.

### Task 5: Reference migration — GoblinWhackerLevel

**Files:**
- Modify: `src/scenes/level-types/GoblinWhackerLevel.ts`

- [ ] **Step 1: Open `src/scenes/level-types/GoblinWhackerLevel.ts` and make these changes**

Change the class declaration:
```typescript
// BEFORE:
export class GoblinWhackerLevel extends Phaser.Scene {

// AFTER:
export class GoblinWhackerLevel extends BaseLevelScene {
```

Add import at top (remove the duplicate imports that BaseLevelScene now handles):
```typescript
// ADD:
import { BaseLevelScene } from '../BaseLevelScene'

// REMOVE these imports (now handled by BaseLevelScene):
// import { loadProfile } from '../../utils/profile'     ← remove
// import { getWordPool } from '../../utils/words'        ← remove
// import { calcAccuracyStars, calcSpeedStars } from '../../utils/scoring'  ← remove
// import { setupPause } from '../../utils/pauseSetup'   ← remove
// import { generateAllCompanionTextures } from '../../art/companionsArt'   ← remove
// import { CompanionAndPetRenderer } from '../../components/CompanionAndPetRenderer'  ← remove
// NOTE: keep loadProfile import IF still used in goblinReachedPlayer / onWordComplete
```

**NOTE:** `loadProfile` is still used in `goblinReachedPlayer()` and `onWordComplete()` for equipment checks. Keep that import.

Update `init()` — call super, remove shared resets:
```typescript
// BEFORE:
init(data: { level: LevelConfig; profileSlot: number }) {
  this.level = data.level
  this.profileSlot = data.profileSlot
  this.finished = false
  this.goblinsDefeated = 0
  this.playerHp = 3
  this.goblins = []
  this.activeGoblin = null
  this.words = []
  this.wordQueue = []
  this.timeLeft = 0
  this.letterShieldCount = 0
  this.wrongKeyCount = 0
  this.nextAttackThreshold = Phaser.Math.Between(5, 8)
  this.hpHearts = []
  const profile = loadProfile(data.profileSlot)
  this.gameMode = profile?.gameMode ?? 'regular'
}

// AFTER:
init(data: { level: LevelConfig; profileSlot: number }) {
  super.init(data)   // handles: level, profileSlot, finished
  this.goblinsDefeated = 0
  this.playerHp = 3
  this.goblins = []
  this.activeGoblin = null
  this.timeLeft = 0
  this.letterShieldCount = 0
  this.wrongKeyCount = 0
  this.nextAttackThreshold = Phaser.Math.Between(5, 8)
  this.hpHearts = []
  const profile = loadProfile(data.profileSlot)
  this.gameMode = profile?.gameMode ?? 'regular'
}
```

Update `create()` — call `this.preCreate()`, remove shared setup block:
```typescript
// BEFORE (first ~50 lines of create()):
create() {
  setupPause(this, this.profileSlot)
  const { width, height } = this.scale
  this.maxGoblinReach = 80
  generateGoblinWhackerTextures(this)
  this.add.image(width / 2, height / 2, 'forest_bg')
  this.pathY = height * 0.62
  const pProfileAvatar = loadProfile(this.profileSlot)
  generateAllCompanionTextures(this)
  const avatarKey = this.textures.exists(pProfileAvatar?.avatarChoice || '') ? pProfileAvatar!.avatarChoice : 'avatar_0'
  this.add.image(80, this.pathY, avatarKey).setScale(1.5)
  const petRenderer = new CompanionAndPetRenderer(this, 80, this.pathY, this.profileSlot)
  this.goldManager = new GoldManager(this)
  if (petRenderer.getPetSprite()) {
    const pProfile = loadProfile(this.profileSlot)!;
    const p = pProfile.pets.find(pet => pet.id === pProfile.activePetId);
    if (p) {
      this.goldManager.registerPet(petRenderer.getPetSprite()!, 100 + (p.level * 25), petRenderer.getStartPetX(), petRenderer.getStartPetY())
    }
  }
  // ... HUD, engine, spells, typing hands, word pool ...

// AFTER:
create() {
  const { width, height } = this.scale
  this.pathY = height * 0.62
  this.maxGoblinReach = 80
  this.preCreate(80, this.pathY)   // handles avatar, companion, gold, word pool, engine, spells, hands

  generateGoblinWhackerTextures(this)
  this.add.image(width / 2, height / 2, 'forest_bg')
  // ... scene-specific setup continues (HUD, timer, spawner) ...
```

Remove the word pool block from `create()` (now handled by `preCreate()`):
```typescript
// REMOVE these lines from create() — preCreate handles them:
// const difficulty = Math.ceil(this.level.world / 2)
// const maxLength = this.level.world === 1 ? 5 : undefined
// this.words = getWordPool(this.level.unlockedLetters, this.level.wordCount, difficulty, maxLength)
// const shuffledWords = [...this.words]
// Phaser.Utils.Array.Shuffle(shuffledWords)
// this.wordQueue = shuffledWords
```

Move spell effects to `handleSpellEffect()`:
```typescript
// REMOVE the spellCaster.setEffectCallback block entirely from create()
// ADD this method to the class:
protected handleSpellEffect(effect: SpellData['effect']) {
  if (effect === 'time_freeze') {
    this.goblins.forEach(g => { g.speed = 0 })
    this.time.delayedCall(5000, () => {
      this.goblins.forEach(g => { g.speed = 60 + this.level.world * 10 })
    })
  } else if (effect === 'word_blast') {
    const nearest = this.goblins.reduce<Goblin | null>((min, g) =>
      !min || g.x < min.x ? g : min, null)
    if (nearest) { this.removeGoblin(nearest); this.goblinsDefeated++ }
  } else if (effect === 'second_chance') {
    this.playerHp = Math.min(this.playerHp + 2, 5)
    this.hpHearts.forEach((h, i) => h.setVisible(i < this.playerHp))
  } else if (effect === 'letter_shield') {
    this.letterShieldCount = 3
  }
}
```

Update `endLevel()` — call super after cleanup:
```typescript
// BEFORE:
private endLevel(passed: boolean) {
  if (this.finished) return
  this.finished = true
  this.timerEvent?.remove()
  this.spawnTimer?.remove()
  this.spellCaster?.destroy()
  this.typingHands?.fadeOut()
  this.engine.destroy()
  const elapsed = Date.now() - this.engine.sessionStartTime
  const acc = calcAccuracyStars(this.engine.correctKeystrokes, this.engine.totalKeystrokes)
  const spd = calcSpeedStars(Math.round(this.engine.completedWords / (elapsed / 60000)), this.level.world)
  this.time.delayedCall(500, () => {
    this.scene.start('LevelResult', { ... })
  })
}

// AFTER:
protected endLevel(passed: boolean) {
  this.timerEvent?.remove()
  this.spawnTimer?.remove()
  super.endLevel(passed)   // handles guard, finished flag, spellCaster, typingHands, engine, scoring, scene.start
}
```

Update `update()` — call super:
```typescript
// BEFORE:
update(_time: number, delta: number) {
  this.goldManager?.update(delta)
  if (this.finished) return
  // ...

// AFTER:
update(time: number, delta: number) {
  super.update(time, delta)   // handles goldManager.update
  if (this.finished) return
  // ...
```

Change `onWordComplete` and `onWrongKey` from `private` to `protected`:
```typescript
protected onWordComplete(word: string, _elapsed: number) { ... }
protected onWrongKey() { ... }
```

Remove `private` field declarations for `level`, `profileSlot`, `finished`, `engine`, `words`, `wordQueue`, `goldManager`, `spellCaster`, `typingHands` — these are now on `BaseLevelScene`. Remove the `GoldManager` import if no longer needed directly.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Smoke-test the scene manually**

Start the dev server with `npm run dev`. Navigate to GoblinWhacker level and:
1. Verify the level loads (background, avatar, goblins appear)
2. Type one word — verify goblin is defeated
3. Let time run out OR defeat all goblins — verify LevelResult screen appears
4. Click Continue — verify return to OverlandMap

- [ ] **Step 4: Commit**

```bash
git add src/scenes/level-types/GoblinWhackerLevel.ts
git commit -m "refactor: migrate GoblinWhackerLevel to BaseLevelScene"
```

---

### Task 6: Migrate remaining 12 level scenes

Apply the same pattern from Task 5 to each remaining scene. The pattern is identical for each:

1. Change `extends Phaser.Scene` → `extends BaseLevelScene`
2. Add `import { BaseLevelScene } from '../BaseLevelScene'`
3. Remove shared imports (profile, words, scoring, pauseSetup, companionsArt, CompanionAndPetRenderer) — keep `loadProfile` if used for equipment/armor/weapon checks
4. In `init()`: call `super.init(data)`, remove shared state resets (`level`, `profileSlot`, `finished`, `words`, `wordQueue`)
5. In `create()`: add `this.preCreate(avatarX, avatarY)` at the top with the scene-specific avatar position; remove the avatar/companion/gold/wordPool/engine/spells/hands blocks
6. Move spell effect callback content into `protected handleSpellEffect(effect: SpellData['effect'])` method (import `SpellData` from `../../types`)
7. In `endLevel()`: remove shared cleanup, change to `protected`, call `super.endLevel(passed)` after scene-specific timer removal
8. In `update()`: call `super.update(time, delta)`, remove `this.goldManager?.update(delta)`
9. Change `onWordComplete` and `onWrongKey` from `private` to `protected`
10. Remove redeclared base class properties from the field list

**Avatar positions per scene** (use these in the `preCreate()` call):

| Scene | avatarX | avatarY |
|---|---|---|
| `SkeletonSwarmLevel` | `60` | `this.pathY` (set pathY = height * 0.55 before calling preCreate) |
| `DungeonPlatformerLevel` | `100` | `height * 0.6` |
| `CrazedCookLevel` | `80` | `height - 120` |
| `SlimeSplittingLevel` | `80` | `height * 0.6` |
| `UndeadSiegeLevel` | `80` | `height * 0.65` |
| `MonsterArenaLevel` | `width * 0.2` | `height / 2` |
| `MagicRuneTypingLevel` | `80` | `height * 0.6` |
| `PotionBrewingLabLevel` | `80` | `height * 0.65` |
| `GuildRecruitmentLevel` | `80` | `height * 0.65` |
| `MonsterManualLevel` | `80` | `height * 0.65` |
| `WoodlandFestivalLevel` | `80` | `height * 0.65` |
| `DungeonEscapeLevel` | `80` | `height * 0.65` |

**Exception:** `CharacterCreatorLevel` — this scene has no avatar setup, no word pool, and no companion rendering. It is too minimal to benefit from the base class. Skip it.

- [ ] **Step 1: Migrate SkeletonSwarmLevel** (smoke-test after)
- [ ] **Step 2: Migrate DungeonPlatformerLevel** (smoke-test after)
- [ ] **Step 3: Migrate CrazedCookLevel** (smoke-test after)
- [ ] **Step 4: Migrate SlimeSplittingLevel** (smoke-test after)
- [ ] **Step 5: Migrate UndeadSiegeLevel** (smoke-test after)
- [ ] **Step 6: Migrate MonsterArenaLevel** (smoke-test after)
- [ ] **Step 7: Migrate MagicRuneTypingLevel** (smoke-test after)
- [ ] **Step 8: Migrate PotionBrewingLabLevel** (smoke-test after)
- [ ] **Step 9: Migrate GuildRecruitmentLevel** (smoke-test after)
- [ ] **Step 10: Migrate MonsterManualLevel** (smoke-test after)
- [ ] **Step 11: Migrate WoodlandFestivalLevel** (smoke-test after)
- [ ] **Step 12: Migrate DungeonEscapeLevel** (smoke-test after)

**Smoke-test for each scene** (from the spec's regression checklist):
1. Navigate to that level from the overland map
2. Complete the LevelIntro by typing the level name
3. Type at least one word — verify it registers
4. Let the level end — verify LevelResultScene loads with correct data
5. Click Continue — verify return to OverlandMapScene

- [ ] **Step 13: Verify TypeScript compiles clean after all migrations**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 14: Commit**

```bash
git add src/scenes/level-types/
git commit -m "refactor: migrate all 12 remaining level scenes to BaseLevelScene"
```

---

## Chunk 3: Boss Scene Migrations

### Task 7: Reference migration — MiniBossTypical

**Files:**
- Modify: `src/scenes/boss-types/MiniBossTypical.ts`

- [ ] **Step 1: Apply the same base class pattern, but extend BaseBossScene**

Change class declaration:
```typescript
import { BaseBossScene } from '../BaseBossScene'

export class MiniBossTypical extends BaseBossScene {
```

Update `init()`:
```typescript
init(data: { level: LevelConfig; profileSlot: number }) {
  super.init(data)   // handles level, profileSlot, finished
  this.playerHp = 3
  this.wrongKeyCount = 0
  this.nextAttackThreshold = Phaser.Math.Between(2, 5)
  const profile = loadProfile(data.profileSlot)
  this.weaknessActive = profile?.bossWeaknessKnown === (data.level.bossId ?? '')
  this.gameMode = profile?.gameMode ?? 'regular'
}
```

Update `create()` — call `this.preCreate()` with no args (BaseBossScene defaults handle position/scale):
```typescript
create() {
  this.preCreate()   // no args — uses boss defaults (width*0.25, height/2-50, scale 2.5, etc.)
  const { width, height } = this.scale

  // Background
  this.add.rectangle(width / 2, height / 2, width, height, 0x4a1e2a)
  // ... rest of boss-specific setup (boss sprite, HP text, attack timer) ...
```

Remove the avatar/companion/goldManager/wordPool/engine/typingHands blocks from `create()`.

Update `endLevel()`:
```typescript
protected endLevel(passed: boolean) {
  this.timerEvent?.remove()
  this.attackTimer?.remove()
  if (passed) {
    this.bossSprite.destroy()
    this.bossHpText.setText('DEFEATED!')
  }
  super.endLevel(passed)
}
```

Change `onWordComplete` and `onWrongKey` to `protected`.

Update `update()`:
```typescript
update(time: number, delta: number) {
  super.update(time, delta)
}
```

- [ ] **Step 2: Verify TypeScript compiles**
```bash
npx tsc --noEmit
```

- [ ] **Step 3: Smoke-test MiniBossTypical** (navigate to any mini-boss level, complete it)

- [ ] **Step 4: Commit**
```bash
git add src/scenes/boss-types/MiniBossTypical.ts
git commit -m "refactor: migrate MiniBossTypical to BaseBossScene"
```

---

### Task 8: Migrate remaining 11 boss scenes

Apply the same pattern as Task 7 to each boss scene. Each extends `BaseBossScene`, calls `this.preCreate()` with no args (the boss defaults handle avatar position), and delegates shared cleanup to `super.endLevel(passed)`.

**SpellCaster note:** Boss scenes that don't use spells will silently gain a `SpellCaster` if the player has spells (preCreate creates it conditionally). This is safe — the default `handleSpellEffect()` is a no-op. Boss scenes that need spell behavior can override `handleSpellEffect`.

**Avatar position note:** Most boss scenes use the default position (`width * 0.25, height/2 - 50`). If a boss has an unusual layout, open the file and read the existing avatar coordinates, then pass explicit values: `this.preCreate(customX, customY)`.

Boss scenes:
- `ClockworkDragonBoss.ts`
- `SpiderBoss.ts`
- `HydraBoss.ts`
- `BaronTypoBoss.ts`
- `AncientDragonBoss.ts`
- `SlimeKingBoss.ts`
- `BoneKnightBoss.ts`
- `DiceLichBoss.ts`
- `GrizzlefangBoss.ts`
- `FlashWordBoss.ts`
- `TypemancerBoss.ts`

- [ ] **Step 1–11:** Migrate each boss scene (smoke-test each one)
- [ ] **Step 12:** Verify TypeScript compiles clean
```bash
npx tsc --noEmit
```
- [ ] **Step 13:** Commit
```bash
git add src/scenes/boss-types/
git commit -m "refactor: migrate all 11 remaining boss scenes to BaseBossScene"
```

---

## Chunk 4: WaveController

Extract wave management logic from `SkeletonSwarmLevel` into a pure TypeScript controller.

### Task 9: Write WaveController tests

**Files:**
- Create: `src/controllers/WaveController.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/controllers/WaveController.test.ts
import { describe, it, expect } from 'vitest'
import { WaveController } from './WaveController'

const baseConfig = {
  words: ['ant', 'bat', 'cat', 'dog', 'eel', 'fox', 'gnu', 'hen', 'ibis', 'jay', 'kite', 'lark'],
  maxWaves: 3,
  worldNumber: 1,
  barrierX: 265,
  canvasWidth: 1280,
  rng: () => 0.5,  // deterministic random
}

describe('WaveController — wave sequencing', () => {
  it('starts at wave 0', () => {
    const ctrl = new WaveController(baseConfig)
    expect(ctrl.currentWave).toBe(0)
  })

  it('startWave increments currentWave', () => {
    const ctrl = new WaveController(baseConfig)
    ctrl.startWave()
    expect(ctrl.currentWave).toBe(1)
  })

  it('startWave returns spawn events', () => {
    const ctrl = new WaveController(baseConfig)
    const events = ctrl.startWave()
    expect(events.filter(e => e.type === 'spawn').length).toBeGreaterThan(0)
  })

  it('startWave does not exceed maxWaves', () => {
    const ctrl = new WaveController(baseConfig)
    ctrl.startWave()
    ctrl.startWave()
    ctrl.startWave()
    const events = ctrl.startWave()  // 4th call — should produce nothing
    expect(events.length).toBe(0)
    expect(ctrl.currentWave).toBe(3)
  })
})

describe('WaveController — skeleton defeat', () => {
  it('markDefeated removes the skeleton', () => {
    const ctrl = new WaveController(baseConfig)
    ctrl.startWave()
    const initial = ctrl.activeSkeletons.length
    const word = ctrl.activeSkeletons[0].word
    ctrl.markDefeated(word)
    expect(ctrl.activeSkeletons.length).toBe(initial - 1)
  })

  it('markDefeated returns wave_complete when last skeleton dies and more waves remain', () => {
    const ctrl = new WaveController({ ...baseConfig, maxWaves: 2 })
    ctrl.startWave()
    const events: ReturnType<typeof ctrl.markDefeated> = []
    while (ctrl.activeSkeletons.length > 0) {
      const word = ctrl.activeSkeletons[0].word
      events.push(...ctrl.markDefeated(word))
    }
    const waveComplete = events.find(e => e.type === 'wave_complete')
    expect(waveComplete).toBeDefined()
  })

  it('markDefeated returns game_complete when last skeleton dies in final wave', () => {
    const ctrl = new WaveController({ ...baseConfig, maxWaves: 1 })
    ctrl.startWave()
    const events: ReturnType<typeof ctrl.markDefeated> = []
    while (ctrl.activeSkeletons.length > 0) {
      const word = ctrl.activeSkeletons[0].word
      events.push(...ctrl.markDefeated(word))
    }
    expect(events.find(e => e.type === 'game_complete')).toBeDefined()
  })
})

describe('WaveController — skeleton movement (advanced mode)', () => {
  it('tick moves skeletons left by speed*dt', () => {
    const ctrl = new WaveController(baseConfig)
    ctrl.startWave()
    const initial = ctrl.activeSkeletons.map(s => s.x)
    ctrl.tick(100, 'advanced')  // 100ms
    ctrl.activeSkeletons.forEach((s, i) => {
      expect(s.x).toBeLessThan(initial[i])
    })
  })

  it('tick returns skeleton_reached when skeleton crosses barrierX', () => {
    const ctrl = new WaveController({ ...baseConfig, canvasWidth: 400, barrierX: 265 })
    ctrl.startWave()
    // Force a skeleton to just past the barrier
    ;(ctrl as any)._skeletons[0].x = 270
    const events = ctrl.tick(1000, 'advanced')  // big delta to move it past
    expect(events.find(e => e.type === 'skeleton_reached')).toBeDefined()
  })
})

describe('WaveController — regular mode slot positions', () => {
  it('tick does not move skeletons past battleX', () => {
    const ctrl = new WaveController({ ...baseConfig, battleX: 350 })
    ctrl.startWave()
    ctrl.tick(10000, 'regular')  // large delta
    ctrl.activeSkeletons.forEach(s => {
      expect(s.x).toBeGreaterThanOrEqual(350)
    })
  })
})
```

- [ ] **Step 2: Run to verify they fail**
```bash
npx vitest run src/controllers/WaveController.test.ts
```
Expected: FAIL — `WaveController` not found

---

### Task 10: Implement WaveController

**Files:**
- Create: `src/controllers/WaveController.ts`

- [ ] **Step 1: Create `src/controllers/WaveController.ts`**

```typescript
// src/controllers/WaveController.ts
// Pure TypeScript — NO Phaser imports.
import { computeSlotPositions, applySeparationForce } from '../utils/skeletonSpacing'

export type WaveEvent =
  | { type: 'spawn'; word: string; x: number; isRiser: boolean }
  | { type: 'wave_complete'; waveNumber: number }
  | { type: 'game_complete' }
  | { type: 'skeleton_reached'; word: string }

export interface SkeletonState {
  id: string
  word: string
  x: number
  speed: number
  isRiser: boolean
}

export interface WaveConfig {
  words: string[]
  maxWaves: number
  worldNumber: number
  barrierX: number
  canvasWidth: number
  battleX?: number       // default 350, regular mode stop point
  minSpacing?: number    // default 80
  labelPad?: number      // default 24
  /** Inject a custom RNG for deterministic tests. Defaults to Math.random. */
  rng?: () => number
}

export class WaveController {
  private _currentWave = 0
  private _skeletons: SkeletonState[] = []
  private wordQueue: string[]
  private rng: () => number
  private battleX: number
  private minSpacing: number
  private labelPad: number
  private readonly speed: number

  constructor(private config: WaveConfig) {
    this.wordQueue = [...config.words]
    this.rng = config.rng ?? Math.random
    this.battleX = config.battleX ?? 350
    this.minSpacing = config.minSpacing ?? 80
    this.labelPad = config.labelPad ?? 24
    this.speed = 60 + config.worldNumber * 10
  }

  get currentWave() { return this._currentWave }
  get activeSkeletons(): ReadonlyArray<SkeletonState> { return this._skeletons }
  get isComplete() {
    return this._currentWave >= this.config.maxWaves && this._skeletons.length === 0
  }

  /** Begin the next wave. Returns spawn events, one per skeleton spawned. */
  startWave(): WaveEvent[] {
    if (this._currentWave >= this.config.maxWaves) return []
    if (this.wordQueue.length === 0) return []
    this._currentWave++

    const count = Math.min(
      this.between(6, 10),
      this.wordQueue.length
    )
    const riserCount = Math.min(Math.ceil(count / 2), this.wordQueue.length)
    const marcherCount = count - riserCount

    const events: WaveEvent[] = []
    for (let i = 0; i < riserCount + marcherCount; i++) {
      if (this.wordQueue.length === 0) break
      const word = this.wordQueue.shift()!
      const isRiser = i < riserCount
      const x = isRiser
        ? this.between(300, Math.min(800, this.config.canvasWidth - 50))
        : this.config.canvasWidth + 30
      const id = `skel_${this._currentWave}_${i}`
      this._skeletons.push({ id, word, x, speed: this.speed, isRiser })
      events.push({ type: 'spawn', word, x, isRiser })
    }
    return events
  }

  /**
   * Advance all skeleton positions by `delta` ms.
   * Returns events for any collisions or completions detected.
   */
  /**
   * Advance all skeleton positions by `delta` ms.
   *
   * @param labelWidths  Actual rendered label pixel widths, one per active skeleton
   *                     in the same order as activeSkeletons. Pass this from the scene
   *                     (e.g. `this.skeletons.map(s => s.label.width)`) for accurate
   *                     spacing. If omitted, falls back to a word-length approximation.
   */
  tick(delta: number, mode: 'regular' | 'advanced', labelWidths?: number[]): WaveEvent[] {
    const events: WaveEvent[] = []
    const dt = delta / 1000
    // Resolve label widths — prefer caller-supplied values for accurate separation physics
    const widths = labelWidths ?? this._skeletons.map(s => Math.max(s.word.length * 12, 40))

    if (mode === 'advanced') {
      this._skeletons.forEach(s => { s.x -= s.speed * dt })

      // Separation force
      const positions = this._skeletons.map(s => s.x)
      const separated = applySeparationForce(
        positions,
        widths,
        this.labelPad,
        this.config.barrierX + 20,
        this.config.canvasWidth - 60
      )
      this._skeletons.forEach((s, i) => { s.x = separated[i] })

      // Collision detection
      const reached = this._skeletons.filter(s => s.x <= this.config.barrierX)
      reached.forEach(s => {
        events.push({ type: 'skeleton_reached', word: s.word })
        this._skeletons = this._skeletons.filter(sk => sk !== s)
      })

      // Check wave/win after all collisions are resolved
      if (reached.length > 0) {
        events.push(...this.checkWaveOrWin())
      }
    } else {
      // Regular mode: skeletons walk to computed slot positions
      const targetXs = computeSlotPositions(
        widths,
        this.battleX,
        this.labelPad,
        this.minSpacing,
        this.config.canvasWidth - 60
      )
      this._skeletons.forEach((s, i) => {
        const target = targetXs[i]
        if (s.x > target) {
          s.x -= s.speed * dt
          if (s.x < target) s.x = target
        } else if (s.x < target) {
          s.x += s.speed * dt
          if (s.x > target) s.x = target
        }
      })
    }

    return events
  }

  /**
   * Mark a skeleton as defeated. Returns wave_complete or game_complete
   * if this defeat clears the wave.
   */
  markDefeated(word: string): WaveEvent[] {
    this._skeletons = this._skeletons.filter(s => s.word !== word)
    return this.checkWaveOrWin()
  }

  private checkWaveOrWin(): WaveEvent[] {
    if (this._skeletons.length > 0) return []
    if (this.wordQueue.length === 0 && this._currentWave >= this.config.maxWaves) {
      return [{ type: 'game_complete' }]
    }
    if (this._currentWave < this.config.maxWaves) {
      return [{ type: 'wave_complete', waveNumber: this._currentWave + 1 }]
    }
    return [{ type: 'game_complete' }]
  }

  private between(min: number, max: number): number {
    return min + Math.floor(this.rng() * (max - min + 1))
  }
}
```

- [ ] **Step 2: Run tests**
```bash
npx vitest run src/controllers/WaveController.test.ts
```
Expected: PASS (fix any failures before proceeding)

- [ ] **Step 3: Commit**
```bash
git add src/controllers/WaveController.ts src/controllers/WaveController.test.ts
git commit -m "feat: add WaveController with unit tests"
```

---

### Task 11: Refactor SkeletonSwarmLevel to use WaveController

**Files:**
- Modify: `src/scenes/level-types/SkeletonSwarmLevel.ts`

- [ ] **Step 1: Add WaveController to SkeletonSwarmLevel**

Add import:
```typescript
import { WaveController, WaveEvent } from '../../controllers/WaveController'
```

Add field:
```typescript
private waveController!: WaveController
```

In `create()`, after calling `this.preCreate()`, initialize the controller:
```typescript
// After preCreate() call:
this.waveController = new WaveController({
  words: this.wordQueue,
  maxWaves: this.maxWaves,
  worldNumber: this.level.world,
  barrierX: this.BARRIER_X,
  canvasWidth: this.scale.width,
})
// Clear wordQueue — WaveController owns it now
this.wordQueue = []
```

Replace `spawnWave()` with controller-driven version:
```typescript
private spawnWave() {
  if (this.finished) return
  const events = this.waveController.startWave()
  this.waveText.setText(`Wave ${this.waveController.currentWave} / ${this.maxWaves}`)
  events.forEach((e, i) => {
    if (e.type === 'spawn') {
      this.time.delayedCall(i * 400, () => {
        if (!this.finished) this.spawnSkeletonAt(e.word, e.x, e.isRiser)
      })
    }
  })
}
```

Rename existing `spawnSkeleton(isRiser: boolean)` to `spawnSkeletonAt(word: string, x: number, isRiser: boolean)` — it already has the word/x passed in, just reorganize parameters.

Replace `update()` movement block with controller tick:
```typescript
update(time: number, delta: number) {
  super.update(time, delta)
  this.redrawBarrier(time)
  if (this.finished) return

  this.skeletons.forEach(s => { s.prevX = s.x })

  // Pass actual label pixel widths for accurate separation physics
  const labelWidths = this.skeletons.map(s => s.label.width)
  const events = this.waveController.tick(delta, this.gameMode, labelWidths)
  events.forEach(e => this.handleWaveEvent(e))

  // Sync sprite positions from controller state
  this.waveController.activeSkeletons.forEach(state => {
    const skeleton = this.skeletons.find(s => s.word === state.word)
    if (skeleton) {
      skeleton.x = state.x
      skeleton.sprite.setX(skeleton.x)
      skeleton.label.setX(skeleton.x)
      skeleton.aura.setX(skeleton.x)
    }
  })

  // Animation state
  this.skeletons.forEach(s => {
    if (s.isRiser) return
    const dx = s.x - s.prevX
    const moved = Math.abs(dx) > 0.5
    if (moved !== s.isMoving) {
      s.isMoving = moved
      s.sprite.play(moved ? 'ss_walk_anim' : 'ss_idle_anim')
    }
    s.sprite.setFlipX(moved && dx > 0)
  })
}

private handleWaveEvent(e: WaveEvent) {
  // Guard: level may have already ended (e.g. player died from skeleton_reached)
  if (this.finished) return
  if (e.type === 'skeleton_reached') {
    const skeleton = this.skeletons.find(s => s.word === e.word)
    if (skeleton) this.skeletonReachedPlayer(skeleton)
  }
  if (e.type === 'wave_complete') {
    this.showWaveBanner(e.waveNumber)
  }
  if (e.type === 'game_complete') {
    this.endLevel(true)
  }
}
```

Update `markDefeated` calls in `onWordComplete`:
```typescript
protected onWordComplete(word: string, _elapsed: number) {
  const skeleton = this.skeletons.find(s => s.word === word)
  if (skeleton) {
    // gold drop, cleave, etc. unchanged
    this.removeSkeleton(skeleton)
    this.skeletonsDefeated++
    const events = this.waveController.markDefeated(word)
    events.forEach(e => this.handleWaveEvent(e))
  }
  // ...
}
```

**IMPORTANT — delete `checkWaveOrWin()` and `maxSkeletonReach` from `SkeletonSwarmLevel`:**
The old `private checkWaveOrWin()` method must be deleted — wave progression is now handled exclusively by the controller. Also delete `private maxSkeletonReach = 265` — the controller's `barrierX` takes over that responsibility. Wave completion is now handled exclusively by the controller (via events from `tick()` and `markDefeated()`). Also remove the `checkWaveOrWin()` call from `skeletonReachedPlayer()` — after this refactor, skeletonReachedPlayer() only needs to handle HP logic; wave progression comes through handleWaveEvent() from the tick() events.

Also update `skeletonReachedPlayer()` to stop calling the old scene-level `checkWaveOrWin()`:
```typescript
// REMOVE from skeletonReachedPlayer:
// if (!this.finished) this.checkWaveOrWin()
// (wave progression is now handled via tick() events → handleWaveEvent())
```

- [ ] **Step 2: Verify TypeScript compiles**
```bash
npx tsc --noEmit
```

- [ ] **Step 3: Smoke-test SkeletonSwarmLevel** — play through all 3 waves, verify wave banners appear, win condition triggers

- [ ] **Step 4: Commit**
```bash
git add src/scenes/level-types/SkeletonSwarmLevel.ts
git commit -m "refactor: SkeletonSwarmLevel delegates wave logic to WaveController"
```

---

## Chunk 5: KitchenController

### Task 12: Write KitchenController tests

**Files:**
- Create: `src/controllers/KitchenController.test.ts`

> **Note to implementer:** Read `src/scenes/level-types/CrazedCookLevel.ts` fully before implementing. The key logic to extract: patience decay per tick, order completion when all ingredients are typed, walkoff detection when patience hits 0, and quota tracking.

- [ ] **Step 1: Write failing tests**

```typescript
// src/controllers/KitchenController.test.ts
import { describe, it, expect } from 'vitest'
import { KitchenController } from './KitchenController'

const baseConfig = {
  orderQuota: 4,
  maxWalkoffs: 2,
  worldNumber: 1,
  rng: () => 0.5,
}

describe('KitchenController — order management', () => {
  it('starts with no orders', () => {
    const ctrl = new KitchenController(baseConfig)
    expect(ctrl.activeOrders.length).toBe(0)
  })

  it('addOrder creates an order with patience = 1.0', () => {
    const ctrl = new KitchenController(baseConfig)
    ctrl.addOrder('seat_0', ['ant', 'bat'])
    expect(ctrl.activeOrders.length).toBe(1)
    expect(ctrl.activeOrders[0].patience).toBeCloseTo(1.0)
  })

  it('completeIngredient advances currentIngredientIndex', () => {
    const ctrl = new KitchenController(baseConfig)
    ctrl.addOrder('seat_0', ['ant', 'bat'])
    ctrl.completeIngredient('seat_0', 'ant')
    expect(ctrl.activeOrders[0].currentIngredientIndex).toBe(1)
  })

  it('completeIngredient on final ingredient fires order_complete event', () => {
    const ctrl = new KitchenController(baseConfig)
    ctrl.addOrder('seat_0', ['ant'])
    const events = ctrl.completeIngredient('seat_0', 'ant')
    expect(events.find(e => e.type === 'order_complete')).toBeDefined()
  })

  it('ordersFilled increments on order_complete', () => {
    const ctrl = new KitchenController(baseConfig)
    ctrl.addOrder('seat_0', ['ant'])
    ctrl.completeIngredient('seat_0', 'ant')
    expect(ctrl.ordersFilled).toBe(1)
  })

  it('returns quota_reached when ordersFilled hits orderQuota', () => {
    const ctrl = new KitchenController({ ...baseConfig, orderQuota: 1 })
    ctrl.addOrder('seat_0', ['ant'])
    const events = ctrl.completeIngredient('seat_0', 'ant')
    expect(events.find(e => e.type === 'quota_reached')).toBeDefined()
  })
})

describe('KitchenController — patience decay', () => {
  it('tick reduces patience over time', () => {
    const ctrl = new KitchenController(baseConfig)
    ctrl.addOrder('seat_0', ['ant', 'bat', 'cat'])
    const before = ctrl.activeOrders[0].patience
    ctrl.tick(1000)
    expect(ctrl.activeOrders[0].patience).toBeLessThan(before)
  })

  it('tick fires walkoff event when patience hits 0', () => {
    const ctrl = new KitchenController({ ...baseConfig, patienceRate: 10 })
    ctrl.addOrder('seat_0', ['ant'])
    // Drain patience completely
    const events: ReturnType<typeof ctrl.tick> = []
    for (let i = 0; i < 100; i++) {
      events.push(...ctrl.tick(500))
    }
    expect(events.find(e => e.type === 'walkoff')).toBeDefined()
  })

  it('walkoffs increments on walkoff event', () => {
    const ctrl = new KitchenController({ ...baseConfig, patienceRate: 10 })
    ctrl.addOrder('seat_0', ['ant'])
    for (let i = 0; i < 100; i++) ctrl.tick(500)
    expect(ctrl.walkoffs).toBe(1)
  })

  it('returns game_over when walkoffs exceeds maxWalkoffs', () => {
    const ctrl = new KitchenController({ ...baseConfig, maxWalkoffs: 1, patienceRate: 10 })
    ctrl.addOrder('seat_0', ['ant'])
    const events: ReturnType<typeof ctrl.tick> = []
    for (let i = 0; i < 200; i++) {
      events.push(...ctrl.tick(500))
    }
    expect(events.find(e => e.type === 'game_over')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run to verify they fail**
```bash
npx vitest run src/controllers/KitchenController.test.ts
```

---

### Task 13: Implement KitchenController

**Files:**
- Create: `src/controllers/KitchenController.ts`

> Read `src/scenes/level-types/CrazedCookLevel.ts` before implementing. Pay attention to `patienceRate` per order, the `INGREDIENT_WEIGHTS` constant for ingredient count distribution, and how `activeOrder` is selected.

- [ ] **Step 1: Create `src/controllers/KitchenController.ts`**

```typescript
// src/controllers/KitchenController.ts
// Pure TypeScript — NO Phaser imports.

export type KitchenEvent =
  | { type: 'order_complete'; seatId: string }
  | { type: 'walkoff'; seatId: string }
  | { type: 'quota_reached' }
  | { type: 'game_over' }

export interface OrderState {
  seatId: string
  ingredients: string[]
  currentIngredientIndex: number
  patience: number      // 0.0 – 1.0
  patienceRate: number  // fraction drained per second (derived from ingredient count + world)
}

export interface KitchenConfig {
  orderQuota: number
  maxWalkoffs: number
  worldNumber: number
  /** Override patience rate (per second) for all orders — used in tests to drain patience quickly. */
  patienceRate?: number
  rng?: () => number
}

export class KitchenController {
  private _orders: OrderState[] = []
  private _ordersFilled = 0
  private _walkoffs = 0
  private rng: () => number

  constructor(private config: KitchenConfig) {
    this.rng = config.rng ?? Math.random
  }

  get activeOrders(): ReadonlyArray<OrderState> { return this._orders }
  get ordersFilled() { return this._ordersFilled }
  get walkoffs() { return this._walkoffs }
  get isQuotaReached() { return this._ordersFilled >= this.config.orderQuota }

  /** Create a new order at the given seat with the provided ingredient words.
   *
   * Patience rate is a delta-time-correct equivalent of CrazedCookLevel's formula:
   *   patienceDuration (seconds) = 70 - ingredientCount * 10
   *   patienceRate = 1 / patienceDuration  (fraction drained per second)
   * (The source scene uses a frame-rate-normalized form; this is the equivalent.)
   * Applied as: patience -= patienceRate * (delta / 1000) in tick()
   */
  addOrder(seatId: string, ingredients: string[]): void {
    const patienceDuration = Math.max(10, 70 - ingredients.length * 10)
    const patienceRate = this.config.patienceRate ?? (1 / patienceDuration)
    this._orders.push({
      seatId,
      ingredients,
      currentIngredientIndex: 0,
      patience: 1.0,
      patienceRate,
    })
  }

  /** Called when the player types an ingredient word. */
  completeIngredient(seatId: string, word: string): KitchenEvent[] {
    const order = this._orders.find(o => o.seatId === seatId)
    if (!order) return []
    if (order.ingredients[order.currentIngredientIndex] !== word) return []

    order.currentIngredientIndex++
    if (order.currentIngredientIndex < order.ingredients.length) return []

    // All ingredients done — order complete
    this._orders = this._orders.filter(o => o !== order)
    this._ordersFilled++
    const events: KitchenEvent[] = [{ type: 'order_complete', seatId }]
    if (this._ordersFilled >= this.config.orderQuota) {
      events.push({ type: 'quota_reached' })
    }
    return events
  }

  /** Advance patience decay. Returns events for any walkoffs or game over. */
  tick(delta: number): KitchenEvent[] {
    const events: KitchenEvent[] = []
    const dt = delta / 1000

    const walkedOff: OrderState[] = []
    this._orders.forEach(order => {
      order.patience -= order.patienceRate * dt
      if (order.patience <= 0) {
        order.patience = 0
        walkedOff.push(order)
      }
    })

    walkedOff.forEach(order => {
      this._orders = this._orders.filter(o => o !== order)
      this._walkoffs++
      events.push({ type: 'walkoff', seatId: order.seatId })
      if (this._walkoffs >= this.config.maxWalkoffs) {
        events.push({ type: 'game_over' })
      }
    })

    return events
  }
}
```

- [ ] **Step 2: Run tests**
```bash
npx vitest run src/controllers/KitchenController.test.ts
```
Expected: PASS

- [ ] **Step 3: Commit**
```bash
git add src/controllers/KitchenController.ts src/controllers/KitchenController.test.ts
git commit -m "feat: add KitchenController with unit tests"
```

---

### Task 14: Wire KitchenController into CrazedCookLevel

**Files:**
- Modify: `src/scenes/level-types/CrazedCookLevel.ts`

> Read the full CrazedCookLevel.ts before making changes. The key wiring points are: `addOrder()` when an orc sits down, `completeIngredient()` in `onWordComplete`, `tick()` in `update()`, and handling the returned events.

- [ ] **Step 1: Add KitchenController import and field**
```typescript
import { KitchenController, KitchenEvent } from '../../controllers/KitchenController'
// Add field:
private kitchenController!: KitchenController
```

- [ ] **Step 2: Initialize in `create()`** (after preCreate call)
```typescript
this.kitchenController = new KitchenController({
  orderQuota: this.orderQuota,
  maxWalkoffs: this.maxWalkoffs,
  worldNumber: this.level.world,
})
```

- [ ] **Step 3: Call `addOrder()` when an orc order is created** — in the orc spawning function, after creating the `OrcOrder` object, call:
```typescript
this.kitchenController.addOrder(order.seat.toString(), order.ingredients.map(i => i.word))
```

- [ ] **Step 4: Call `completeIngredient()` in `onWordComplete()`** and handle events:
```typescript
private handleKitchenEvent(e: KitchenEvent) {
  if (e.type === 'quota_reached') this.endLevel(true)
  if (e.type === 'game_over') this.endLevel(false)
  // order_complete and walkoff visual feedback stays in the scene
}
```

- [ ] **Step 5: Call `tick()` in `update()`**
```typescript
update(time: number, delta: number) {
  super.update(time, delta)
  if (this.finished) return
  const events = this.kitchenController.tick(delta)
  events.forEach(e => this.handleKitchenEvent(e))
  // Sync patience bar visuals from kitchenController.activeOrders
}
```

- [ ] **Step 6: Remove duplicated patience/quota/walkoff logic from CrazedCookLevel**

The patience decay loop, walkoff check, and quota check in the existing `update()` are now handled by the controller. Remove them.

- [ ] **Step 7: Verify TypeScript compiles and smoke-test**
```bash
npx tsc --noEmit
npm run dev  # test manually
```

- [ ] **Step 8: Commit**
```bash
git add src/scenes/level-types/CrazedCookLevel.ts
git commit -m "refactor: CrazedCookLevel delegates order logic to KitchenController"
```

---

## Chunk 6: PlatformerController

### Task 15: Write PlatformerController tests

> Read `src/scenes/level-types/DungeonPlatformerLevel.ts` fully before implementing. The scene uses Phaser tweens (not a per-frame update loop) for obstacle movement — the controller must NOT replicate scrolling. The extractable logic is word queue sequencing and completion tracking only.

**Files:**
- Create: `src/controllers/PlatformerController.test.ts`
- Create: `src/controllers/PlatformerController.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/controllers/PlatformerController.test.ts
import { describe, it, expect } from 'vitest'
import { PlatformerController } from './PlatformerController'

const WORDS = ['ant', 'bat', 'cat', 'dog', 'eel']

describe('PlatformerController — word queue', () => {
  it('nextWord returns the first word from the queue', () => {
    const ctrl = new PlatformerController(WORDS)
    expect(ctrl.nextWord()).toBe('ant')
  })

  it('nextWord advances the queue', () => {
    const ctrl = new PlatformerController(WORDS)
    ctrl.nextWord()
    expect(ctrl.nextWord()).toBe('bat')
  })

  it('nextWord returns null when the queue is exhausted', () => {
    const ctrl = new PlatformerController([])
    expect(ctrl.nextWord()).toBeNull()
  })

  it('hasNextWord is false when queue is empty', () => {
    const ctrl = new PlatformerController([])
    expect(ctrl.hasNextWord).toBe(false)
  })

  it('hasNextWord is true when queue has words', () => {
    const ctrl = new PlatformerController(WORDS)
    expect(ctrl.hasNextWord).toBe(true)
  })
})

describe('PlatformerController — word completion', () => {
  it('completeWord increments wordsCompleted', () => {
    const ctrl = new PlatformerController(WORDS)
    ctrl.completeWord()
    expect(ctrl.wordsCompleted).toBe(1)
  })

  it('all_complete fires when last word is completed', () => {
    const ctrl = new PlatformerController(['ant'])
    const events = ctrl.completeWord()
    expect(events.find(e => e.type === 'all_complete')).toBeDefined()
  })

  it('all_complete does NOT fire before all words are done', () => {
    const ctrl = new PlatformerController(WORDS)
    const events = ctrl.completeWord()
    expect(events.find(e => e.type === 'all_complete')).toBeUndefined()
  })

  it('isComplete is true after all words are completed', () => {
    const ctrl = new PlatformerController(['ant'])
    ctrl.completeWord()
    expect(ctrl.isComplete).toBe(true)
  })
})
```

- [ ] **Step 2: Run to verify they fail**
```bash
npx vitest run src/controllers/PlatformerController.test.ts
```

---

### Task 16: Implement PlatformerController

- [ ] **Step 1: Create `src/controllers/PlatformerController.ts`**

```typescript
// src/controllers/PlatformerController.ts
// Pure TypeScript — NO Phaser imports.
// Manages word queue and completion count only.
// Obstacle movement is handled by Phaser tweens in the scene.

export type PlatformerEvent =
  | { type: 'all_complete' }

export class PlatformerController {
  private wordQueue: string[]
  private _wordsCompleted = 0
  private totalWords: number

  constructor(words: string[]) {
    this.wordQueue = [...words]
    this.totalWords = words.length
  }

  get wordsCompleted() { return this._wordsCompleted }
  get isComplete() { return this._wordsCompleted >= this.totalWords }
  get hasNextWord(): boolean { return this.wordQueue.length > 0 }

  /**
   * Returns the next word from the queue to assign to a spawning obstacle.
   * Returns null when the queue is exhausted.
   */
  nextWord(): string | null {
    return this.wordQueue.shift() ?? null
  }

  /**
   * Called when the player successfully types the current obstacle's word.
   * Returns events — including `all_complete` when the last word is finished.
   */
  completeWord(): PlatformerEvent[] {
    this._wordsCompleted++
    if (this._wordsCompleted >= this.totalWords) {
      return [{ type: 'all_complete' }]
    }
    return []
  }
}
```

- [ ] **Step 2: Run tests**
```bash
npx vitest run src/controllers/PlatformerController.test.ts
```
Expected: PASS

- [ ] **Step 3: Commit**
```bash
git add src/controllers/PlatformerController.ts src/controllers/PlatformerController.test.ts
git commit -m "feat: add PlatformerController with unit tests"
```

---

### Task 17: Wire PlatformerController into DungeonPlatformerLevel

> Read `src/scenes/level-types/DungeonPlatformerLevel.ts` fully before wiring.
>
> **Important:** Obstacle movement is driven by `this.tweens.add(...)` in `spawnNextObstacle()` — do NOT replace the tween. The controller handles the word queue; the scene handles all rendering and movement.

- [ ] **Step 1: Add import and field**
```typescript
import { PlatformerController, PlatformerEvent } from '../../controllers/PlatformerController'
private platformerController!: PlatformerController
```

- [ ] **Step 2: Initialize in `create()`** — pass the word pool to the controller
```typescript
this.platformerController = new PlatformerController(this.wordPool)
```

- [ ] **Step 3: In `spawnNextObstacle()`** — replace the inline word selection with `ctrl.nextWord()`
```typescript
// Before: const word = this.wordPool.shift()! (or similar)
// After:
const word = this.platformerController.nextWord()
if (!word) return  // queue exhausted
// ... rest of tween setup unchanged ...
```

- [ ] **Step 4: In `onWordComplete()`** — call `ctrl.completeWord()` and handle events
```typescript
private onWordComplete(_word: string) {
  const events = this.platformerController.completeWord()
  for (const e of events) {
    if (e.type === 'all_complete') this.endLevel(true)
  }
  // Destroy obstacle sprite/label as before
  // Call spawnNextObstacle() if more words remain
}
```

- [ ] **Step 5: Remove the scene's own word counter** — the controller's `wordsCompleted` and `isComplete` replace any inline count the scene maintained. Delete duplicate counter fields. Update `updateCounterText()` (or equivalent display call) to read from `this.platformerController.wordsCompleted` instead of the scene's own counter.

- [ ] **Step 6: Verify TypeScript compiles and smoke-test**
```bash
npx tsc --noEmit
npm run dev  # play through DungeonPlatformer level to verify obstacles spawn and complete correctly
```

- [ ] **Step 7: Commit**
```bash
git add src/scenes/level-types/DungeonPlatformerLevel.ts
git commit -m "refactor: DungeonPlatformerLevel delegates word queue to PlatformerController"
```

---

## Chunk 7: InventoryController

### Task 18: Write InventoryController tests

> Read `src/scenes/CharacterScene.ts` fully before implementing. The extractable logic: equipping/unequipping items (stat calculation), item filtering by type (weapon/armor/accessory), and stat delta display.

**Files:**
- Create: `src/controllers/InventoryController.test.ts`
- Create: `src/controllers/InventoryController.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/controllers/InventoryController.test.ts
import { describe, it, expect } from 'vitest'
import { InventoryController } from './InventoryController'
import { ProfileData } from '../types'

// Real item IDs from src/data/items.ts:
//   weapons:    rusty_quill, ink_blotter, obsidian_nib
//   armor:      leather_tunic, iron_gauntlet, padded_envelope
//   accessory:  focus_ring, scholars_monocle
//   trophy:     (any trophy-slot item ID from items.ts)

const mockProfile = {
  equipment: { weapon: null, armor: null, accessory: null, trophy: null },
  ownedItemIds: ['rusty_quill', 'leather_tunic', 'focus_ring'],
} as unknown as ProfileData

describe('InventoryController — equip/unequip', () => {
  it('equip sets the equipment slot', () => {
    const ctrl = new InventoryController(mockProfile)
    ctrl.equip('weapon', 'rusty_quill')
    expect(ctrl.equipment.weapon).toBe('rusty_quill')
  })

  it('unequip clears the equipment slot', () => {
    const ctrl = new InventoryController({
      ...mockProfile,
      equipment: { weapon: 'rusty_quill', armor: null, accessory: null, trophy: null }
    } as unknown as ProfileData)
    ctrl.unequip('weapon')
    expect(ctrl.equipment.weapon).toBeNull()
  })

  it('equip replaces an existing item in the same slot', () => {
    const ctrl = new InventoryController({
      ...mockProfile,
      equipment: { weapon: 'rusty_quill', armor: null, accessory: null, trophy: null }
    } as unknown as ProfileData)
    ctrl.equip('weapon', 'ink_blotter')
    expect(ctrl.equipment.weapon).toBe('ink_blotter')
  })
})

describe('InventoryController — filtering', () => {
  it('getItemsBySlot returns only weapon items', () => {
    const ctrl = new InventoryController(mockProfile)
    const weapons = ctrl.getItemsBySlot('weapon')
    expect(weapons).toContain('rusty_quill')
    expect(weapons).not.toContain('leather_tunic')
    expect(weapons).not.toContain('focus_ring')
  })

  it('getItemsBySlot returns only armor items', () => {
    const ctrl = new InventoryController(mockProfile)
    const armor = ctrl.getItemsBySlot('armor')
    expect(armor).toContain('leather_tunic')
    expect(armor).not.toContain('rusty_quill')
  })
})
```

- [ ] **Step 2: Run to verify they fail**
```bash
npx vitest run src/controllers/InventoryController.test.ts
```

---

### Task 19: Implement InventoryController

- [ ] **Step 1: Create `src/controllers/InventoryController.ts`**

```typescript
// src/controllers/InventoryController.ts
// Pure TypeScript — NO Phaser imports.
import { ProfileData } from '../types'
import { getItem } from '../data/items'

type EquipmentSlot = 'weapon' | 'armor' | 'accessory' | 'trophy'

export interface EquipmentState {
  weapon: string | null
  armor: string | null
  accessory: string | null
  trophy: string | null
}

export class InventoryController {
  private _equipment: EquipmentState

  constructor(private profile: ProfileData) {
    this._equipment = {
      weapon: profile.equipment?.weapon ?? null,
      armor: profile.equipment?.armor ?? null,
      accessory: profile.equipment?.accessory ?? null,
      trophy: profile.equipment?.trophy ?? null,
    }
  }

  get equipment(): Readonly<EquipmentState> { return this._equipment }

  equip(slot: EquipmentSlot, itemId: string): void {
    this._equipment = { ...this._equipment, [slot]: itemId }
  }

  unequip(slot: EquipmentSlot): void {
    this._equipment = { ...this._equipment, [slot]: null }
  }

  /** Returns inventory item IDs that belong to the given equipment slot. */
  getItemsBySlot(slot: EquipmentSlot): string[] {
    return (this.profile.ownedItemIds ?? []).filter(id => {
      const item = getItem(id)
      return item?.slot === slot
    })
  }

  /** Returns a stat delta description when equipping an item vs. current. */
  getStatDelta(slot: EquipmentSlot, newItemId: string): Record<string, number> {
    const current = this._equipment[slot]
    const currentItem = current ? getItem(current) : null
    const newItem = getItem(newItemId)
    if (!newItem) return {}

    const delta: Record<string, number> = {}
    const currentEffect = currentItem?.effect ?? {}
    const newEffect = newItem.effect ?? {}

    const allKeys = new Set([...Object.keys(currentEffect), ...Object.keys(newEffect)])
    allKeys.forEach(key => {
      const curr = (currentEffect as Record<string, number>)[key] ?? 0
      const next = (newEffect as Record<string, number>)[key] ?? 0
      const diff = next - curr
      if (diff !== 0) delta[key] = diff
    })
    return delta
  }
}
```

- [ ] **Step 2: Run tests**
```bash
npx vitest run src/controllers/InventoryController.test.ts
```
Expected: PASS (adjust test data if `getItem` returns unexpected structures)

- [ ] **Step 3: Commit**
```bash
git add src/controllers/InventoryController.ts src/controllers/InventoryController.test.ts
git commit -m "feat: add InventoryController with unit tests"
```

---

### Task 20: Wire InventoryController into CharacterScene

> Read `src/scenes/CharacterScene.ts` fully before wiring. The equip/unequip button handlers and stat display rendering are the main wiring points.

- [ ] **Step 1: Add import and field**
```typescript
import { InventoryController } from '../controllers/InventoryController'
private inventoryController!: InventoryController
```

- [ ] **Step 2: Initialize in `create()`**
```typescript
const profile = loadProfile(this.profileSlot)!
this.inventoryController = new InventoryController(profile)
```

- [ ] **Step 3: Route equip/unequip clicks through the controller** — on equip button press:
```typescript
// 1. Update controller state
this.inventoryController.equip(slot, itemId)  // or .unequip(slot)
// 2. Sync back to profile and save
const profile = loadProfile(this.profileSlot)!
profile.equipment = { ...this.inventoryController.equipment }
saveProfile(this.profileSlot, profile)
// 3. Re-render stats display
this.updateStatsDisplay()
```

- [ ] **Step 4: Remove duplicated equip/unequip/stat logic from the scene**

- [ ] **Step 5: Verify TypeScript compiles and smoke-test CharacterScene**
```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**
```bash
git add src/scenes/CharacterScene.ts
git commit -m "refactor: CharacterScene delegates inventory logic to InventoryController"
```

---

## Chunk 8: MapNavigationController

### Task 21: Write MapNavigationController tests

> Read `src/scenes/OverlandMapScene.ts` fully before implementing. The extractable logic: node unlock determination (`canUnlockNode`, `unlockNextLevels`), world transition conditions (all levels complete), and pan bounds clamping.

**Files:**
- Create: `src/controllers/MapNavigationController.test.ts`
- Create: `src/controllers/MapNavigationController.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/controllers/MapNavigationController.test.ts
import { describe, it, expect } from 'vitest'
import { MapNavigationController } from './MapNavigationController'
import { ProfileData } from '../types'
import { getLevelsForWorld } from '../data/levels'

const world1Levels = getLevelsForWorld(1)

const mockProfile = (unlockedIds: string[]) => ({
  unlockedLevelIds: unlockedIds,
  levelResults: {},
  currentWorld: 1,
}) as unknown as ProfileData

describe('MapNavigationController — node unlocking', () => {
  it('returns true for already-unlocked levels', () => {
    const ctrl = new MapNavigationController(mockProfile([world1Levels[0].id]))
    expect(ctrl.isUnlocked(world1Levels[0].id)).toBe(true)
  })

  it('returns false for locked levels', () => {
    const ctrl = new MapNavigationController(mockProfile([world1Levels[0].id]))
    expect(ctrl.isUnlocked(world1Levels[1].id)).toBe(false)
  })
})

describe('MapNavigationController — pan bounds', () => {
  it('clampPan keeps scroll within bounds', () => {
    const ctrl = new MapNavigationController(mockProfile([]))
    const clamped = ctrl.clampPan(-5000, 0, 1280, 4000)
    expect(clamped.x).toBeGreaterThanOrEqual(-(4000 - 1280))
    expect(clamped.x).toBeLessThanOrEqual(0)
  })

  it('clampPan does not allow scrolling right of origin', () => {
    const ctrl = new MapNavigationController(mockProfile([]))
    const clamped = ctrl.clampPan(100, 0, 1280, 4000)
    expect(clamped.x).toBeLessThanOrEqual(0)
  })
})

describe('MapNavigationController — world transition', () => {
  it('canAdvanceToWorld returns false if any required level is incomplete', () => {
    const ctrl = new MapNavigationController(mockProfile([]))
    expect(ctrl.canAdvanceToWorld(2)).toBe(false)
  })

  it('canAdvanceToWorld returns true if all world 1 levels have completedAt', () => {
    const results: Record<string, unknown> = {}
    world1Levels.forEach(l => {
      results[l.id] = { accuracyStars: 3, speedStars: 3, completedAt: 123 }
    })
    const profile = {
      ...mockProfile(world1Levels.map(l => l.id)),
      levelResults: results,
    } as unknown as ProfileData
    const ctrl = new MapNavigationController(profile)
    expect(ctrl.canAdvanceToWorld(2)).toBe(true)
  })
})

describe('MapNavigationController — unlock propagation', () => {
  it('getNewUnlocks returns the next level id after completing a level', () => {
    const ctrl = new MapNavigationController(mockProfile([world1Levels[0].id]))
    const unlocks = ctrl.getNewUnlocks(world1Levels[0].id, 1)
    expect(unlocks).toContain(world1Levels[1].id)
  })

  it('getNewUnlocks returns empty array if next level is already unlocked', () => {
    const ctrl = new MapNavigationController(mockProfile([world1Levels[0].id, world1Levels[1].id]))
    const unlocks = ctrl.getNewUnlocks(world1Levels[0].id, 1)
    expect(unlocks).toHaveLength(0)
  })

  it('getNewUnlocks returns empty array at end of world', () => {
    const lastLevel = world1Levels[world1Levels.length - 1]
    const ctrl = new MapNavigationController(mockProfile([lastLevel.id]))
    const unlocks = ctrl.getNewUnlocks(lastLevel.id, 1)
    expect(unlocks).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run to verify they fail**
```bash
npx vitest run src/controllers/MapNavigationController.test.ts
```

---

### Task 22: Implement MapNavigationController

- [ ] **Step 1: Create `src/controllers/MapNavigationController.ts`**

```typescript
// src/controllers/MapNavigationController.ts
// Pure TypeScript — NO Phaser imports.
import { ProfileData } from '../types'
import { getLevelsForWorld } from '../data/levels'

export interface PanPosition {
  x: number
  y: number
}

export class MapNavigationController {
  constructor(private profile: ProfileData) {}

  isUnlocked(levelId: string): boolean {
    return (this.profile.unlockedLevelIds ?? []).includes(levelId)
  }

  /**
   * Returns all level IDs that should be unlocked after completing `justCompletedId`.
   * Matches the logic currently in OverlandMapScene / profile.ts.
   */
  getNewUnlocks(justCompletedId: string, world: number): string[] {
    const levels = getLevelsForWorld(world)
    const idx = levels.findIndex(l => l.id === justCompletedId)
    if (idx < 0) return []
    const nextLevel = levels[idx + 1]
    if (!nextLevel) return []
    if (this.isUnlocked(nextLevel.id)) return []
    return [nextLevel.id]
  }

  /**
   * Returns true if the player has completed all levels in the previous world
   * (i.e. every level has a `completedAt` timestamp in levelResults).
   * NOTE: This is NEW logic being introduced by the refactor — it does not currently
   * exist in OverlandMapScene. It centralises a world-transition guard that was
   * previously unenforced.
   */
  canAdvanceToWorld(worldNumber: number): boolean {
    if (worldNumber <= 1) return true
    const prevWorld = worldNumber - 1
    const levels = getLevelsForWorld(prevWorld)
    return levels.every(l => {
      const result = this.profile.levelResults?.[l.id]
      return result && result.completedAt != null
    })
  }

  /**
   * Clamps a pan position so the map stays within its scrollable area.
   *
   * @param x           Proposed scroll X
   * @param y           Proposed scroll Y
   * @param viewportW   Width of the visible area
   * @param mapW        Total width of the map
   */
  clampPan(x: number, y: number, viewportW: number, mapW: number): PanPosition {
    const minX = -(mapW - viewportW)
    return {
      x: Math.max(minX, Math.min(0, x)),
      y,
    }
  }
}
```

- [ ] **Step 2: Run tests**
```bash
npx vitest run src/controllers/MapNavigationController.test.ts
```
Expected: PASS (fix any schema mismatches against the real ProfileData type)

- [ ] **Step 3: Commit**
```bash
git add src/controllers/MapNavigationController.ts src/controllers/MapNavigationController.test.ts
git commit -m "feat: add MapNavigationController with unit tests"
```

---

### Task 23: Wire MapNavigationController into OverlandMapScene

> Read `src/scenes/OverlandMapScene.ts` fully before wiring. The pan clamp logic and node unlock calls are the primary wiring points.

- [ ] **Step 1: Add import and field**
```typescript
import { MapNavigationController } from '../controllers/MapNavigationController'
private navController!: MapNavigationController
```

- [ ] **Step 2: Initialize in `create()`**
```typescript
const profile = loadProfile(this.profileSlot)!
this.navController = new MapNavigationController(profile)
```

- [ ] **Step 3: Route pan clamping through the controller** — `OverlandMapScene` has 9 `Phaser.Math.Clamp` calls; only two are pan-bounds clamping and should be replaced:
  - The `pointermove` drag handler (the call that clamps `scrollX` when the pointer drags the map)
  - The edge-scroll block in `update()` (the call that clamps `scrollX` during edge-pan)

  Replace each with `this.navController.clampPan(proposedX, 0, viewportW, mapW).x`. Leave all other `Phaser.Math.Clamp` calls untouched — they handle camera-follow tweens, glide interpolation, and world-pan destinations which are outside the controller's scope.

- [ ] **Step 4: Route world transition and unlock calls** — replace inline world transition checks with `this.navController.canAdvanceToWorld(nextWorld)`; replace inline unlock propagation with `this.navController.getNewUnlocks(completedId, world)` to get newly-unlocked level IDs, then add them to the profile's `unlockedLevelIds`.

- [ ] **Step 5: Remove duplicated pan/unlock logic from the scene**

- [ ] **Step 6: Verify TypeScript compiles and smoke-test OverlandMapScene**
```bash
npx tsc --noEmit
npm run dev  # verify map scrolling, level unlocking, world transitions
```

- [ ] **Step 7: Commit**
```bash
git add src/scenes/OverlandMapScene.ts
git commit -m "refactor: OverlandMapScene delegates navigation logic to MapNavigationController"
```

---

## Final Verification

- [ ] **Run the full test suite**
```bash
npm run test
```
Expected: All existing tests pass, new controller tests pass.

- [ ] **Run TypeScript type check**
```bash
npm run build
```
Expected: Clean build, no type errors.

- [ ] **Verify line count reduction** — the 26 migrated scenes should be measurably smaller:
```bash
wc -l src/scenes/level-types/*.ts src/scenes/boss-types/*.ts
```

- [ ] **Final commit**
```bash
git add -A
git commit -m "chore: final cleanup after refactoring — update imports, remove dead code"
```
