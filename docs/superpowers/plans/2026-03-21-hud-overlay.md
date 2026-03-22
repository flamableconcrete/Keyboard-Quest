# HUD Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all per-scene HUD code with a unified `LevelHUD` component that renders a dark top bar + bottom bar with gold trim, containing hero HP hearts, level name, timer, typing engine, finger hints, and WPM — consistent across all 13 level scenes and 12 boss scenes.

**Architecture:** `LevelHUD` is instantiated by each scene in `create()`, after `initWordPool()` and before `preCreate()`. It creates and owns the `TypingEngine` and `TypingHands`. `BaseLevelScene.preCreate()` gains backwards-compat support for receiving a `LevelHUD` (skips engine/hands creation when provided). A final cleanup task removes all old code paths.

**Tech Stack:** Phaser 3, TypeScript, Vitest

**Spec:** `docs/superpowers/specs/2026-03-21-hud-overlay-design.md`

---

## File Map

**Create:**
- `src/components/LevelHUD.ts` — unified HUD component (panels, hearts, timer, counter, phase, engine, hands)
- `src/components/LevelHUD.test.ts` — unit tests for LevelHUD logic

**Modify:**
- `src/constants.ts` — add HUD depth/sizing constants
- `src/art/dungeonTrapArt.ts` — export `generateHeartTextures()` for shared use
- `src/components/TypingEngine.ts` — add `charDepth` config option (so HUD chars render above panels)
- `src/components/TypingEngine.test.ts` — test the charDepth option
- `src/scenes/BaseLevelScene.ts` — add `initWordPool()`, make `preCreate()` accept `LevelHUD`, add `protected hud`
- `src/scenes/BaseLevelScene.test.ts` — update preCreate test for new signature
- `src/scenes/BaseBossScene.ts` — no API changes yet; `setupBossTimer()` removed in Task 13
- All 13 `src/scenes/level-types/*.ts` — replace hand-rolled HUD with `LevelHUD`
- All 12 `src/scenes/boss-types/*.ts` — replace hand-rolled HUD with `LevelHUD`

**Final cleanup (Task 13):**
- `src/scenes/BaseLevelScene.ts` — remove `setupLevelTimer()`, old engine/hands paths
- `src/scenes/BaseBossScene.ts` — remove `setupBossTimer()`
- `src/scenes/BaseBossScene.test.ts` — remove `setupBossTimer` tests
- `src/scenes/BaseLevelScene.test.ts` — remove `setupLevelTimer` tests
- `src/constants.ts` — remove `LEVEL_ENGINE_Y_OFFSET`, `BOSS_ENGINE_Y_OFFSET`, `TYPING_HANDS_Y_OFFSET`

---

## Task 1: HUD constants + TypingEngine charDepth

**Files:**
- Modify: `src/constants.ts`
- Modify: `src/components/TypingEngine.ts`
- Modify: `src/components/TypingEngine.test.ts` (if it exists; otherwise skip test step)

- [ ] **Write failing test** — TypingEngine uses provided `charDepth` for char text objects

```typescript
// In TypingEngine.test.ts — add to existing test file or create it
it('uses charDepth for char text objects when provided', () => {
  // The test verifies that add.text().setDepth is called with the provided charDepth.
  // Use a mock that records setDepth calls.
  const mockText = { setDepth: vi.fn().mockReturnThis() }
  const mockScene = {
    input: { keyboard: { on: vi.fn() } },
    scale: { width: 1280, height: 720 },
    add: { text: vi.fn().mockReturnValue(mockText) },
    events: { on: vi.fn() },
    time: {},
  }
  const engine = new TypingEngine({
    scene: mockScene as any,
    x: 640, y: 600,
    onWordComplete: vi.fn(),
    onWrongKey: vi.fn(),
    charDepth: 99,
    showWpm: false,
  })
  engine.setWord('hi')
  expect(mockText.setDepth).toHaveBeenCalledWith(99)
})
```

- [ ] **Run to verify it fails**

```bash
npx vitest run src/components/TypingEngine.test.ts
```

- [ ] **Add HUD constants to `src/constants.ts`**

```typescript
/** Height of the top HUD panel bar in pixels */
export const HUD_TOP_BAR_H = 56
/** Height of the bottom HUD panel bar in pixels */
export const HUD_BOTTOM_BAR_H = 130
/** Phaser render depth for HUD background panels */
export const HUD_BG_DEPTH = 50
/** Phaser render depth for HUD text and image objects */
export const HUD_TEXT_DEPTH = 51
/** Background fill color for HUD panels (dark near-black with purple tint) */
export const HUD_BG_COLOR = 0x0a0814
/** Background fill alpha for HUD panels */
export const HUD_BG_ALPHA = 0.88
/** Border line color for HUD panels (warm gold) */
export const HUD_BORDER_COLOR = 0x8a6a2a
```

- [ ] **Update `TypingEngineConfig` in `src/components/TypingEngine.ts`** — add optional `charDepth`

```typescript
export interface TypingEngineConfig {
  scene: Phaser.Scene
  x: number
  y: number
  fontSize?: number
  onWordComplete: (word: string, elapsedMs: number) => void
  onWrongKey: () => void
  silent?: boolean
  showWpm?: boolean
  charDepth?: number   // NEW: render depth for char text objects (default: TYPING_ENGINE_CHAR_DEPTH)
}
```

