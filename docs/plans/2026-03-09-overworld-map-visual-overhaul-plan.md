# Overworld Map Visual Overhaul — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the placeholder overworld map with tile-based pixel-art terrain, themed per world, with animated decorations, particle atmospheres, curved paths, and polished node interactions.

**Architecture:** Each world has a tileset PNG (spritesheet of 32×32 tiles) and a TypeScript map data file defining 2D tile arrays for ground/detail layers, decoration placements, node positions, bezier path control points, and atmosphere configs. A shared `mapRenderer.ts` utility handles tilemap rendering, path drawing, and atmosphere setup, keeping OverlandMapScene manageable. A common spritesheet holds node sprites, star icons, and particle textures shared across all worlds.

**Tech Stack:** Phaser 3, TypeScript, Vite. No external tools (Tiled, etc.) — all map data hand-coded.

---

### Task 1: Create map data types and file structure

**Files:**
- Create: `src/data/maps/types.ts`
- Create: `src/data/maps/common.ts`
- Create: `public/assets/maps/` (directory)

**Step 1: Create the directory structure**

Run: `mkdir -p public/assets/maps src/data/maps`

**Step 2: Create map type definitions**

Create `src/data/maps/types.ts`:

```typescript
// src/data/maps/types.ts

/** A 2D grid of tile indices. -1 = empty/transparent. */
export type TileGrid = number[][]

/** Decoration placed as a sprite on the map */
export interface DecorationPlacement {
  /** Tile index in the world tileset */
  tileIndex: number
  /** Pixel position (top-left of the tile) */
  x: number
  y: number
  /** Optional depth offset for y-sorting */
  depthOffset?: number
  /** If true, apply ambient sway tween */
  sway?: boolean
  /** If true, apply ambient scale pulse */
  pulse?: boolean
  /** If true, apply alpha flicker */
  flicker?: boolean
}

/** Bezier control point for curved path between nodes */
export interface PathSegment {
  /** Control point for quadratic bezier (omit for straight line) */
  cx?: number
  cy?: number
}

/** Node position on the map (pixel coords) */
export interface MapNodePosition {
  x: number
  y: number
}

/** Particle emitter config for world atmosphere */
export interface AtmosphereEmitter {
  /** Key into common spritesheet frame name */
  particleFrame: string
  /** Emitter zone bounds (pixel coords) */
  zone: { x: number; y: number; width: number; height: number }
  /** Particle tint color */
  tint: number
  /** Particles per second */
  frequency: number
  /** Particle lifespan in ms */
  lifespan: number
  /** Speed range */
  speed: { min: number; max: number }
  /** Gravity Y (negative = float up) */
  gravityY?: number
  /** Scale range */
  scale?: { start: number; end: number }
  /** Alpha range */
  alpha?: { start: number; end: number }
}

/** Animated tile definition — cycles through tile indices */
export interface AnimatedTile {
  /** Tile indices in the tileset to cycle through */
  frames: number[]
  /** Duration per frame in ms */
  frameDuration: number
}

/** Full map data for one world */
export interface WorldMapData {
  /** Which world (1-5) */
  world: number
  /** Tileset image key (loaded in PreloadScene) */
  tilesetKey: string
  /** Number of columns in the tileset spritesheet */
  tilesetColumns: number
  /** Ground layer tile grid (40x23) */
  ground: TileGrid
  /** Terrain detail layer tile grid (40x23), -1 = transparent */
  detail: TileGrid
  /** Decoration sprites to place */
  decorations: DecorationPlacement[]
  /** Node pixel positions (indexed same as level array) */
  nodePositions: MapNodePosition[]
  /** Special node positions */
  specialNodes: Record<string, MapNodePosition>
  /** Bezier path segments between consecutive nodes */
  pathSegments: PathSegment[]
  /** Atmosphere particle emitters */
  atmosphere: AtmosphereEmitter[]
  /** Animated tile definitions */
  animatedTiles: AnimatedTile[]
}
```

**Step 3: Create common config stub**

Create `src/data/maps/common.ts`:

```typescript
// src/data/maps/common.ts

/** Frame names in the common spritesheet */
export const COMMON_FRAMES = {
  // Node sprites
  nodeLevel: 0,
  nodeMiniBoss: 1,
  nodeBoss: 2,
  nodeTavern: 3,
  nodeStable: 4,
  nodeInventory: 5,
  // Star icons
  starFilled: 6,
  starEmpty: 7,
  // Particle textures
  particleDot: 8,
  particleSpark: 9,
  particleLeaf: 10,
  particleDust: 11,
  // Lock/chain overlay
  lockOverlay: 12,
} as const

/** Common spritesheet layout */
export const COMMON_TILESET = {
  key: 'map-common',
  path: 'assets/maps/common.png',
  frameWidth: 32,
  frameHeight: 32,
  columns: 8,
} as const
```

**Step 4: Commit**

```bash
git add src/data/maps/types.ts src/data/maps/common.ts
git commit -m "feat(map): add map data types and common config"
```

---

### Task 2: Create mapRenderer utility

**Files:**
- Create: `src/utils/mapRenderer.ts`

**Step 1: Create the map renderer**

Create `src/utils/mapRenderer.ts`:

