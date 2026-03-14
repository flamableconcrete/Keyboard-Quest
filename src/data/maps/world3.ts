// src/data/maps/world3.ts
// World 3 — "The Ember Peaks" — volcanic / lava theme

import type {
  WorldMapData,
  TileGrid,
  DecorationPlacement,
  PathSegment,
  AtmosphereEmitter,
  AnimatedTile,
} from './types'

// ── Tile index constants ────────────────────────────────────
const VOLCANIC_ROCK = 0
const VOLCANIC_ROCK_ALT = 1
const PATH_H = 2
const PATH_V = 3
const PATH_CORNER = 4
const ASH_STONE = 5
const CRACKED_EARTH = 6
const LAVA_1 = 10
// const LAVA_2 = 11  // used only in animated tile frames

// Decoration indices
const OBSIDIAN_SPIRE = 20
const OBSIDIAN_SPIRE_TALL = 21
const SMOLDERING_STUMP = 22
const EMBER_VENT = 23
const BOULDER = 24
const LAVA_CRACK = 30
const SCORCHED_GROUND = 31

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
  const g = fillGrid(VOLCANIC_ROCK)

  // Scatter variants
  const altPositions = [
    [1, 12], [2, 36], [3, 59], [4, 20], [5, 47], [6, 71],
    [7, 8], [8, 32], [9, 55], [10, 16], [11, 40], [12, 63],
    [13, 4], [14, 28], [15, 51], [16, 75], [17, 24], [18, 43],
    [19, 67], [20, 12], [21, 36], [22, 59], [1, 43], [3, 67],
    [5, 16], [7, 40], [9, 63], [11, 28], [13, 51], [15, 75],
  ]
  for (const [r, c] of altPositions) {
    if (r < ROWS && c < COLS) {
      g[r][c] = VOLCANIC_ROCK_ALT
    }
  }

  // Ash stone patches
  const ashPatches = [
    [2, 40], [2, 41], [3, 40], [3, 41],
    [8, 12], [8, 14], [9, 12], [9, 14],
    [15, 59], [15, 61], [16, 59], [16, 61],
  ]
  for (const [r, c] of ashPatches) {
    if (r < ROWS && c < COLS) g[r][c] = ASH_STONE
  }

  // Cracked earth areas
  const crackPatches = [
    [6, 28], [6, 30], [7, 28],
    [12, 47], [12, 49], [13, 47],
    [18, 16], [18, 18],
  ]
  for (const [r, c] of crackPatches) {
    if (r < ROWS && c < COLS) g[r][c] = CRACKED_EARTH
  }

  // ── Path spirals upward from bottom-center ─────────────
  // Segment 1: l1 (bottom-center) → l2 (right)
  hPath(g, 19, 36, 47, PATH_H)

  // Segment 2: l2 → l3 (up-right)
  g[19][47] = PATH_CORNER
  vPath(g, 47, 17, 19, PATH_V)
  g[17][47] = PATH_CORNER
  hPath(g, 17, 47, 59, PATH_H)

  // Segment 3: l3 → mb1 (up)
  g[17][59] = PATH_CORNER
  vPath(g, 59, 14, 17, PATH_V)

  // Segment 4: mb1 → l4 (left)
  g[14][59] = PATH_CORNER
  hPath(g, 14, 47, 59, PATH_H)
  g[14][47] = PATH_CORNER
  vPath(g, 47, 12, 14, PATH_V)

  // Segment 5: l4 → l5 (left and up)
  g[12][47] = PATH_CORNER
  hPath(g, 12, 36, 47, PATH_H)
  g[12][36] = PATH_CORNER
  vPath(g, 36, 10, 12, PATH_V)

  // Segment 6: l5 → mb2 (left)
  g[10][36] = PATH_CORNER
  hPath(g, 10, 24, 36, PATH_H)

  // Segment 7: mb2 → l6 (up)
  g[10][24] = PATH_CORNER
  vPath(g, 24, 8, 10, PATH_V)
  g[8][24] = PATH_CORNER
  hPath(g, 8, 16, 24, PATH_H)

  // Segment 8: l6 → l7 (right and up)
  g[8][16] = PATH_CORNER
  vPath(g, 16, 6, 8, PATH_V)
  g[6][16] = PATH_CORNER
  hPath(g, 6, 16, 28, PATH_H)

  // Segment 9: l7 → mb3 (up-right)
  g[6][28] = PATH_CORNER
  vPath(g, 28, 4, 6, PATH_V)
  g[4][28] = PATH_CORNER
  hPath(g, 4, 28, 40, PATH_H)

  // Segment 10: mb3 → l8 (up)
  g[4][40] = PATH_CORNER
  vPath(g, 40, 3, 4, PATH_V)

  // Segment 11: l8 → boss (up-center)
  g[3][40] = PATH_CORNER
  hPath(g, 3, 36, 40, PATH_H)
  g[3][36] = PATH_CORNER
  vPath(g, 36, 1, 3, PATH_V)

  // ── Lava flows ─────────────────────────────────────────────
  // Central lava river
  for (let r = 10; r <= 16; r++) {
    for (let c = 28; c <= 32; c++) {
      if (g[r][c] === VOLCANIC_ROCK || g[r][c] === VOLCANIC_ROCK_ALT) {
        g[r][c] = LAVA_1
      }
    }
  }
  // Lava pool near top
  g[5][40] = LAVA_1
  g[5][41] = LAVA_1
  g[5][43] = LAVA_1
  g[6][41] = LAVA_1
  g[6][43] = LAVA_1

  // Small lava pool bottom-left
  g[18][8] = LAVA_1
  g[18][10] = LAVA_1
  g[19][8] = LAVA_1
  g[19][10] = LAVA_1

  // Path down to special nodes
  vPath(g, 40, 19, 21, PATH_V)
  hPath(g, 21, 32, 47, PATH_H)

  return g
}

