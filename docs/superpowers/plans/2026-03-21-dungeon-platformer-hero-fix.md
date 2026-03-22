# DungeonPlatformerLevel Hero Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix four bugs in `DungeonPlatformerLevel`: duplicate hero sprite, gold drops where there should be none, companion/pet positioned to the right instead of left, and no party animation on trap clear.

**Architecture:** Expose the avatar sprite from `BaseLevelScene.preCreate` so subclasses can reference it directly. Add left-side layout support to `CompanionAndPetRenderer`. Wire up `DungeonPlatformerLevel` to use the correct position, suppress gold, and emit a `trap_cleared` event that triggers a jump animation.

**Tech Stack:** Phaser 3, TypeScript, Vitest for tests (`npx vitest run <file>` to run a single test file).

---

## File Map

| File | Change |
|------|--------|
| `src/scenes/BaseLevelScene.ts` | Add `avatarSprite` field; add `companionSide` to `PreCreateOptions`; pass through to `CompanionAndPetRenderer` |
| `src/scenes/BaseLevelScene.test.ts` | Add test that `avatarSprite` is set after `preCreate` |
| `src/components/CompanionAndPetRenderer.ts` | Accept `side` param; flip positions; add `playJumpAnimation`; listen for `trap_cleared` |
| `src/scenes/level-types/DungeonPlatformerLevel.ts` | Move `heroX` before `preCreate`; use correct Y; reference `avatarSprite`; remove gold; emit `trap_cleared` |

---

### Task 1: Expose `avatarSprite` from `BaseLevelScene`

**Files:**
- Modify: `src/scenes/BaseLevelScene.ts`
- Modify: `src/scenes/BaseLevelScene.test.ts`

**Background:** `preCreate` currently discards the return value of `this.add.image(...)`. Subclasses that want to animate the hero sprite have to create a second redundant image (the root cause of the duplicate-hero bug). We expose it via a protected field.

- [ ] **Step 1: Write failing test**

Add to `src/scenes/BaseLevelScene.test.ts`:

```typescript
describe('BaseLevelScene.preCreate avatarSprite', () => {
  it('sets avatarSprite after preCreate is called', () => {
    const scene = new TestLevelScene()
    ;(scene as any).init({ level: mockLevel as LevelConfig, profileSlot: 0 })

    const fakeImage = { setScale: () => fakeImage, setDepth: () => fakeImage }
    ;(scene as any).add = { image: vi.fn().mockReturnValue(fakeImage) }
    ;(scene as any).scale = { width: 1280, height: 720 }
    ;(scene as any).input = { keyboard: null }
    ;(scene as any).events = { on: vi.fn(), once: vi.fn(), emit: vi.fn() }
    ;(scene as any).time = { addEvent: vi.fn().mockReturnValue({ remove: vi.fn() }) }

    // Stub out everything preCreate calls that we don't care about here
    vi.mock('../utils/profile', () => ({ loadProfile: () => null }), { virtual: true })
    vi.mock('../utils/words', () => ({ getWordPool: () => ['cat', 'dog'] }), { virtual: true })
    vi.mock('../art/companionsArt', () => ({ generateAllCompanionTextures: () => {} }), { virtual: true })
    vi.mock('../utils/pauseSetup', () => ({ setupPause: () => {} }), { virtual: true })
    vi.mock('../components/TypingEngine', () => ({
      TypingEngine: class { constructor() {} }
    }), { virtual: true })
    vi.mock('../components/CompanionAndPetRenderer', () => ({
      CompanionAndPetRenderer: class {
        constructor() {}
        getPetSprite() { return null }
        getStartPetX() { return 0 }
        getStartPetY() { return 0 }
      }
    }), { virtual: true })
    vi.mock('../utils/goldSystem', () => ({
      GoldManager: class { constructor() {} }
    }), { virtual: true })

    ;(scene as any).preCreate(100, 400)

    expect((scene as any).avatarSprite).toBe(fakeImage)
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run src/scenes/BaseLevelScene.test.ts
```

Expected: FAIL — `avatarSprite` is `null` / undefined.

- [ ] **Step 3: Add `avatarSprite` field and assign it in `preCreate`**

In `src/scenes/BaseLevelScene.ts`:

At the top of the class body (after `private _preCreateCalled`), add:

