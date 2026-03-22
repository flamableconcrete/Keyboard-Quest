# DungeonPlatformerLevel — Hero Duplicate, Gold Drop, and Party Position Fix

**Date:** 2026-03-21

## Problem

The `DungeonPlatformerLevel` (used by "The Lost Ruins of Elda") has four bugs:

1. **Two hero sprites** — `preCreate` places an avatar at x=100, then a second `this.hero` is manually created at `heroX = width * 0.35`. Both are visible simultaneously.
2. **Gold drops on word complete** — `onWordComplete` calls `goldManager.spawnGold(...)`, which is wrong for a trap-dodging level.
3. **Companion/pet positioned wrong** — `CompanionAndPetRenderer` places them to the *right* of the avatar (x+70, x+145), but in this level they should follow *behind* (to the left) of the hero.
4. **No party animation on trap clear** — Companion and pet should do a brief jump when the player types through a trap.

## Approach

Expose the avatar sprite created by `preCreate`, add left-side companion support to `CompanionAndPetRenderer`, and wire everything up in `DungeonPlatformerLevel`.

## Design

### 1. `BaseLevelScene`

- Add `protected avatarSprite: Phaser.GameObjects.Image | null = null`.
- In `preCreate`, assign the result of `this.add.image(ax, ay, avatarKey)` to `this.avatarSprite`. The `!` non-null assertion is safe in consumers because `add.image` always returns a sprite and `preCreate` is always called before any usage.
- Add `companionSide?: 'left' | 'right'` (default `'right'`) to `PreCreateOptions`; pass it through to `CompanionAndPetRenderer`.

### 2. `CompanionAndPetRenderer`

- Accept `side?: 'left' | 'right'` in the constructor (default `'right'`).
  - `'right'`: pet at `x + 70`, companion at `x + 145` (current behavior, unchanged for all other levels).
  - `'left'`: pet at `x - 70`, companion at `x - 140`. The 5px asymmetry vs the right-side offsets is intentional — at `heroX = 35% * 1280 = 448px`, companion lands at 308px which keeps it comfortably on-screen.
- The shadow ellipses must also follow `side`: draw them at `petX` and `companionX` (the already-computed flipped positions), not hardcoded to the right-side values.
- Add `playJumpAnimation()`: tween companion (if non-null) up ~30px yoyo ~200ms, and separately tween pet (if non-null) up ~30px yoyo ~200ms. Both tweens must guard with null checks.
- Listen for `'trap_cleared'` scene event → `playJumpAnimation()`. The existing `'word_completed_attack'` → `playAttackAnimation()` listener is unchanged. Note: `DungeonPlatformerLevel` never emits `'word_completed_attack'`, so `playAttackAnimation`'s rightward lunge is irrelevant in that scene and requires no fix here.
- Clean up the new listener in `destroy()` via `this.scene.events.off('trap_cleared', this.playJumpAnimation, this)`.

### 3. `DungeonPlatformerLevel`

- Compute `heroX = width * 0.35` before calling `preCreate`.
- Call `preCreate(heroX, this.heroBaseY, { companionSide: 'left' })`. The Y coordinate is `this.heroBaseY` (`height * 0.62`, i.e. `floorY`), which is where the hero actually runs — this replaces the previous `height * 0.6` which was slightly misaligned.
- Remove the manual `this.hero = this.add.image(heroX, ...)` block (lines 107–111); replace with `this.hero = this.avatarSprite!`.
- In `onWordComplete`: remove `goldManager.spawnGold(...)` call; emit `this.events.emit('trap_cleared')`.

## Files Changed

- `src/scenes/BaseLevelScene.ts`
- `src/components/CompanionAndPetRenderer.ts`
- `src/scenes/level-types/DungeonPlatformerLevel.ts`

## Out of Scope

- No changes to other level types — `CompanionAndPetRenderer` defaults to `'right'` so all other levels are unaffected.
- No changes to `GoldManager` or `goldSystem`.
- No fix to `playAttackAnimation` direction — it is not triggered in `DungeonPlatformerLevel`.