- [ ] **Use `charDepth` in `renderWord()`** — replace the hardcoded `TYPING_ENGINE_CHAR_DEPTH` with `this.config.charDepth ?? TYPING_ENGINE_CHAR_DEPTH`

- [ ] **Run tests**

```bash
npx vitest run src/components/TypingEngine.test.ts
```

Expected: PASS

- [ ] **Commit**

```bash
git add src/constants.ts src/components/TypingEngine.ts src/components/TypingEngine.test.ts
git commit -m "feat: add HUD constants and TypingEngine charDepth config option"
```

---

## Task 2: Export `generateHeartTextures()` from dungeonTrapArt

**Files:**
- Modify: `src/art/dungeonTrapArt.ts`

The `heart_full` and `heart_empty` textures are currently generated only as a side effect of `generateDungeonTrapTextures()`. `LevelHUD` needs these textures but shouldn't generate the entire dungeon trap texture set.

- [ ] **Add exported function to `src/art/dungeonTrapArt.ts`** — after the existing `export function generateDungeonTrapTextures`:

```typescript
/** Generate only the heart textures (heart_full, heart_empty). Safe to call multiple times — guards against duplicate generation. */
export function generateHeartTextures(scene: Phaser.Scene) {
  if (!scene.textures.exists('heart_full')) generateHeartFullTexture(scene)
  if (!scene.textures.exists('heart_empty')) generateHeartEmptyTexture(scene)
}
```

- [ ] **Run tests** to verify no regressions

```bash
npm run test
```

Expected: all pass

- [ ] **Commit**

```bash
git add src/art/dungeonTrapArt.ts
git commit -m "feat: export generateHeartTextures() from dungeonTrapArt for shared use"
```

---

## Task 3: Create `LevelHUD` — panels, top bar, hearts

**Files:**
- Create: `src/components/LevelHUD.ts`
- Create: `src/components/LevelHUD.test.ts`

- [ ] **Write failing tests in `src/components/LevelHUD.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LevelHUD, HUDConfig } from './LevelHUD'

vi.mock('phaser', () => ({
  default: {
    Scene: class { constructor() {} },
  },
}))
vi.mock('../art/dungeonTrapArt', () => ({ generateHeartTextures: vi.fn() }))
vi.mock('./TypingEngine', () => ({ TypingEngine: class { constructor() {}; destroy() {}; setWord() {} } }))
vi.mock('./TypingHands', () => ({ TypingHands: class { constructor() {}; fadeOut() {} } }))
vi.mock('../utils/profile', () => ({ loadProfile: () => null }))

function makeScene(overrides = {}) {
  const mockText = { setOrigin: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis() }
  const mockImage = { setScale: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis(), setTexture: vi.fn() }
  const mockGraphics = {
    setDepth: vi.fn().mockReturnThis(),
    fillStyle: vi.fn().mockReturnThis(),
    fillRect: vi.fn().mockReturnThis(),
  }
  return {
    scale: { width: 1280, height: 720 },
    add: {
      text: vi.fn().mockReturnValue(mockText),
      image: vi.fn().mockReturnValue(mockImage),
      graphics: vi.fn().mockReturnValue(mockGraphics),
    },
    textures: { exists: vi.fn().mockReturnValue(true) },
    input: { keyboard: { on: vi.fn() } },
    events: { on: vi.fn() },
    time: { addEvent: vi.fn().mockReturnValue({ remove: vi.fn() }) },
    ...overrides,
  }
}

const baseConfig: HUDConfig = {
  profileSlot: 0,
  heroHp: 3,
  levelName: 'Test Level',
  wordPool: ['cat', 'dog'],
  onWordComplete: vi.fn(),
  onWrongKey: vi.fn(),
}

describe('LevelHUD construction', () => {
  it('creates two graphics panels', () => {
    const scene = makeScene()
    new LevelHUD(scene as any, baseConfig)
    expect(scene.add.graphics).toHaveBeenCalledTimes(1) // one graphics object for both panels
  })

  it('creates 3 heart images', () => {
    const scene = makeScene()
    new LevelHUD(scene as any, baseConfig)
    const imageCalls = (scene.add.image as any).mock.calls
    const heartCalls = imageCalls.filter((args: any[]) => args[2] === 'heart_full' || args[2] === 'heart_empty')
    expect(heartCalls).toHaveLength(3)
  })
})

describe('LevelHUD.setHeroHp', () => {
  it('sets heart_empty texture for hearts beyond current hp', () => {
    const scene = makeScene()
    const hud = new LevelHUD(scene as any, { ...baseConfig, heroHp: 3 })
    hud.setHeroHp(1)
    // hearts[1] and hearts[2] should be set to heart_empty
    const mockImages = (scene.add.image as any).mock.results
      .filter((_r: any, i: number) => {
        const args = (scene.add.image as any).mock.calls[i]
        return args[2] === 'heart_full' || args[2] === 'heart_empty'
      })
      .map((r: any) => r.value)
    expect(mockImages[1].setTexture).toHaveBeenCalledWith('heart_empty')
    expect(mockImages[2].setTexture).toHaveBeenCalledWith('heart_empty')
  })
})
```