```typescript
// src/utils/mapRenderer.ts
import Phaser from 'phaser'
import { WorldMapData, DecorationPlacement, AtmosphereEmitter, AnimatedTile } from '../data/maps/types'

export class MapRenderer {
  private scene: Phaser.Scene
  private mapData: WorldMapData
  private animatedTileTimers: Phaser.Time.TimerEvent[] = []
  private decorationSprites: Phaser.GameObjects.Sprite[] = []
  private particleEmitters: Phaser.GameObjects.Particles.ParticleEmitter[] = []

  constructor(scene: Phaser.Scene, mapData: WorldMapData) {
    this.scene = scene
    this.mapData = mapData
  }

  /** Render ground + detail tile layers */
  renderTileLayers(): void {
    const { ground, detail, tilesetKey, tilesetColumns } = this.mapData
    this.renderGrid(ground, tilesetKey, tilesetColumns, 0)
    this.renderGrid(detail, tilesetKey, tilesetColumns, 1)
  }

  private renderGrid(grid: number[][], tilesetKey: string, columns: number, depth: number): void {
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < (grid[row]?.length ?? 0); col++) {
        const idx = grid[row][col]
        if (idx < 0) continue
        const frameX = (idx % columns) * 32
        const frameY = Math.floor(idx / columns) * 32
        this.scene.add.image(col * 32, row * 32, tilesetKey)
          .setOrigin(0, 0)
          .setCrop(frameX, frameY, 32, 32)
          .setDepth(depth)
      }
    }
  }

  /** Place decoration sprites with ambient animations */
  renderDecorations(): void {
    for (const dec of this.mapData.decorations) {
      const { tilesetKey, tilesetColumns } = this.mapData
      const frameX = (dec.tileIndex % tilesetColumns) * 32
      const frameY = Math.floor(dec.tileIndex / tilesetColumns) * 32
      const sprite = this.scene.add.image(dec.x, dec.y, tilesetKey)
        .setOrigin(0, 0)
        .setCrop(frameX, frameY, 32, 32)
        .setDepth(2 + (dec.depthOffset ?? 0))

      if (dec.sway) {
        this.scene.tweens.add({
          targets: sprite,
          angle: { from: -2, to: 2 },
          duration: 2000 + Math.random() * 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        })
      }

      if (dec.pulse) {
        this.scene.tweens.add({
          targets: sprite,
          scaleX: { from: 1, to: 1.05 },
          scaleY: { from: 1, to: 1.05 },
          duration: 1500 + Math.random() * 500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        })
      }

      if (dec.flicker) {
        this.scene.tweens.add({
          targets: sprite,
          alpha: { from: 0.7, to: 1 },
          duration: 300 + Math.random() * 200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        })
      }

      this.decorationSprites.push(sprite as unknown as Phaser.GameObjects.Sprite)
    }
  }

  /** Draw curved bezier paths between nodes */
  renderPaths(levels: { id: string }[], completedIds: Set<string>): Phaser.Curves.Path {
    const gfx = this.scene.add.graphics().setDepth(1)
    const nodes = this.mapData.nodePositions
    const segments = this.mapData.pathSegments
    const path = new Phaser.Curves.Path(nodes[0]?.x ?? 0, nodes[0]?.y ?? 0)

    for (let i = 1; i < nodes.length && i < levels.length; i++) {
      const from = nodes[i - 1]
      const to = nodes[i]
      const seg = segments[i - 1]
      if (!from || !to) continue

      const completed = completedIds.has(levels[i - 1]?.id ?? '')
      gfx.lineStyle(6, completed ? 0xaa8844 : 0x665533, completed ? 1 : 0.6)

      if (seg?.cx !== undefined && seg?.cy !== undefined) {
        // Quadratic bezier
        const curve = new Phaser.Curves.QuadraticBezier(
          new Phaser.Math.Vector2(from.x, from.y),
          new Phaser.Math.Vector2(seg.cx, seg.cy),
          new Phaser.Math.Vector2(to.x, to.y),
        )
        path.add(curve)
        curve.draw(gfx, 32)
      } else {
        // Straight line fallback
        path.lineTo(to.x, to.y)
        gfx.beginPath()
        gfx.moveTo(from.x, from.y)
        gfx.lineTo(to.x, to.y)
        gfx.strokePath()
      }
    }

    return path
  }

  /** Start atmosphere particle emitters */
  startAtmosphere(): void {
    // Atmosphere particles require the common spritesheet with particle frames.
    // Each emitter uses a small texture from the common sheet.
    for (const config of this.mapData.atmosphere) {
      const emitter = this.scene.add.particles(0, 0, 'map-common', {
        frame: config.particleFrame,
        x: { min: config.zone.x, max: config.zone.x + config.zone.width },
        y: { min: config.zone.y, max: config.zone.y + config.zone.height },
        frequency: config.frequency,
        lifespan: config.lifespan,
        speed: config.speed,
        gravityY: config.gravityY ?? 0,
        scale: config.scale ?? { start: 1, end: 0.5 },
        alpha: config.alpha ?? { start: 1, end: 0 },
        tint: config.tint,
      })
      emitter.setDepth(8)
      this.particleEmitters.push(emitter)
    }
  }

  /** Start animated tile cycling */
  startAnimatedTiles(): void {
    // Animated tiles swap tile indices at runtime.
    // Implementation will update tile images on a timer.
    // For now this is a stub — full implementation when we have actual tilesets.
  }

  /** Clean up all created objects */
  destroy(): void {
    this.animatedTileTimers.forEach(t => t.destroy())
    this.decorationSprites.forEach(s => s.destroy())
    this.particleEmitters.forEach(e => e.destroy())
  }
}
```

**Step 2: Commit**

```bash
git add src/utils/mapRenderer.ts
git commit -m "feat(map): add MapRenderer utility for tilemap rendering"
```

---

### Task 3: Create World 1 placeholder tileset PNG

**Files:**
- Create: `public/assets/maps/world1-tileset.png`

This task creates a minimal pixel-art tileset for World 1. The tileset is a spritesheet grid of 32×32 tiles arranged in columns.

**Step 1: Generate the World 1 tileset**

Use Phaser's graphics in a helper script or generate programmatically in PreloadScene temporarily. The tileset should contain at minimum:

