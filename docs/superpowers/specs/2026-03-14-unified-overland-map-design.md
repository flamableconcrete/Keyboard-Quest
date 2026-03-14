# Unified Overland Map — Design Spec

**Date:** 2026-03-14
**Status:** Approved

## Overview

Replace the current per-world `OverlandMapScene` (which restarts the scene on world change) with a single, continuously scrollable map spanning all 5 worlds left-to-right. The player pans by clicking and dragging or moving the mouse to the screen edges. World boss nodes gate access to the next world, and the final castle node sits at the far right.

---

## 1. Map Layout & Coordinate System

### Per-world widths

Each world gets a computed horizontal width based on its level count, using a configurable spacing constant:

```
worldWidth(world) = LEFT_MARGIN + (numLevels × NODE_H_SPACING) + RIGHT_MARGIN
```

- `NODE_H_SPACING` = 150px (configurable)
- `LEFT_MARGIN` = `RIGHT_MARGIN` = 200px
- Tile grid column count per world = `Math.ceil(worldWidth / TILE_SIZE)` (TILE_SIZE = 32)

Approximate widths given current level counts (W1=12, W2=15, W3=14, W4=14, W5=13):

| World | Levels | Approx Width | Tile Columns |
|-------|--------|-------------|--------------|
| 1     | 12     | ~2000px     | ~63          |
| 2     | 15     | ~2450px     | ~77          |
| 3     | 14     | ~2300px     | ~72          |
| 4     | 14     | ~2300px     | ~72          |
| 5     | 13     | ~2150px     | ~68          |
| **Total** | 68 | **~11200px** |            |

### Coordinate system

- World N's x-offset = sum of all preceding world widths
- Node positions within each world are recalculated to fit the new width (data migration for all 5 `world*.ts` map files — see Section 6)
- Phaser camera bounds: `(0, 0, totalMapWidth, 720)`
- Map height is fixed at 720px — no vertical scrolling

### Node position recalculation

Each world's node x-positions are recalculated relative to that world's section (i.e. in local coordinates starting at 0). The `buildUnifiedMap()` function adds each world's x-offset when placing them in the scene. Node y-positions are authored per-world and remain unchanged.

The existing `COLS = 40` constant in each world's tile grid builder is replaced with the computed column count for that world. The `buildGround()` and `buildDetail()` functions in each world file are updated accordingly.

---

## 2. Camera & Panning

### Initial snap

On scene load, the camera immediately positions (no animation) to center on the player's current world section. The `profile.currentWorld` field is retained (not renamed or removed) and continues to mean "which world section to center the camera on at load":

```
camera.scrollX = worldXOffset(profile.currentWorld) + worldWidth(profile.currentWorld)/2 - viewportWidth/2
```

`profile.currentWorld` is updated whenever the avatar enters a level in a new world (same as today, replacing the old world-switch save).

### Click-drag pan

- Pointer down: capture start position
- Pointer move: shift `camera.scrollX` by the pointer delta
- Pointer up: release
- Drag threshold: 5px to prevent accidental drags when clicking nodes
- Click-drag is suppressed while the avatar is gliding

### Edge scrolling

- Threshold: 60px from left/right viewport edge
- Speed: proportional to proximity to edge (faster nearer the edge)
- Only active when pointer is over the canvas
- Edge scrolling is suppressed while the avatar is gliding

### HUD anchoring

All HUD elements (buttons, world title, player info, settings, profiles, mastery chest) use `setScrollFactor(0)` and high depth values so they remain fixed on screen regardless of camera position.

### No vertical scrolling

Camera Y is always 0. The map is fixed-height at 720px.

---

## 3. Biome Blending Zones

At each world boundary seam, a 300px-wide gradient overlay spans 150px into each adjacent world, creating a soft visual transition between biomes.

### Implementation

The gradient is a Phaser `Graphics` object drawing a series of thin vertical rectangles stepping from one world's blend color to the next. Alpha is capped at ~0.45 so underlying tile art shows through.

### World blend colors

| World | Theme              | Blend Color            |
|-------|--------------------|------------------------|
| 1     | The Heartland      | `0x88cc66` (meadow green) |
| 2     | The Shadowed Fen   | `0x334455` (dark teal)    |
| 3     | The Ember Peaks    | `0xcc5522` (burnt orange) |
| 4     | The Shrouded Wilds | `0x336633` (deep forest)  |
| 5     | Typemancer's Tower | `0x220044` (arcane purple)|

### Atmospheric particles

Each world's particle emitters (pollen, mist, embers, etc.) are scoped to that world's x-zone. As the player scrolls through a blend region, one world's particles naturally fade out while the next world's particles fade in.

---

## 4. HUD Buttons

### Special nodes removed from map

Tavern, Stable, and Shop are no longer placed as map sprites. They become fixed HUD buttons. The `specialNodes` field is removed from the `WorldMapData` type in `src/data/maps/types.ts`, and all five `world*.ts` map data files have their `specialNodes` entries deleted.

