# Game Modes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the bug where only the first goblin can be typed, add `gameMode` to profiles, implement regular vs advanced mode behavior in GoblinWhackerLevel, and add a SettingsScene accessible from OverlandMapScene.

**Architecture:** Add `gameMode: 'regular' | 'advanced'` to `ProfileData`. `GoblinWhackerLevel` reads this on create and branches behavior. A new `SettingsScene` handles the toggle and is launched from `OverlandMapScene` via a SETTINGS button.

**Tech Stack:** Phaser 3, TypeScript, Vite, Vitest

---

### Task 1: Add `gameMode` to ProfileData and profile utilities

**Files:**
- Modify: `src/types/index.ts:26-50`
- Modify: `src/utils/profile.ts:6-46`
- Modify: `src/utils/profile.test.ts`

**Step 1: Add failing tests**

In `src/utils/profile.test.ts`, add inside the `describe('profile system', ...)` block:

```ts
it('creates profile with gameMode regular by default', () => {
  const p = createProfile('Hero')
  expect(p.gameMode).toBe('regular')
})

it('loadProfile returns regular gameMode for legacy profiles missing the field', () => {
  // Simulate a legacy profile saved without gameMode
  const legacy = createProfile('OldHero')
  const { gameMode: _drop, ...withoutMode } = legacy as ProfileData & { gameMode?: string }
  localStorage.setItem('kq_profile_0', JSON.stringify(withoutMode))
  const loaded = loadProfile(0)
  expect(loaded?.gameMode).toBe('regular')
})
```

**Step 2: Run tests to verify they fail**

```bash
npx vitest run src/utils/profile.test.ts
```
Expected: 2 new tests fail — `gameMode` does not exist on type / is `undefined`.

**Step 3: Add `gameMode` to `ProfileData` in `src/types/index.ts`**

After line 49 (`bossWeaknessKnown: string | null`), add:
```ts
gameMode: 'regular' | 'advanced'
```

**Step 4: Add `gameMode` to `createProfile` in `src/utils/profile.ts`**

Inside the returned object (after `bossWeaknessKnown: null`), add:
```ts
gameMode: 'regular' as const,
```

**Step 5: Add migration guard to `loadProfile` in `src/utils/profile.ts`**

Replace the current `loadProfile` function (lines 38-46) with:
```ts
export function loadProfile(slot: number): ProfileData | null {
  const raw = localStorage.getItem(KEY(slot))
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as ProfileData
    if (!data.gameMode) data.gameMode = 'regular'
    return data
  } catch {
    return null
  }
}
```

**Step 6: Run tests to verify they pass**

```bash
npx vitest run src/utils/profile.test.ts
```
Expected: ALL tests pass.

**Step 7: Commit**

```bash
git add src/types/index.ts src/utils/profile.ts src/utils/profile.test.ts
git commit -m "feat: add gameMode to ProfileData with regular default and migration"
```

---

### Task 2: Fix the active goblin stale-reference bug

**Files:**
- Modify: `src/scenes/level-types/GoblinWhackerLevel.ts:187-193`

**Step 1: Read and understand the bug**

In `GoblinWhackerLevel.ts`, `goblinReachedPlayer` (line 187) calls `removeGoblin(goblin)` but never clears `this.activeGoblin`. When the active goblin reaches the player and is destroyed, `this.activeGoblin` stays pointing to the stale object. Subsequent goblin spawns skip auto-activation because `!this.activeGoblin` is false.

**Step 2: Fix `goblinReachedPlayer`**

Replace lines 187-193:
```ts
private goblinReachedPlayer(goblin: Goblin) {
  this.removeGoblin(goblin)
  this.playerHp--
  this.hpText.setText(`HP: ${'❤️'.repeat(Math.max(0, this.playerHp))}`)
  this.cameras.main.shake(200, 0.01)
  if (this.activeGoblin === goblin) {
    this.setActiveGoblin(this.goblins[0] ?? null)
  }
  if (this.playerHp <= 0) this.endLevel(false)
}
```

**Step 3: Build to verify no TypeScript errors**

```bash
npm run build
```
Expected: Build succeeds with no errors.

**Step 4: Commit**

```bash
git add src/scenes/level-types/GoblinWhackerLevel.ts
git commit -m "fix: advance active goblin when current goblin reaches player"
```

---

### Task 3: Implement regular mode behavior in GoblinWhackerLevel

Regular mode: up to 3–4 goblins visible, all marching, but only lead is typeable. The lead stops at a "battle position" (`battleX`). Subsequent goblins maintain spacing. No HP damage — goblins never reach the player.

**Files:**
- Modify: `src/scenes/level-types/GoblinWhackerLevel.ts`

**Step 1: Add `gameMode` field and constants**

At the top of the class (after `private tutorialHands?: TutorialHands`, line 41), add:
```ts
private gameMode: 'regular' | 'advanced' = 'regular'
private readonly BATTLE_X = 300        // where lead goblin stops in regular mode
private readonly GOBLIN_SPACING = 120  // horizontal gap between queued goblins
private readonly MAX_VISIBLE_QUEUE = 4 // max goblins on screen at once in regular mode
```