- [ ] **Run tests to verify they fail**

```bash
npx vitest run src/components/LevelHUD.test.ts
```

- [ ] **Create `src/components/LevelHUD.ts`** with the HUDConfig interface and LevelHUD class

```typescript
// src/components/LevelHUD.ts
import Phaser from 'phaser'
import { TypingEngine } from './TypingEngine'
import { TypingHands } from './TypingHands'
import { generateHeartTextures } from '../art/dungeonTrapArt'
import { loadProfile } from '../utils/profile'
import {
  DEFAULT_PLAYER_HP,
  HUD_TOP_BAR_H, HUD_BOTTOM_BAR_H,
  HUD_BG_DEPTH, HUD_TEXT_DEPTH,
  HUD_BG_COLOR, HUD_BG_ALPHA, HUD_BORDER_COLOR,
  LEVEL_ENGINE_FONT_SIZE,
} from '../constants'

export interface HUDConfig {
  profileSlot: number

  // Top-left
  heroHp: number                              // initial HP (1–3)

  // Top-center
  levelName: string
  phase?: { current: number; total: number }  // boss only

  // Top-right
  timer?: {
    seconds: number
    onExpire: () => void
    onTick?: (remaining: number) => void
  }
  counter?: {
    label: string                             // e.g. "Goblins Defeated", "Obstacles", "Orders"
    total: number
  }

  // Bottom bar — typing engine
  wordPool: string[]
  onWordComplete: (word: string, elapsed: number) => void
  onWrongKey: () => void
  engineFontSize?: number
}

export class LevelHUD {
  readonly engine: TypingEngine
  private hearts: Phaser.GameObjects.Image[] = []
  private phaseText?: Phaser.GameObjects.Text
  private counterText?: Phaser.GameObjects.Text
  private timerEvent?: Phaser.Time.TimerEvent
  private typingHands?: TypingHands
  private counterLabel?: string
  private counterTotal?: number
  private phaseTotal?: number

  constructor(scene: Phaser.Scene, config: HUDConfig) {
    const { width, height } = scene.scale

    generateHeartTextures(scene)

    // ── Panels ────────────────────────────────────────────────────────────────
    const bg = scene.add.graphics().setDepth(HUD_BG_DEPTH)
    bg.fillStyle(HUD_BG_COLOR, HUD_BG_ALPHA)
    bg.fillRect(0, 0, width, HUD_TOP_BAR_H)
    bg.fillRect(0, height - HUD_BOTTOM_BAR_H, width, HUD_BOTTOM_BAR_H)
    bg.fillStyle(HUD_BORDER_COLOR, 1)
    bg.fillRect(0, HUD_TOP_BAR_H, width, 2)
    bg.fillRect(0, height - HUD_BOTTOM_BAR_H, width, 2)

    // ── Top-left: Menu label + hearts ─────────────────────────────────────────
    scene.add.text(16, 10, 'MENU', {
      fontSize: '11px', color: '#6a5a4a',
    }).setOrigin(0, 0).setDepth(HUD_TEXT_DEPTH)

    for (let i = 0; i < DEFAULT_PLAYER_HP; i++) {
      const key = i < config.heroHp ? 'heart_full' : 'heart_empty'
      const heart = scene.add.image(20 + i * 26, 38, key)
        .setScale(2).setOrigin(0, 0.5).setDepth(HUD_TEXT_DEPTH)
      this.hearts.push(heart)
    }

    // ── Top-center: Level name + phase ────────────────────────────────────────
    scene.add.text(width / 2, 10, config.levelName, {
      fontSize: '18px', color: '#d4b870', fontFamily: 'serif',
    }).setOrigin(0.5, 0).setDepth(HUD_TEXT_DEPTH)

    if (config.phase) {
      this.phaseTotal = config.phase.total
      this.phaseText = scene.add.text(width / 2, 32, `Phase ${config.phase.current} / ${config.phase.total}`, {
        fontSize: '13px', color: '#7a7060',
      }).setOrigin(0.5, 0).setDepth(HUD_TEXT_DEPTH)
    }

    // ── Top-right: Timer + counter ────────────────────────────────────────────
    if (config.timer) {
      const timerText = scene.add.text(width - 16, 12, `⏳ ${config.timer.seconds}s`, {
        fontSize: '16px', color: '#c8a830',
      }).setOrigin(1, 0).setDepth(HUD_TEXT_DEPTH)

      let timeLeft = config.timer.seconds
      this.timerEvent = scene.time.addEvent({
        delay: 1000,
        repeat: config.timer.seconds - 1,
        callback: () => {
          timeLeft--
          timerText.setText(`⏳ ${timeLeft}s`)
          config.timer!.onTick?.(timeLeft)
          if (timeLeft <= 0) config.timer!.onExpire()
        },
      })
    }

    if (config.counter) {
      this.counterLabel = config.counter.label
      this.counterTotal = config.counter.total
      this.counterText = scene.add.text(width - 16, 34, `${config.counter.label}: 0 / ${config.counter.total}`, {
        fontSize: '13px', color: '#c88888',
      }).setOrigin(1, 0).setDepth(HUD_TEXT_DEPTH)
    }

    // ── Bottom bar: TypingEngine ───────────────────────────────────────────────
    const engineY = height - HUD_BOTTOM_BAR_H + 42
    this.engine = new TypingEngine({
      scene,
      x: width / 2,
      y: engineY,
      fontSize: config.engineFontSize ?? LEVEL_ENGINE_FONT_SIZE,
      onWordComplete: config.onWordComplete,
      onWrongKey: config.onWrongKey,
      charDepth: HUD_TEXT_DEPTH + 1,
    })

    // ── Bottom bar: TypingHands ───────────────────────────────────────────────
    const profile = loadProfile(config.profileSlot)
    if (profile?.showFingerHints) {
      this.typingHands = new TypingHands(scene, width / 2, height - 28)
      scene.events.on('typing_next_char', (ch: string) => this.typingHands?.highlightFinger(ch))
    }
  }

  setHeroHp(hp: number): void {
    this.hearts.forEach((heart, i) => {
      heart.setTexture(i < hp ? 'heart_full' : 'heart_empty')
    })
  }

  setPhase(current: number): void {
    this.phaseText?.setText(`Phase ${current} / ${this.phaseTotal}`)
  }

  setCounter(completed: number): void {
    this.counterText?.setText(`${this.counterLabel}: ${completed} / ${this.counterTotal}`)
  }

  destroy(): void {
    this.timerEvent?.remove()
    this.engine.destroy()
    this.typingHands?.fadeOut()
  }
}
```