- Row 0: grass (plain), grass (variant), dirt path (horizontal), dirt path (vertical), dirt path (corner variants)
- Row 1: pond water (frame 1), pond water (frame 2), bridge, shoreline tiles
- Row 2: oak tree (top), oak tree (trunk), wildflowers, hay bale, fence horizontal, fence vertical
- Row 3: cottage (top-left), cottage (top-right), cottage (bottom-left), cottage (bottom-right)

Layout: 10 columns × 4 rows = 40 tiles, image size 320×128 pixels.

For initial development, generate this as a procedural tileset in PreloadScene (colored rectangles with simple pixel patterns) — replace with hand-drawn pixel art later.

**Step 2: Create the tileset generation in PreloadScene**

Add to `PreloadScene.ts` after existing placeholder generation — a function that draws the World 1 tileset onto a canvas and generates a texture from it. This is a temporary approach until real art is created.

```typescript
// Add after line 78 (g.destroy()) in PreloadScene.ts
this.generateWorld1Tileset()
```

Create the method on PreloadScene:

```typescript
private generateWorld1Tileset(): void {
  const cols = 10
  const rows = 4
  const g = this.add.graphics()

  // Helper to draw a tile at grid position
  const drawAt = (col: number, row: number) => {
    return { x: col * 32, y: row * 32 }
  }

  // Row 0: Ground tiles
  // 0: grass plain
  g.fillStyle(0x4a8c2a); g.fillRect(0, 0, 32, 32)
  // grass detail dots
  g.fillStyle(0x3d7a22); g.fillRect(8, 8, 2, 2); g.fillRect(20, 16, 2, 2); g.fillRect(14, 24, 2, 2)

  // 1: grass variant
  const p1 = drawAt(1, 0)
  g.fillStyle(0x5a9c3a); g.fillRect(p1.x, p1.y, 32, 32)
  g.fillStyle(0x4a8c2a); g.fillRect(p1.x + 4, p1.y + 12, 3, 3); g.fillRect(p1.x + 22, p1.y + 6, 3, 3)

  // 2: dirt path horizontal
  const p2 = drawAt(2, 0)
  g.fillStyle(0x4a8c2a); g.fillRect(p2.x, p2.y, 32, 32)
  g.fillStyle(0x8b6b3a); g.fillRect(p2.x, p2.y + 8, 32, 16)
  g.fillStyle(0x7a5c2e); g.fillRect(p2.x + 6, p2.y + 12, 3, 2); g.fillRect(p2.x + 20, p2.y + 18, 4, 2)

  // 3: dirt path vertical
  const p3 = drawAt(3, 0)
  g.fillStyle(0x4a8c2a); g.fillRect(p3.x, p3.y, 32, 32)
  g.fillStyle(0x8b6b3a); g.fillRect(p3.x + 8, p3.y, 16, 32)

  // 4: dirt corner (top-left to right)
  const p4 = drawAt(4, 0)
  g.fillStyle(0x4a8c2a); g.fillRect(p4.x, p4.y, 32, 32)
  g.fillStyle(0x8b6b3a); g.fillRect(p4.x + 8, p4.y + 8, 24, 16)
  g.fillRect(p4.x + 8, p4.y + 8, 16, 24)

  // 5-9: more grass variants for variety
  for (let i = 5; i < 10; i++) {
    const p = drawAt(i, 0)
    const shade = 0x4a8c2a + (i * 0x040404)
    g.fillStyle(shade); g.fillRect(p.x, p.y, 32, 32)
  }

  // Row 1: Water and bridges
  // 10: water frame 1
  const p10 = drawAt(0, 1)
  g.fillStyle(0x2878b8); g.fillRect(p10.x, p10.y, 32, 32)
  g.fillStyle(0x3088c8); g.fillRect(p10.x + 4, p10.y + 8, 12, 2); g.fillRect(p10.x + 16, p10.y + 20, 10, 2)

  // 11: water frame 2
  const p11 = drawAt(1, 1)
  g.fillStyle(0x2878b8); g.fillRect(p11.x, p11.y, 32, 32)
  g.fillStyle(0x3088c8); g.fillRect(p11.x + 8, p11.y + 12, 12, 2); g.fillRect(p11.x + 2, p11.y + 24, 10, 2)

  // 12-19: shoreline variants and bridge
  const p12 = drawAt(2, 1)
  g.fillStyle(0x6b5c3a); g.fillRect(p12.x, p12.y, 32, 32) // bridge wood
  g.fillStyle(0x5a4c2e); g.fillRect(p12.x + 2, p12.y, 4, 32); g.fillRect(p12.x + 26, p12.y, 4, 32) // railings

  for (let i = 3; i < 10; i++) {
    const p = drawAt(i, 1)
    g.fillStyle(0x4a8c2a); g.fillRect(p.x, p.y, 32, 32)
  }

  // Row 2: Decorations (trees, flowers, etc.)
  // 20: oak tree top (green circle on transparent-ish)
  const p20 = drawAt(0, 2)
  g.fillStyle(0x2d6b1a); g.fillCircle(p20.x + 16, p20.y + 14, 14)
  g.fillStyle(0x3d8b2a); g.fillCircle(p20.x + 12, p20.y + 10, 8)

  // 21: oak tree trunk
  const p21 = drawAt(1, 2)
  g.fillStyle(0x6b4c2a); g.fillRect(p21.x + 12, p21.y, 8, 20)
  g.fillStyle(0x4a8c2a); g.fillRect(p21.x, p21.y + 20, 32, 12) // ground

  // 22: wildflowers
  const p22 = drawAt(2, 2)
  g.fillStyle(0x4a8c2a); g.fillRect(p22.x, p22.y, 32, 32)
  g.fillStyle(0xff6688); g.fillCircle(p22.x + 8, p22.y + 12, 3)
  g.fillStyle(0xffdd44); g.fillCircle(p22.x + 20, p22.y + 8, 3)
  g.fillStyle(0xff88aa); g.fillCircle(p22.x + 14, p22.y + 22, 3)

  // 23: hay bale
  const p23 = drawAt(3, 2)
  g.fillStyle(0x4a8c2a); g.fillRect(p23.x, p23.y, 32, 32)
  g.fillStyle(0xccaa44); g.fillCircle(p23.x + 16, p23.y + 20, 10)
  g.fillStyle(0xbbaa33); g.fillRect(p23.x + 6, p23.y + 20, 20, 10)

  // 24: fence horizontal
  const p24 = drawAt(4, 2)
  g.fillStyle(0x4a8c2a); g.fillRect(p24.x, p24.y, 32, 32)
  g.fillStyle(0x8b6b3a); g.fillRect(p24.x, p24.y + 14, 32, 4)
  g.fillRect(p24.x + 4, p24.y + 8, 4, 16); g.fillRect(p24.x + 24, p24.y + 8, 4, 16)

  // 25-29: reserved
  for (let i = 5; i < 10; i++) {
    const p = drawAt(i, 2)
    g.fillStyle(0x4a8c2a); g.fillRect(p.x, p.y, 32, 32)
  }

  // Row 3: Cottage tiles
  // 30: cottage top-left
  const p30 = drawAt(0, 3)
  g.fillStyle(0x884422); g.fillRect(p30.x, p30.y + 8, 32, 24) // wall
  g.fillStyle(0xcc4444); g.fillRect(p30.x, p30.y, 32, 12) // roof
  // 31: cottage top-right
  const p31 = drawAt(1, 3)
  g.fillStyle(0x884422); g.fillRect(p31.x, p31.y + 8, 32, 24)
  g.fillStyle(0xcc4444); g.fillRect(p31.x, p31.y, 32, 12)
  g.fillStyle(0x666666); g.fillRect(p31.x + 20, p31.y, 8, 10) // chimney

  // 32-39: reserved
  for (let i = 2; i < 10; i++) {
    const p = drawAt(i, 3)
    g.fillStyle(0x4a8c2a); g.fillRect(p.x, p.y, 32, 32)
  }

  g.generateTexture('world1-tileset', cols * 32, rows * 32)
  g.destroy()
}
```

