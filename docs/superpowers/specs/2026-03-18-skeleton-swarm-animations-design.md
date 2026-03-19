# Skeleton Swarm: Spread, Idle & Walk Animations

**Date:** 2026-03-18
**Status:** Approved

## Problem

Skeletons in `SkeletonSwarmLevel` overlap each other, making word labels above their heads unreadable. Additionally, skeletons have no animation — they are static images that slide across the screen with no visual feedback distinguishing stationary from moving states.

## Goals

1. Prevent skeleton overlap so word labels are always legible.
2. Add idle animations (6–8 frames) when a skeleton is stationary.
3. Add walk animations (6–8 frames) when a skeleton is moving.

## Out of Scope

- Rising animation (already handled by a tween on spawn).
- Enemy AI, targeting, or difficulty changes.
- Any other level type.

---

## Design

### 1. New Texture Frames (`skeletonSwarmArt.ts`)

Generate 8 idle frames and 8 walk frames as named textures:

**Idle frames** (`ss_skeleton_idle_0` … `ss_skeleton_idle_7`)
A slow arm/weapon bob cycle. The skeleton stands in place; the spear hand and off-arm oscillate gently through 8 poses covering one full bob period.

**Walk frames** (`ss_skeleton_walk_0` … `ss_skeleton_walk_7`)
A full stride cycle. Left and right legs alternate through forward/back positions; arms swing in opposition; the torso has a subtle vertical bob to sell the weight of each step.

Both sets reuse the existing skeleton skull, ribcage, and armor shapes — only limb positions change per frame.

### 2. Phaser Animations (registered in `SkeletonSwarmLevel.create()`)

| Key | Frames | Frame Rate | Repeat |
|-----|--------|-----------|--------|
| `ss_idle_anim` | idle_0 → idle_7 | 3 fps | −1 (loop) |
| `ss_walk_anim` | walk_0 → walk_7 | 8 fps | −1 (loop) |

### 3. Skeleton Interface Changes

```ts
interface Skeleton {
  // ...existing fields...
  sprite: Phaser.GameObjects.Sprite  // was Image
  isMoving: boolean                  // new — tracks current anim state
}
```

`isMoving` starts `true` on spawn. State transitions happen in `update()` only when the value changes, so `sprite.play()` is not called redundantly every frame.

### 4. Regular Mode — Label-Aware Dynamic Spacing

**Current behaviour:** `targetX = BATTLE_X + i * SKELETON_SPACING` (fixed 120 px gap).

**New behaviour:** Compute slot positions each frame based on actual label widths:

```
slot[0].targetX = BATTLE_X
slot[i].targetX = slot[i-1].targetX + max(slot[i-1].labelWidth + LABEL_PAD, MIN_SPACING)
```

Where:
- `LABEL_PAD = 24` px (12 px each side)
- `MIN_SPACING = 80` px (minimum gap even for short words)

Skeletons slide toward their target X at their normal speed (clamped, same as before). Long-word skeletons push subsequent ones further right — already the visible behaviour, now correct.

### 5. Advanced Mode — Per-Frame Separation Force

After moving all skeletons in the advanced update loop, run one separation pass:

For every pair `(a, b)`:
1. Compute each skeleton's label half-width + `LABEL_PAD`.
2. If their combined half-widths exceed `|a.x − b.x|`, they overlap.
3. Push each apart by `overlap / 2` along X.
4. Clamp so neither goes left of the barrier (`BARRIER_X + 20`) or right of the screen edge.

One pass per frame is sufficient at expected skeleton counts (≤ 6).

### 6. Animation State Tracking (both modes)

In `update()`, after each skeleton's position is updated:

```ts
const moved = Math.abs(s.x - s.sprite.x) > 0.5
if (moved !== s.isMoving) {
  s.isMoving = moved
  s.sprite.play(moved ? 'ss_walk_anim' : 'ss_idle_anim', true)
}
```

The `true` flag (ignoreIfPlaying equivalent via `play(key, ignoreIfPlaying)`) prevents restarting the animation on every frame.

---

## File Changes

| File | Change |
|------|--------|
| `src/art/skeletonSwarmArt.ts` | Add `generateSkeletonIdleFrames()` and `generateSkeletonWalkFrames()` |
| `src/scenes/level-types/SkeletonSwarmLevel.ts` | Register animations; change `sprite` type to `Sprite`; update `spawnSkeleton()`; replace fixed spacing with label-aware logic; add separation force in advanced mode; add animation state tracking in `update()` |

---

## Testing

- Spawn 4+ skeletons with long words — labels must not overlap.
- Stand at barrier in advanced mode with multiple skeletons — they must spread out.
- While skeletons are moving, walk animation plays.
- When a skeleton reaches its target slot (regular mode) or is blocked (advanced mode), idle animation plays.
- Defeat a skeleton — remaining skeletons re-space correctly.