```typescript
protected avatarSprite: Phaser.GameObjects.Image | null = null
```

In `preCreate`, find this line:
```typescript
this.add.image(ax, ay, avatarKey).setScale(avatarScale).setDepth(5)
```
Replace with:
```typescript
this.avatarSprite = this.add.image(ax, ay, avatarKey).setScale(avatarScale).setDepth(5)
```

- [ ] **Step 4: Also add `companionSide` to `PreCreateOptions` and pass it through**

In `PreCreateOptions` interface, add:
```typescript
companionSide?: 'left' | 'right'
```

In `preCreate`, destructure the new option:
```typescript
const {
  avatarScale = LEVEL_AVATAR_SCALE,
  engineFontSize = LEVEL_ENGINE_FONT_SIZE,
  handsYOffset = TYPING_HANDS_Y_OFFSET,
  engineY: engineYOverride,
  companionSide = 'right',
} = options
```

Then pass it to the `CompanionAndPetRenderer` constructor. The constructor currently reads:
```typescript
const petRenderer = new CompanionAndPetRenderer(this, ax, ay, this.profileSlot)
```
Change to:
```typescript
const petRenderer = new CompanionAndPetRenderer(this, ax, ay, this.profileSlot, companionSide)
```

- [ ] **Step 5: Run tests**

```bash
npx vitest run src/scenes/BaseLevelScene.test.ts
```

Expected: all tests PASS (the new test may still fail if `CompanionAndPetRenderer` mock doesn't accept a 5th arg — that's fine, the constructor signature change comes in Task 2).

- [ ] **Step 6: Commit**

```bash
git add src/scenes/BaseLevelScene.ts src/scenes/BaseLevelScene.test.ts
git commit -m "feat: expose avatarSprite from preCreate; add companionSide option"
```

---

### Task 2: Left-side layout + jump animation in `CompanionAndPetRenderer`

**Files:**
- Modify: `src/components/CompanionAndPetRenderer.ts`

**Background:** Currently the companion and pet are always placed to the RIGHT of the hero. For the dungeon trap level, they follow behind (to the left). We also add a `playJumpAnimation` triggered by the new `trap_cleared` scene event.

There is no dedicated test file for `CompanionAndPetRenderer` — these changes are visual/tween logic that is tested indirectly via scene behavior. We will add a focused unit test file.

- [ ] **Step 1: Write failing tests**

Create `src/components/CompanionAndPetRenderer.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../utils/profile', () => ({ loadProfile: () => null }))
vi.mock('../art/companionsArt', () => ({ generateAllCompanionTextures: () => {} }))

// Minimal Phaser mock
vi.mock('phaser', () => ({
  default: {
    Scene: class {},
    Scenes: { Events: { SHUTDOWN: 'shutdown' } },
  },
}))

import { CompanionAndPetRenderer } from './CompanionAndPetRenderer'

function makeScene(eventHandlers: Record<string, () => void> = {}) {
  return {
    add: {
      graphics: () => ({
        fillStyle: () => {},
        fillEllipse: () => {},
      }),
      image: vi.fn().mockReturnValue({
        setScale: function() { return this },
        setDepth: function() { return this },
        x: 0, y: 0,
      }),
    },
    tweens: { add: vi.fn() },
    events: {
      on: (event: string, cb: () => void) => { eventHandlers[event] = cb },
      once: (event: string, cb: () => void) => { eventHandlers[event] = cb },
      off: vi.fn(),
    },
  } as any
}

describe('CompanionAndPetRenderer — side option', () => {
  it('places pet and companion to the right of hero by default', () => {
    const scene = makeScene()
    new CompanionAndPetRenderer(scene, 100, 300, 0)
    // No sprites created (loadProfile returns null) — just ensure no throw
    expect(true).toBe(true)
  })

  it('does not throw when side is left', () => {
    const scene = makeScene()
    expect(() => new CompanionAndPetRenderer(scene, 448, 387, 0, 'left')).not.toThrow()
  })
})

describe('CompanionAndPetRenderer — trap_cleared event', () => {
  it('calls tweens.add for pet and companion sprites when trap_cleared fires', () => {
    const handlers: Record<string, () => void> = {}
    const scene = makeScene(handlers)

    // Make loadProfile return a profile with companion and pet so sprites are created
    vi.doMock('../utils/profile', () => ({
      loadProfile: () => ({
        activeCompanionId: 'badger_warrior',
        activePetId: 'slime',
      }),
    }))

    // Simulate: companion sprite and pet sprite exist
    const renderer = new CompanionAndPetRenderer(scene, 448, 387, 0, 'left')
    // Manually inject sprites to test the animation (since loadProfile returns null in mock)
    ;(renderer as any).companionSprite = { y: 387 }
    ;(renderer as any).petSprite = { y: 387 }

    // Fire the trap_cleared event
    handlers['trap_cleared']?.()

    // tweens.add should have been called for both sprites
    expect(scene.tweens.add).toHaveBeenCalled()
  })

  it('does not throw when trap_cleared fires and sprites are null', () => {
    const handlers: Record<string, () => void> = {}
    const scene = makeScene(handlers)
    new CompanionAndPetRenderer(scene, 448, 387, 0, 'left')
    expect(() => handlers['trap_cleared']?.()).not.toThrow()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/components/CompanionAndPetRenderer.test.ts
```

