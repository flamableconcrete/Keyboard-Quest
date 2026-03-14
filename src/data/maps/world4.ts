// src/data/maps/world4.ts
// World 4 — "The Shrouded Wilds" — dense enchanted forest theme

import type {
  WorldMapData,
  TileGrid,
  DecorationPlacement,
  PathSegment,
  AtmosphereEmitter,
  AnimatedTile,
} from './types'

// ── Tile index constants ────────────────────────────────────
const FOREST_FLOOR = 0
const FOREST_FLOOR_ALT = 1
const PATH_H = 2
const PATH_V = 3
const PATH_CORNER = 4
const TANGLED_ROOTS = 5
const OVERGROWN_STONE = 6
const DEEP_MOSS = 10
// const DEEP_MOSS_ALT = 11  // used only in animated tile frames

// Decoration indices
const MUSHROOM_RED = 20
const MUSHROOM_CLUSTER = 21
const ANCIENT_TREE_TOP = 22
const ANCIENT_TREE_TRUNK = 23
const GLOWING_MOSS = 24
const SPIDER_WEB = 25
const TWISTED_ROOT = 30
const FERN = 31

// ── Grid helpers ────────────────────────────────────────────
const COLS = 79
const ROWS = 23

function fillGrid(value: number): TileGrid {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(value))
}

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
  const g = fillGrid(FOREST_FLOOR)

  // Scatter variants
  const altPositions = [
    [1, 8], [2, 32], [3, 55], [4, 16], [5, 40], [6, 63],
    [7, 24], [8, 47], [9, 71], [10, 12], [11, 36], [12, 59],
    [13, 20], [14, 43], [15, 67], [16, 4], [17, 28], [18, 51],
    [19, 75], [20, 16], [21, 40], [22, 63], [1, 59], [3, 24],
    [5, 71], [7, 16], [9, 47], [11, 32], [13, 75], [15, 8],
  ]
  for (const [r, c] of altPositions) {
    if (r < ROWS && c < COLS) {
      g[r][c] = FOREST_FLOOR_ALT
    }
  }

  // Tangled root patches
  const rootPatches = [
    [4, 6], [4, 8], [5, 6], [5, 8],
    [10, 55], [10, 57], [11, 55], [11, 57],
    [16, 28], [16, 30], [17, 28], [17, 30],
    [8, 71], [8, 73], [9, 71],
  ]
  for (const [r, c] of rootPatches) {
    if (r < ROWS && c < COLS) g[r][c] = TANGLED_ROOTS
  }

  // Overgrown stone patches
  const stonePatches = [
    [6, 40], [6, 41], [7, 40],
    [14, 16], [14, 18],
    [18, 63], [18, 65],
  ]
  for (const [r, c] of stonePatches) {
    if (r < ROWS && c < COLS) g[r][c] = OVERGROWN_STONE
  }

  // ── Path weaves horizontally through middle ────────────
  // Segment 1: l1 (far left) → l2 (right)
  hPath(g, 14, 4, 16, PATH_H)

  // Segment 2: l2 → l3 (up then right)
  g[14][16] = PATH_CORNER
  vPath(g, 16, 11, 14, PATH_V)
  g[11][16] = PATH_CORNER
  hPath(g, 11, 16, 28, PATH_H)

  // Segment 3: l3 → mb1 (right then down)
  g[11][28] = PATH_CORNER
  vPath(g, 28, 11, 14, PATH_V)
  g[14][28] = PATH_CORNER
  hPath(g, 14, 28, 36, PATH_H)

  // Segment 4: mb1 → l4 (up)
  g[14][36] = PATH_CORNER
  vPath(g, 36, 10, 14, PATH_V)
  g[10][36] = PATH_CORNER
  hPath(g, 10, 36, 43, PATH_H)

  // Segment 5: l4 → l5 (down-right)
  g[10][43] = PATH_CORNER
  vPath(g, 43, 10, 13, PATH_V)
  g[13][43] = PATH_CORNER
  hPath(g, 13, 43, 51, PATH_H)

  // Segment 6: l5 → mb2 (up-right)
  g[13][51] = PATH_CORNER
  vPath(g, 51, 10, 13, PATH_V)
  g[10][51] = PATH_CORNER
  hPath(g, 10, 51, 59, PATH_H)

  // Segment 7: mb2 → l6 (down-right)
  g[10][59] = PATH_CORNER
  vPath(g, 59, 10, 14, PATH_V)
  g[14][59] = PATH_CORNER
  hPath(g, 14, 59, 67, PATH_H)

  // Segment 8: l6 → l7 (up-right)
  g[14][67] = PATH_CORNER
  vPath(g, 67, 11, 14, PATH_V)
  g[11][67] = PATH_CORNER
  hPath(g, 11, 67, 73, PATH_H)

  // Segment 9: l7 → mb3 (down)
  g[11][73] = PATH_CORNER
  vPath(g, 73, 11, 15, PATH_V)

  // Segment 10: mb3 → l8 (left and up)
  g[15][73] = PATH_CORNER
  hPath(g, 15, 67, 73, PATH_H)
  g[15][67] = PATH_CORNER
  vPath(g, 67, 8, 15, PATH_V) // long climb

  // Segment 11: l8 → boss (right)
  g[8][67] = PATH_CORNER
  hPath(g, 8, 67, 75, PATH_H)
  g[8][75] = PATH_CORNER
  vPath(g, 75, 5, 8, PATH_V)

  // Deep moss pools
  for (let r = 18; r <= 20; r++) {
    for (let c = 16; c <= 24; c++) {
      if (g[r][c] === FOREST_FLOOR || g[r][c] === FOREST_FLOOR_ALT) {
        g[r][c] = DEEP_MOSS
      }
    }
  }
  g[6][59] = DEEP_MOSS
  g[6][61] = DEEP_MOSS
  g[7][59] = DEEP_MOSS
  g[7][61] = DEEP_MOSS

  // Path to special nodes
  vPath(g, 40, 14, 20, PATH_V)
  hPath(g, 20, 32, 47, PATH_H)

  return g
}

