// src/data/maps/world1.ts
// World 1 — "The Heartland" — pleasant meadow / village theme

import type {
  WorldMapData,
  TileGrid,
  DecorationPlacement,
  PathSegment,
  AtmosphereEmitter,
  AnimatedTile,
} from './types'

// ── Tile index constants ────────────────────────────────────
const GRASS = 0
const GRASS_ALT = 1
const PATH_H = 2 // horizontal dirt path
const PATH_V = 3 // vertical dirt path
const PATH_CORNER = 4 // dirt path corner
const WATER = 10
// const WATER_ALT = 11  // used only in animated tile frames

// Decoration indices
const TREE_TOP = 20
const TREE_TRUNK = 21
const WILDFLOWER = 22
const HAY_BALE = 23
const FENCE = 24
const COTTAGE_TOP = 30
const COTTAGE_BOTTOM = 31

// ── Grid helpers ────────────────────────────────────────────
const COLS = 40
const ROWS = 23

function fillGrid(value: number): TileGrid {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(value))
}

/** Draw a horizontal path on the grid from colStart to colEnd (inclusive) at the given row. */
function hPath(
  grid: TileGrid,
  row: number,
  colStart: number,
  colEnd: number,
  tileIdx: number
): void {
  const lo = Math.min(colStart, colEnd)
  const hi = Math.max(colStart, colEnd)
  for (let c = lo; c <= hi; c++) {
    grid[row][c] = tileIdx
  }
}

/** Draw a vertical path on the grid from rowStart to rowEnd (inclusive) at the given col. */
function vPath(
  grid: TileGrid,
  col: number,
  rowStart: number,
  rowEnd: number,
  tileIdx: number
): void {
  const lo = Math.min(rowStart, rowEnd)
  const hi = Math.max(rowStart, rowEnd)
  for (let r = lo; r <= hi; r++) {
    grid[r][col] = tileIdx
  }
}

// ── Build ground layer ──────────────────────────────────────
function buildGround(): TileGrid {
  const g = fillGrid(GRASS)

  // Scatter grass variants for visual variety
  const altPositions = [
    [1, 5],
    [2, 12],
    [3, 25],
    [4, 8],
    [5, 30],
    [6, 3],
    [7, 18],
    [8, 35],
    [9, 10],
    [10, 22],
    [11, 7],
    [12, 14],
    [13, 28],
    [14, 2],
    [15, 36],
    [16, 20],
    [17, 9],
    [18, 33],
    [19, 15],
    [20, 26],
    [1, 20],
    [3, 38],
    [5, 16],
    [7, 31],
    [9, 4],
    [11, 27],
    [13, 11],
    [15, 23],
    [17, 37],
    [19, 6],
    [21, 19],
    [2, 30],
    [4, 17],
    [6, 34],
    [8, 1],
    [10, 13],
    [12, 39],
    [14, 24],
    [16, 8],
    [18, 21],
    [20, 32],
    [22, 10],
    [22, 35],
  ]
  for (const [r, c] of altPositions) {
    if (r < ROWS && c < COLS) {
      g[r][c] = GRASS_ALT
    }
  }

  // ── Dirt paths connecting node areas ──────────────────────
  // Path from starting village (bottom-left) winding to upper-right

  // Segment 1: l1 area → l2 area (row ~18, cols 4–8)
  hPath(g, 18, 4, 8, PATH_H)
  // Corner turn upward
  g[18][8] = PATH_CORNER
  vPath(g, 8, 16, 18, PATH_V)

  // Segment 2: l2 → l3 (row ~16, cols 8–11)
  g[16][8] = PATH_CORNER
  hPath(g, 16, 8, 12, PATH_H)

  // Segment 3: l3 → mb1 (row ~15, cols 12–15)
  g[16][12] = PATH_CORNER
  vPath(g, 12, 15, 16, PATH_V)
  g[15][12] = PATH_CORNER
  hPath(g, 15, 12, 16, PATH_H)

  // Segment 4: mb1 → l4 (row ~14, cols 16–19)
  g[15][16] = PATH_CORNER
  vPath(g, 16, 13, 15, PATH_V)
  g[13][16] = PATH_CORNER
  hPath(g, 13, 16, 20, PATH_H)

  // Segment 5: l4 → l5 (row ~12, cols 20–23)
  g[13][20] = PATH_CORNER
  vPath(g, 20, 11, 13, PATH_V)
  g[11][20] = PATH_CORNER
  hPath(g, 11, 20, 24, PATH_H)

  // Segment 6: l5 → mb2 (row ~10, cols 24–26)
  g[11][24] = PATH_CORNER
  vPath(g, 24, 10, 11, PATH_V)
  g[10][24] = PATH_CORNER
  hPath(g, 10, 24, 27, PATH_H)

  // Segment 7: mb2 → l6 (double-back left, row ~8, cols 22–27)
  g[10][27] = PATH_CORNER
  vPath(g, 27, 8, 10, PATH_V)
  g[8][27] = PATH_CORNER
  hPath(g, 8, 22, 27, PATH_H)

  // Segment 8: l6 → l7 (row ~7, cols 22–26)
  g[8][22] = PATH_CORNER
  vPath(g, 22, 7, 8, PATH_V)
  g[7][22] = PATH_CORNER
  hPath(g, 7, 22, 26, PATH_H)

  // Segment 9: l7 → mb3 (row ~9, cols 26–30)
  g[7][26] = PATH_CORNER
  vPath(g, 26, 7, 9, PATH_V)
  g[9][26] = PATH_CORNER
  hPath(g, 9, 26, 30, PATH_H)

  // Segment 10: mb3 → l8 (row ~7, cols 30–34)
  g[9][30] = PATH_CORNER
  vPath(g, 30, 7, 9, PATH_V)
  g[7][30] = PATH_CORNER
  hPath(g, 7, 30, 34, PATH_H)

  // Segment 11: l8 → boss (row ~5, cols 34–37)
  g[7][34] = PATH_CORNER
  vPath(g, 34, 5, 7, PATH_V)
  g[5][34] = PATH_CORNER
  hPath(g, 5, 34, 37, PATH_H)

  // ── Small pond (bottom-center area) ──────────────────────
  g[20][18] = WATER
  g[20][19] = WATER
  g[20][20] = WATER
  g[21][18] = WATER
  g[21][19] = WATER
  g[21][20] = WATER
  g[21][21] = WATER

  // Path from main trail down to special nodes row (row ~20)
  vPath(g, 15, 18, 20, PATH_V)
  hPath(g, 20, 14, 23, PATH_H)

  return g
}