**Step 3: Commit**

```bash
git add src/scenes/PreloadScene.ts
git commit -m "feat(map): generate World 1 tileset procedurally in PreloadScene"
```

---

### Task 4: Create World 1 map data

**Files:**
- Create: `src/data/maps/world1.ts`

**Step 1: Create the World 1 map data file**

Create `src/data/maps/world1.ts` with tile arrays, node positions (more organic than current straight diagonal), path bezier control points, decorations, and atmosphere config.

The ground layer is a 40×23 grid filled mostly with grass (index 0/1), with dirt paths (index 2/3/4) connecting node positions, and ponds (index 10) scattered for interest.

```typescript
// src/data/maps/world1.ts
import { WorldMapData } from './types'

// Helper: fill a 40x23 grid with a value
function fillGrid(value: number): number[][] {
  return Array.from({ length: 23 }, () => Array(40).fill(value))
}

// Helper: place a horizontal dirt path on the grid
function hPath(grid: number[][], row: number, colStart: number, colEnd: number, tileIdx = 2): void {
  for (let c = colStart; c <= colEnd; c++) {
    grid[row][c] = tileIdx
  }
}

// Helper: place a vertical dirt path on the grid
function vPath(grid: number[][], col: number, rowStart: number, rowEnd: number, tileIdx = 3): void {
  for (let r = rowStart; r <= rowEnd; r++) {
    grid[r][col] = tileIdx
  }
}

// Build ground layer
const ground = fillGrid(0) // all grass

// Scatter grass variant tiles (index 1) randomly
const variantPositions = [
  [2, 5], [4, 12], [6, 30], [8, 8], [10, 22], [12, 3], [14, 18], [16, 35],
  [3, 20], [7, 15], [11, 28], [15, 7], [19, 25], [1, 38], [5, 1], [9, 33],
  [17, 10], [20, 17], [13, 37], [18, 5],
]
for (const [r, c] of variantPositions) {
  if (ground[r]) ground[r][c] = 1
}

// Dirt paths connecting nodes (rough winding trail)
// Path from l1 area (col ~4, row ~18) winding up to boss area (col ~35, row ~6)
hPath(ground, 18, 3, 7)
vPath(ground, 7, 16, 18)
hPath(ground, 16, 7, 11)
vPath(ground, 11, 15, 16)
hPath(ground, 15, 11, 15)
vPath(ground, 15, 14, 15)
hPath(ground, 14, 15, 19)
vPath(ground, 19, 13, 14)
hPath(ground, 13, 19, 23)
vPath(ground, 23, 11, 13)
hPath(ground, 11, 23, 26)
vPath(ground, 26, 9, 11)
hPath(ground, 9, 21, 26)
vPath(ground, 21, 8, 9)
hPath(ground, 8, 21, 25)
vPath(ground, 25, 7, 8)
hPath(ground, 7, 25, 29)
vPath(ground, 29, 7, 8)
hPath(ground, 7, 29, 33)
vPath(ground, 33, 6, 7)
hPath(ground, 6, 33, 36)

// Small pond
if (ground[12]) { ground[12][32] = 10; ground[12][33] = 10 }
if (ground[13]) { ground[13][32] = 10; ground[13][33] = 10 }

// Detail layer (mostly empty)
const detail = fillGrid(-1)

export const WORLD1_MAP: WorldMapData = {
  world: 1,
  tilesetKey: 'world1-tileset',
  tilesetColumns: 10,

  ground,
  detail,

  decorations: [
    // Oak trees scattered around the map
    { tileIndex: 20, x: 64, y: 96, sway: true },
    { tileIndex: 21, x: 64, y: 128 },
    { tileIndex: 20, x: 320, y: 160, sway: true },
    { tileIndex: 21, x: 320, y: 192 },
    { tileIndex: 20, x: 800, y: 128, sway: true },
    { tileIndex: 21, x: 800, y: 160 },
    { tileIndex: 20, x: 1100, y: 320, sway: true },
    { tileIndex: 21, x: 1100, y: 352 },
    // Wildflowers
    { tileIndex: 22, x: 192, y: 512, pulse: true },
    { tileIndex: 22, x: 480, y: 384, pulse: true },
    { tileIndex: 22, x: 960, y: 256, pulse: true },
    // Hay bales
    { tileIndex: 23, x: 128, y: 448 },
    { tileIndex: 23, x: 700, y: 544 },
    // Fences
    { tileIndex: 24, x: 352, y: 608 },
    { tileIndex: 24, x: 384, y: 608 },
    // Cottages
    { tileIndex: 30, x: 544, y: 576 },
    { tileIndex: 31, x: 576, y: 576 },
  ],

  // More organic node positions (winding path, bottom-left to top-right)
  nodePositions: [
    { x: 140, y: 590 },   // l1 — starting village
    { x: 260, y: 530 },   // l2
    { x: 370, y: 500 },   // l3
    { x: 500, y: 460 },   // mb1
    { x: 620, y: 430 },   // l4
    { x: 740, y: 380 },   // l5
    { x: 840, y: 340 },   // mb2
    { x: 710, y: 280 },   // l6
    { x: 830, y: 250 },   // l7
    { x: 940, y: 290 },   // mb3
    { x: 1060, y: 240 },  // l8
    { x: 1160, y: 190 },  // boss
  ],

  specialNodes: {
    tavern:    { x: 580, y: 630 },
    stable:    { x: 710, y: 630 },
    inventory: { x: 450, y: 630 },
  },

  // Bezier control points for winding paths between consecutive nodes
  pathSegments: [
    { cx: 180, cy: 580 },   // l1 → l2: slight curve
    { cx: 320, cy: 530 },   // l2 → l3
    { cx: 440, cy: 500 },   // l3 → mb1: curve upward
    { cx: 560, cy: 460 },   // mb1 → l4
    { cx: 690, cy: 420 },   // l4 → l5
    { cx: 800, cy: 370 },   // l5 → mb2
    { cx: 770, cy: 300 },   // mb2 → l6: curve back left
    { cx: 760, cy: 250 },   // l6 → l7
    { cx: 900, cy: 260 },   // l7 → mb3
    { cx: 1010, cy: 270 },  // mb3 → l8
    { cx: 1120, cy: 200 },  // l8 → boss
  ],

  atmosphere: [
    {
      particleFrame: 'particleDot',
      zone: { x: 0, y: 0, width: 1280, height: 720 },
      tint: 0xffff88,
      frequency: 2000,
      lifespan: 4000,
      speed: { min: 5, max: 15 },
      gravityY: -10,
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.8, end: 0 },
    },
    {
      particleFrame: 'particleDot',
      zone: { x: 0, y: 200, width: 1280, height: 400 },
      tint: 0xffffff,
      frequency: 3000,
      lifespan: 5000,
      speed: { min: 3, max: 8 },
      gravityY: -5,
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.5, end: 0 },
    },
  ],

  animatedTiles: [
    { frames: [10, 11], frameDuration: 500 },
  ],
}
```