function buildDetail(): TileGrid {
  return fillGrid(-1)
}

// ── Decorations ─────────────────────────────────────────────
function buildDecorations(): DecorationPlacement[] {
  const decs: DecorationPlacement[] = []

  function placeAncientTree(x: number, y: number): void {
    decs.push({ tileIndex: ANCIENT_TREE_TOP, x, y: y - 32, sway: true })
    decs.push({ tileIndex: ANCIENT_TREE_TRUNK, x, y })
  }

  // Ancient twisted trees
  placeAncientTree(78, 120)
  placeAncientTree(391, 80)
  placeAncientTree(781, 100)
  placeAncientTree(1172, 60)
  placeAncientTree(1563, 100)
  placeAncientTree(1953, 80)
  placeAncientTree(2344, 120)

  // Bottom trees
  placeAncientTree(117, 680)
  placeAncientTree(469, 660)
  placeAncientTree(977, 680)
  placeAncientTree(1758, 660)
  placeAncientTree(2246, 680)

  // Mid trees
  placeAncientTree(293, 350)
  placeAncientTree(879, 280)
  placeAncientTree(1367, 350)
  placeAncientTree(1855, 300)

  // Giant red mushrooms
  const mushroomSpots = [
    [234, 450], [547, 380], [938, 500], [1250, 420],
    [1602, 480], [1992, 400], [703, 600], [1367, 580],
    [2148, 520],
  ]
  for (const [x, y] of mushroomSpots) {
    decs.push({ tileIndex: MUSHROOM_RED, x, y, pulse: true })
  }

  // Mushroom clusters
  decs.push({ tileIndex: MUSHROOM_CLUSTER, x: 352, y: 520 })
  decs.push({ tileIndex: MUSHROOM_CLUSTER, x: 1094, y: 450 })
  decs.push({ tileIndex: MUSHROOM_CLUSTER, x: 1719, y: 550 })
  decs.push({ tileIndex: MUSHROOM_CLUSTER, x: 2070, y: 480 })

  // Glowing moss patches
  const mossSpots = [
    [195, 400], [586, 320], [977, 360], [1367, 280],
    [1758, 340], [2148, 380], [488, 550], [1270, 520],
  ]
  for (const [x, y] of mossSpots) {
    decs.push({ tileIndex: GLOWING_MOSS, x, y, flicker: true })
  }

  // Spider webs
  decs.push({ tileIndex: SPIDER_WEB, x: 391, y: 200 })
  decs.push({ tileIndex: SPIDER_WEB, x: 977, y: 160 })
  decs.push({ tileIndex: SPIDER_WEB, x: 1563, y: 200 })
  decs.push({ tileIndex: SPIDER_WEB, x: 2148, y: 180 })

  // Twisted roots
  decs.push({ tileIndex: TWISTED_ROOT, x: 156, y: 550 })
  decs.push({ tileIndex: TWISTED_ROOT, x: 781, y: 580 })
  decs.push({ tileIndex: TWISTED_ROOT, x: 1465, y: 600 })
  decs.push({ tileIndex: TWISTED_ROOT, x: 2051, y: 560 })

  // Ferns
  const fernSpots = [
    [117, 300], [391, 250], [742, 200], [1094, 300],
    [1445, 250], [1797, 200], [2148, 280], [313, 620],
    [859, 640], [1563, 620], [2305, 600],
  ]
  for (const [x, y] of fernSpots) {
    decs.push({ tileIndex: FERN, x, y, sway: true })
  }

  return decs
}