- [ ] **Run tests**

```bash
npx vitest run src/components/LevelHUD.test.ts
```

Expected: PASS

- [ ] **Run full suite**

```bash
npm run test
```

Expected: all pass

- [ ] **Commit**

```bash
git add src/components/LevelHUD.ts src/components/LevelHUD.test.ts
git commit -m "feat: create LevelHUD component with panels, hearts, timer, counter, and engine"
```

---

## Task 4: LevelHUD timer test

**Files:**
- Modify: `src/components/LevelHUD.test.ts`

- [ ] **Add timer tests to `LevelHUD.test.ts`**

```typescript
describe('LevelHUD timer', () => {
  it('calls onExpire after countdown reaches zero', () => {
    const scene = makeScene()
    let timerCallback: (() => void) | null = null
    ;(scene.time.addEvent as any).mockImplementation((opts: any) => {
      timerCallback = opts.callback
      return { remove: vi.fn() }
    })

    const onExpire = vi.fn()
    new LevelHUD(scene as any, {
      ...baseConfig,
      timer: { seconds: 3, onExpire },
    })

    timerCallback!(); timerCallback!(); timerCallback!()
    expect(onExpire).toHaveBeenCalledOnce()
  })

  it('calls onTick with remaining seconds', () => {
    const scene = makeScene()
    let timerCallback: (() => void) | null = null
    ;(scene.time.addEvent as any).mockImplementation((opts: any) => {
      timerCallback = opts.callback
      return { remove: vi.fn() }
    })

    const onTick = vi.fn()
    new LevelHUD(scene as any, {
      ...baseConfig,
      timer: { seconds: 3, onExpire: vi.fn(), onTick },
    })

    timerCallback!(); timerCallback!(); timerCallback!()
    expect(onTick).toHaveBeenNthCalledWith(1, 2)
    expect(onTick).toHaveBeenNthCalledWith(2, 1)
    expect(onTick).toHaveBeenNthCalledWith(3, 0)
  })

  it('destroy() removes the timer event', () => {
    const scene = makeScene()
    const removeSpy = vi.fn()
    ;(scene.time.addEvent as any).mockReturnValue({ remove: removeSpy })

    const hud = new LevelHUD(scene as any, {
      ...baseConfig,
      timer: { seconds: 5, onExpire: vi.fn() },
    })
    hud.destroy()
    expect(removeSpy).toHaveBeenCalled()
  })
})
```

- [ ] **Run tests**

```bash
npx vitest run src/components/LevelHUD.test.ts
```

Expected: PASS

- [ ] **Commit**

```bash
git add src/components/LevelHUD.test.ts
git commit -m "test: add LevelHUD timer tests"
```

---

## Task 5: Update `BaseLevelScene` — `initWordPool()` + LevelHUD backwards compat

**Files:**
- Modify: `src/scenes/BaseLevelScene.ts`
- Modify: `src/scenes/BaseLevelScene.test.ts`

The goals:
1. Extract word pool generation into `protected initWordPool()` so scenes can call it before creating LevelHUD
2. Add `protected hud?: LevelHUD` field
3. `preCreate()` skips engine + hands creation when `options.hud` is provided; otherwise creates them as before (backwards compat)
4. `preCreate()` skips word pool generation if `wordQueue` already populated (idempotent)
5. `endLevel()` calls `this.hud.destroy()` when hud is set, else old path

- [ ] **Add `initWordPool()` tests to `BaseLevelScene.test.ts`**

```typescript
describe('BaseLevelScene.initWordPool', () => {
  it('populates this.words and this.wordQueue', () => {
    const scene = new TestLevelScene()
    ;(scene as any).init({ level: mockLevel as LevelConfig, profileSlot: 0 })
    ;(scene as any).initWordPool()
    expect((scene as any).words).toEqual(['cat', 'dog'])
    expect((scene as any).wordQueue).toEqual(['cat', 'dog']) // shuffle is identity in mock
  })
})
```