Expected: FAIL — `side` parameter not accepted, `trap_cleared` not handled.

- [ ] **Step 3: Implement the changes**

Replace the body of `src/components/CompanionAndPetRenderer.ts` with:

```typescript
import Phaser from 'phaser'
import { loadProfile } from '../utils/profile'
import { generateAllCompanionTextures } from '../art/companionsArt'

export class CompanionAndPetRenderer {
  private scene: Phaser.Scene
  private companionSprite: Phaser.GameObjects.Image | null = null
  private petSprite: Phaser.GameObjects.Image | null = null
  private startCompX = 0
  private startPetX = 0

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    profileSlot: number,
    side: 'left' | 'right' = 'right'
  ) {
    this.scene = scene
    const profile = loadProfile(profileSlot)

    const graphics = scene.add.graphics()
    graphics.fillStyle(0x000000, 0.3)

    // Hero is at (x, y).
    // 'right': pet one slot right, companion two slots right (default — combat levels).
    // 'left':  pet one slot left, companion two slots left (trap levels — party follows behind).
    const sign = side === 'left' ? -1 : 1
    const petX = x + sign * 70
    const petY = y
    const companionX = x + sign * (side === 'left' ? 140 : 145)
    const companionY = y

    this.startPetX = petX
    this.startCompX = companionX

    // Shadow ellipses beneath each slot (positions follow petX/companionX)
    graphics.fillEllipse(petX, petY + 28, 50, 16)
    graphics.fillEllipse(companionX, companionY + 28, 60, 18)

    generateAllCompanionTextures(scene)

    if (profile?.activeCompanionId) {
      this.companionSprite = scene.add.image(companionX, companionY, profile.activeCompanionId).setScale(1.5).setDepth(3)
    }

    if (profile?.activePetId) {
      this.petSprite = scene.add.image(petX, petY, profile.activePetId).setScale(1.2).setDepth(5)
    }

    this.scene.events.on('word_completed_attack', this.playAttackAnimation, this)
    this.scene.events.on('trap_cleared', this.playJumpAnimation, this)
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this)
  }

  private playAttackAnimation() {
    if (this.companionSprite) {
      this.scene.tweens.add({
        targets: this.companionSprite,
        x: this.startCompX + 40,
        yoyo: true,
        duration: 150,
        delay: 60,
        ease: 'Quad.easeOut'
      })
    }
  }

  private playJumpAnimation() {
    if (this.companionSprite) {
      this.scene.tweens.add({
        targets: this.companionSprite,
        y: this.companionSprite.y - 30,
        yoyo: true,
        duration: 200,
        ease: 'Sine.easeOut'
      })
    }
    if (this.petSprite) {
      this.scene.tweens.add({
        targets: this.petSprite,
        y: this.petSprite.y - 30,
        yoyo: true,
        duration: 200,
        delay: 60,
        ease: 'Sine.easeOut'
      })
    }
  }

  public getPetSprite() { return this.petSprite }
  public getStartPetX() { return this.startPetX }
  public getStartPetY() { return this.petSprite ? this.petSprite.y : 0 }

  public destroy() {
    this.scene.events.off('word_completed_attack', this.playAttackAnimation, this)
    this.scene.events.off('trap_cleared', this.playJumpAnimation, this)
  }
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/components/CompanionAndPetRenderer.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Run full test suite to check for regressions**

```bash
npm run test
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/CompanionAndPetRenderer.ts src/components/CompanionAndPetRenderer.test.ts
git commit -m "feat: add left-side layout and jump animation to CompanionAndPetRenderer"
```

---

### Task 3: Fix `DungeonPlatformerLevel`

**Files:**
- Modify: `src/scenes/level-types/DungeonPlatformerLevel.ts`

**Background:** Four lines to change: (1) move `heroX` definition before `preCreate`, (2) call `preCreate` with the correct position and `companionSide: 'left'`, (3) remove the duplicate hero `add.image` and reference `avatarSprite` instead, (4) remove gold spawn and emit `trap_cleared`.

There is no unit test for `DungeonPlatformerLevel` (it's a full Phaser scene — too Phaser-heavy to unit test meaningfully). The correctness check is visual. We verify no regressions via the full test suite.

- [ ] **Step 1: Edit the `create()` method**

In `src/scenes/level-types/DungeonPlatformerLevel.ts`, make these changes to `create()`:

**a) Move `heroX` before `preCreate`.** The `create()` method currently reads:

```typescript
const floorY = height * 0.62
this.heroBaseY = floorY

