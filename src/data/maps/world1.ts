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
const COLS = 69
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
    [1, 9],   // was [1, 5]
    [2, 21],  // was [2, 12]
    [3, 43],  // was [3, 25]
    [4, 14],  // was [4, 8]
    [5, 52],  // was [5, 30]
    [6, 5],   // was [6, 3]
    [7, 31],  // was [7, 18]
    [8, 60],  // was [8, 35]
    [9, 17],  // was [9, 10]
    [10, 38], // was [10, 22]
    [11, 12], // was [11, 7]
    [12, 24], // was [12, 14]
    [13, 48], // was [13, 28]
    [14, 3],  // was [14, 2]
    [15, 62], // was [15, 36]
    [16, 35], // was [16, 20]
    [17, 16], // was [17, 9]
    [18, 57], // was [18, 33]
    [19, 26], // was [19, 15]
    [20, 45], // was [20, 26]
    [1, 35],  // was [1, 20]
    [3, 66],  // was [3, 38]
    [5, 28],  // was [5, 16]
    [7, 53],  // was [7, 31]
    [9, 7],   // was [9, 4]
    [11, 47], // was [11, 27]
    [13, 19], // was [13, 11]
    [15, 40], // was [15, 23]
    [17, 64], // was [17, 37]
    [19, 10], // was [19, 6]
    [21, 33], // was [21, 19]
    [2, 52],  // was [2, 30]
    [4, 29],  // was [4, 17]
    [6, 59],  // was [6, 34]
    [8, 2],   // was [8, 1]
    [10, 22], // was [10, 13]
    [12, 67], // was [12, 39]
    [14, 41], // was [14, 24]
    [16, 14], // was [16, 8]
    [18, 36], // was [18, 21]
    [20, 55], // was [20, 32]
    [22, 17], // was [22, 10]
    [22, 60], // was [22, 35]
  ]
  for (const [r, c] of altPositions) {
    if (r < ROWS && c < COLS) {
      g[r][c] = GRASS_ALT
    }
  }

  // ── Dirt paths connecting node areas ──────────────────────
  // Path from starting village (bottom-left) winding to upper-right

  // Segment 1: l1 area → l2 area
  hPath(g, 18, 7, 14, PATH_H)
  // Corner turn upward
  g[18][14] = PATH_CORNER
  vPath(g, 14, 16, 18, PATH_V)

  // Segment 2: l2 → l3
  g[16][14] = PATH_CORNER
  hPath(g, 16, 14, 21, PATH_H)

  // Segment 3: l3 → mb1
  g[16][21] = PATH_CORNER
  vPath(g, 21, 15, 16, PATH_V)
  g[15][21] = PATH_CORNER
  hPath(g, 15, 21, 28, PATH_H)

  // Segment 4: mb1 → l4
  g[15][28] = PATH_CORNER
  vPath(g, 28, 13, 15, PATH_V)
  g[13][28] = PATH_CORNER
  hPath(g, 13, 28, 35, PATH_H)

  // Segment 5: l4 → l5
  g[13][35] = PATH_CORNER
  vPath(g, 35, 11, 13, PATH_V)
  g[11][35] = PATH_CORNER
  hPath(g, 11, 35, 41, PATH_H)

  // Segment 6: l5 → mb2
  g[11][41] = PATH_CORNER
  vPath(g, 41, 10, 11, PATH_V)
  g[10][41] = PATH_CORNER
  hPath(g, 10, 41, 47, PATH_H)

  // Segment 7: mb2 → l6 (double-back left)
  g[10][47] = PATH_CORNER
  vPath(g, 47, 8, 10, PATH_V)
  g[8][47] = PATH_CORNER
  hPath(g, 8, 38, 47, PATH_H)

  // Segment 8: l6 → l7
  g[8][38] = PATH_CORNER
  vPath(g, 38, 7, 8, PATH_V)
  g[7][38] = PATH_CORNER
  hPath(g, 7, 38, 45, PATH_H)

  // Segment 9: l7 → mb3
  g[7][45] = PATH_CORNER
  vPath(g, 45, 7, 9, PATH_V)
  g[9][45] = PATH_CORNER
  hPath(g, 9, 45, 52, PATH_H)

  // Segment 10: mb3 → l8
  g[9][52] = PATH_CORNER
  vPath(g, 52, 7, 9, PATH_V)
  g[7][52] = PATH_CORNER
  hPath(g, 7, 52, 59, PATH_H)

  // Segment 11: l8 → boss
  g[7][59] = PATH_CORNER
  vPath(g, 59, 5, 7, PATH_V)
  g[5][59] = PATH_CORNER
  hPath(g, 5, 59, 64, PATH_H)

  // ── Small pond (bottom-center area) ──────────────────────
  g[20][31] = WATER
  g[20][33] = WATER
  g[20][35] = WATER
  g[21][31] = WATER
  g[21][33] = WATER
  g[21][35] = WATER
  g[21][36] = WATER

  // Path from main trail down to special nodes row (row ~20)
  vPath(g, 26, 18, 20, PATH_V)
  hPath(g, 20, 24, 40, PATH_H)

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
  placeTree(69, 80)
  placeTree(172, 120)
  placeTree(344, 60)
  placeTree(547, 100)
  placeTree(859, 80)
  placeTree(1169, 60)
  placeTree(1547, 100)
  placeTree(1891, 60)
  placeTree(2063, 120)

  // Trees along the bottom
  placeTree(34, 660)
  placeTree(275, 680)
  placeTree(1513, 660)
  placeTree(1719, 680)
  placeTree(2063, 650)

  // Mid-area trees for depth
  placeTree(86, 400)
  placeTree(309, 320)
  placeTree(756, 350)
  placeTree(1031, 200)
  placeTree(1341, 150)
  placeTree(1753, 350)
  placeTree(1977, 300)

  // Wildflowers scattered across meadow
  const flowerSpots = [
    [138, 500],
    [344, 450],
    [602, 380],
    [894, 350],
    [1134, 320],
    [1375, 200],
    [1633, 180],
    [1891, 150],
    [516, 620],
    [1289, 600],
    [1805, 580],
    [223, 250],
    [722, 200],
    [963, 500],
    [1547, 450],
  ]
  for (const [x, y] of flowerSpots) {
    decs.push({ tileIndex: WILDFLOWER, x, y, pulse: true })
  }

  // Hay bales near the starting village
  decs.push({ tileIndex: HAY_BALE, x: 172, y: 620 })
  decs.push({ tileIndex: HAY_BALE, x: 309, y: 600 })
  decs.push({ tileIndex: HAY_BALE, x: 103, y: 570 })

  // Fences around the village area
  decs.push({ tileIndex: FENCE, x: 120, y: 550 })
  decs.push({ tileIndex: FENCE, x: 175, y: 550 })
  decs.push({ tileIndex: FENCE, x: 230, y: 550 })
  decs.push({ tileIndex: FENCE, x: 285, y: 550 })

  // Cottages — starting village
  decs.push({
    tileIndex: COTTAGE_TOP,
    x: 103,
    y: 480,
    depthOffset: -16,
  })
  decs.push({ tileIndex: COTTAGE_BOTTOM, x: 103, y: 512 })

  decs.push({
    tileIndex: COTTAGE_TOP,
    x: 344,
    y: 460,
    depthOffset: -16,
  })
  decs.push({ tileIndex: COTTAGE_BOTTOM, x: 344, y: 492 })

  // Cottage near mid-map
  decs.push({
    tileIndex: COTTAGE_TOP,
    x: 1100,
    y: 500,
    depthOffset: -16,
  })
  decs.push({ tileIndex: COTTAGE_BOTTOM, x: 1100, y: 532 })

  return decs
}