**Step 2: Commit**

```bash
git add src/data/maps/world1.ts
git commit -m "feat(map): add World 1 (Heartland) map data with tile arrays and decorations"
```

---

### Task 5: Create common spritesheet (procedural placeholder)

**Files:**
- Modify: `src/scenes/PreloadScene.ts`

**Step 1: Add common spritesheet generation to PreloadScene**

Add a method that generates the common map spritesheet with node sprites, star icons, particle textures, and lock overlay. These are better versions of the current placeholders.

```typescript
private generateCommonMapSheet(): void {
  const cols = 8
  const g = this.add.graphics()

  const at = (col: number, row: number) => ({ x: col * 32, y: row * 32 })

  // 0: node-level (stone tower with banner)
  const n0 = at(0, 0)
  g.fillStyle(0x888888); g.fillRect(n0.x + 8, n0.y + 10, 16, 20)
  g.fillStyle(0xaaaaaa); g.fillRect(n0.x + 6, n0.y + 6, 6, 8)
  g.fillRect(n0.x + 14, n0.y + 6, 6, 8)
  g.fillRect(n0.x + 22, n0.y + 6, 4, 8)
  g.fillStyle(0xffffff); g.fillRect(n0.x + 12, n0.y + 12, 3, 8) // banner pole
  g.fillRect(n0.x + 15, n0.y + 12, 6, 5) // banner

  // 1: node-miniboss (fortified gatehouse)
  const n1 = at(1, 0)
  g.fillStyle(0x666666); g.fillRect(n1.x + 4, n1.y + 8, 24, 22)
  g.fillStyle(0x888888); g.fillRect(n1.x + 2, n1.y + 2, 8, 10)
  g.fillRect(n1.x + 22, n1.y + 2, 8, 10)
  g.fillStyle(0x444444); g.fillRect(n1.x + 10, n1.y + 18, 12, 12) // gate
  g.fillStyle(0xcc4444); g.fillRect(n1.x + 6, n1.y + 0, 4, 4) // spike
  g.fillRect(n1.x + 22, n1.y + 0, 4, 4)

  // 2: node-boss (imposing castle with skull)
  const n2 = at(2, 0)
  g.fillStyle(0x555555); g.fillRect(n2.x + 2, n2.y + 6, 28, 24)
  g.fillStyle(0x777777); g.fillRect(n2.x + 0, n2.y + 0, 8, 12)
  g.fillRect(n2.x + 24, n2.y + 0, 8, 12)
  g.fillStyle(0xcc0000); g.fillCircle(n2.x + 16, n2.y + 16, 6) // skull
  g.fillStyle(0x000000); g.fillCircle(n2.x + 14, n2.y + 14, 2)
  g.fillCircle(n2.x + 18, n2.y + 14, 2)

  // 3: node-tavern (timber frame with sign)
  const n3 = at(3, 0)
  g.fillStyle(0x8b6b3a); g.fillRect(n3.x + 4, n3.y + 10, 24, 20)
  g.fillStyle(0xcc8844); g.fillRect(n3.x + 2, n3.y + 4, 28, 10) // roof
  g.fillStyle(0xffcc44); g.fillRect(n3.x + 10, n3.y + 14, 6, 6) // window glow
  g.fillStyle(0x6b4c2a); g.fillRect(n3.x + 26, n3.y + 8, 4, 8) // sign post
  g.fillStyle(0xffdd66); g.fillRect(n3.x + 24, n3.y + 4, 8, 6) // sign

  // 4: node-stable (barn with fence)
  const n4 = at(4, 0)
  g.fillStyle(0x884422); g.fillRect(n4.x + 6, n4.y + 10, 20, 20)
  g.fillStyle(0xaa5533); g.fillRect(n4.x + 4, n4.y + 4, 24, 10) // roof
  g.fillStyle(0x6b4c2a); g.fillRect(n4.x + 0, n4.y + 22, 6, 4)
  g.fillRect(n4.x + 26, n4.y + 22, 6, 4) // fence posts

  // 5: node-inventory (chest)
  const n5 = at(5, 0)
  g.fillStyle(0x8b6b3a); g.fillRect(n5.x + 6, n5.y + 12, 20, 16)
  g.fillStyle(0xaa8844); g.fillRect(n5.x + 6, n5.y + 10, 20, 6) // lid
  g.fillStyle(0xffd700); g.fillRect(n5.x + 14, n5.y + 16, 4, 4) // clasp

  // 6: star filled
  const n6 = at(6, 0)
  g.fillStyle(0xffd700)
  g.fillRect(n6.x + 14, n6.y + 4, 4, 8)
  g.fillRect(n6.x + 6, n6.y + 10, 20, 4)
  g.fillRect(n6.x + 8, n6.y + 14, 6, 6)
  g.fillRect(n6.x + 18, n6.y + 14, 6, 6)

  // 7: star empty
  const n7 = at(7, 0)
  g.fillStyle(0x444444)
  g.fillRect(n7.x + 14, n7.y + 4, 4, 8)
  g.fillRect(n7.x + 6, n7.y + 10, 20, 4)
  g.fillRect(n7.x + 8, n7.y + 14, 6, 6)
  g.fillRect(n7.x + 18, n7.y + 14, 6, 6)

  // Row 1: particles and misc
  // 8: particle dot
  const p8 = at(0, 1)
  g.fillStyle(0xffffff); g.fillCircle(p8.x + 16, p8.y + 16, 3)

  // 9: particle spark
  const p9 = at(1, 1)
  g.fillStyle(0xffff88); g.fillRect(p9.x + 14, p9.y + 8, 4, 16)
  g.fillRect(p9.x + 8, p9.y + 14, 16, 4)

  // 10: particle leaf
  const p10 = at(2, 1)
  g.fillStyle(0x44aa22); g.fillEllipse(p10.x + 16, p10.y + 16, 10, 6)

  // 11: particle dust
  const p11 = at(3, 1)
  g.fillStyle(0xccaa88); g.fillCircle(p11.x + 16, p11.y + 16, 4)

  // 12: lock overlay
  const p12 = at(4, 1)
  g.fillStyle(0x888888); g.fillCircle(p12.x + 16, p12.y + 10, 6)
  g.fillRect(p12.x + 10, p12.y + 14, 12, 10)
  g.fillStyle(0xaaaaaa); g.fillRect(p12.x + 14, p12.y + 18, 4, 4) // keyhole

  g.generateTexture('map-common', cols * 32, 2 * 32)
  g.destroy()
}
```