**Step 2: Read `gameMode` from profile in `init`**

In `init` (lines 45-51), after `this.playerHp = 3`, add:
```ts
const profile = loadProfile(data.profileSlot)
this.gameMode = profile?.gameMode ?? 'regular'
```

**Step 3: Hide HP HUD in regular mode**

In `create`, after `this.hpText` is created (line 61-63), add:
```ts
if (this.gameMode === 'regular') this.hpText.setVisible(false)
```

**Step 4: Cap spawn queue in regular mode**

In `spawnGoblin` (line 144), replace the guard at the top:
```ts
private spawnGoblin() {
  if (this.finished || this.wordQueue.length === 0) return
  if (this.gameMode === 'regular' && this.goblins.length >= this.MAX_VISIBLE_QUEUE) return
```

**Step 5: Update `update()` for regular mode movement**

Replace the `update` method (lines 174-185):
```ts
update(_time: number, delta: number) {
  if (this.finished) return

  if (this.gameMode === 'advanced') {
    this.goblins.forEach(g => {
      g.x -= g.speed * (delta / 1000)
      g.sprite.setX(g.x)
      g.label.setX(g.x)
      if (g.x <= this.maxGoblinReach) {
        this.goblinReachedPlayer(g)
      }
    })
  } else {
    // Regular mode: lead stops at BATTLE_X, others queue behind with spacing
    this.goblins.forEach((g, i) => {
      const targetX = this.BATTLE_X + i * this.GOBLIN_SPACING
      if (g.x > targetX) {
        g.x -= g.speed * (delta / 1000)
        if (g.x < targetX) g.x = targetX
      }
      g.sprite.setX(g.x)
      g.label.setX(g.x)
    })
  }
}
```

Note: in `this.goblins`, index 0 is always the lead (leftmost). The lead targets `BATTLE_X`, the next targets `BATTLE_X + 120`, etc.

**Step 6: After defeating a goblin in regular mode, trigger next spawn**

In `onWordComplete` (line 195), after `this.setActiveGoblin(next)`, add:
```ts
if (this.gameMode === 'regular') {
  this.spawnGoblin()
}
```

**Step 7: Update `goblinReachedPlayer` — no damage in regular mode**

Since regular mode goblins never reach `maxGoblinReach`, the guard in `goblinReachedPlayer` only applies to advanced mode. This is already safe because regular goblins stop at `BATTLE_X` (300px), which is greater than `maxGoblinReach` (80px). No code change needed — but verify `BATTLE_X > maxGoblinReach` is always true.

**Step 8: Highlight the active (lead) goblin visually**

In `setActiveGoblin` (line 161), update to highlight the active goblin:
```ts
private setActiveGoblin(goblin: Goblin | null) {
  // Reset previous active goblin color
  if (this.activeGoblin) {
    this.activeGoblin.sprite.setFillStyle(0x44aa44)
  }
  this.activeGoblin = goblin
  if (goblin) {
    goblin.sprite.setFillStyle(0xffff44)  // bright yellow = active
    this.engine.setWord(goblin.word)
    if (this.ghostKeyboard) {
      this.ghostKeyboard.highlight(goblin.word[0])
    }
    this.tutorialHands?.highlightFinger(goblin.word[0])
  } else {
    this.engine.clearWord()
  }
}
```

**Step 9: Build to verify no TypeScript errors**

```bash
npm run build
```
Expected: Build succeeds.

**Step 10: Commit**

```bash
git add src/scenes/level-types/GoblinWhackerLevel.ts
git commit -m "feat: implement regular and advanced game modes in GoblinWhackerLevel"
```

---

### Task 4: Create SettingsScene

**Files:**
- Create: `src/scenes/SettingsScene.ts`
- Modify: `src/main.ts:28-53`

**Step 1: Create `src/scenes/SettingsScene.ts`**

