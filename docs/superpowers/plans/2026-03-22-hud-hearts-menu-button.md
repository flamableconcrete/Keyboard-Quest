# HUD Hearts Spacing & Menu Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix overlapping hearts in the top-left HUD, replace the floating "Esc to Pause" overlay with a proper interactive `[ MENU ]` button inside the HUD bar, and add a gold "HP" label so the left side matches the visual style of the right-side timer.

**Architecture:** All changes are in `LevelHUD.ts` (the component) and `pauseSetup.ts` (gutted to a no-op). The ESC keyboard listener moves from `pauseSetup` into the `LevelHUD` constructor and is torn down in `destroy()`. `BaseLevelScene.ts` and all tests are unchanged.

**Tech Stack:** Phaser 3, TypeScript, Vitest

---

## File Map

| File | Change |
|------|--------|
| `src/components/LevelHUD.ts` | Redesign top-left section: interactive MENU button, HP label, fixed heart spacing, ESC listener lifecycle |
| `src/components/LevelHUD.test.ts` | New assertions: ESC registration, destroy cleanup, heart positions |
| `src/utils/pauseSetup.ts` | Gut to empty no-op (body removed, signature kept) |

---

### Task 1: Add failing tests for new LevelHUD behavior

**Files:**
- Modify: `src/components/LevelHUD.test.ts`

The existing `mockText` and `mockScene` don't support `.setInteractive()` or `.on()` chains. Extend the mock, then add three new test cases that will fail until the implementation is updated.

- [ ] **Step 1: Extend `mockText` and `makeScene` in `LevelHUD.test.ts`**

Replace the existing `mockText` and `makeScene` with versions that support `setInteractive` and `on` chaining, and add `off` to the keyboard mock:

```ts
function makeScene(overrides = {}) {
  const mockText = {
    setOrigin: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setText: vi.fn().mockReturnThis(),
    setInteractive: vi.fn().mockReturnThis(),
    setColor: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
  }
  const mockImage = {
    setScale: vi.fn().mockReturnThis(),
    setOrigin: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setTexture: vi.fn(),
  }
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
    input: { keyboard: { on: vi.fn(), off: vi.fn() } },
    scene: { isPaused: vi.fn().mockReturnValue(false), pause: vi.fn(), launch: vi.fn(), bringToTop: vi.fn(), key: 'TestScene' },
    events: { on: vi.fn() },
    time: { addEvent: vi.fn().mockReturnValue({ remove: vi.fn() }) },
    ...overrides,
  }
}
```

- [ ] **Step 2: Add three failing test cases**

Append these three `describe` blocks to `LevelHUD.test.ts`:

```ts
describe('LevelHUD ESC listener', () => {
  it('registers keydown-ESC handler on construction', () => {
    const scene = makeScene()
    new LevelHUD(scene as any, baseConfig)
    expect(scene.input.keyboard.on).toHaveBeenCalledWith('keydown-ESC', expect.any(Function))
  })

  it('removes keydown-ESC handler on destroy()', () => {
    const scene = makeScene()
    const hud = new LevelHUD(scene as any, baseConfig)
    hud.destroy()
    expect(scene.input.keyboard.off).toHaveBeenCalledWith('keydown-ESC', expect.any(Function))
  })
})

describe('LevelHUD heart positions', () => {
  it('places hearts at y=28 and x starting at 124 with step 54', () => {
    const scene = makeScene()
    new LevelHUD(scene as any, baseConfig)
    const imageCalls: any[][] = (scene.add.image as any).mock.calls
    const heartCalls = imageCalls.filter(args => args[2] === 'heart_full' || args[2] === 'heart_empty')
    expect(heartCalls).toHaveLength(3)
    expect(heartCalls[0][0]).toBe(124)  // x of first heart
    expect(heartCalls[1][0]).toBe(178)  // 124 + 54
    expect(heartCalls[2][0]).toBe(232)  // 124 + 108
    expect(heartCalls[0][1]).toBe(28)   // y vertically centered
  })
})
```

- [ ] **Step 3: Run the new tests and confirm they fail**

```bash
npx vitest run src/components/LevelHUD.test.ts
```

Expected: the three new tests fail (wrong heart positions, `keyboard.on` not called with `'keydown-ESC'`, `keyboard.off` not called).

---

### Task 2: Implement top-left HUD redesign in `LevelHUD.ts`