### Four circular buttons — bottom-right

All four buttons (Tavern, Stable, Shop, Character) are circular icon buttons anchored to the bottom-right corner. The Character button (rightmost) is at `(width - 60, height - 60)`. Each preceding button is 90px to the left:

```
x: width-330  width-240  width-150  width-60
y: height-60  height-60  height-60  height-60

╭───╮  ╭───╮  ╭───╮  ╭───╮
│🍺 │  │🐴 │  │🛒 │  │👤 │
╰───╯  ╰───╯  ╰───╯  ╰───╯
Tavern Stable  Shop  Character
```

**Styling** (same as current character button, minus the glow ring):
- Dark circle background
- Gold border with stroke
- Hover: background lightens, border turns gold, icon scales up slightly
- Click: brief scale-down pop, then navigate
- Tooltip label on hover
- **No pulsing glow ring** on any button (including the existing character button — remove its glow ring)

A shared `drawHudButton()` helper creates all four consistently.

### World title

The world title label at the top-center updates dynamically as the camera scrolls. The displayed world is determined by which world's x-offset boundary the camera center has most recently crossed — i.e. the world whose section contains `camera.scrollX + viewportWidth/2`. Blend zones (300px seams) do not get their own title; the outgoing world's title remains displayed until the camera center crosses the seam midpoint.

---

## 5. Avatar Movement in Unified Coordinate Space

### Intra-world movement

Unchanged — the avatar follows bezier paths between nodes within each world using the existing tween system.

### Cross-world path segments

A `worldTransitions` array in `UnifiedMapConfig` defines one path segment connecting each world boss node to the first node of the next world. Each entry holds absolute pixel coordinates (in the unified map's coordinate space, i.e. already including each world's x-offset) for an optional bezier control point. These values are hardcoded in `src/data/maps/unified.ts`, computed from the adjacent node positions of each world with a midpoint control point:

```typescript
// Example entry for W1→W2 transition
{ cx: (w1BossNode.x + w2FirstNode.x) / 2, cy: (w1BossNode.y + w2FirstNode.y) / 2 }
```

```
World 1 ...─[👑 W1 BOSS]────────────────[○ W2_L1]─... World 2
                         ↑ worldTransitions[0] (absolute coords)
```

The avatar glides smoothly across world seams using the same path-following logic as intra-world movement.

### Camera behavior during cross-world glide

Clicking a node whose position is off-screen triggers a one-time camera tween to center on the destination node before the avatar begins gliding. This handles cross-world node clicks where the destination is outside the current viewport. Within the same visible area, the camera does not move during glide. After the camera tween completes (or if destination is already on-screen), the avatar glide begins and the camera remains stationary.

---

## 6. OverlandMapScene Refactor

### Removed

- World-switching ◀/▶ arrow buttons and their `drawWorldArrows()` method
- Scene restart on world change
- Per-world `getMapData()` switch statement
- Tavern, Stable, Shop rendered as map sprites (`drawSpecialNodes()` method deleted)

### Added

- `UnifiedMapConfig` data structure: holds all 5 world maps, per-world x-offsets, computed widths, and `worldTransitions`
- `buildUnifiedMap()`: renders all 5 world containers at their x-offsets plus gradient blend overlays
- `computeWorldWidths()`: utility that derives per-world widths from level counts and `NODE_H_SPACING`
- Click-drag and edge-scroll input handlers in `update()`
- `drawHudButton()`: shared helper for all four bottom-right buttons
- Dynamic world title label that updates based on `camera.scrollX`
- Camera tween to center on off-screen destination before avatar glide begins

### Unchanged (logic)

- Avatar glide and bezier path-following logic (operates in wider coordinate space)
- Node drawing (lock states, star display, hover/click, glow rect, tooltip)
- Gate logic (`meetsGate()`)
- Settings and Profiles buttons
- `profile.currentWorld` field (retained, semantics unchanged)

### Updated behavior

- `drawMasteryChest()`: the mastery chest is repositioned as a HUD element using `setScrollFactor(0)` so it stays fixed on screen (currently it renders without scroll factor and would drift with the camera)

### New files

- `src/data/maps/unified.ts` — `UnifiedMapConfig` type, `buildUnifiedMap()`, `computeWorldWidths()`, and `worldTransitions` data

### Updated files

- `src/scenes/OverlandMapScene.ts` — major refactor per above
- `src/data/maps/world1.ts` through `world5.ts` — node positions recalculated for expanded world widths; `COLS` constant updated; `specialNodes` removed
- `src/data/maps/types.ts` — `specialNodes` field removed from `WorldMapData`; new types added for `UnifiedMapConfig` and `WorldTransition`

---

## Out of Scope

- Minimap (explicitly removed from design)
- Fog of war / world visibility gating (all worlds visible, locked nodes just dimmed)
- Vertical scrolling
- New tileset art assets (blending is achieved via overlay, not tile mixing)
