# Overworld Map Visual Overhaul — Design

## Goal

Transform the overworld map from placeholder procedural graphics into a fully-themed, pixel-art RPG overworld with tile-based terrain, animated decorations, particle atmospheres, and polished node interactions.

## Approach

**Tile-Based Terrain Map** — Build proper tilemaps for each world using pixel-art tilesets (32×32). Each world gets a unique tileset and atmosphere. Nodes use distinct sprite art. Paths curve organically. Particles and ambient animations bring the map to life.

## Tilemap Architecture

- **Tile size:** 32×32 pixels
- **Grid:** 40×23 tiles (1280×736, slight oversize clipped by camera on 1280×720 canvas)
- **Layers per world** (bottom to top):
  1. **Ground** — base terrain (grass, dirt, sand, stone, water/lava)
  2. **Terrain detail** — path tiles, bridges, shorelines, cracks
  3. **Decorations** — trees, rocks, bushes, flowers, mushrooms (tile objects with y-offset for depth)
  4. **Nodes** — interactive level/special node sprites at specific tile positions
  5. **Particles/FX** — runtime particle emitters, not part of the tilemap
- **Tilemap data format:** JSON arrays in TypeScript (`src/data/maps/world1.ts` etc.). No external Tiled editor dependency.
- **Tileset approach:** One PNG spritesheet per world (~20-30 unique tiles). Shared tiles (path, nodes) in a `common` sheet.

## Per-World Visual Themes

### World 1 — The Heartland
- **Ground:** lush green grass, dirt paths, small ponds
- **Decorations:** oak trees, wildflowers, hay bales, fences, cottages
- **Particles:** butterflies, floating pollen
- **Palette:** greens, warm browns, sunny yellows

### World 2 — The Shadowed Fen
- **Ground:** dark mud, murky water, mossy stone
- **Decorations:** dead trees, lily pads, cattails, fog wisps, ruined pillars
- **Particles:** fireflies, rising fog/mist
- **Palette:** dark teals, sickly greens, grays

### World 3 — The Ember Peaks
- **Ground:** volcanic rock, lava flows, ash-covered stone, cracked earth
- **Decorations:** obsidian spires, smoldering stumps, ember vents, iron chains
- **Particles:** floating embers, ash fall, heat shimmer
- **Palette:** deep reds, charcoal, molten orange

### World 4 — The Shrouded Wilds
- **Ground:** dense forest floor, tangled roots, overgrown stone
- **Decorations:** giant mushrooms, twisted ancient trees, glowing moss, spider webs
- **Particles:** falling leaves, spore puffs, dim light rays
- **Palette:** deep greens, purples, earthy browns

### World 5 — The Typemancer's Tower
- **Ground:** arcane tile floors, floating stone platforms, void/starfield gaps
- **Decorations:** crystal pillars, runic circles, floating books, enchanted braziers
- **Particles:** magic sparkles, orbiting runes, arcane pulses
- **Palette:** deep purple, electric blue, gold accents

## Node & Path Design

### Node sprites (32×32 pixel art PNGs)
- **Regular level** — small stone tower with colored banner (white=unlocked, gold=completed, dark=locked)
- **Mini-boss** — fortified gatehouse with spikes/horns
- **Boss** — imposing castle/fortress with skull or crown motif
- **Tavern** — timber-frame building with hanging sign
- **Stable** — wooden barn with fence
- **Inventory** — treasure chest or merchant cart

### Node interactivity
- **Hover:** small bounce tween + glow outline + tooltip fades in
- **Completed:** subtle golden shimmer particle loop
- **Locked:** darkened + faint chain overlay
- **Gated:** lock icon pulses gently

### Paths
- **Curved bezier paths** between nodes (winding trails, not straight lines)
- **6px wide dirt/cobblestone texture** (repeating pattern) instead of solid color
- Completed path segments slightly brighter than upcoming ones

### Star display
- Small pixel-art star sprites (gold filled vs gray empty) replacing emoji text

## Avatar & Movement

- Keep the existing `AvatarRenderer` system for unique character faces
- Add **2-frame walk animation** (bob up/down) during movement
- Avatar **follows curved bezier paths** between nodes (not straight lines)
- Slight **dust particle puff** on arrival at a node
- Small **drop shadow** beneath avatar
- **No camera changes** — full static 1280×720 view

## Particle & Atmosphere System

- Each world defines a `WorldAtmosphere` config (particle types, zones, colors, density)
- Particles use small (4×4 or 8×8) pixel-art textures from the common spritesheet
- 2-3 emitter types per world max for performance
- **Animated tiles:** water/lava use 2-3 frame animation (swap tile indices every 400-600ms)
- **Ambient tweens:** tree sway (±2° rotation), flower/mushroom scale pulse, brazier alpha flicker — applied to a subset of decorations
- **World transition:** fade-to-black (300ms out, 300ms in) when switching worlds

## File Structure

### Sprite assets
```
public/assets/maps/
  common.png          — shared tiles (path, nodes, particles, stars)
  world1-tileset.png  — Heartland terrain + decorations
  world2-tileset.png  — Shadowed Fen terrain + decorations
  world3-tileset.png  — Ember Peaks terrain + decorations
  world4-tileset.png  — Shrouded Wilds terrain + decorations
  world5-tileset.png  — Typemancer's Tower terrain + decorations
```

### Map data
```
src/data/maps/
  types.ts            — WorldMapData, TileLayer, WorldAtmosphere interfaces
  common.ts           — shared tile indices, particle configs
  world1.ts           — tile arrays, decoration placements, node positions, atmosphere config
  world2.ts–world5.ts — same structure per world
```

### Code changes
- `PreloadScene.ts` — load tileset PNGs + common spritesheet
- `OverlandMapScene.ts` — major refactor: render tilemap layers, place decorations, init particles, draw curved paths, use new node sprites
- New: `src/utils/mapRenderer.ts` — shared tilemap rendering, path drawing, atmosphere setup

## Implementation Order

Each step leaves the map in a playable state:

1. **Foundation** — file structure, interfaces, `mapRenderer.ts`, refactor `OverlandMapScene`
2. **World 1 tileset + tilemap** — Heartland spritesheet and tile arrays, replace tinted background
3. **Node sprites + paths** — common spritesheet with node art, star sprites, particle textures, bezier paths
4. **Node interactivity** — hover bounce/glow, completion shimmer, lock pulse, tooltip fade
5. **Avatar path-following** — curved path movement, dust puff, walk bob
6. **World 1 atmosphere** — particles (butterflies, pollen), tree sway, flower pulse
7. **World 2-5 tilesets** — remaining tileset PNGs and map data, one world at a time
8. **World 2-5 atmospheres** — per-world particles and animated tiles
9. **Polish** — world transition fade, timing/color/density tuning