**Files:**
- Modify: `src/components/LevelHUD.ts`

Replace the passive `MENU` label and heart loop with the new layout. Add `_scene` and `escHandler` instance fields. Update `destroy()`.

- [ ] **Step 1: Add instance fields near the top of the class**

In `src/components/LevelHUD.ts`, inside the `LevelHUD` class body, after the existing field declarations, add:

```ts
private _scene!: Phaser.Scene
private escHandler!: () => void
```

- [ ] **Step 2: Replace the top-left section in the constructor**

Find and replace the `// ── Top-left: Menu label + hearts` block (lines 68–78):

**Remove:**
```ts
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
```

**Replace with:**
```ts
// ── Top-left: MENU button + HP label + hearts ─────────────────────────────
this._scene = scene
this.escHandler = () => {
  if (!scene.scene.isPaused()) {
    scene.scene.pause()
    scene.scene.launch('PauseScene', { levelKey: scene.scene.key, profileSlot: config.profileSlot })
    scene.scene.bringToTop('PauseScene')
  }
}
scene.input.keyboard?.on('keydown-ESC', this.escHandler)

scene.add.text(12, 28, '[ MENU ]', {
  fontSize: '14px', color: '#c8a830',
}).setOrigin(0, 0.5).setDepth(HUD_TEXT_DEPTH)
  .setInteractive({ useHandCursor: true })
  .on('pointerover', function(this: Phaser.GameObjects.Text) { this.setColor('#ffd966') })
  .on('pointerout',  function(this: Phaser.GameObjects.Text) { this.setColor('#c8a830') })
  .on('pointerdown', () => {
    if (!scene.scene.isPaused()) {
      scene.scene.pause()
      scene.scene.launch('PauseScene', { levelKey: scene.scene.key, profileSlot: config.profileSlot })
      scene.scene.bringToTop('PauseScene')
    }
  })

scene.add.text(96, 28, 'HP', {
  fontSize: '13px', color: '#c8a830',
}).setOrigin(0, 0.5).setDepth(HUD_TEXT_DEPTH)

for (let i = 0; i < DEFAULT_PLAYER_HP; i++) {
  const key = i < config.heroHp ? 'heart_full' : 'heart_empty'
  const heart = scene.add.image(124 + i * 54, 28, key)
    .setScale(2).setOrigin(0, 0.5).setDepth(HUD_TEXT_DEPTH)
  this.hearts.push(heart)
}
```

- [ ] **Step 3: Update `destroy()` to remove the ESC listener**

In `src/components/LevelHUD.ts`, find `destroy()` and add the keyboard cleanup:

**Before:**
```ts
destroy(): void {
  this.timerEvent?.remove()
  this.engine.destroy()
  this.typingHands?.fadeOut()
}
```

**After:**
```ts
destroy(): void {
  this._scene.input.keyboard?.off('keydown-ESC', this.escHandler)
  this.timerEvent?.remove()
  this.engine.destroy()
  this.typingHands?.fadeOut()
}
```

- [ ] **Step 4: Run the new tests and confirm they pass**

```bash
npx vitest run src/components/LevelHUD.test.ts
```

Expected: all tests pass, including the three new ones.

- [ ] **Step 5: Run the full test suite**

```bash
npm run test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/LevelHUD.ts src/components/LevelHUD.test.ts
git commit -m "feat: redesign HUD top-left — interactive MENU button, HP label, fixed heart spacing"
```

---

### Task 3: Gut `pauseSetup.ts` to a no-op stub

**Files:**
- Modify: `src/utils/pauseSetup.ts`

The ESC listener and visual button are now in `LevelHUD`. The `setupPause` export must remain so `BaseLevelScene.ts` and its test mock continue to compile without change.

- [ ] **Step 1: Replace the body of `pauseSetup.ts` with a no-op**

Replace the entire file content with:

```ts
import Phaser from 'phaser'

export function setupPause(_scene: Phaser.Scene, _profileSlot: number) {
  // Pause logic moved into LevelHUD (ESC key + MENU button).
}
```

- [ ] **Step 2: Run the full test suite**

```bash
npm run test
```

Expected: all tests pass (the test mock `{ setupPause: () => {} }` remains compatible).

- [ ] **Step 3: Commit**

```bash
git add src/utils/pauseSetup.ts
git commit -m "refactor: gut pauseSetup to no-op — pause handling moved into LevelHUD"
```