// ── Build detail layer ──────────────────────────────────────
function buildDetail(): TileGrid {
  return fillGrid(-1)
}

// ── Decorations ─────────────────────────────────────────────
function buildDecorations(): DecorationPlacement[] {
  const decs: DecorationPlacement[] = []

  // Helper to place a tree (top + trunk)
  function placeTree(x: number, y: number): void {
    decs.push({ tileIndex: TREE_TOP, x, y: y - 32, sway: true })
    decs.push({ tileIndex: TREE_TRUNK, x, y })
  }

  // Scattered oak trees along the map edges and between paths
  placeTree(40, 80)
  placeTree(100, 120)
  placeTree(200, 60)
  placeTree(320, 100)
  placeTree(500, 80)
  placeTree(680, 60)
  placeTree(900, 100)
  placeTree(1100, 60)
  placeTree(1200, 120)

  // Trees along the bottom
  placeTree(20, 660)
  placeTree(160, 680)
  placeTree(880, 660)
  placeTree(1000, 680)
  placeTree(1200, 650)

  // Mid-area trees for depth
  placeTree(50, 400)
  placeTree(180, 320)
  placeTree(440, 350)
  placeTree(600, 200)
  placeTree(780, 150)
  placeTree(1020, 350)
  placeTree(1150, 300)

  // Wildflowers scattered across meadow
  const flowerSpots = [
    [80, 500],
    [200, 450],
    [350, 380],
    [520, 350],
    [660, 320],
    [800, 200],
    [950, 180],
    [1100, 150],
    [300, 620],
    [750, 600],
    [1050, 580],
    [130, 250],
    [420, 200],
    [560, 500],
    [900, 450],
  ]
  for (const [x, y] of flowerSpots) {
    decs.push({ tileIndex: WILDFLOWER, x, y, pulse: true })
  }

  // Hay bales near the starting village
  decs.push({ tileIndex: HAY_BALE, x: 100, y: 620 })
  decs.push({ tileIndex: HAY_BALE, x: 180, y: 600 })
  decs.push({ tileIndex: HAY_BALE, x: 60, y: 570 })

  // Fences around the village area
  decs.push({ tileIndex: FENCE, x: 70, y: 550 })
  decs.push({ tileIndex: FENCE, x: 102, y: 550 })
  decs.push({ tileIndex: FENCE, x: 134, y: 550 })
  decs.push({ tileIndex: FENCE, x: 166, y: 550 })

  // Cottages — starting village
  decs.push({
    tileIndex: COTTAGE_TOP,
    x: 60,
    y: 480,
    depthOffset: -16,
  })
  decs.push({ tileIndex: COTTAGE_BOTTOM, x: 60, y: 512 })

  decs.push({
    tileIndex: COTTAGE_TOP,
    x: 200,
    y: 460,
    depthOffset: -16,
  })
  decs.push({ tileIndex: COTTAGE_BOTTOM, x: 200, y: 492 })

  // Cottage near mid-map
  decs.push({
    tileIndex: COTTAGE_TOP,
    x: 640,
    y: 500,
    depthOffset: -16,
  })
  decs.push({ tileIndex: COTTAGE_BOTTOM, x: 640, y: 532 })

  return decs
}

