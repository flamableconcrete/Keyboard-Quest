# SkeletonSwarm Level Overhaul — Design Spec

**Date:** 2026-03-18
**Status:** Approved
**Scope:** Full rewrite of `SkeletonSwarmLevel.ts` + new `skeletonSwarmArt.ts` art module

---

## Overview

SkeletonSwarm is used in worlds 1, 2, 4, and 5 — one of the most reused level types in the game. The current implementation uses plain gray rectangles as enemy sprites, has no pixel art, no SpellCaster, no TypingHands, and a weak wave loop. This overhaul replaces it entirely with a polished "epic last stand" experience: the player defends a glowing barrier on a ruined battlefield as waves of skeletal soldiers rise from the earth and march toward them.

The implementation follows the same architecture as `GoblinWhackerLevel.ts` + `goblinWhackerArt.ts`.

---

## Art Module — `src/art/skeletonSwarmArt.ts`

The module exports a single entry point:

```ts
export function generateSkeletonSwarmTextures(scene: Phaser.Scene) {
  if (scene.textures.exists('ss_skeleton')) return
  generateSkeletonTexture(scene)
  generateRisingSkeletonTexture(scene)
  generateBoneFragmentTexture(scene)
  generateAshParticleTexture(scene)
  generateSkeletonBackground(scene)
  generateHeartTexture(scene)     // generate independently — do NOT import goblinWhackerArt
  generateFireFrames(scene)
}
```

> **Note:** The heart texture (`'heart'`) must be generated here independently. Do not import or call `generateGoblinWhackerTextures` — that guard key is `'ogre'` and the heart may not exist if GoblinWhacker was never visited.

### Skeleton Sprites (~4px scale, ~16×20 pixel grid)

**Marching skeleton** (texture key: `'ss_skeleton'`):
- Skull: rounded top, empty eye sockets as glowing cyan dots (2×2px, `0x00ccff`)
- Ribcage: off-white bone stripes (`0xddccaa`), shadow side slightly darker (`0xbbaa88`)
- Armor scraps: dark rusted iron (`0x445566`) — broken breastplate shard, partial pauldron
- Weapon: simple sword or spear (`0xaaaaaa` blade, `0x885533` haft)

**Rising skeleton** (texture key: `'ss_skeleton_rising'`):
- Same upper body as marching variant
- Lower half replaced with cracked dirt tiles — skeleton partially submerged in ground
- Used for mid-field spawns; the scene swaps the sprite to `'ss_skeleton'` after the rise tween completes

**Bone burst fragment** (texture key: `'ss_bone_fragment'`):
- Single 3×3px off-white rectangle (`0xeeddbb`) — used as the particle texture for death bursts
- Generate via `graphics.fillRect(0, 0, 3, 3)` → `generateTexture('ss_bone_fragment', 3, 3)`

**Ash particle** (texture key: `'ss_ash_particle'`):
- Single 2×2px dark gray rectangle (`0x666666`) at alpha 0.6 — used for both ambient drift and rise-burst effects
- Generate via `graphics.fillRect(0, 0, 2, 2)` → `generateTexture('ss_ash_particle', 2, 2)`

### Background Layers

All drawn with `scene.add.graphics()` → `generateTexture()`.

| Key | Description |
|-----|-------------|
| `ss_sky` | Deep blood-red fading to near-black (`0x3d0000` → `0x0a0000`) gradient |
| `ss_ruins` | Distant broken stone walls and collapsed archways silhouetted against sky |
| `ss_battlefield` | Mid-ground cracked earth (`0x3a2e1e`), scattered skulls, broken weapons sticking from dirt |

These three are tiled or placed as full-width `this.add.image()` calls in `create()`.

### Fire Animation

Generate three separate texture frames:

| Key | Color scheme |
|-----|-------------|
| `ss_fire_0` | Base flame: `0xff4400` outer, `0xff8800` mid, `0xffcc00` tip |
| `ss_fire_1` | Mid flicker: `0xff6600` outer, `0xffaa00` mid, `0xffffff` tip |
| `ss_fire_2` | Bright flicker: `0xff8800` outer, `0xffcc00` mid, `0xffffff` tip |

Each frame is a ~10×14px pixel-art flame shape. In `create()`, register the animation:

```ts
this.anims.create({
  key: 'ss_fire_anim',
  frames: [
    { key: 'ss_fire_0' }, { key: 'ss_fire_1' },
    { key: 'ss_fire_2' }, { key: 'ss_fire_1' },
  ],
  frameRate: 8,
  repeat: -1,
})
```

Place fire sprites with `this.add.sprite(x, y, 'ss_fire_0').play('ss_fire_anim')` at 3–4 positions on the ruins and ground.

