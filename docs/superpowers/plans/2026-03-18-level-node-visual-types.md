# Level Node Visual Types Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every regular level node on the overland map visually distinct by rendering a unique 32×32 pixel-art icon per level type at runtime.

**Architecture:** Fourteen node textures are generated in `PreloadScene.preload()` using Phaser Graphics (`generateTexture()`), matching the existing pattern for all other generated textures. `OverlandMapScene.drawNodes()` looks up the generated texture key per level type instead of using the generic `nodeLevel` frame. Two stale level types (`SillyChallenge`, `CharacterCreator`) are removed from the type union, and two missing `LevelScene` dispatch cases (`UndeadSiege`, `SlimeSplitting`) are fixed as a bonus.

**Tech Stack:** Phaser 3, TypeScript, Vitest

---

## Chunk 1: Type Cleanup and LevelScene Fixes

### Task 1: Remove SillyChallenge

**Files:**
- Modify: `src/data/levels/world4.ts:144`
- Modify: `src/data/levels/world5.ts:129`
- Modify: `src/types/index.ts:78`
- Modify: `src/scenes/LevelScene.ts:24`
- Modify: `src/scenes/LevelIntroScene.ts:25` (exhaustive `Record<LevelType, string>`)
- Modify: `src/main.ts:23,67` (import + scene registration)
- Delete: `src/scenes/level-types/SillyChallengeLevel.ts`

- [ ] **Step 1: Convert SillyChallenge entries to CrazedCook in world4.ts**