Call `this.generateCommonMapSheet()` after `this.generateWorld1Tileset()` in PreloadScene.

**Step 2: Commit**

```bash
git add src/scenes/PreloadScene.ts
git commit -m "feat(map): generate common map spritesheet with node/star/particle sprites"
```

---

### Task 6: Refactor OverlandMapScene to use MapRenderer

**Files:**
- Modify: `src/scenes/OverlandMapScene.ts`
- Modify: `src/utils/mapRenderer.ts` (if adjustments needed)

This is the core refactor. The scene should:

1. Look up the `WorldMapData` for the current world (fall back to old behavior if no map data exists yet — worlds 2-5 initially)
2. Use `MapRenderer` to render tile layers, decorations, paths
3. Use node positions from map data instead of `NODE_LAYOUT`
4. Use common spritesheet node sprites instead of old `node-castle`/`node-cave`/`node-boss`
5. Keep all existing game logic (unlock checks, gate checks, tooltips, glide, enter level, mastery chest, settings, world arrows)

**Step 1: Add map data imports and fallback logic**

At the top of `OverlandMapScene.ts`, import the new types and World 1 data. Add a method that returns `WorldMapData | null` — returning null for worlds that don't have map data yet.

**Step 2: Refactor `create()` method**

Replace the background tileSprite and path/node drawing with MapRenderer calls when map data is available. Keep the old logic as a fallback for worlds 2-5.

**Step 3: Update node drawing to use common spritesheet frames**

When map data is available, use `map-common` spritesheet frames for nodes instead of old texture keys. Apply new tint logic (gold=completed, white=unlocked, dark=locked).