// ── Path segments ───────────────────────────────────────────
function buildPathSegments(): PathSegment[] {
  return [
    // l1 → l2: slight curve up
    { cx: 313, cy: 420 },
    // l2 → l3: rightward wave
    { cx: 664, cy: 350 },
    // l3 → mb1: dip down
    { cx: 918, cy: 440 },
    // mb1 → l4: up-right
    { cx: 1172, cy: 340 },
    // l4 → l5: down-right
    { cx: 1406, cy: 420 },
    // l5 → mb2: up-right
    { cx: 1641, cy: 340 },
    // mb2 → l6: down-right
    { cx: 1875, cy: 420 },
    // l6 → l7: up-right
    { cx: 2148, cy: 340 },
    // l7 → mb3: dip down-right
    { cx: 2305, cy: 440 },
    // mb3 → l8: left and up
    { cx: 2148, cy: 300 },
    // l8 → l9: curve up
    { cx: 2148, cy: 240 },
    // l9 → mb4: right curve
    { cx: 2227, cy: 180 },
    // mb4 → boss: final right
    { cx: 2383, cy: 140 },
  ]
}

// ── Atmosphere ──────────────────────────────────────────────
function buildAtmosphere(): AtmosphereEmitter[] {
  return [
    // Falling leaves — green leaf shapes drifting down
    {
      particleFrame: 'particleLeaf',
      zone: { x: 0, y: -20, width: 2500, height: 100 },
      tint: 0x44aa22,
      frequency: 800,
      lifespan: 7000,
      speed: { min: 5, max: 15 },
      gravityY: 12,
      scale: { start: 0.6, end: 0.3 },
      alpha: { start: 0.8, end: 0 },
    },
    // Spore puffs — yellow-green dots bursting up
    {
      particleFrame: 'particleDot',
      zone: { x: 0, y: 500, width: 2500, height: 220 },
      tint: 0xaacc44,
      frequency: 1000,
      lifespan: 3000,
      speed: { min: 10, max: 25 },
      gravityY: -20,
      scale: { start: 0.4, end: 0.1 },
      alpha: { start: 0.6, end: 0 },
    },
  ]
}

// ── Animated tiles ──────────────────────────────────────────
function buildAnimatedTiles(): AnimatedTile[] {
  return [
    {
      frames: [10, 11], // deep moss shimmer
      frameDuration: 700,
    },
  ]
}

// ── Export ───────────────────────────────────────────────────
export const WORLD4_MAP: WorldMapData = {
  world: 4,
  tilesetKey: 'world4-tileset',
  tilesetColumns: 10,

  ground: buildGround(),
  detail: buildDetail(),
  decorations: buildDecorations(),

  // Path weaves horizontally through the middle
  nodePositions: [
    { x: 156, y: 450 },   // l1 — far left entrance
    { x: 469, y: 380 },   // l2
    { x: 820, y: 360 },   // l3
    { x: 1094, y: 440 },  // mb1
    { x: 1328, y: 340 },  // l4
    { x: 1563, y: 420 },  // l5
    { x: 1797, y: 340 },  // mb2
    { x: 2051, y: 430 },  // l6
    { x: 2266, y: 360 },  // l7
    { x: 2305, y: 470 },  // mb3
    { x: 2109, y: 280 },  // l8
    { x: 2070, y: 210 },  // l9
    { x: 2188, y: 150 },  // mb4
    { x: 2461, y: 120 },  // boss
  ],

  pathSegments: buildPathSegments(),
  atmosphere: buildAtmosphere(),
  animatedTiles: buildAnimatedTiles(),
}