```ts
// src/scenes/SettingsScene.ts
import Phaser from 'phaser'
import { loadProfile, saveProfile } from '../utils/profile'

export class SettingsScene extends Phaser.Scene {
  private profileSlot!: number

  constructor() { super('Settings') }

  init(data: { profileSlot: number }) {
    this.profileSlot = data.profileSlot
  }

  create() {
    const { width, height } = this.scale
    const profile = loadProfile(this.profileSlot)!

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e)

    // Title
    this.add.text(width / 2, 80, 'SETTINGS', {
      fontSize: '40px', color: '#ffd700'
    }).setOrigin(0.5)

    // Game Mode label
    this.add.text(width / 2, 220, 'Game Mode', {
      fontSize: '26px', color: '#ffffff'
    }).setOrigin(0.5)

    // Regular button
    const regularBtn = this.add.text(width / 2 - 120, 290, '[ Regular ]', {
      fontSize: '28px',
      color: profile.gameMode === 'regular' ? '#ffd700' : '#888888',
      backgroundColor: '#222244',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    // Advanced button
    const advancedBtn = this.add.text(width / 2 + 120, 290, '[ Advanced ]', {
      fontSize: '28px',
      color: profile.gameMode === 'advanced' ? '#ffd700' : '#888888',
      backgroundColor: '#222244',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    // Description text
    const descText = this.add.text(width / 2, 370, this.getModeDescription(profile.gameMode), {
      fontSize: '18px', color: '#aaaaaa', wordWrap: { width: 700 }, align: 'center',
    }).setOrigin(0.5)

    const setMode = (mode: 'regular' | 'advanced') => {
      const p = loadProfile(this.profileSlot)!
      p.gameMode = mode
      saveProfile(this.profileSlot, p)
      regularBtn.setColor(mode === 'regular' ? '#ffd700' : '#888888')
      advancedBtn.setColor(mode === 'advanced' ? '#ffd700' : '#888888')
      descText.setText(this.getModeDescription(mode))
    }

    regularBtn.on('pointerdown', () => setMode('regular'))
    advancedBtn.on('pointerdown', () => setMode('advanced'))

    // Back button
    const back = this.add.text(60, 40, '← BACK', {
      fontSize: '22px', color: '#aaaaff'
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true })
    back.on('pointerdown', () => {
      this.scene.start('OverlandMap', { profileSlot: this.profileSlot })
    })
  }

  private getModeDescription(mode: 'regular' | 'advanced'): string {
    if (mode === 'regular') {
      return 'Regular: Enemies queue up and wait. Only the lead enemy can be defeated. No damage taken.'
    }
    return 'Advanced: Enemies march in real-time. Type fast or take damage!'
  }
}
```

**Step 2: Register `SettingsScene` in `src/main.ts`**

After the import for `VictoryScene` (line 28), add:
```ts
import { SettingsScene } from './scenes/SettingsScene'
```

In the `scene` array (line 48), add `SettingsScene` after `VictoryScene`:
```ts
BootScene, PreloadScene, MainMenuScene, ProfileSelectScene, OverlandMapScene, LevelIntroScene, LevelResultScene, LevelScene,
GoblinWhackerLevel, SkeletonSwarmLevel, MonsterArenaLevel, UndeadSiegeLevel, SlimeSplittingLevel,
DungeonTrapDisarmLevel, DungeonEscapeLevel, PotionBrewingLabLevel, MagicRuneTypingLevel,
MonsterManualLevel, WoodlandFestivalLevel, SillyChallengeLevel, GuildRecruitmentLevel,
BossBattleScene, InventoryScene, TavernScene, StableScene, CutsceneScene, VictoryScene, SettingsScene, MiniBossTypical, ...
```

**Step 3: Build to verify no TypeScript errors**

```bash
npm run build
```
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/scenes/SettingsScene.ts src/main.ts
git commit -m "feat: add SettingsScene for game mode toggle"
```

---

### Task 5: Add SETTINGS button to OverlandMapScene

**Files:**
- Modify: `src/scenes/OverlandMapScene.ts:62-86`

**Step 1: Add SETTINGS button in `create()`**

In `OverlandMapScene.create()`, after `this.drawMasteryChest()` (line 85), add:
```ts
this.drawSettingsButton()
```

Then add the private method at the end of the class (before the closing `}`):
```ts
private drawSettingsButton() {
  const { width } = this.scale
  const btn = this.add.text(width - 20, 20, '⚙ SETTINGS', {
    fontSize: '18px', color: '#aaaaaa'
  }).setOrigin(1, 0).setInteractive({ useHandCursor: true })
  btn.on('pointerover', () => btn.setColor('#ffffff'))
  btn.on('pointerout', () => btn.setColor('#aaaaaa'))
  btn.on('pointerdown', () => {
    this.scene.start('Settings', { profileSlot: this.profileSlot })
  })
}
```

**Step 2: Build to verify no TypeScript errors**

```bash
npm run build
```
Expected: Build succeeds.

**Step 3: Run all tests**

```bash
npm run test
```
Expected: All tests pass.

**Step 4: Commit**

```bash
git add src/scenes/OverlandMapScene.ts
git commit -m "feat: add SETTINGS button to OverlandMapScene"
```

---

## Manual Smoke Test Checklist

After all tasks are complete, start the dev server (`npm run dev`) and verify:

1. [ ] Create a new hero — profile defaults to Regular mode
2. [ ] Play Alder Falls (w1_l1) — first goblin is yellow/active, type it, second goblin activates immediately
3. [ ] In regular mode, goblins queue up behind the lead; they stop and wait, none reach the hero
4. [ ] On overland map, click ⚙ SETTINGS → SettingsScene opens, Regular is highlighted gold
5. [ ] Click Advanced → Advanced highlights gold, description changes, profile is saved
6. [ ] Click ← BACK → returns to overland map
7. [ ] Play Alder Falls in Advanced mode — goblins march in real-time, player takes damage if slow