**Step 4: Update path drawing to use bezier curves**

Use `MapRenderer.renderPaths()` which returns a `Phaser.Curves.Path` — store this for avatar path-following later.

**Step 5: Keep special nodes, mastery chest, settings, world arrows, tooltips, glide logic unchanged**

These use positions from `mapData.specialNodes` when available, falling back to `SPECIAL_NODE_POSITIONS`.

**Step 6: Run the dev server and verify**

Run: `npm run dev`
Verify: World 1 overland map now shows tiled terrain with winding paths and new node sprites. Worlds 2-5 still show old appearance. All interactions (click nodes, hover tooltips, tavern/stable/inventory, world arrows, mastery chest, settings) still work.

**Step 7: Commit**

```bash
git add src/scenes/OverlandMapScene.ts src/utils/mapRenderer.ts
git commit -m "feat(map): refactor OverlandMapScene to use tilemap renderer for World 1"
```

---

### Task 7: Add node hover/interaction polish

**Files:**
- Modify: `src/scenes/OverlandMapScene.ts`

**Step 1: Add hover bounce and glow**

When hovering a node sprite:
- Tween: `scaleX/scaleY` from 1 to 1.15 over 150ms ease `Back.easeOut`
- Add a faint glow rectangle behind the node (white, alpha 0.2, slightly larger than node)
- On pointerout: reverse the scale tween, destroy the glow

**Step 2: Add completion shimmer**

For completed nodes, add a small particle emitter (using `particleSpark` frame from common sheet) that loops with low frequency, positioned at the node.

**Step 3: Add lock pulse for gated nodes**

Replace static lock emoji with the `lockOverlay` sprite from common sheet, add a slow alpha pulse tween (0.4 to 0.8, 1000ms, yoyo repeat).

**Step 4: Fade tooltips**

Instead of instant show/destroy, tween tooltip alpha from 0 to 1 over 150ms on show, 1 to 0 over 100ms on hide (then destroy).

**Step 5: Replace emoji stars with pixel-art stars**

Under completed nodes, render `starFilled`/`starEmpty` sprites from common sheet instead of emoji text. Show 5 small stars for accuracy, 5 for speed.

**Step 6: Run dev server and verify**

Run: `npm run dev`
Verify: Hover nodes bounce and glow, completed nodes shimmer, locked nodes pulse, tooltips fade, stars are pixel-art.

**Step 7: Commit**

```bash
git add src/scenes/OverlandMapScene.ts
git commit -m "feat(map): add node hover bounce, completion shimmer, and pixel-art stars"
```

---

### Task 8: Avatar bezier path-following

**Files:**
- Modify: `src/scenes/OverlandMapScene.ts`

**Step 1: Store the path from MapRenderer**

Save the `Phaser.Curves.Path` returned by `renderPaths()` as a scene property.

**Step 2: Update `glideAvatarTo` to follow the path**

Instead of tweening x/y directly, use a path follower. Find the path segment between the avatar's current node and the target node. Create a temporary sub-path for that segment and use `this.tweens.add` with the follower pattern:

```typescript
const t = { val: 0 }
this.tweens.add({
  targets: t,
  val: 1,
  duration: Math.max(200, distance * 2.5),
  ease: 'Sine.easeInOut',
  onUpdate: () => {
    const point = subPath.getPoint(t.val)
    this.avatar.setPosition(point.x, point.y)
  },
  onComplete: () => { /* ... */ }
})
```

**Step 3: Add walk bob animation**

During the glide tween, add a concurrent tween on the avatar's y that oscillates ±2px at 200ms intervals for a walking bob effect. Stop it on arrival.

**Step 4: Add dust puff on arrival**

When the avatar arrives at a node, emit 5-8 `particleDust` particles from the common sheet at the avatar's position, short lifespan (300ms), spreading outward with slight gravity.

**Step 5: Add drop shadow**

Create a small dark ellipse (alpha 0.3) positioned 2px below the avatar. Move it with the avatar during glides.

**Step 6: Run dev server and verify**

Run: `npm run dev`
Verify: Avatar follows curved paths, bobs while walking, puffs dust on arrival, has a shadow.

**Step 7: Commit**

```bash
git add src/scenes/OverlandMapScene.ts
git commit -m "feat(map): avatar follows bezier paths with walk bob and dust puff"
```

---

### Task 9: World 1 atmosphere (particles + ambient animations)

**Files:**
- Modify: `src/scenes/OverlandMapScene.ts`
- Modify: `src/data/maps/world1.ts` (tune atmosphere config if needed)

**Step 1: Wire up MapRenderer.startAtmosphere()**

Call `this.mapRenderer.startAtmosphere()` in `create()` after rendering tiles and decorations.

**Step 2: Wire up MapRenderer.renderDecorations()**

Ensure decorations with `sway`, `pulse`, and `flicker` flags are rendering with their ambient tweens.

**Step 3: Add world transition fade**

In `drawWorldArrows()`, instead of `this.scene.start(...)` directly, use:

```typescript
this.cameras.main.fadeOut(300, 0, 0, 0)
this.cameras.main.once('camerafadeoutcomplete', () => {
  this.scene.start('OverlandMap', { profileSlot: this.profileSlot, world: targetWorld })
})
```

The incoming scene should fade in:

```typescript
// At start of create()
this.cameras.main.fadeIn(300, 0, 0, 0)
```

**Step 4: Run dev server and verify**

Run: `npm run dev`
Verify: World 1 has floating particles (pollen/butterflies), trees sway gently, flowers pulse. World transitions fade smoothly.

**Step 5: Commit**

```bash
git add src/scenes/OverlandMapScene.ts src/data/maps/world1.ts
git commit -m "feat(map): add World 1 atmosphere particles and world transition fade"
```

