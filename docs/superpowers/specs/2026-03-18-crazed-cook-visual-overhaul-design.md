# Crazed Cook's Camp — Visual Overhaul Design

**Date:** 2026-03-18
**Scope:** `src/art/crazedCookArt.ts`, `src/scenes/level-types/CrazedCookLevel.ts`

---

## Overview

Three parallel improvements to the Crazed Cook's Camp level:

1. Orcs are redrawn to look like proper threatening orcs with axes
2. Orcs attack (visually) when patience runs out instead of silently vanishing
3. Cooks move around the kitchen between named stations rather than bobbing in place

---

## Section 1: Orc Visual Redesign

### Goal
The current orc sprite reads as a generic seated figure. The new sprite should immediately read as an angry, armed orc.

### Changes to `generateOrcCustomerTexture`
- Current canvas: 16×20 pixels at scale 3 (48×60px texture). New canvas: 20×24 pixels at scale 3 (60×72px texture).
- Because the texture is larger, the orc Image origin remains at (0.5, 0.5) and the spawn Y position in `spawnOrc` must be adjusted so the orc sits correctly above the patience bar (currently spawned at y=160). The new Y should be tuned so the bottom of the sprite aligns with the counter top.
- Patience bars and ticket positions are not moved — only the orc sprite Y spawn point is adjusted.
- Wider, more hunched silhouette with heavy brow ridge, deeper-set beady yellow eyes
- Larger protruding bottom tusks
- Battle axe integrated into the raised right arm: brown handle + grey/steel wedge blade visible above the shoulder
- Same grey-green base color (`0x6b7c3a`), leather vest retained
- The red tinting as patience drains (already implemented) leads naturally into the attack flash

---

## Section 2: Orc Attack Animation

### Goal
When an orc's patience hits 0, a short punchy animation fires before the orc despawns. Purely visual — no mechanical changes beyond what already exists (walkoff counter, lose condition).

### Call sites
`handleWalkoff` is called only from within `CrazedCookLevel.ts` (one call site: the `update` loop). Rename to `handleAttack` with no other files affected.

### Sequence on patience reaching 0 (replaces immediate despawn)

1. Immediately cancel active-order focus and clear engine word (same as current walkoff logic) so the player isn't left typing into a dead order
2. Tint orc fully red (`0xff0000`)
3. Quick scale-up lunge tween: from current scale (always 2 — set at spawn, never modified by tint logic) → 2.8, duration 200ms, ease `Power2`
4. Screen shake: `cameras.main.shake(150, 0.01)`
5. On tween `onComplete`: destroy orc sprite + ticket + patience bar, increment walkoff counter, check lose condition (`endLevel(false)` if `walkoffs >= maxWalkoffs`), schedule respawn after 1500ms delay

---

## Section 3: Cook Movement — Kitchen Stations

### Goal
Cooks move between named, visually distinct kitchen stations rather than bobbing in place. The kitchen background is redesigned as a cohesive layout.

### Kitchen Layout

The background is restructured into three zones within the kitchen area (y=0–360):

**Back counter zone** — continuous counter running full width, stone wall behind it:
| Station | Approx X | Description |
|---------|----------|-------------|
| Stove (left) | 80 | Two-burner stove with flames |
| Sink | 240 | Stone basin with tap |
| Spice rack | 420 | Wall-mounted shelves with jars |
| Herb bundles | 580 | Hanging dried herbs from ceiling beams |
| Fridge | 760 | Tall wooden ice-box with metal bands |
| Stove (right) | 920 | Two-burner stove matching left |

**Middle island zone** — wide prep table spanning the center:
| Station | Approx X | Description |
|---------|----------|-------------|
| Cauldron | 300 | Large bubbling pot over small flames |
| Cutting board | 560 | Thick wooden board with knife marks |
| Mortar & pestle | 820 | Stone grinding bowl |

**Floor/wall zone**:
| Station | Approx X | Description |
|---------|----------|-------------|
| Barrel rack | 160 | Stacked barrels (flour, ale, mystery) |
| Oven | 1100 | Stone arch oven with glowing interior |

### Cook Waypoints
Each station has a corresponding work position (the pixel coordinate where the cook sprite is centered when "at" that station):
- Back counter stations: y≈210 (in front of the counter)
- Island stations: y≈295 (south face of the island)
- Floor stations: y≈330 (in front of the floor item)

### Cook Movement Behavior
Each cook has a fixed base speed assigned at spawn:
- Cook 1 (ladle): 160ms per 100px
- Cook 2 (knife): 130ms per 100px
- Cook 3 (spoon): 190ms per 100px

Per-move loop:
1. Pick a random station from the 10-station pool (different from the cook's current station)
2. Compute tween duration: `distance / 100 * baseMsPerHundredPx`, minimum 150ms
3. Tween cook Image to the station's work position (x, y)
4. On tween complete: pause for a random delay between 150–500ms (`Phaser.Math.Between(150, 500)`)
5. After pause: go to step 1

Multiple cooks may occupy the same station simultaneously — stacking is allowed and adds to visual chaos. No reservation system.

Cook sprites are added to the scene after the background texture, so they naturally render above all background elements. No depth/z-ordering changes needed.

The existing bobbing tween is removed — the path movement provides the frantic feel.

### Background Art Changes (`generateKitchenBackground`)
The function is significantly expanded. All art is baked into the generated texture (static pixel art only — no post-generation tweens on baked textures):
- Back wall: stone texture strip across the top
- Continuous back counter: long rectangle with highlight and shadow stripes
- Prep island: wide centered table rectangle with highlights
- Each of the 10 stations: individual pixel art drawn on/above their surface
- Stove flames are baked as static colored rectangles (no animation)

Stove flame animation (optional enhancement, separate from background texture): two small Phaser Image or Rectangle objects added to the scene after `generateCrazedCookTextures` returns, driven by alpha-flicker tweens. This is additive and does not affect the texture generation. If omitted, the static baked flames are sufficient.

---

## Files Changed

| File | Change |
|------|--------|
| `src/art/crazedCookArt.ts` | Full rewrite of orc texture (new canvas size); full rewrite of kitchen background (stations, back wall, island); new per-station pixel art functions |
| `src/scenes/level-types/CrazedCookLevel.ts` | `handleWalkoff` → `handleAttack` with tween sequence; cook bobbing tweens replaced with waypoint movement system; station position constants added; orc spawn Y adjusted for new texture size |

---

## Out of Scope

- No audio changes
- No mechanical gameplay changes (patience rates, walkoff limits, order quota unchanged)
- No changes to ticket UI, typing engine, or HUD
- Cook sprites themselves are not redrawn (only their movement changes)
- Cook z-ordering relative to background requires no changes (cooks already render above background by scene add order)