- [ ] **Run to verify it fails**

```bash
npx vitest run src/scenes/BaseLevelScene.test.ts
```

- [ ] **Refactor `BaseLevelScene.ts`** — extract word pool into `initWordPool()`, add hud support

Key changes to `BaseLevelScene.ts`:

```typescript
import { LevelHUD } from '../components/LevelHUD'
import { HUDConfig } from '../components/LevelHUD'

export interface PreCreateOptions {
  avatarScale?: number
  engineY?: number          // kept for backwards compat — ignored when hud provided
  engineFontSize?: number   // kept for backwards compat — ignored when hud provided
  handsYOffset?: number     // kept for backwards compat — ignored when hud provided
  companionSide?: 'left' | 'right'
  hud?: LevelHUD            // NEW: if provided, skip engine + hands creation
}

export abstract class BaseLevelScene extends Phaser.Scene {
  // ... existing fields ...
  protected hud?: LevelHUD  // NEW

  /** Extract word pool generation. Call before creating LevelHUD in migrated scenes. */
  protected initWordPool() {
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
  }

  protected preCreate(avatarX?: number, avatarY?: number, options: PreCreateOptions = {}) {
    this._preCreateCalled = true
    const { /* existing destructure */ companionSide = 'right' } = options

    setupPause(this, this.profileSlot)
    const { width, height } = this.scale

    const ax = avatarX ?? 100
    const ay = avatarY ?? (height - 100)

    const profile = loadProfile(this.profileSlot)

    // Avatar
    generateAllCompanionTextures(this)
    const avatarKey = profile?.avatarChoice && this.textures.exists(profile.avatarChoice)
      ? profile.avatarChoice : 'avatar_0'
    this.avatarSprite = this.add.image(ax, ay, avatarKey).setScale(options.avatarScale ?? LEVEL_AVATAR_SCALE).setDepth(5)

    // Companion / pet + gold manager
    const petRenderer = new CompanionAndPetRenderer(this, ax, ay, this.profileSlot, companionSide)
    this.goldManager = new GoldManager(this)
    // ... pet gold registration unchanged ...

    if (options.hud) {
      // Migrated path: engine + hands owned by HUD
      this.hud = options.hud
      this.engine = options.hud.engine
    } else {
      // Legacy path: word pool + engine + hands created here
      if (this.wordQueue.length === 0) this.initWordPool()

      const engineFontSize = options.engineFontSize ?? LEVEL_ENGINE_FONT_SIZE
      const engineY = options.engineY != null ? options.engineY : (height - LEVEL_ENGINE_Y_OFFSET)
      this.engine = new TypingEngine({
        scene: this,
        x: width / 2,
        y: engineY,
        fontSize: engineFontSize,
        onWordComplete: this.onWordComplete.bind(this),
        onWrongKey: this.onWrongKey.bind(this),
      })

      if (profile?.showFingerHints) {
        const handsY = height - (options.handsYOffset ?? TYPING_HANDS_Y_OFFSET)
        this.typingHands = new TypingHands(this, width / 2, handsY)
        this.events.on('typing_next_char', (ch: string) => this.typingHands?.highlightFinger(ch))
      }
    }

    // Spell caster (uses this.engine, works in both paths)
    if (profile && profile.spells.length > 0) {
      this.spellCaster = new SpellCaster(this, this.profileSlot, this.engine)
      this.spellCaster.setEffectCallback(this.handleSpellEffect.bind(this))
    }
  }

  protected endLevel(passed: boolean) {
    // ... existing guard + finished flag ...
    this.spellCaster?.destroy()
    if (this.hud) {
      this.hud.destroy()
    } else {
      this.typingHands?.fadeOut()
      this.engine.destroy()
    }
    // ... scoring + scene.start unchanged (uses this.engine.sessionStartTime etc.) ...
  }
}
```

- [ ] **Run tests**

```bash
npm run test
```

Expected: all pass

- [ ] **Commit**

```bash
git add src/scenes/BaseLevelScene.ts src/scenes/BaseLevelScene.test.ts
git commit -m "feat: add LevelHUD backwards-compat support to BaseLevelScene.preCreate()"
```

---

## Task 6: Migrate `GoblinWhackerLevel` (reference scene)

**Files:**
- Modify: `src/scenes/level-types/GoblinWhackerLevel.ts`

This is the reference migration. Every other level scene follows the same pattern. Differences between scenes:
- Which counter label/total to use
- Whether a timer exists
- Whether HP is tracked in gameplay (whether `setHeroHp()` is called)

**Before pattern (old):**
```typescript
// HP hearts (images)
for (let i = 0; i < this.playerHp; i++) {
  const heart = this.add.image(30 + i * 24, 28, 'heart').setScale(1.5)
  this.hpHearts.push(heart)
}
// Timer text
this.timerText = this.add.text(width - 20, 20, '', { fontSize: '22px', color: '#ffffff' }).setOrigin(1, 0)
// Counter text
this.counterText = this.add.text(width - 20, 50, '', { fontSize: '22px', color: '#ffaaaa' }).setOrigin(1, 0)
// Level name
this.add.text(width / 2, 20, this.level.name, { fontSize: '22px', color: '#ffd700' }).setOrigin(0.5, 0)
// Timer setup
if (this.level.timeLimit) {
  this.timerEvent = this.setupLevelTimer(this.level.timeLimit, this.timerText)
}
```

