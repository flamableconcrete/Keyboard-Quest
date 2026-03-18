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
- Wider, more hunched silhouette — bigger canvas (e.g. 20×24 pixels at scale 3)
- Heavy brow ridge, deeper-set beady yellow eyes
- Larger protruding bottom tusks
- Battle axe integrated into the raised right arm: brown handle + grey/steel wedge blade visible above the shoulder
- Same grey-green base color (`0x6b7c3a`), leather vest retained
- The red tinting as patience drains (already implemented) leads naturally into the attack flash

---

## Section 2: Orc Attack Animation

### Goal
When an orc's patience hits 0, a short punchy animation fires before the orc despawns. Purely visual — no mechanical changes beyond what already exists (walkoff counter, lose condition).

### Changes to `handleWalkoff` → renamed `handleAttack`
Sequence on patience reaching 0:

1. Orc tints fully red (`0xff0000`)
2. Quick scale-up lunge tween: scale 2 → 2.8, duration ~200ms, ease `Power2`
3. Screen shake: `cameras.main.shake(150, 0.01)`
4. On tween complete: despawn orc + ticket + patience bar, increment walkoff counter, check lose condition, respawn after delay

The existing patience-drain red tinting (below 0.33) already primes the player visually — the attack fires as a natural escalation.

---

## Section 3: Cook Movement — Kitchen Stations

### Goal
Cooks move between named, visually distinct kitchen stations rather than bobbing in place. The kitchen background is redesigned as a cohesive layout.

### Kitchen Layout

The background is restructured into three zones within the kitchen area (y=0–360):

**Back counter zone (y≈80–200)** — continuous counter running full width, stone wall behind:
| Station | Approx X | Description |
|---------|----------|-------------|
| Stove (left) | 80 | Two-burner stove with flames |
| Sink | 240 | Stone basin with tap |
| Spice rack | 420 | Wall-mounted shelves with jars |
| Herb bundles | 580 | Hanging dried herbs from ceiling beams |
| Fridge | 760 | Tall wooden ice-box with metal bands |
| Stove (right) | 920 | Two-burner stove matching left |

**Middle island zone (y≈220–290)** — wide prep table spanning the center:
| Station | Approx X | Description |
|---------|----------|-------------|
| Cauldron | 300 | Large bubbling pot over small flames |
| Cutting board | 560 | Thick wooden board with knife marks |
| Mortar & pestle | 820 | Stone grinding bowl |

**Floor/wall zone (y≈300–350)**:
| Station | Approx X | Description |
|---------|----------|-------------|
| Barrel rack | 160 | Stacked barrels (flour, ale, mystery) |
| Oven | 1100 | Stone arch oven with glowing interior |

### Cook Waypoints
Each station has a corresponding work position (where the cook stands):
- Back counter stations: work position is ~20px in front of the counter (y≈210)
- Island stations: work position is south face of the island (y≈295)
- Floor stations: work position is directly in front (y≈330)

### Cook Movement Behavior
Each of the three cooks runs a looping random-waypoint system:

1. Pick a random station from the pool (all 10 stations shared)
2. Tween to work position at random speed (100–200ms per 100px distance)
3. Pause at station: 150–500ms (randomized per arrival)
4. Pick next station (different from current), repeat

Base speeds are staggered per cook (cook 1 fastest, cook 3 slowest) so they never move in lockstep.

The existing bobbing tween is removed — the natural path variation provides the frantic feel.

### Background Art Changes (`generateKitchenBackground`)
The function is significantly expanded:
- Back wall added (stone texture, darker than floor tiles)
- Continuous back counter drawn as a long rectangle with highlights
- Prep island drawn as a wide centered table
- Each of the 10 stations drawn with individual pixel art on/above their surface
- Stove flames animated via Phaser tweens (alpha flicker) after texture generation — or baked in as static art if texture generation doesn't support post-generation tweens

---

## Files Changed

| File | Change |
|------|--------|
| `src/art/crazedCookArt.ts` | Full rewrite of orc texture; full rewrite of kitchen background; new station art functions |
| `src/scenes/level-types/CrazedCookLevel.ts` | `handleWalkoff` → `handleAttack` with tween sequence; cook spawn logic replaced with waypoint movement system; station position constants added |

---

## Out of Scope

- No audio changes
- No mechanical gameplay changes (patience rates, walkoff limits, order quota unchanged)
- No changes to ticket UI, typing engine, or HUD
- Cook sprites themselves are not redrawn (only their movement changes)