In `src/data/levels/world4.ts`, find `w4_l7` (The Jester's Glade) and change:
```typescript
type: 'SillyChallenge',
```
to:
```typescript
type: 'CrazedCook',
```

- [ ] **Step 2: Convert SillyChallenge entry to CrazedCook in world5.ts**

In `src/data/levels/world5.ts`, find `w5_l6` (The Mad King's Court) and change:
```typescript
type: 'SillyChallenge',
```
to:
```typescript
type: 'CrazedCook',
```

- [ ] **Step 3: Remove SillyChallenge from LevelType union**

In `src/types/index.ts`, remove the line:
```typescript
  | 'SillyChallenge'
```

- [ ] **Step 4: Remove SillyChallenge dispatch from LevelScene**

In `src/scenes/LevelScene.ts`, remove this line from the `typeToScene` object:
```typescript
      SillyChallenge: 'SillyChallengeLevel',
```

- [ ] **Step 5: Remove SillyChallenge from LevelIntroScene's exhaustive label map**

`src/scenes/LevelIntroScene.ts` has a `const LEVEL_TYPE_LABELS: Record<LevelType, string>` that must contain every member of `LevelType`. Remove the entry:
```typescript
  SillyChallenge:     '🃏 Silly Challenge',
```

- [ ] **Step 6: Remove SillyChallengeLevel import and registration from main.ts**

In `src/main.ts`, remove the import:
```typescript
import { SillyChallengeLevel } from './scenes/level-types/SillyChallengeLevel'
```
And remove `SillyChallengeLevel` from the scene array in the `new Phaser.Game(...)` config (it appears on the same line as `MonsterManualLevel`, `WoodlandFestivalLevel`, `CrazedCookLevel`, etc.).

- [ ] **Step 7: Delete SillyChallengeLevel.ts**

```bash
rm src/scenes/level-types/SillyChallengeLevel.ts
```

- [ ] **Step 8: Verify TypeScript compiles**

```bash
npm run build
```
Expected: build succeeds with no type errors referencing `SillyChallenge`.

- [ ] **Step 9: Commit**

```bash
git add src/data/levels/world4.ts src/data/levels/world5.ts src/types/index.ts src/scenes/LevelScene.ts src/scenes/LevelIntroScene.ts src/main.ts
git rm src/scenes/level-types/SillyChallengeLevel.ts
git commit -m "refactor: remove SillyChallenge level type, convert to CrazedCook"
```

---

### Task 2: Remove CharacterCreator from LevelType

**Files:**
- Modify: `src/types/index.ts:76`
- Modify: `src/scenes/LevelIntroScene.ts:23` (exhaustive `Record<LevelType, string>`)

Note: There is no `CharacterCreator` dispatch case in `LevelScene.ts` and no `LevelConfig` in any world file uses this type. The `CharacterCreatorLevel` scene file and its `main.ts` registration remain — it is launched directly, not via `LevelScene`.

- [ ] **Step 1: Remove CharacterCreator from LevelType union**

In `src/types/index.ts`, remove the line:
```typescript
  | 'CharacterCreator'
```

- [ ] **Step 2: Remove CharacterCreator from LevelIntroScene's exhaustive label map**

In `src/scenes/LevelIntroScene.ts`, remove the entry:
```typescript
  CharacterCreator:   '🎨 Character Creator',
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npm run build
```
Expected: build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts src/scenes/LevelIntroScene.ts
git commit -m "refactor: remove CharacterCreator from LevelType union"
```

---

### Task 3: Fix Missing LevelScene Dispatch Cases

**Files:**
- Modify: `src/scenes/LevelScene.ts:12-27`

Two level types that appear in world data (`UndeadSiege`, `SlimeSplitting`) are missing from the dispatch table, causing them to fall back to `GoblinWhackerLevel`.

- [ ] **Step 1: Add missing dispatch cases**

In `src/scenes/LevelScene.ts`, add two entries to `typeToScene` after `SkeletonSwarm`:
```typescript
      UndeadSiege: 'UndeadSiegeLevel',
      SlimeSplitting: 'SlimeSplittingLevel',
```

The full `typeToScene` object should read:
```typescript
    const typeToScene: Record<string, string> = {
      GoblinWhacker: 'GoblinWhackerLevel',
      SkeletonSwarm: 'SkeletonSwarmLevel',
      MonsterArena: 'MonsterArenaLevel',
      UndeadSiege: 'UndeadSiegeLevel',
      SlimeSplitting: 'SlimeSplittingLevel',
      DungeonTrapDisarm: 'DungeonTrapDisarmLevel',
      DungeonPlatformer: 'DungeonPlatformerLevel',
      DungeonEscape: 'DungeonEscapeLevel',
      PotionBrewingLab: 'PotionBrewingLabLevel',
      MagicRuneTyping: 'MagicRuneTypingLevel',
      MonsterManual: 'MonsterManualLevel',
      GuildRecruitment: 'GuildRecruitmentLevel',
      WoodlandFestival: 'WoodlandFestivalLevel',
      CrazedCook: 'CrazedCookLevel',
      BossBattle: 'BossBattleScene',
    }
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/LevelScene.ts
git commit -m "fix: add missing UndeadSiege and SlimeSplitting dispatch cases in LevelScene"
```

---

## Chunk 2: Level Node Textures

### Task 4: Create levelNodeTextures.ts

**Files:**
- Create: `src/utils/levelNodeTextures.ts`
- Test: `src/utils/levelNodeTextures.test.ts`

This module exports one function that generates 32×32 textures for all 14 regular level types. Each texture has a colored background circle and a pixel-art symbol. The function is designed to be called from `PreloadScene.preload()`.

- [ ] **Step 1: Write the failing test for levelNodeTextureKey**

Create `src/utils/levelNodeTextures.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { levelNodeTextureKey } from './levelNodeTextures'
import { LevelConfig } from '../types'

const makeLevel = (overrides: Partial<LevelConfig>): LevelConfig => ({
  id: 'test',
  name: 'Test',
  type: 'GoblinWhacker',
  world: 1,
  unlockedLetters: ['a'],
  wordCount: 10,
  timeLimit: 60,
  rewards: { xp: 50 },
  bossGate: null,
  ...overrides,
})

describe('levelNodeTextureKey', () => {
  it('returns null for boss levels', () => {
    expect(levelNodeTextureKey(makeLevel({ isBoss: true, type: 'BossBattle' }))).toBeNull()
  })

  it('returns null for mini-boss levels', () => {
    expect(levelNodeTextureKey(makeLevel({ isMiniBoss: true, type: 'BossBattle' }))).toBeNull()
  })

  it('returns node_GoblinWhacker for a regular GoblinWhacker level', () => {
    expect(levelNodeTextureKey(makeLevel({ type: 'GoblinWhacker' }))).toBe('node_GoblinWhacker')
  })

  it('returns node_CrazedCook for a CrazedCook level', () => {
    expect(levelNodeTextureKey(makeLevel({ type: 'CrazedCook' }))).toBe('node_CrazedCook')
  })

  it('returns node_<type> for every non-boss level type', () => {
    const regularTypes: LevelConfig['type'][] = [
      'GoblinWhacker', 'SkeletonSwarm', 'MonsterArena', 'UndeadSiege',
      'SlimeSplitting', 'DungeonTrapDisarm', 'DungeonPlatformer', 'DungeonEscape',
      'PotionBrewingLab', 'MagicRuneTyping', 'MonsterManual', 'GuildRecruitment',
      'WoodlandFestival', 'CrazedCook',
    ]
    for (const type of regularTypes) {
      expect(levelNodeTextureKey(makeLevel({ type }))).toBe(`node_${type}`)
    }
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run src/utils/levelNodeTextures.test.ts
```
Expected: FAIL — `levelNodeTextures` module not found.

- [ ] **Step 3: Create levelNodeTextures.ts with levelNodeTextureKey and generateLevelNodeTextures**

Create `src/utils/levelNodeTextures.ts`:

```typescript
// src/utils/levelNodeTextures.ts
import Phaser from 'phaser'
import { LevelConfig } from '../types'

/**
 * Returns the texture key for a level node, or null if the level uses
 * the existing map-common spritesheet (boss / mini-boss nodes).
 */
export function levelNodeTextureKey(level: LevelConfig): string | null {
  if (level.isBoss || level.isMiniBoss) return null
  return `node_${level.type}`
}

/**
 * Generates all 14 level-type node textures (32×32 each) using Phaser Graphics.
 * Call once from PreloadScene.preload(), after generateCommonMapSheet().
 */
export function generateLevelNodeTextures(scene: Phaser.Scene): void {
  const g = scene.add.graphics()

  // Helper: draw the shared circular background
  const bg = (color: number) => {
    g.clear()
    g.fillStyle(color)
    g.fillCircle(16, 16, 15)
  }

  // ── GoblinWhacker ───────────────────────────────────────────
  bg(0x4a8c3f)
  // Skin
  g.fillStyle(0x6abf45)
  g.fillCircle(16, 13, 6)   // head
  g.fillRect(12, 19, 8, 6)  // body
  // Pointy ears
  g.fillStyle(0x6abf45)
  g.fillTriangle(9, 13, 10, 9, 12, 14)   // left ear
  g.fillTriangle(20, 14, 22, 9, 23, 13)  // right ear
  // Eyes (beady)
  g.fillStyle(0x000000)
  g.fillRect(13, 11, 2, 2)
  g.fillRect(18, 11, 2, 2)
  // Mouth (sneer)
  g.fillRect(14, 15, 5, 1)
  g.generateTexture('node_GoblinWhacker', 32, 32)

  // ── SkeletonSwarm ───────────────────────────────────────────
  bg(0x5a5a6a)
  g.fillStyle(0xdddddd)
  g.fillCircle(16, 8, 5)    // skull
  g.fillRect(13, 13, 6, 7)  // ribcage top
  // Ribs
  g.fillStyle(0x5a5a6a)
  g.fillRect(14, 14, 4, 1)
  g.fillRect(14, 16, 4, 1)
  g.fillRect(14, 18, 4, 1)
  // Eyes
  g.fillRect(14, 7, 2, 2)
  g.fillRect(18, 7, 2, 2)
  // Pelvis
  g.fillStyle(0xdddddd)
  g.fillRect(13, 20, 6, 3)
  // Leg bones
  g.fillRect(13, 23, 2, 6)
  g.fillRect(17, 23, 2, 6)
  g.generateTexture('node_SkeletonSwarm', 32, 32)

  // ── MonsterArena ────────────────────────────────────────────
  bg(0x8c3a3a)
  // Minotaur body
  g.fillStyle(0xcc8844)
  g.fillRect(10, 18, 12, 10)  // torso
  g.fillRect(8, 18, 4, 8)     // left arm
  g.fillRect(20, 18, 4, 8)    // right arm
  // Head
  g.fillRect(11, 10, 10, 8)
  // Horns
  g.fillStyle(0x886622)
  g.fillTriangle(10, 10, 7, 4, 13, 10)   // left horn
  g.fillTriangle(22, 10, 19, 10, 25, 4)  // right horn
  // Eyes
  g.fillStyle(0xff0000)
  g.fillRect(13, 12, 2, 2)
  g.fillRect(18, 12, 2, 2)
  // Nose ring
  g.fillStyle(0xffd700)
  g.fillRect(15, 16, 3, 2)
  g.generateTexture('node_MonsterArena', 32, 32)

  // ── UndeadSiege ─────────────────────────────────────────────
  bg(0x4a2a6a)
  // Castle walls
  g.fillStyle(0x888888)
  g.fillRect(7, 14, 18, 13)   // main wall
  // Battlements (alternating notches)
  g.fillRect(7, 10, 4, 4)
  g.fillRect(13, 10, 4, 4)
  g.fillRect(19, 10, 4, 4)
  // Gate arch
  g.fillStyle(0x000000)
  g.fillRect(13, 19, 6, 8)
  // Zombie figures (tiny) at base
  g.fillStyle(0x446644)
  g.fillCircle(10, 28, 2)  // zombie 1 head
  g.fillRect(9, 29, 2, 2)  // zombie 1 body
  g.fillCircle(22, 28, 2)  // zombie 2 head
  g.fillRect(21, 29, 2, 2) // zombie 2 body
  g.generateTexture('node_UndeadSiege', 32, 32)

  // ── SlimeSplitting ──────────────────────────────────────────
  bg(0x2a7a6a)
  // Main blob body
  g.fillStyle(0x44ffaa)
  g.fillCircle(16, 19, 9)
  // Blobby bumps on top
  g.fillCircle(11, 14, 4)
  g.fillCircle(21, 14, 4)
  // Shine highlight
  g.fillStyle(0xaaffdd)
  g.fillCircle(14, 17, 2)
  // Eyes
  g.fillStyle(0x000000)
  g.fillCircle(13, 19, 2)
  g.fillCircle(19, 19, 2)
  // Pupils
  g.fillStyle(0xffffff)
  g.fillRect(14, 18, 1, 1)
  g.fillRect(20, 18, 1, 1)
  g.generateTexture('node_SlimeSplitting', 32, 32)

  // ── DungeonTrapDisarm ───────────────────────────────────────
  bg(0x8c5a1a)
  // Stone floor
  g.fillStyle(0x885522)
  g.fillRect(4, 22, 24, 6)
  // Spikes (4 upward triangles)
  g.fillStyle(0xcccccc)
  g.fillTriangle(7, 22, 10, 10, 13, 22)
  g.fillTriangle(12, 22, 15, 10, 18, 22)
  g.fillTriangle(17, 22, 20, 10, 23, 22)
  // Tip highlights
  g.fillStyle(0xffffff)
  g.fillRect(10, 10, 1, 2)
  g.fillRect(15, 10, 1, 2)
  g.fillRect(20, 10, 1, 2)
  g.generateTexture('node_DungeonTrapDisarm', 32, 32)

  // ── DungeonPlatformer ───────────────────────────────────────
  bg(0x5a4a2a)
  // Boulder (large circle with shading)
  g.fillStyle(0x888888)
  g.fillCircle(16, 18, 10)
  // Shading arc (darker)
  g.fillStyle(0x555555)
  g.fillTriangle(20, 14, 26, 20, 24, 26)  // shadow wedge on right
  // Highlight
  g.fillStyle(0xbbbbbb)
  g.fillCircle(12, 14, 3)
  // Cracks
  g.lineStyle(1, 0x333333)
  g.lineBetween(14, 12, 16, 18)
  g.lineBetween(16, 18, 20, 22)
  g.generateTexture('node_DungeonPlatformer', 32, 32)

  // ── DungeonEscape ───────────────────────────────────────────
  bg(0x6a2a2a)
  // Stone archway
  g.fillStyle(0x888888)
  g.fillRect(6, 10, 5, 18)   // left pillar
  g.fillRect(21, 10, 5, 18)  // right pillar
  g.fillRect(6, 8, 20, 4)    // arch lintel
  // Dark arch opening
  g.fillStyle(0x000000)
  g.fillRect(11, 12, 10, 16)
  // Arrow pointing right (gold)
  g.fillStyle(0xffaa00)
  g.fillRect(11, 18, 7, 3)          // arrow shaft
  g.fillTriangle(18, 15, 24, 19, 18, 23)  // arrowhead
  g.generateTexture('node_DungeonEscape', 32, 32)

  // ── PotionBrewingLab ────────────────────────────────────────
  bg(0x5a2a8c)
  // Bottle body (round bottom)
  g.fillStyle(0x2244aa)
  g.fillCircle(16, 22, 7)
  // Liquid fill (brighter, lower portion)
  g.fillStyle(0x44aaff)
  g.fillCircle(16, 24, 5)
  // Bottle neck
  g.fillStyle(0x2244aa)
  g.fillRect(13, 13, 6, 8)
  // Cork
  g.fillStyle(0xaa7744)
  g.fillRect(13, 10, 6, 4)
  // Shine
  g.fillStyle(0x88ccff)
  g.fillCircle(13, 20, 2)
  // Bubbles
  g.fillStyle(0xaaddff)
  g.fillCircle(18, 21, 1)
  g.fillCircle(16, 19, 1)
  g.generateTexture('node_PotionBrewingLab', 32, 32)

  // ── MagicRuneTyping ─────────────────────────────────────────
  bg(0x2a4a8c)
  // Three dwarf-style rune glyphs (angular, golden)
  g.fillStyle(0xffd700)
  // Rune 1 (left): vertical bar + cross
  g.fillRect(7, 8, 2, 16)
  g.fillRect(7, 10, 6, 2)
  g.fillRect(7, 16, 6, 2)
  // Rune 2 (center): two diagonals
  g.fillRect(14, 8, 2, 16)
  g.fillRect(14, 8, 6, 2)
  g.fillRect(18, 8, 2, 8)
  g.fillRect(14, 16, 6, 2)
  // Rune 3 (right): Z-shape
  g.fillRect(22, 8, 6, 2)
  g.fillRect(24, 8, 2, 16)
  g.fillRect(22, 22, 6, 2)
  g.generateTexture('node_MagicRuneTyping', 32, 32)

  // ── MonsterManual ───────────────────────────────────────────
  bg(0x2a3a6a)
  // Book cover (brown)
  g.fillStyle(0x6b4c2a)
  g.fillRect(5, 8, 22, 18)
  // Left page (open book)
  g.fillStyle(0xf0e8d8)
  g.fillRect(6, 9, 9, 16)
  // Right page
  g.fillRect(17, 9, 9, 16)
  // Spine
  g.fillStyle(0x4a3a1a)
  g.fillRect(15, 8, 2, 18)
  // Page lines (left)
  g.fillStyle(0xaaa090)
  g.fillRect(7, 12, 7, 1)
  g.fillRect(7, 14, 7, 1)
  g.fillRect(7, 16, 7, 1)
  g.fillRect(7, 18, 7, 1)
  g.fillRect(7, 20, 5, 1)
  // Page lines (right)
  g.fillRect(18, 12, 7, 1)
  g.fillRect(18, 14, 7, 1)
  g.fillRect(18, 16, 7, 1)
  g.fillRect(18, 18, 7, 1)
  g.fillRect(18, 20, 5, 1)
  g.generateTexture('node_MonsterManual', 32, 32)

  // ── GuildRecruitment ────────────────────────────────────────
  bg(0x8c6a1a)
  // NPC body
  g.fillStyle(0xffccaa)  // skin
  g.fillCircle(16, 12, 5)  // head
  // Body (simple tunic shape)
  g.fillStyle(0x4466aa)  // blue tunic
  g.fillRect(12, 17, 8, 10)
  // Wave arm (extended right)
  g.fillStyle(0xffccaa)
  g.fillRect(20, 17, 6, 3)   // arm
  g.fillRect(25, 14, 3, 3)   // raised hand
  // Other arm (left, at side)
  g.fillRect(6, 17, 6, 3)
  // Smile
  g.fillStyle(0xaa6644)
  g.fillRect(14, 14, 4, 1)
  // Eyes
  g.fillStyle(0x000000)
  g.fillRect(14, 11, 2, 2)
  g.fillRect(18, 11, 2, 2)
  g.generateTexture('node_GuildRecruitment', 32, 32)

  // ── WoodlandFestival ────────────────────────────────────────
  bg(0x2a6a2a)
  // Ferris wheel frame (circle outline)
  g.lineStyle(2, 0xcc8844)
  g.strokeCircle(16, 16, 11)
  // Spokes (8 spokes)
  g.lineBetween(16, 5, 16, 27)   // vertical
  g.lineBetween(5, 16, 27, 16)   // horizontal
  g.lineBetween(8, 8, 24, 24)    // diagonal
  g.lineBetween(24, 8, 8, 24)    // diagonal
  // Hub center
  g.fillStyle(0xcc8844)
  g.fillCircle(16, 16, 2)
  // Tiny mice at 4 seats (small colored circles)
  g.fillStyle(0xddbbaa)  // mouse color
  g.fillCircle(16, 5, 2)   // top
  g.fillCircle(27, 16, 2)  // right
  g.fillCircle(16, 27, 2)  // bottom
  g.fillCircle(5, 16, 2)   // left
  // Tiny ears on top mouse
  g.fillCircle(14, 3, 1)
  g.fillCircle(18, 3, 1)
  g.generateTexture('node_WoodlandFestival', 32, 32)

  // ── CrazedCook ──────────────────────────────────────────────
  bg(0x8c4a1a)
  // Chef hat (white dome + brim)
  g.fillStyle(0xffffff)
  g.fillCircle(16, 8, 6)    // dome
  g.fillRect(10, 12, 12, 3)  // brim
  // Body (white apron)
  g.fillStyle(0xeeeeee)
  g.fillRect(11, 15, 10, 12)
  // Face
  g.fillStyle(0xffccaa)
  g.fillRect(12, 11, 8, 6)
  // Crazy eyes
  g.fillStyle(0x000000)
  g.fillRect(13, 12, 2, 3)
  g.fillRect(18, 12, 2, 3)
  g.fillStyle(0xffffff)
  g.fillRect(13, 12, 1, 1)
  g.fillRect(18, 12, 1, 1)
  // Knife (right hand)
  g.fillStyle(0xcccccc)
  g.fillRect(22, 14, 2, 10)  // blade
  g.fillStyle(0x884422)
  g.fillRect(22, 23, 2, 4)   // handle
  // Knife guard
  g.fillStyle(0xcccccc)
  g.fillRect(20, 23, 6, 2)
  g.generateTexture('node_CrazedCook', 32, 32)

  g.destroy()
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/utils/levelNodeTextures.test.ts
```
Expected: All 7 tests PASS.

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/utils/levelNodeTextures.ts src/utils/levelNodeTextures.test.ts
git commit -m "feat: add levelNodeTextures with 14 pixel-art level type icons"
```

---

### Task 5: Call generateLevelNodeTextures from PreloadScene

**Files:**
- Modify: `src/scenes/PreloadScene.ts:39`

- [ ] **Step 1: Import and call the generator**

In `src/scenes/PreloadScene.ts`, add the import at the top of the file:
```typescript
import { generateLevelNodeTextures } from '../utils/levelNodeTextures'
```

Then in `preload()`, add the call immediately after `this.generateCommonMapSheet()`:
```typescript
    this.generateCommonMapSheet()
    generateLevelNodeTextures(this)
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/PreloadScene.ts
git commit -m "feat: generate level node textures in PreloadScene"
```

---

### Task 6: Update OverlandMapScene to Use Generated Textures

**Files:**
- Modify: `src/scenes/OverlandMapScene.ts:375-487`

- [ ] **Step 1: Import levelNodeTextureKey**

In `src/scenes/OverlandMapScene.ts`, add to the imports at the top:
```typescript
import { levelNodeTextureKey } from '../utils/levelNodeTextures'
```

- [ ] **Step 2: Update drawNodes to use generated texture keys**

In `OverlandMapScene.drawNodes()`, find this line (around line 395):
```typescript
      const nodeFrame = level.isBoss ? COMMON_FRAMES.nodeBoss : level.isMiniBoss ? COMMON_FRAMES.nodeMiniBoss : COMMON_FRAMES.nodeLevel
      const nodeSprite = this.add.sprite(pos.x, pos.y, 'map-common', nodeFrame).setTint(color).setDepth(1000).setScale(baseScale)
```

Replace with:
```typescript
      const generatedKey = levelNodeTextureKey(level)
      let nodeSprite: Phaser.GameObjects.Sprite
      if (generatedKey) {
        nodeSprite = this.add.sprite(pos.x, pos.y, generatedKey).setTint(color).setDepth(1000).setScale(baseScale)
      } else {
        const bossFrame = level.isBoss ? COMMON_FRAMES.nodeBoss : COMMON_FRAMES.nodeMiniBoss
        nodeSprite = this.add.sprite(pos.x, pos.y, 'map-common', bossFrame).setTint(color).setDepth(1000).setScale(baseScale)
      }
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 4: Run all tests to confirm nothing is broken**

```bash
npm run test
```
Expected: all tests pass.

- [ ] **Step 5: Start the dev server and visually verify**

```bash
npm run dev
```
Open the game in a browser, navigate to the overland map. Verify:
- Regular level nodes show distinct colored icons per type (GoblinWhacker = green goblin, CrazedCook = orange chef, SkeletonSwarm = grey skeleton, etc.)
- Mini-boss nodes still show the dark gatehouse sprite
- Boss nodes still show the dark castle/skull sprite
- Hover effects, star display, and click navigation all still work

- [ ] **Step 6: Commit**

```bash
git add src/scenes/OverlandMapScene.ts
git commit -m "feat: use type-specific node textures on overland map"
```