**After pattern (new):**
```typescript
create() {
  const { width, height } = this.scale
  this.pathY = height * 0.62
  this.maxGoblinReach = 80

  generateGoblinWhackerTextures(this)
  this.add.image(width / 2, height / 2, 'forest_bg')

  // ── Word pool + HUD ──────────────────────────────────────────────────────
  this.initWordPool()
  this.preCreate(80, this.pathY, {
    hud: new LevelHUD(this, {
      profileSlot: this.profileSlot,
      heroHp: DEFAULT_PLAYER_HP,
      levelName: this.level.name,
      timer: this.level.timeLimit ? {
        seconds: this.level.timeLimit,
        onExpire: () => this.endLevel(false),
      } : undefined,
      counter: { label: 'Goblins Defeated', total: this.level.wordCount },
      wordPool: this.wordQueue,
      onWordComplete: this.onWordComplete.bind(this),
      onWrongKey: this.onWrongKey.bind(this),
    }),
  })
  // ... rest of gameplay setup (goblinCtrl, wrongKeyCtrl, spawnTimer) ...
}
```

**What to remove from GoblinWhackerLevel:**
- `private hpHearts`, `private timerText`, `private counterText` fields
- `private timerEvent` field (timer now owned by HUD)
- Heart creation loop in `create()`
- `timerText`, `counterText`, level name `add.text()` calls in `create()`
- `setupLevelTimer()` call in `create()`
- `this.hpHearts[this.playerHp].setVisible(false)` in `handleGoblinBreached()` → replace with `this.hud!.setHeroHp(this.playerHp)`
- `this.hpHearts.forEach(h => h.setVisible(i < this.playerHp))` in `handleSpellEffect` → replace with `this.hud!.setHeroHp(this.playerHp)`
- `this.timerEvent?.remove()` in `endLevel()` (timer removed by hud.destroy())
- `this.counterText.setText(...)` in `updateCounterText()` → `this.hud!.setCounter(this.goblinsDefeated)`
- `gameMode` HP visibility logic (hearts always shown now)

**What to keep:** All gameplay logic: GoblinController, WrongKeyAttackController, spawn/update loops, onWordComplete, onWrongKey, gold drops, etc.

- [ ] **Make the changes described above**

- [ ] **Build check**

```bash
npm run build
```

Expected: no TypeScript errors

- [ ] **Run tests**

```bash
npm run test
```

Expected: all pass

- [ ] **Commit**

```bash
git add src/scenes/level-types/GoblinWhackerLevel.ts
git commit -m "feat: migrate GoblinWhackerLevel to LevelHUD"
```

---

## Task 7: Migrate HP-tracking level scenes

**Files:**
- Modify: `src/scenes/level-types/DungeonPlatformerLevel.ts`
- Modify: `src/scenes/level-types/SkeletonSwarmLevel.ts`
- Modify: `src/scenes/level-types/SlimeSplittingLevel.ts`
- Modify: `src/scenes/level-types/MonsterArenaLevel.ts`

Follow the same pattern as Task 6 for each scene. Key differences:

