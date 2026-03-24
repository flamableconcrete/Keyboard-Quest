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

  // ── Path snakes left-to-right ─────────────────────────────
  // l1(4,19) → l2(10,15)
  hPath(g, 19, 4, 10, PATH_H); g[19][10] = PATH_CORNER; vPath(g, 10, 15, 19, PATH_V)
  // l2(10,15) → l3(16,12)
  hPath(g, 15, 10, 16, PATH_H); g[15][16] = PATH_CORNER; vPath(g, 16, 12, 15, PATH_V)
  // l3(16,12) → mb1(22,8)
  hPath(g, 12, 16, 22, PATH_H); g[12][22] = PATH_CORNER; vPath(g, 22, 8, 12, PATH_V)
  // mb1(22,8) → l4(28,13)
  hPath(g, 8, 22, 28, PATH_H); g[8][28] = PATH_CORNER; vPath(g, 28, 8, 13, PATH_V)
  // l4(28,13) → l5(33,17)
  hPath(g, 13, 28, 33, PATH_H); g[13][33] = PATH_CORNER; vPath(g, 33, 13, 17, PATH_V)
  // l5(33,17) → mb2(39,11)
  hPath(g, 17, 33, 39, PATH_H); g[17][39] = PATH_CORNER; vPath(g, 39, 11, 17, PATH_V)
  // mb2(39,11) → l6(44,16)
  hPath(g, 11, 39, 44, PATH_H); g[11][44] = PATH_CORNER; vPath(g, 44, 11, 16, PATH_V)
  // l6(44,16) → l7(50,11)
  hPath(g, 16, 44, 50, PATH_H); g[16][50] = PATH_CORNER; vPath(g, 50, 11, 16, PATH_V)
  // l7(50,11) → mb3(56,6)
  hPath(g, 11, 50, 56, PATH_H); g[11][56] = PATH_CORNER; vPath(g, 56, 6, 11, PATH_V)
  // mb3(56,6) → l8(61,10)
  hPath(g, 6, 56, 61, PATH_H); g[6][61] = PATH_CORNER; vPath(g, 61, 6, 10, PATH_V)
  // l8(61,10) → l9(66,6)
  hPath(g, 10, 61, 66, PATH_H); g[10][66] = PATH_CORNER; vPath(g, 66, 6, 10, PATH_V)
  // l9(66,6) → mb4(71,3)
  hPath(g, 6, 66, 71, PATH_H); g[6][71] = PATH_CORNER; vPath(g, 71, 3, 6, PATH_V)
  // mb4(71,3) → boss(76,1)
  hPath(g, 3, 71, 76, PATH_H); g[3][76] = PATH_CORNER; vPath(g, 76, 1, 3, PATH_V)

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
  if (g[18][8] !== PATH_H && g[18][8] !== PATH_V && g[18][8] !== PATH_CORNER) g[18][8] = LAVA_1
  if (g[18][10] !== PATH_H && g[18][10] !== PATH_V && g[18][10] !== PATH_CORNER) g[18][10] = LAVA_1
  if (g[19][8] !== PATH_H && g[19][8] !== PATH_V && g[19][8] !== PATH_CORNER) g[19][8] = LAVA_1
  if (g[19][10] !== PATH_H && g[19][10] !== PATH_V && g[19][10] !== PATH_CORNER) g[19][10] = LAVA_1

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

// cy offsets bow outward: -40 when going up, +40 when going down
function buildPathSegments(): PathSegment[] {
  return [
    { cx: 230,  cy: 505 }, // l1 → l2   (going up)
    { cx: 415,  cy: 390 }, // l2 → l3   (going up)
    { cx: 610,  cy: 270 }, // l3 → mb1  (going up)
    { cx: 795,  cy: 365 }, // mb1 → l4  (going down)
    { cx: 970,  cy: 505 }, // l4 → l5   (going down)
    { cx: 1160, cy: 405 }, // l5 → mb2  (going up)
    { cx: 1340, cy: 470 }, // mb2 → l6  (going down)
    { cx: 1510, cy: 380 }, // l6 → l7   (going up)
    { cx: 1690, cy: 230 }, // l7 → mb3  (going up)
    { cx: 1860, cy: 300 }, // mb3 → l8  (going down)
    { cx: 2020, cy: 215 }, // l8 → mb4  (was l8 → l9)
    { cx: 2185, cy: 140 }, // mb4 → l9  (was l9 → mb4)
    { cx: 2350, cy: 125 }, // l9 → boss (was mb4 → boss)
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

  // Path snakes left-to-right (volcanic peaks)
  nodePositions: [
    { x: 140,  y: 600 }, // l1 — volcanic foothills (left)
    { x: 320,  y: 490 }, // l2
    { x: 510,  y: 370 }, // l3
    { x: 710,  y: 250 }, // mb1
    { x: 880,  y: 400 }, // l4
    { x: 1060, y: 530 }, // l5
    { x: 1260, y: 360 }, // mb2
    { x: 1420, y: 500 }, // l6
    { x: 1600, y: 340 }, // l7
    { x: 1780, y: 200 }, // mb3
    { x: 1940, y: 320 }, // l8
    { x: 2100, y: 190 }, // mb4 (was l9)
    { x: 2270, y: 170 }, // l9 — MonsterManual (was mb4)
    { x: 2430, y: 160 }, // boss — volcanic summit (right)
  ],

  pathSegments: buildPathSegments(),
  atmosphere: buildAtmosphere(),
  animatedTiles: buildAnimatedTiles(),
}