// ── Path segments (bezier control points between consecutive nodes) ──
function buildPathSegments(): PathSegment[] {
  return [
    // l1 → l2: gentle curve upward
    { cx: 190, cy: 580 },
    // l2 → l3: slight curve
    { cx: 310, cy: 500 },
    // l3 → mb1: curve right
    { cx: 430, cy: 470 },
    // mb1 → l4: slight S-curve
    { cx: 560, cy: 460 },
    // l4 → l5: gentle rise
    { cx: 680, cy: 390 },
    // l5 → mb2: short hop
    { cx: 790, cy: 350 },
    // mb2 → l6: double-back left and up
    { cx: 800, cy: 280 },
    // l6 → l7: rightward curve
    { cx: 770, cy: 250 },
    // l7 → mb3: curve down-right
    { cx: 890, cy: 280 },
    // mb3 → l8: curve upward
    { cx: 1000, cy: 250 },
    // l8 → boss: final ascent
    { cx: 1110, cy: 200 },
  ]
}

// ── Atmosphere ──────────────────────────────────────────────
function buildAtmosphere(): AtmosphereEmitter[] {
  return [
    // Pollen / butterfly particles — yellow-ish, floating upward
    {
      particleFrame: 'particleDot',
      zone: { x: 0, y: 200, width: 1280, height: 520 },
      tint: 0xfff4a0,
      frequency: 800,
      lifespan: 6000,
      speed: { min: 5, max: 15 },
      gravityY: -8,
      scale: { start: 0.6, end: 0.1 },
      alpha: { start: 0.7, end: 0 },
    },
    // White ambient dots — subtle floating particles
    {
      particleFrame: 'particleDot',
      zone: { x: 0, y: 0, width: 1280, height: 720 },
      tint: 0xffffff,
      frequency: 1200,
      lifespan: 4000,
      speed: { min: 2, max: 8 },
      gravityY: -3,
      scale: { start: 0.3, end: 0.05 },
      alpha: { start: 0.4, end: 0 },
    },
  ]
}

// ── Animated tiles ──────────────────────────────────────────
function buildAnimatedTiles(): AnimatedTile[] {
  return [
    {
      frames: [10, 11], // water shimmer
      frameDuration: 500,
    },
  ]
}

// ── Export ───────────────────────────────────────────────────
export const WORLD1_MAP: WorldMapData = {
  world: 1,
  tilesetKey: 'world1-tileset',
  tilesetColumns: 10,

  ground: buildGround(),
  detail: buildDetail(),
  decorations: buildDecorations(),

  nodePositions: [
    { x: 140, y: 590 }, // l1 — starting village
    { x: 260, y: 530 }, // l2
    { x: 370, y: 500 }, // l3
    { x: 500, y: 460 }, // mb1
    { x: 620, y: 430 }, // l4
    { x: 740, y: 380 }, // l5
    { x: 840, y: 340 }, // mb2
    { x: 710, y: 280 }, // l6
    { x: 830, y: 250 }, // l7
    { x: 940, y: 290 }, // mb3
    { x: 1060, y: 240 }, // l8
    { x: 1160, y: 190 }, // boss
  ],

  specialNodes: {
    tavern: { x: 580, y: 630 },
    stable: { x: 710, y: 630 },
    shop: { x: 840, y: 630 },
  },

  pathSegments: buildPathSegments(),
  atmosphere: buildAtmosphere(),
  animatedTiles: buildAnimatedTiles(),
}