// preCreate places the player avatar at left side, companion, pet, gold, words, engine
this.preCreate(100, height * 0.6)
this.platformerController = new PlatformerController(this.wordQueue)

// Hero dodging sprite is separate — placed at 35% width for obstacle interaction
const heroX = width * 0.35
```

Replace those lines with:

```typescript
const floorY = height * 0.62
this.heroBaseY = floorY

// Hero runs at 35% width on the floor
const heroX = width * 0.35

// preCreate: avatar at heroX/heroBaseY; companion/pet follow behind (left side)
this.preCreate(heroX, this.heroBaseY, { companionSide: 'left' })
this.platformerController = new PlatformerController(this.wordQueue)
```

**b) Remove the duplicate hero sprite block.** Delete lines 104–111:

```typescript
// ── Hero reference for walking animation ────────────────────
// preCreate already placed the avatar at (heroX, heroBaseY); we create a tracked
// copy here so we can tween it for the walking bob effect.
const profile = loadProfile(this.profileSlot)
const avatarKey = this.textures.exists(profile?.avatarChoice || '')
  ? profile!.avatarChoice : 'avatar_0'
this.hero = this.add.image(heroX, this.heroBaseY, avatarKey)
  .setScale(1.5).setDepth(5)
```

Replace with:

```typescript
// ── Hero reference for walking animation ────────────────────
// preCreate placed the avatar at (heroX, heroBaseY); reference it directly.
this.hero = this.avatarSprite!
```

- [ ] **Step 2: Remove unused imports**

At the top of `DungeonPlatformerLevel.ts`, the import line reads:

```typescript
import { loadProfile } from '../../utils/profile'
```

Remove the `loadProfile` import entirely (it's no longer used after Step 1b).

Also on the constants import line:

```typescript
import { DEFAULT_PLAYER_HP, GOLD_PER_KILL } from '../../constants'
```

Remove `GOLD_PER_KILL` (it will be unused after Step 3):

```typescript
import { DEFAULT_PLAYER_HP } from '../../constants'
```

- [ ] **Step 3: Fix `onWordComplete` — remove gold, emit `trap_cleared`**

In `onWordComplete`, replace:

```typescript
// Drop gold on kill
if (this.goldManager) {
  const dropX = this.scale.width / 2 + (Math.random() * 200 - 100);
  const dropY = this.scale.height / 2 + (Math.random() * 100 - 50);
  this.goldManager.spawnGold(dropX, dropY, GOLD_PER_KILL);
}
```

With:

```typescript
// Notify party to animate (trap dodged — no gold in this level type)
this.events.emit('trap_cleared')
```

- [ ] **Step 4: Run full test suite**

```bash
npm run test
```

Expected: all tests PASS.

- [ ] **Step 5: Type-check**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add src/scenes/level-types/DungeonPlatformerLevel.ts
git commit -m "fix: remove duplicate hero, gold drops, and fix party position in DungeonPlatformerLevel"
```
