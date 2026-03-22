# DungeonPlatformerLevel — Hero Duplicate, Gold Drop, and Party Position Fix

**Date:** 2026-03-21

## Problem

The `DungeonPlatformerLevel` (used by "The Lost Ruins of Elda") has three bugs:

1. **Two hero sprites** — `preCreate` places an avatar at x=100, then a second `this.hero` is manually created at `heroX = width * 0.35`. Both are visible simultaneously.
2. **Gold drops on word complete** — `onWordComplete` calls `goldManager.spawnGold(...)`, which is wrong for a trap-dodging level.
3. **Companion/pet positioned wrong** — `CompanionAndPetRenderer` places them to the *right* of the avatar (x+70, x+145), but in this level they should follow *behind* (to the left) of the hero.
4. **No party animation on trap clear** — Companion and pet should do a brief jump when the player types through a trap.

## Approach

Expose the avatar sprite created by `preCreate`, add left-side companion support to `CompanionAndPetRenderer`, and wire everything up in `DungeonPlatformerLevel`.

## Design

### 1. `BaseLevelScene`

- Add `protected avatarSprite: Phaser.GameObjects.Image | null = null`.
- In `preCreate`, assign the result of `this.add.image(ax, ay, avatarKey)` to `this.avatarSprite`.
- Add `companionSide?: 'left' | 'right'` (default `'right'`) to `PreCreateOptions`; pass it through to `CompanionAndPetRenderer`.

### 2. `CompanionAndPetRenderer`

- Accept `side?: 'left' | 'right'` in the constructor (default `'right'`).
  - `'right'`: pet at `x + 70`, companion at `x + 145` (current behavior, unchanged for all other levels).
  - `'left'`: pet at `x - 70`, companion at `x - 140`.
- Add `playJumpAnimation()`: tween both companion and pet sprites up ~30px, yoyo, ~200ms duration.
- Listen for `'trap_cleared'` scene event → `playJumpAnimation()`. Existing `'word_completed_attack'` listener is unchanged.
- Clean up the new listener in `destroy()`.

### 3. `DungeonPlatformerLevel`

- Move `heroX = width * 0.35` to before the `preCreate` call.
- Call `preCreate(heroX, this.heroBaseY, { companionSide: 'left' })`.
- Remove the manual `this.hero = this.add.image(heroX, ...)` block; replace with `this.hero = this.avatarSprite!`.
- In `onWordComplete`: remove `goldManager.spawnGold(...)` call; emit `this.events.emit('trap_cleared')`.

## Files Changed

- `src/scenes/BaseLevelScene.ts`
- `src/components/CompanionAndPetRenderer.ts`
- `src/scenes/level-types/DungeonPlatformerLevel.ts`

## Out of Scope

- No changes to other level types — `CompanionAndPetRenderer` defaults to `'right'` so all other levels are unaffected.
- No changes to `GoldManager` or `goldSystem`.
