# Skeleton Swarm: Spread, Idle & Walk Animations

**Date:** 2026-03-18
**Status:** Approved

## Problem

Skeletons in `SkeletonSwarmLevel` overlap each other, making word labels above their heads unreadable. Additionally, skeletons have no animation — they are static images that slide across the screen with no visual feedback distinguishing stationary from moving states.

## Goals

1. Prevent skeleton overlap so word labels are always legible.
2. Add idle animations (8 frames) when a skeleton is stationary.
3. Add walk animations (8 frames) when a skeleton is moving.

## Out of Scope

- Rising animation (already handled by a tween on spawn); the rise tween is not changed.
- Enemy AI, targeting, or difficulty changes.
- Any other level type.

---

## Design

### 1. New Texture Frames (`skeletonSwarmArt.ts`)

Generate 8 idle frames and 8 walk frames as named textures inside the existing `generateSkeletonSwarmTextures()` function, after the existing early-return guard on `'ss_skeleton'` (so they are only generated once per Phaser session):

**Idle frames** (`ss_skeleton_idle_0` … `ss_skeleton_idle_7`)
A slow arm/weapon bob cycle. The skeleton stands in place; the spear hand and off-arm oscillate gently through 8 poses covering one full bob period.

**Walk frames** (`ss_skeleton_walk_0` … `ss_skeleton_walk_7`)
A full stride cycle. Left and right legs alternate through forward/back positions; arms swing in opposition; the torso has a subtle vertical bob to sell the weight of each step.

Both sets reuse the existing skeleton skull, ribcage, and armor shapes — only limb positions change per frame.

### 2. Phaser Animations (registered in `SkeletonSwarmLevel.create()`)

Animations are registered on the global `AnimationManager` and persist across scene restarts, so each must be guarded before creation. This includes the pre-existing `ss_fire_anim` (currently unguarded) which is also fixed in this changeset:

```ts
if (!this.anims.exists('ss_fire_anim')) {
  this.anims.create({ key: 'ss_fire_anim', ... })
}
if (!this.anims.exists('ss_idle_anim')) {
  this.anims.create({ key: 'ss_idle_anim', frames: [...8 idle frames...], frameRate: 3, repeat: -1 })
}
if (!this.anims.exists('ss_walk_anim')) {
  this.anims.create({ key: 'ss_walk_anim', frames: [...8 walk frames...], frameRate: 8, repeat: -1 })
}
```

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
  prevX: number                      // new — x position at start of last frame
}
```

`isMoving` starts `false` on spawn for all skeletons.

**Riser skeletons** must continue to show the `ss_skeleton_rising` static texture during the Y-axis rise tween — do **not** call `sprite.play()` at spawn for risers. When the rise tween's `onComplete` fires:
1. Guard against a destroyed sprite first: `if (!sprite.active) return`
2. Call `sprite.play('ss_idle_anim')` — Phaser's animation system replaces the displayed texture with each animation frame, so the `ss_skeleton_rising` base texture is immediately overridden. No `setTexture` call is needed before `play()`.
3. The state-tracking loop takes over from this point.

**Marcher skeletons** are created with any valid texture key (e.g. `ss_skeleton_idle_0`). Call `sprite.play('ss_idle_anim')` immediately after creation — Phaser's animation system replaces the initial texture on the first animation tick, so the constructor texture is cosmetically irrelevant. The state-tracking loop will transition the sprite to `ss_walk_anim` on the first update frame when movement is detected.

`prevX` is initialised to `startX` in `spawnSkeleton()` as a safe default. The value is overwritten at the **start of every `update()` frame** before any position changes, so the animation state check (Section 6) always compares against the previous frame's position.

### 4. Regular Mode — Label-Aware Dynamic Spacing

The queue grows **rightward** (away from the barrier): `skeletons[0]` is closest to the barrier at `BATTLE_X = 350`; `skeletons[1]` is behind it at a higher X, and so on. This matches the current index-based ordering.

Replace the fixed `SKELETON_SPACING` with computed slot positions each frame:

```
slot[0].targetX = BATTLE_X
slot[i].targetX = slot[i-1].targetX
                + max(slot[i-1].label.width + LABEL_PAD, MIN_SPACING)