// ── Path segments (bezier control points between consecutive nodes) ──
function buildPathSegments(): PathSegment[] {
  return [
    // l1 → l2: gentle curve upward
    { cx: 327,  cy: 580 },
    // l2 → l3: slight curve
    { cx: 533,  cy: 500 },
    // l3 → mb1: curve right
    { cx: 739,  cy: 470 },
    // mb1 → l4: slight S-curve
    { cx: 963,  cy: 460 },
    // l4 → l5: gentle rise
    { cx: 1169, cy: 390 },
    // l5 → mb2: short hop
    { cx: 1358, cy: 350 },
    // mb2 → l6: double-back left and up
    { cx: 1375, cy: 280 },
    // l6 → l7: rightward curve
    { cx: 1323, cy: 250 },
    // l7 → mb3: curve down-right
    { cx: 1530, cy: 280 },
    // mb3 → l8: curve upward
    { cx: 1719, cy: 250 },
    // l8 → boss: final ascent
    { cx: 1908, cy: 200 },
  ]
}

// ── Atmosphere ──────────────────────────────────────────────
function buildAtmosphere(): AtmosphereEmitter[] {
  return [
    // Pollen / butterfly particles — yellow-ish, floating upward
    {
      particleFrame: 'particleDot',
      zone: { x: 0, y: 200, width: 2200, height: 520 },
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
      zone: { x: 0, y: 0, width: 2200, height: 720 },
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
    { x: 241,  y: 590 }, // l1 — starting village
    { x: 447,  y: 530 }, // l2
    { x: 636,  y: 500 }, // l3
    { x: 859,  y: 460 }, // mb1
    { x: 1066, y: 430 }, // l4
    { x: 1272, y: 380 }, // l5
    { x: 1444, y: 340 }, // mb2
    { x: 1220, y: 280 }, // l6
    { x: 1427, y: 250 }, // l7
    { x: 1616, y: 290 }, // mb3
    { x: 1822, y: 240 }, // l8
    { x: 1994, y: 190 }, // boss
  ],

  pathSegments: buildPathSegments(),
  atmosphere: buildAtmosphere(),
  animatedTiles: buildAnimatedTiles(),
}
