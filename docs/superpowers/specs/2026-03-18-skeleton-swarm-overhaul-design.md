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

### Skeleton Sprites (~4px scale, ~16×20 pixel grid)

**Marching skeleton:**
- Skull: rounded top, empty eye sockets as glowing cyan dots (2×2px, `0x00ccff`)
- Ribcage: off-white bone stripes (`0xddccaa`), shadow side slightly darker (`0xbbaa88`)
- Armor scraps: dark rusted iron (`0x445566`) — broken breastplate shard, partial pauldron
- Weapon: simple sword or spear (`0xaaaaaa` blade, `0x885533` haft)

**Rising skeleton:**
- Same upper body as marching variant
- Lower half replaced with cracked dirt tiles — skeleton partially submerged in ground
- Used for mid-field spawns; transitions to marching sprite after rise animation completes

**Bone burst (death):**
- 6–8 off-white bone fragment rectangles (`0xeeddbb`), 1×3px and 2×2px
- Used as Phaser particle emitter on skeleton death
- Scatter outward radially with gravity, fade to alpha 0 over 600ms

### Background Layers

All drawn with `scene.add.graphics()` → `generateTexture()`.

| Key | Description |
|-----|-------------|
| `ss_sky` | Deep blood-red fading to near-black (`0x3d0000` → `0x0a0000`) |
| `ss_ruins` | Distant broken stone walls and collapsed archways silhouetted against sky |
| `ss_battlefield` | Mid-ground cracked earth (`0x3a2e1e`), scattered skulls, broken weapons sticking from dirt |
| `ss_fire` | 3-frame pixel-art fire animation: `0xff6600` → `0xffcc00` → `0xffffff` core; placed on ruins and ground |
| `ss_ash` | Particle emitter: tiny gray/white specks (`0x888888`–`0xcccccc`), very low alpha, drifting upward-left |

### Barrier Line

- Vertical glowing line at x=100, ~400px tall
- Cyan/blue pulse: `0x00ccff` core, `0x0044aa` outer
- Tween: opacity 0.4 → 1.0 → 0.4 over 1200ms, looping
- On player damage: briefly flickers red (`0xff2200`) then returns to cyan

### Active Skeleton Aura

- A slightly larger ellipse drawn behind the active/targeted skeleton sprite
- Pulses between dim (`0x006688`, alpha 0.3) and bright (`0x00ccff`, alpha 0.8) via tween loop
- When targeting switches to a new skeleton, the aura tween is stopped on the old one and started on the new one

---

## Game Loop

### Two Modes

**Regular mode** (mirrors GoblinWhacker regular mode):
- Skeletons march to the barrier and **stop**, queueing up in a line behind each other
- They do NOT deal damage on contact
- Damage occurs only on wrong keystrokes: every 3–6 mistyped letters (random threshold, re-randomized after each attack), the frontmost skeleton deals 1 HP damage
- Camera shake + barrier flickers red on damage
- Player types skeletons front-to-back; defeating the front one causes the next to advance to the barrier position

**Advanced mode:**
- Skeletons march at full speed and deal damage on contact with the barrier (x ≤ 100)
- Speed scales with world number

### Skeleton Spawn Types (both modes)

Each wave spawns a random mix of:
- **Edge marchers** — appear off-screen right, walk immediately at constant speed
- **Ground risers** — spawn at random x between 300–800, play rise animation (tween from y+20 to final y + dirt particles using `ss_ash` emitter burst), then begin marching

Wave composition scales with wave number and world number (more skeletons, faster speed in higher worlds).

### Wave Pacing

1. Level starts immediately with Wave 1
2. Between waves: `WAVE INCOMING` banner fades in (center screen, gold text, ~2 second duration)
3. Wave counter updates: "Wave 2 / 4"
4. Skeletons in the new wave spawn staggered 400ms apart (not all at once)
5. Total waves: 3–5 (random, same as current implementation)

### Wrong-Key Attack System (Regular Mode)

Mirrors GoblinWhacker's `wrongKeyCount` / `nextAttackThreshold` pattern:
- `wrongKeyCount` increments on each `onWrongKey` callback
- `nextAttackThreshold` is randomized to `Phaser.Math.Between(3, 6)` on init and after each triggered attack
- When `wrongKeyCount >= nextAttackThreshold`: deal 1 damage, reset `wrongKeyCount = 0`, re-randomize threshold

### Targeting

- Auto-target = skeleton closest to barrier (lowest x value)
- Active skeleton receives the pulsing cyan aura
- On skeleton defeat: immediately retarget next closest
- `TypingEngine.setWord()` called with new target's word

### Win / Lose

- **Win:** all waves spawned + all skeletons defeated
- **Lose:** player HP reaches 0
- Both call `endLevel(passed: boolean)` → `LevelResultScene` after 500ms delay

---

## UI Components

| Component | Details |
|-----------|---------|
| HP hearts | Pixel-art heart icons (reuse `heart` texture from `goblinWhackerArt`), top-left |
| Wave counter | Top-right: "Wave 2 / 4" |
| Level name | Top-center, gold (`0xffd700`) |
| Pause | `setupPause()` |
| CompanionAndPetRenderer | Bottom-left, same position as other levels |
| GoldManager | Pet gold-collection registered as in current implementation |
| SpellCaster | Bottom-right spell UI; effects apply to active or nearest skeleton |
| TypingHands | Shown conditionally when level config enables finger hints |
| TypingEngine | Bottom-center, same position and font size as other levels |

---

## Pixel Art Color Palette

| Element | Color |
|---------|-------|
| Skeleton bone | `0xddccaa` (lit), `0xbbaa88` (shadow) |
| Skeleton eyes | `0x00ccff` (cyan glow) |
| Armor scraps | `0x445566` |
| Weapon blade | `0xaaaaaa` |
| Weapon haft | `0x885533` |
| Sky (top) | `0x3d0000` |
| Sky (bottom) | `0x0a0000` |
| Ground | `0x3a2e1e` |
| Ruins stone | `0x2a2a2a` / `0x444444` mortar |
| Fire core | `0xffffff` → `0xffcc00` → `0xff6600` |
| Ash particles | `0x888888`–`0xcccccc` |
| Barrier glow | `0x00ccff` core, `0x0044aa` pulse |
| Bone fragments | `0xeeddbb` |

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