```

Where:
- `label.width` — use Phaser's `Text.width` property directly.
- `LABEL_PAD = 24` px total (≈ 12 px gap on each side of the label)
- `MIN_SPACING = 80` px (minimum slot width even for very short words)

Clamp: if a computed `targetX` exceeds `(scene.scale.width - 60)`, clamp it to that value. The **clamped** value is then used as the base for computing the next skeleton's slot (i.e. subsequent skeletons stack against the right edge rather than spreading further off-screen). Overlap at the far right when more skeletons exist than horizontal space allows is an accepted limitation.

Skeletons slide toward their target X at their normal speed (clamped approach, same as before).

### 5. Advanced Mode — Per-Frame Separation Force

After moving all skeletons in the advanced update loop, sort the skeletons array by ascending `x` (leftmost first), then run one separation pass over consecutive pairs:

```
sort skeletons by x ascending
for i = 0 to skeletons.length - 2:
  a = skeletons[i], b = skeletons[i+1]
  minGap = (a.label.width + b.label.width) / 2 + LABEL_PAD
  overlap = minGap - (b.x - a.x)
  if overlap > 0:
    a.x -= overlap / 2
    b.x += overlap / 2
    clamp a.x to [BARRIER_X + 20, scene.scale.width - 60]
    clamp b.x to [BARRIER_X + 20, scene.scale.width - 60]
    # Skeletons march leftward (decreasing X = closer to player).
    # Clamping a.x >= BARRIER_X + 20 = 285 prevents the left-push from shoving a skeleton
    # into the damage zone (maxSkeletonReach = 265).
    # Clamping b.x <= scene.scale.width - 60 prevents overflow off the right edge.
```

Sorting by X first ensures the left-to-right pass resolves the most impactful overlaps first. One pass per frame is sufficient at expected skeleton counts (≤ 6); residual error is imperceptible.

After the separation pass, update each skeleton's sprite/label/aura positions from `s.x` as before.

### 6. Animation State Tracking (both modes)

At the **start** of `update()`, before moving any skeletons, snapshot each skeleton's current X into `prevX`:

```ts
this.skeletons.forEach(s => { s.prevX = s.x })
```

After all position updates (and the separation pass in advanced mode), check for state changes:

```ts
this.skeletons.forEach(s => {
  const moved = Math.abs(s.x - s.prevX) > 0.5
  if (moved !== s.isMoving) {
    s.isMoving = moved
    s.sprite.play(moved ? 'ss_walk_anim' : 'ss_idle_anim')
  }
})
```

The `if (moved !== s.isMoving)` guard ensures `play()` is only called on a state **change**, not every frame. No `ignoreIfPlaying` flag is needed because the guard already prevents redundant calls.

---

## File Changes

| File | Change |
|------|--------|
| `src/art/skeletonSwarmArt.ts` | Add `generateSkeletonIdleFrames()` and `generateSkeletonWalkFrames()`, called inside the existing early-return guard in `generateSkeletonSwarmTextures()` |
| `src/scenes/level-types/SkeletonSwarmLevel.ts` | Guard all `anims.create()` calls (including pre-existing `ss_fire_anim`); add `prevX`/`isMoving` to `Skeleton` interface; change `sprite` type to `Sprite`; update `spawnSkeleton()` to create a Sprite with `ss_skeleton_rising` (risers) or `ss_skeleton_walk_0` (marchers), initialise `prevX = startX`; marchers call `sprite.play('ss_idle_anim')` at spawn, risers do not; rise tween `onComplete` guards `if (!sprite.active)` then calls `sprite.play('ss_idle_anim')`; replace fixed spacing with label-aware logic; add separation force + sort in advanced mode; add `prevX` snapshot + animation state tracking in `update()` |

---

## Constants Summary

| Constant | Value | Purpose |
|----------|-------|---------|
| `LABEL_PAD` | 24 px | Minimum padding added to a label's width when computing the next slot position |
| `MIN_SPACING` | 80 px | Minimum slot width in regular mode |
| `BARRIER_X` | 265 px | Left bound for separation clamp in advanced mode |

---

## Testing

- Spawn 4+ skeletons with long words — labels must not overlap in either mode.
- In advanced mode with multiple skeletons bunching at the barrier, they must spread apart.
- While skeletons are moving, walk animation plays; when stationary, idle animation plays.
- Riser skeletons play idle during the rise tween, then transition to walk/idle tracking normally.
- Defeat a skeleton — remaining skeletons re-space correctly without a visible jump.
- Visit the level a second time — no Phaser console warnings about duplicate texture keys or animation keys.