---

### Task 10: World 2 tileset and map data

**Files:**
- Modify: `src/scenes/PreloadScene.ts` (add World 2 tileset generation)
- Create: `src/data/maps/world2.ts`
- Modify: `src/scenes/OverlandMapScene.ts` (add World 2 to map data lookup)

**Step 1: Generate World 2 tileset in PreloadScene**

Create `generateWorld2Tileset()` with Shadowed Fen theme: dark mud tiles, murky water, mossy stone, dead trees, lily pads, cattails, ruined pillars. Palette: dark teals, sickly greens, grays.

**Step 2: Create World 2 map data**

Create `src/data/maps/world2.ts` following the same structure as world1.ts. Use the same node count (12 nodes for 12 levels). Design a different winding path layout.

Atmosphere: firefly particles (green-yellow dots, slow float, scattered), fog/mist (large translucent white particles near ground, slow drift).

**Step 3: Add World 2 to the map data lookup in OverlandMapScene**

**Step 4: Run dev server and verify**

Navigate to World 2 and verify the swamp theme renders correctly with fog and fireflies.

**Step 5: Commit**

```bash
git add src/scenes/PreloadScene.ts src/data/maps/world2.ts src/scenes/OverlandMapScene.ts
git commit -m "feat(map): add World 2 (Shadowed Fen) tileset, map data, and atmosphere"
```

---

### Task 11: World 3 tileset and map data

**Files:**
- Modify: `src/scenes/PreloadScene.ts`
- Create: `src/data/maps/world3.ts`
- Modify: `src/scenes/OverlandMapScene.ts`

Same pattern as Task 10. Ember Peaks theme: volcanic rock, lava flows, ash stone, cracked earth, obsidian spires, smoldering stumps, ember vents. Particles: floating embers (orange-red dots rising), ash fall (gray dots falling). Animated tiles: lava frames cycling.

**Commit:**

```bash
git add src/scenes/PreloadScene.ts src/data/maps/world3.ts src/scenes/OverlandMapScene.ts
git commit -m "feat(map): add World 3 (Ember Peaks) tileset, map data, and atmosphere"
```

---

### Task 12: World 4 tileset and map data

**Files:**
- Modify: `src/scenes/PreloadScene.ts`
- Create: `src/data/maps/world4.ts`
- Modify: `src/scenes/OverlandMapScene.ts`

Shrouded Wilds theme: dense forest floor, tangled roots, overgrown stone, giant mushrooms, twisted trees, glowing moss, spider webs. Particles: falling leaves (green leaf shapes drifting down), spore puffs (small bursts from mushrooms). Palette: deep greens, purples, earthy browns.

**Commit:**

```bash
git add src/scenes/PreloadScene.ts src/data/maps/world4.ts src/scenes/OverlandMapScene.ts
git commit -m "feat(map): add World 4 (Shrouded Wilds) tileset, map data, and atmosphere"
```

---

### Task 13: World 5 tileset and map data

**Files:**
- Modify: `src/scenes/PreloadScene.ts`
- Create: `src/data/maps/world5.ts`
- Modify: `src/scenes/OverlandMapScene.ts`

Typemancer's Tower theme: arcane tile floors, floating stone platforms, void/starfield gaps, crystal pillars, runic circles, floating books, enchanted braziers. Particles: magic sparkles (blue-gold dots orbiting), arcane pulses (brief flashes). Animated tiles: runic glow cycling. Palette: deep purple, electric blue, gold.

**Commit:**

```bash
git add src/scenes/PreloadScene.ts src/data/maps/world5.ts src/scenes/OverlandMapScene.ts
git commit -m "feat(map): add World 5 (Typemancer's Tower) tileset, map data, and atmosphere"
```

---

### Task 14: Remove old placeholder fallback and polish

**Files:**
- Modify: `src/scenes/OverlandMapScene.ts`
- Modify: `src/scenes/PreloadScene.ts`

**Step 1: Remove old fallback rendering**

Now that all 5 worlds have map data, remove the old `NODE_LAYOUT`, `SPECIAL_NODE_POSITIONS`, `WORLD_BG_COLORS` constants and the fallback rendering code paths.

**Step 2: Remove old placeholder texture generation from PreloadScene**

Remove the old `tile-grass`, `node-castle`, `node-cave`, `node-boss` texture generation. Keep `tile-dirt`, `tile-water`, `avatar` if used elsewhere — check first.

**Step 3: Run build and tests**

Run: `npm run build`
Expected: No type errors, clean build.

Run: `npm run test`
Expected: All existing tests pass.

**Step 4: Run dev server for final visual check**

Run: `npm run dev`
Verify all 5 worlds: correct terrain, decorations, particles, node interactions, path following, transitions.

**Step 5: Commit**

```bash
git add src/scenes/OverlandMapScene.ts src/scenes/PreloadScene.ts
git commit -m "refactor(map): remove old placeholder map rendering, all worlds use tilemap"
```

---

### Task 15: Final timing and density tuning

**Files:**
- Modify: `src/data/maps/world1.ts` through `world5.ts`
- Modify: `src/utils/mapRenderer.ts` (if needed)

**Step 1: Play-test each world**

Run through all 5 world maps and note:
- Are particles too dense or sparse?
- Are decoration animations too fast or too distracting?
- Are path curves smooth or awkward?
- Do node positions feel naturally placed?
- Is the world transition fade duration right?

**Step 2: Adjust atmosphere configs**

Tune `frequency`, `lifespan`, `speed`, `scale`, `alpha` values in each world's map data based on play-testing.

**Step 3: Adjust decoration animations**

Tune sway angle, pulse scale, flicker alpha ranges in `mapRenderer.ts` if needed.

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore(map): tune particle densities and animation timings across all worlds"
```