**DungeonPlatformerLevel:**
- Remove: `heartIcons` array, `buildHeartHUD()`, `updateHeartHUD()`, timerText, counterText, level name text, `setupLevelTimer()` call, vignette (low-HP warning stays — it's gameplay feedback, not a HUD element)
- Counter: `{ label: 'Obstacles', total: this.words.length }`
- Calls `this.hud!.setHeroHp(this.playerHp)` when player takes trap damage
- Note: this scene already generates `heart_full`/`heart_empty` via `generateDungeonTrapTextures()` — keep that call; `LevelHUD` calling `generateHeartTextures()` will just no-op due to the guard

**SkeletonSwarmLevel:**
- Remove: `hpHearts` array, heart creation loop, hpText/timerText/counterText, `setupLevelTimer()` call
- Counter: `{ label: 'Waves Cleared', total: <totalWaves from config> }` — inspect the scene to find the right total
- Calls `this.hud!.setHeroHp(this.playerHp)` when skeleton breaches
- Calls `this.hud!.setCounter(wavesCleared)` each wave

**SlimeSplittingLevel:**
- Remove: `hpText` (emoji), level name text
- No timer, no counter
- Calls `this.hud!.setHeroHp(this.slimeCtrl.playerHp)` when player takes damage

**MonsterArenaLevel:**
- Remove: `hpText` (emoji), monster HP text (that stays — it's gameplay-specific), level name text
- No timer, no counter in the HUD
- Calls `this.hud!.setHeroHp(this.playerHp)` when player takes damage

- [ ] **Migrate DungeonPlatformerLevel, SkeletonSwarmLevel, SlimeSplittingLevel, MonsterArenaLevel** following the pattern above

- [ ] **Build check**

```bash
npm run build
```

Expected: no errors

- [ ] **Run tests**

```bash
npm run test
```

Expected: all pass

- [ ] **Commit**

```bash
git add src/scenes/level-types/DungeonPlatformerLevel.ts src/scenes/level-types/SkeletonSwarmLevel.ts src/scenes/level-types/SlimeSplittingLevel.ts src/scenes/level-types/MonsterArenaLevel.ts
git commit -m "feat: migrate HP-tracking level scenes to LevelHUD"
```

---

## Task 8: Migrate remaining level scenes (no HP tracking)

**Files:**
- Modify: `src/scenes/level-types/CrazedCookLevel.ts`
- Modify: `src/scenes/level-types/PotionBrewingLabLevel.ts`
- Modify: `src/scenes/level-types/MagicRuneTypingLevel.ts`
- Modify: `src/scenes/level-types/DungeonEscapeLevel.ts`
- Modify: `src/scenes/level-types/GuildRecruitmentLevel.ts`
- Modify: `src/scenes/level-types/MonsterManualLevel.ts`
- Modify: `src/scenes/level-types/WoodlandFestivalLevel.ts`
- Modify: `src/scenes/level-types/UndeadSiegeLevel.ts`

These scenes don't track HP so they never call `setHeroHp()` — hearts stay at 3 full. They otherwise follow the same migration pattern.

For each scene:
1. Call `this.initWordPool()` before `preCreate()`
2. Pass `new LevelHUD(this, { ... })` in `preCreate()` options
3. Remove hand-rolled HUD `add.text()` calls for level name, timer text, counter text
4. Remove `setupLevelTimer()` call (pass timer config to LevelHUD instead)
5. Replace `this.counterText.setText(...)` with `this.hud!.setCounter(...)`

**CrazedCookLevel specifics:** Counter `{ label: 'Orders', total: this.orderQuota }`

**PotionBrewingLabLevel, MagicRuneTypingLevel, DungeonEscapeLevel, GuildRecruitmentLevel:** Inspect each scene's counter/timer config and set accordingly. If a scene has no counter, omit the `counter` field from HUDConfig.

**MonsterManualLevel, WoodlandFestivalLevel, UndeadSiegeLevel:** Likely have no timer or counter — just `heroHp`, `levelName`, `wordPool`, `onWordComplete`, `onWrongKey`.

- [ ] **Migrate all 8 scenes** following the pattern

- [ ] **Build check**

```bash
npm run build
```

- [ ] **Run tests**

```bash
npm run test
```

Expected: all pass

- [ ] **Commit**

```bash
git add src/scenes/level-types/CrazedCookLevel.ts src/scenes/level-types/PotionBrewingLabLevel.ts src/scenes/level-types/MagicRuneTypingLevel.ts src/scenes/level-types/DungeonEscapeLevel.ts src/scenes/level-types/GuildRecruitmentLevel.ts src/scenes/level-types/MonsterManualLevel.ts src/scenes/level-types/WoodlandFestivalLevel.ts src/scenes/level-types/UndeadSiegeLevel.ts
git commit -m "feat: migrate remaining level scenes to LevelHUD"
```

---

## Task 9: Migrate `MiniBossTypical` (reference boss scene)

**Files:**
- Modify: `src/scenes/boss-types/MiniBossTypical.ts`

Boss scenes use `BaseBossScene.preCreate()` with no args (uses boss defaults: avatar at `width*0.25`, scale 2.5, font size 48). After migration they pass `hud` in the options and `engineFontSize: BOSS_ENGINE_FONT_SIZE` in HUDConfig.

Boss scenes with phases pass `phase` to HUDConfig and call `this.hud!.setPhase(current)` on phase transitions.

**Before (MiniBossTypical):**
```typescript
this.preCreate()  // no args
// ...
this.hpText = this.add.text(20, 20, `HP: ${'❤️'.repeat(this.hp.playerHp)}`, ...)
this.timerText = this.add.text(width - 20, 20, '', ...)
this.add.text(width / 2, 20, this.level.name + ' (Mini-Boss)', ...)
// ...
if (this.level.timeLimit) {
  this.timerEvent = this.setupBossTimer(this.level.timeLimit, this.timerText, () => this.endLevel(false))
}
```

**After (MiniBossTypical):**
```typescript
create() {
  // Background FIRST (so it renders behind avatar etc.)
  const { width, height } = this.scale
  this.add.rectangle(width / 2, height / 2, width, height, 0x4a1e2a)

  this.initWordPool()
  // Apply weakness reduction
  const rawHp = this.wordQueue.length
  const effectiveHp = this.weaknessActive ? Math.max(1, Math.floor(rawHp * 0.8)) : rawHp
  if (this.weaknessActive) this.wordQueue = this.wordQueue.slice(0, effectiveHp)
  this.hp = this.setupBossHP(effectiveHp)

  this.preCreate(undefined, undefined, {
    hud: new LevelHUD(this, {
      profileSlot: this.profileSlot,
      heroHp: DEFAULT_PLAYER_HP,
      levelName: this.level.name,
      phase: this.level.phases ? { current: 1, total: this.level.phases } : undefined,
      timer: this.level.timeLimit ? {
        seconds: this.level.timeLimit,
        onExpire: () => this.endLevel(false),
      } : undefined,
      wordPool: this.wordQueue,
      onWordComplete: this.onWordComplete.bind(this),
      onWrongKey: this.onWrongKey.bind(this),
      engineFontSize: BOSS_ENGINE_FONT_SIZE,
    }),
  })
  // ... boss sprite, bossHpText (gameplay-specific, stays), weakness text, etc. ...
}
```

When player takes damage: `this.hud!.setHeroHp(this.hp.playerHp)`
On phase change: `this.hud!.setPhase(newPhase)`

**Remove from MiniBossTypical:**
- `private hpText`, `private timerText`, `private timerEvent` fields
- `hpText` and `timerText` `add.text()` calls in `create()`
- Level name `add.text()` call in `create()`
- `setupBossTimer()` call
- `this.hpText.setText(...)` calls → `this.hud!.setHeroHp(...)`
- `this.timerEvent?.remove()` in `endLevel()`

**Keep:** bossHpText (boss-side HP, gameplay-specific), boss sprite, weakness indicator.

- [ ] **Migrate MiniBossTypical** following the pattern above

- [ ] **Build check + tests**

```bash
npm run build && npm run test
```

- [ ] **Commit**

```bash
git add src/scenes/boss-types/MiniBossTypical.ts
git commit -m "feat: migrate MiniBossTypical to LevelHUD"
```

---

## Task 10: Migrate remaining boss scenes

**Files:**
- Modify: `src/scenes/boss-types/FlashWordBoss.ts`
- Modify: `src/scenes/boss-types/BoneKnightBoss.ts`
- Modify: `src/scenes/boss-types/GrizzlefangBoss.ts`
- Modify: `src/scenes/boss-types/HydraBoss.ts`
- Modify: `src/scenes/boss-types/ClockworkDragonBoss.ts`
- Modify: `src/scenes/boss-types/SpiderBoss.ts`
- Modify: `src/scenes/boss-types/SlimeKingBoss.ts`
- Modify: `src/scenes/boss-types/TypemancerBoss.ts`
- Modify: `src/scenes/boss-types/DiceLichBoss.ts`
- Modify: `src/scenes/boss-types/AncientDragonBoss.ts`
- Modify: `src/scenes/boss-types/BaronTypoBoss.ts`

Follow the same pattern as MiniBossTypical for all 11 remaining boss scenes. All boss scenes:
- Use `BOSS_ENGINE_FONT_SIZE` in HUDConfig
- Pass `phase` if `this.level.phases` is set
- Pass timer config if `this.level.timeLimit` is set
- Call `this.hud!.setHeroHp(this.hp.playerHp)` when player takes damage
- Call `this.hud!.setPhase(current)` on phase transitions (for multi-phase bosses)
- Keep boss-side HP display (bossHpText, boss HP bars) — these are gameplay-specific and not part of LevelHUD

- [ ] **Migrate all 11 boss scenes**

- [ ] **Build check + tests**

```bash
npm run build && npm run test
```

Expected: all pass

- [ ] **Commit**

```bash
git add src/scenes/boss-types/
git commit -m "feat: migrate all boss scenes to LevelHUD"
```

---

## Task 11: Final cleanup — remove backwards compat code

All scenes are now migrated. Remove the old code paths.

**Files:**
- Modify: `src/scenes/BaseLevelScene.ts`
- Modify: `src/scenes/BaseLevelScene.test.ts`
- Modify: `src/scenes/BaseBossScene.ts`
- Modify: `src/scenes/BaseBossScene.test.ts`
- Modify: `src/constants.ts`

**BaseLevelScene changes:**
- Remove the `else` branch in `preCreate()` (old engine/hands creation path)
- Make `options.hud` required: rename `PreCreateOptions.hud` to required, or change `preCreate()` signature to accept `LevelHUD` as first arg
- Remove `setupLevelTimer()` method
- Remove `protected typingHands` field
- Remove imports for `TypingEngine`, `TypingHands`, `LEVEL_ENGINE_Y_OFFSET`, `LEVEL_ENGINE_FONT_SIZE`, `TYPING_HANDS_Y_OFFSET`
- `endLevel()` simplifies to always call `this.hud!.destroy()`
- Update `PreCreateOptions` to remove `engineY`, `engineFontSize`, `handsYOffset`

**BaseBossScene changes:**
- Remove `setupBossTimer()` method

**BaseLevelScene.test.ts + BaseBossScene.test.ts:**
- Remove `setupLevelTimer` tests (those tests now belong in `LevelHUD.test.ts` — already covered)
- Remove `setupBossTimer` tests
- Update `preCreate` test for new signature

**constants.ts:**
- Remove `LEVEL_ENGINE_Y_OFFSET`, `BOSS_ENGINE_Y_OFFSET`, `TYPING_HANDS_Y_OFFSET`
- Keep `LEVEL_ENGINE_FONT_SIZE` and `BOSS_ENGINE_FONT_SIZE` (still used in LevelHUD configs)

- [ ] **Make all cleanup changes**

- [ ] **Build check**

```bash
npm run build
```

Expected: no errors

- [ ] **Run full test suite**

```bash
npm run test
```

Expected: all pass

- [ ] **Commit**

```bash
git add src/scenes/BaseLevelScene.ts src/scenes/BaseLevelScene.test.ts src/scenes/BaseBossScene.ts src/scenes/BaseBossScene.test.ts src/constants.ts
git commit -m "refactor: remove backwards-compat code after full LevelHUD migration"
```