function buildDetail(): TileGrid {
  return fillGrid(-1)
}

// ── Decorations ─────────────────────────────────────────────
function buildDecorations(): DecorationPlacement[] {
  const decs: DecorationPlacement[] = []

  // Obsidian spires — tall black pointed shapes
  const spireSpots = [
    [117, 100], [430, 60], [781, 130], [1367, 80],
    [1953, 100], [2344, 60], [293, 300], [977, 250],
    [1660, 180], [2148, 300],
  ]
  for (const [x, y] of spireSpots) {
    decs.push({ tileIndex: OBSIDIAN_SPIRE, x, y })
  }

  // Tall spires
  decs.push({ tileIndex: OBSIDIAN_SPIRE_TALL, x: 586, y: 80 })
  decs.push({ tileIndex: OBSIDIAN_SPIRE_TALL, x: 1758, y: 60 })
  decs.push({ tileIndex: OBSIDIAN_SPIRE_TALL, x: 2246, y: 120 })

  // Smoldering stumps
  const stumpSpots = [
    [195, 500], [586, 420], [977, 380], [1367, 300],
    [1758, 450], [2051, 350], [391, 620], [1172, 600],
    [1660, 580], [2148, 550],
  ]
  for (const [x, y] of stumpSpots) {
    decs.push({ tileIndex: SMOLDERING_STUMP, x, y, flicker: true })
  }

  // Ember vents
  const ventSpots = [
    [352, 400], [879, 350], [1328, 270], [1855, 380],
    [684, 550], [1465, 520],
  ]
  for (const [x, y] of ventSpots) {
    decs.push({ tileIndex: EMBER_VENT, x, y, flicker: true })
  }

  // Boulders
  decs.push({ tileIndex: BOULDER, x: 98, y: 650 })
  decs.push({ tileIndex: BOULDER, x: 781, y: 660 })
  decs.push({ tileIndex: BOULDER, x: 1953, y: 640 })
  decs.push({ tileIndex: BOULDER, x: 2344, y: 660 })

  // Lava cracks
  decs.push({ tileIndex: LAVA_CRACK, x: 879, y: 450, flicker: true })
  decs.push({ tileIndex: LAVA_CRACK, x: 1270, y: 400, flicker: true })
  decs.push({ tileIndex: LAVA_CRACK, x: 1563, y: 480, flicker: true })

  // Scorched ground patches
  decs.push({ tileIndex: SCORCHED_GROUND, x: 488, y: 500 })
  decs.push({ tileIndex: SCORCHED_GROUND, x: 1074, y: 480 })
  decs.push({ tileIndex: SCORCHED_GROUND, x: 1758, y: 520 })

  return decs
}