### Barrier Line

- Vertical glowing line at x=100, ~400px tall, drawn as a `Phaser.GameObjects.Graphics` object (not a texture) — regenerated each frame or drawn once and tweened via alpha
- Cyan/blue pulse: `0x00ccff` core lineStyle, alpha tween 0.4 → 1.0 → 0.4 over 1200ms loop
- On player damage: `setStrokeStyle` briefly to `0xff2200` (red), then restore to `0x00ccff` after 300ms

### Active Skeleton Aura

- A `Phaser.GameObjects.Ellipse` drawn **behind** the active skeleton sprite (lower depth)
- Size: ~20% larger than the skeleton sprite bounding box
- Color: `0x006688` dim / `0x00ccff` bright
- Tween: alpha 0.3 → 0.8 → 0.3 over 800ms loop
- On target switch: stop the tween and hide the aura on the old skeleton, start/show on the new one

---

## Game Loop

### Two Modes

The active mode is read from `loadProfile(this.profileSlot)?.gameMode ?? 'regular'` in `init()`.

**Regular mode** (mirrors GoblinWhacker regular mode):
- Skeletons march toward the barrier and **stop**, queuing in a line using index-based positioning:
  ```
  targetX = BATTLE_X + i * SKELETON_SPACING
  ```
  where `BATTLE_X = 300` and `SKELETON_SPACING = 120` (same values as GoblinWhacker). No explicit animation trigger needed — the `update()` loop advances each skeleton toward its `targetX` and clamps when reached.
- Skeletons do NOT deal damage on contact with the barrier.
- Damage occurs only on wrong keystrokes — see Wrong-Key Attack System below.
- The player types skeletons front-to-back. The front skeleton (index 0, closest to barrier) is always the auto-target. After it is defeated, index 0 shifts to the next skeleton which then advances to `BATTLE_X`.
- HP hearts are **hidden** at level start in regular mode (same as GoblinWhacker — hearts only flash visible on damage).

**Advanced mode:**
- Skeletons march at full speed and deal 1 HP damage on contact with the barrier (x ≤ 100).
- Speed scales with world number: `60 + level.world * 10`.
- HP hearts are visible.

### Skeleton Spawn Types (both modes)

Each wave spawns a random mix of:
- **Edge marchers** — appear off-screen right (`x = width + 30`), walk immediately; use `'ss_skeleton'` sprite
- **Ground risers** — spawn at random `x` between 300–800, `y` same as path Y; use `'ss_skeleton_rising'` sprite; play rise tween (y+20 → final y over 600ms, ease `'Back.Out'`) + one-shot ash particle burst at spawn point; swap to `'ss_skeleton'` sprite on tween complete

Each wave's composition scales with wave number and world number (more skeletons, faster speed in higher worlds). Example baseline: wave 1 = 1 riser + 1 marcher; final wave = 2 risers + 2 marchers.

### Wave Pacing

1. Level starts with Wave 1 immediately (no banner before first wave)
2. After each wave is **fully spawned**, the wave timer waits:
   - If skeletons are still alive from the previous wave, the new wave's skeletons are added to the existing list without showing the banner
   - If the previous wave is fully cleared, show `WAVE INCOMING` banner (center screen, gold text, ~2 second fade-in/fade-out), then spawn the next wave
3. During the inter-wave banner period: `engine.clearWord()` is called if no skeletons remain; typing is effectively paused since there is no active word
4. Wave counter text updates: "Wave 2 / 4"
5. Skeletons within a wave spawn staggered 400ms apart
6. Total waves: 3–5 (random, same as current implementation)
7. Win condition is checked in the wave timer callback: `if (currentWave >= maxWaves && skeletons.length === 0) endLevel(true)`

### Wrong-Key Attack System (Regular Mode Only)

Mirrors GoblinWhacker's `wrongKeyCount` / `nextAttackThreshold` pattern exactly — same field names, same reset logic:

```ts
// init():
this.nextAttackThreshold = Phaser.Math.Between(5, 8)

// onWrongKey():
this.wrongKeyCount++
if (this.wrongKeyCount >= this.nextAttackThreshold) {
  this.wrongKeyCount = 0
  this.nextAttackThreshold = Phaser.Math.Between(5, 8)
  // trigger attack from frontmost skeleton
}
```

> **Design note:** The threshold range `(5, 8)` intentionally matches GoblinWhacker to maintain consistent difficulty feel across level types. The "last stand" drama comes from the wave structure and visual design, not from more frequent attacks.

The attack animation: scale-pulse tween on the attacking skeleton (same as GoblinWhacker goblin attack), then call `skeletonReachedPlayer(skeleton)` on tween complete.

### Targeting

