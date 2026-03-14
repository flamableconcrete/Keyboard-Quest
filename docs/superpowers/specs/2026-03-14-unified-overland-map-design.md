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

| World | Levels | Approx Width |
|-------|--------|-------------|
| 1     | 12     | ~2000px     |
| 2     | 15     | ~2450px     |
| 3     | 14     | ~2300px     |
| 4     | 14     | ~2300px     |
| 5     | 13     | ~2150px     |
| **Total** | 68 | **~11200px** |

### Coordinate system

- World N's x-offset = sum of all preceding world widths
- Node positions within each world are recalculated to fit the new width (data migration for all 5 `world*.ts` map files)
- Phaser camera bounds: `(0, 0, totalMapWidth, 720)`
- Map height is fixed at 720px — no vertical scrolling

---

## 2. Camera & Panning

### Initial snap

On scene load, the camera immediately positions (no animation) to center on the player's current world section:

```
camera.scrollX = worldXOffset(currentWorld) + worldWidth(currentWorld)/2 - viewportWidth/2
```

### Click-drag pan

- Pointer down: capture start position
- Pointer move: shift `camera.scrollX` by the pointer delta
- Pointer up: release
- Drag threshold: 5px to prevent accidental drags when clicking nodes

### Edge scrolling

- Threshold: 60px from left/right viewport edge
- Speed: proportional to proximity to edge (faster nearer the edge)
- Only active when pointer is over the canvas

### HUD anchoring

All HUD elements use `setScrollFactor(0)` and high depth values so they remain fixed on screen regardless of camera position.

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

Tavern, Stable, and Shop are no longer placed as map sprites. They become fixed HUD buttons.

### Four circular buttons — bottom-right

All four buttons (Tavern, Stable, Shop, Character) are circular icon buttons anchored to the bottom-right corner, spaced 90px apart horizontally:

```
╭───╮ ╭───╮ ╭───╮ ╭───╮
│🍺 │ │🐴 │ │🛒 │ │👤 │
╰───╯ ╰───╯ ╰───╯ ╰───╯
Tavern Stable Shop Character
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

The world title label at the top-center updates dynamically as the camera scrolls, reflecting whichever world section is currently centered in the viewport.

---

## 5. Avatar Movement in Unified Coordinate Space

### Intra-world movement

Unchanged — the avatar follows bezier paths between nodes within each world using the existing tween system.

### Cross-world path segments

A `worldTransitions` array in `UnifiedMapConfig` defines one bezier path segment connecting each world boss node to the first node of the next world:

```
World 1 ...─[👑 W1 BOSS]────────────────[○ W2_L1]─... World 2
                         ↑ worldTransitions[0]
```

The avatar glides smoothly across world seams using the same path-following logic as intra-world movement.

### Camera during glide

The camera does **not** auto-follow the avatar. After the initial snap on load, the camera is always under manual user control (drag or edge scroll).

---

## 6. OverlandMapScene Refactor

### Removed

- `currentWorld` state variable
- World-switching ◀/▶ arrow buttons
- Scene restart on world change
- Per-world `getMapData()` switch statement
- Tavern, Stable, Shop rendered as map sprites (`drawSpecialNodes()`)

### Added

- `UnifiedMapConfig` data structure: holds all 5 world maps, per-world x-offsets, computed widths, and `worldTransitions`
- `buildUnifiedMap()`: renders all 5 world containers at their x-offsets plus gradient blend overlays
- `computeWorldWidths()`: utility that derives per-world widths from level counts and `NODE_H_SPACING`
- Click-drag and edge-scroll input handlers in `update()`
- `drawHudButton()`: shared helper for all four bottom-right buttons
- Dynamic world title label that updates based on `camera.scrollX`

### Unchanged

- Avatar glide and bezier path-following logic
- Node drawing (lock states, star display, hover/click, glow rect, tooltip)
- Gate logic (`meetsGate()`), mastery chest, settings/profiles buttons
- All `WorldMapData` files structure — only node x-positions get updated values

### New files

- `src/data/maps/unified.ts` — `UnifiedMapConfig` type and `buildUnifiedMap()` logic

### Updated files

- `src/scenes/OverlandMapScene.ts` — major refactor per above
- `src/data/maps/world1.ts` through `world5.ts` — node positions recalculated for expanded world widths
- `src/data/maps/types.ts` — any new types needed for `UnifiedMapConfig`

---

## Out of Scope

- Minimap (explicitly removed from design)
- Fog of war / world visibility gating (all worlds visible, locked nodes just dimmed)
- Vertical scrolling
- New tileset art assets (blending is achieved via overlay, not tile mixing)