// ── Path segments ───────────────────────────────────────────
function buildPathSegments(): PathSegment[] {
  return [
    // l1 → l2: curve right
    { cx: 1250, cy: 620 },
    // l2 → l3: up-right curve
    { cx: 1660, cy: 560 },
    // l3 → mb1: upward
    { cx: 1914, cy: 480 },
    // mb1 → l4: arc left
    { cx: 1660, cy: 420 },
    // l4 → l5: left and up
    { cx: 1328, cy: 370 },
    // l5 → mb2: leftward
    { cx: 977, cy: 340 },
    // mb2 → l6: up-left
    { cx: 684, cy: 280 },
    // l6 → l7: curve right
    { cx: 664, cy: 220 },
    // l7 → mb3: up-right
    { cx: 1016, cy: 170 },
    // mb3 → l8: upward
    { cx: 1211, cy: 120 },
    // l8 → l9: curve left
    { cx: 1172, cy: 60 },
    // l9 → mb4: right upward
    { cx: 1406, cy: 40 },
    // mb4 → boss: final climb
    { cx: 1563, cy: 20 },
  ]
}

// ── Atmosphere ──────────────────────────────────────────────
function buildAtmosphere(): AtmosphereEmitter[] {
  return [
    // Floating embers — orange-red dots rising
    {
      particleFrame: 'particleDot',
      zone: { x: 0, y: 200, width: 2500, height: 520 },
      tint: 0xff6600,
      frequency: 600,
      lifespan: 4000,
      speed: { min: 8, max: 20 },
      gravityY: -15,
      scale: { start: 0.5, end: 0.1 },
      alpha: { start: 0.9, end: 0 },
    },
    // Ash fall — gray dots falling
    {
      particleFrame: 'particleDust',
      zone: { x: 0, y: -20, width: 2500, height: 100 },
      tint: 0x888888,
      frequency: 400,
      lifespan: 6000,
      speed: { min: 5, max: 15 },
      gravityY: 10,
      scale: { start: 0.4, end: 0.15 },
      alpha: { start: 0.5, end: 0 },
    },
  ]
}

// ── Animated tiles ──────────────────────────────────────────
function buildAnimatedTiles(): AnimatedTile[] {
  return [
    {
      frames: [10, 11], // lava flow animation
      frameDuration: 400,
    },
  ]
}

// ── Export ───────────────────────────────────────────────────
export const WORLD3_MAP: WorldMapData = {
  world: 3,
  tilesetKey: 'world3-tileset',
  tilesetColumns: 10,

  ground: buildGround(),
  detail: buildDetail(),
  decorations: buildDecorations(),

  // Path spirals upward from bottom-center
  nodePositions: [
    { x: 1133, y: 610 },  // l1 — bottom-center start
    { x: 1445, y: 580 },  // l2
    { x: 1836, y: 540 },  // l3
    { x: 1836, y: 450 },  // mb1
    { x: 1523, y: 400 },  // l4
    { x: 1172, y: 340 },  // l5
    { x: 820, y: 320 },   // mb2
    { x: 547, y: 270 },   // l6
    { x: 781, y: 210 },   // l7
    { x: 1094, y: 150 },  // mb3
    { x: 1250, y: 100 },  // l8
    { x: 1328, y: 60 },   // l9
    { x: 1484, y: 30 },   // mb4
    { x: 1680, y: 20 },   // boss — summit
  ],

  pathSegments: buildPathSegments(),
  atmosphere: buildAtmosphere(),
  animatedTiles: buildAnimatedTiles(),
}