- **Auto-target = skeleton at index 0** (the front/closest skeleton). In regular mode this is the one stopped at `BATTLE_X`; in advanced mode it is the lowest-x skeleton.
- When a skeleton is defeated or reaches the player, `setActiveSkeleton(skeletons[0] ?? null)` is called.
- `setActiveSkeleton()` stops the aura tween on the old target, starts it on the new target, and calls `engine.setWord()` / `engine.clearWord()`.

### Win / Lose

- **Win:** all waves spawned + `skeletons.length === 0` (checked in wave timer loop)
- **Lose:** player HP reaches 0
- Both call `endLevel(passed: boolean)` → `LevelResultScene` after 500ms delay (same pattern as all other levels)

---

## UI Components

| Component | Details |
|-----------|---------|
| HP hearts | Pixel-art heart icons (key: `'heart'`, generated in `skeletonSwarmArt.ts`), top-left; hidden at start in regular mode |
| Wave counter | Top-right: "Wave 2 / 4" |
| Level name | Top-center, gold (`0xffd700`) |
| Pause | `setupPause(this, this.profileSlot)` — called first in `create()` |
| CompanionAndPetRenderer | Bottom-left, same position as other levels |
| GoldManager | Pet gold-collection registered as in current implementation |
| SpellCaster | Bottom-right spell UI; see SpellCaster Effects below |
| TypingHands | Shown when `loadProfile(this.profileSlot)?.showFingerHints` is true (profile setting, not a LevelConfig field) |
| TypingEngine | Bottom-center, `y = height - 80`, `fontSize: 40` |

### SpellCaster Effects

All four standard effects are implemented, mirroring GoblinWhacker:

| Effect | Behavior |
|--------|---------|
| `time_freeze` | Sets all skeletons' `speed = 0` for 5 seconds, then restores `speed = 60 + level.world * 10`. In regular mode, skeletons are already stopped — this has no visible effect but is harmless. |
| `word_blast` | Defeats the skeleton at index 0 (front/closest); calls `removeSkeleton()` and increments `skeletonsDefeated`. |
| `second_chance` | Restores up to 2 HP, capped at 5; shows hearts up to new HP value. |
| `letter_shield` | Sets `letterShieldCount = 3`; each wrong key decrements this before triggering the attack counter. |

---

## Pixel Art Color Palette

| Element | Color |
|---------|-------|
| Skeleton bone (lit) | `0xddccaa` |
| Skeleton bone (shadow) | `0xbbaa88` |
| Skeleton eyes | `0x00ccff` (cyan glow) |
| Armor scraps | `0x445566` |
| Weapon blade | `0xaaaaaa` |
| Weapon haft | `0x885533` |
| Sky (top) | `0x3d0000` |
| Sky (bottom) | `0x0a0000` |
| Ground | `0x3a2e1e` |
| Ruins stone | `0x2a2a2a` / `0x444444` mortar |
| Fire frame 0 outer | `0xff4400` |
| Fire frame 1 outer | `0xff6600` |
| Fire frame 2 outer | `0xff8800` |
| Ash particles | `0x666666` at alpha 0.6 |
| Barrier glow | `0x00ccff` core, `0x0044aa` pulse |
| Barrier damage flash | `0xff2200` for 300ms |
| Bone fragments | `0xeeddbb` |
| Active aura dim | `0x006688` alpha 0.3 |
| Active aura bright | `0x00ccff` alpha 0.8 |

---

## Ash Particle Emitters

Two separate emitter instances are used — they share the `'ss_ash_particle'` texture key but have different configurations:

**Ambient background emitter** (created once in `create()`):
- Covers full scene width, emits continuously at low rate (~3 particles/sec)
- Particle velocity: slow upward-left drift
- Alpha: 0.2–0.5, lifespan: 4000–6000ms

**Rise-burst emitter** (one-shot per rising skeleton):
- Called at the skeleton's spawn x/y when the rise tween begins
- Emits 8–12 particles in a radial burst (simulating dirt flying upward)
- Alpha: 0.6–0.9, lifespan: 600–900ms, gravity: 200
- Use `emitter.explode(12, x, y)` on a pre-configured emitter, or create a temporary emitter and destroy it after burst completes

---

## File Changes

| File | Change |
|------|--------|
| `src/art/skeletonSwarmArt.ts` | **New** — all texture generation functions |
| `src/scenes/level-types/SkeletonSwarmLevel.ts` | **Rewrite** — full replacement following GoblinWhacker pattern |

No changes needed to: `src/main.ts`, `LevelScene.ts`, world data files, or `src/types/index.ts`.

---

## Out of Scope

- Changes to other level types
- New level config fields
- New world data entries
- Backend or persistence changes
