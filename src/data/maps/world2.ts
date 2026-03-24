// src/data/maps/world2.ts
// World 2 — "The Shadowed Fen" — dark swamp / marshland theme

import type {
  WorldMapData,
  TileGrid,
  DecorationPlacement,
  PathSegment,
  AtmosphereEmitter,
  AnimatedTile,
} from './types'

// ── Tile index constants ────────────────────────────────────
const MUD = 0
const MUD_ALT = 1
const PATH_H = 2
const PATH_V = 3
const PATH_CORNER = 4
const MURKY_WATER = 10
// const MURKY_WATER_ALT = 11  // used only in animated tile frames

// Decoration indices
const DEAD_TREE_TOP = 20
const DEAD_TREE_TRUNK = 21
const LILY_PAD = 22
const CATTAIL = 23
const RUINED_PILLAR = 24
const MOSSY_STONE = 30
const MOSSY_STONE_ALT = 31

// ── Grid helpers ────────────────────────────────────────────
const COLS = 83
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
  const g = fillGrid(MUD)

  // Scatter mud variants
  const altPositions = [
    [1, 17], [2, 31], [3, 58], [4, 10], [5, 68], [6, 21],
    [7, 46], [8, 79], [9, 6], [10, 37], [11, 62], [12, 15],
    [13, 52], [14, 25], [15, 73], [16, 19], [17, 41], [18, 77],
    [19, 8], [20, 56], [21, 29], [22, 64], [1, 50], [3, 75],
    [5, 23], [7, 60], [9, 33], [11, 12], [13, 71], [15, 39],
    [17, 4], [19, 79], [21, 46], [2, 66], [4, 27], [6, 54],
  ]
  for (const [r, c] of altPositions) {
    if (r < ROWS && c < COLS) {
      g[r][c] = MUD_ALT
    }
  }

  // ── Path snakes left-to-right ─────────────────────────────
  // l1(5,18) → l2(11,14)
  hPath(g, 18, 5, 11, PATH_H); g[18][11] = PATH_CORNER; vPath(g, 11, 14, 18, PATH_V)
  // l2(11,14) → l3(17,10)
  hPath(g, 14, 11, 17, PATH_H); g[14][17] = PATH_CORNER; vPath(g, 17, 10, 14, PATH_V)
  // l3(17,10) → mb1(23,7)
  hPath(g, 10, 17, 23, PATH_H); g[10][23] = PATH_CORNER; vPath(g, 23, 7, 10, PATH_V)
  // mb1(23,7) → l4(27,12)
  hPath(g, 7, 23, 27, PATH_H); g[7][27] = PATH_CORNER; vPath(g, 27, 7, 12, PATH_V)
  // l4(27,12) → l5(31,15)
  hPath(g, 12, 27, 31, PATH_H); g[12][31] = PATH_CORNER; vPath(g, 31, 12, 15, PATH_V)
  // l5(31,15) → l6(38,11)
  hPath(g, 15, 31, 38, PATH_H); g[15][38] = PATH_CORNER; vPath(g, 38, 11, 15, PATH_V)
  // l6(38,11) → mb2(43,7)
  hPath(g, 11, 38, 43, PATH_H); g[11][43] = PATH_CORNER; vPath(g, 43, 7, 11, PATH_V)
  // mb2(43,7) → l7(48,12)
  hPath(g, 7, 43, 48, PATH_H); g[7][48] = PATH_CORNER; vPath(g, 48, 7, 12, PATH_V)
  // l7(48,12) → l8(53,16)
  hPath(g, 12, 48, 53, PATH_H); g[12][53] = PATH_CORNER; vPath(g, 53, 12, 16, PATH_V)
  // l8(53,16) → mb3(58,11)
  hPath(g, 16, 53, 58, PATH_H); g[16][58] = PATH_CORNER; vPath(g, 58, 11, 16, PATH_V)
  // mb3(58,11) → l9(63,7)
  hPath(g, 11, 58, 63, PATH_H); g[11][63] = PATH_CORNER; vPath(g, 63, 7, 11, PATH_V)
  // l9(63,7) → l10(69,11)
  hPath(g, 7, 63, 69, PATH_H); g[7][69] = PATH_CORNER; vPath(g, 69, 7, 11, PATH_V)
  // l10(69,11) → mb4(74,7)
  hPath(g, 11, 69, 74, PATH_H); g[11][74] = PATH_CORNER; vPath(g, 74, 7, 11, PATH_V)
  // mb4(74,7) → boss(79,3)
  hPath(g, 7, 74, 79, PATH_H); g[7][79] = PATH_CORNER; vPath(g, 79, 3, 7, PATH_V)

  // ── Murky water pools ──────────────────────────────────────
  // Large swamp pool center-left
  for (let r = 14; r <= 17; r++) {
    for (let c = 4; c <= 12; c++) {
      if (g[r][c] === MUD || g[r][c] === MUD_ALT) {
        g[r][c] = MURKY_WATER
      }
    }
  }
  // Small pool near top-right
  g[3][62] = MURKY_WATER
  g[3][64] = MURKY_WATER
  g[4][62] = MURKY_WATER
  g[4][64] = MURKY_WATER
  g[4][66] = MURKY_WATER

  // Bottom swamp
  for (let c = 21; c <= 33; c++) {
    g[20][c] = MURKY_WATER
    g[21][c] = MURKY_WATER
  }

  return g
}

// ── Build detail layer ──────────────────────────────────────
function buildDetail(): TileGrid {
  return fillGrid(-1)
}

// ── Decorations ─────────────────────────────────────────────
function buildDecorations(): DecorationPlacement[] {
  const decs: DecorationPlacement[] = []

  function placeDeadTree(x: number, y: number): void {
    decs.push({ tileIndex: DEAD_TREE_TOP, x, y: y - 32, sway: true })
    decs.push({ tileIndex: DEAD_TREE_TRUNK, x, y })
  }

  // Dead trees scattered across the fen
  placeDeadTree(166, 100)
  placeDeadTree(414, 150)
  placeDeadTree(828, 80)
  placeDeadTree(1242, 120)
  placeDeadTree(1863, 90)
  placeDeadTree(2277, 140)
  placeDeadTree(2484, 80)

  // Dead trees along bottom
  placeDeadTree(124, 660)
  placeDeadTree(621, 680)
  placeDeadTree(1656, 660)
  placeDeadTree(2174, 670)

  // Mid-area dead trees
  placeDeadTree(311, 380)
  placeDeadTree(725, 300)
  placeDeadTree(1139, 250)
  placeDeadTree(1553, 350)
  placeDeadTree(1967, 280)

  // Lily pads on water areas
  const lilyPadSpots = [
    [207, 480], [290, 500], [352, 470], [248, 520],
    [787, 650], [870, 660], [952, 640],
    [1987, 120], [2050, 130],
  ]
  for (const [x, y] of lilyPadSpots) {
    decs.push({ tileIndex: LILY_PAD, x, y, pulse: true })
  }

  // Cattails near water edges
  const cattailSpots = [
    [145, 450], [393, 530], [331, 450],
    [704, 640], [1035, 650],
    [1946, 100], [2091, 140],
  ]
  for (const [x, y] of cattailSpots) {
    decs.push({ tileIndex: CATTAIL, x, y, sway: true })
  }

  // Ruined stone pillars
  decs.push({ tileIndex: RUINED_PILLAR, x: 621, y: 200 })
  decs.push({ tileIndex: RUINED_PILLAR, x: 1449, y: 180 })
  decs.push({ tileIndex: RUINED_PILLAR, x: 2070, y: 400 })
  decs.push({ tileIndex: RUINED_PILLAR, x: 1035, y: 500 })

  // Mossy stones
  decs.push({ tileIndex: MOSSY_STONE, x: 497, y: 420 })
  decs.push({ tileIndex: MOSSY_STONE, x: 1284, y: 380 })
  decs.push({ tileIndex: MOSSY_STONE_ALT, x: 1760, y: 500 })
  decs.push({ tileIndex: MOSSY_STONE_ALT, x: 2277, y: 450 })

  return decs
}

// cy offsets bow outward: -40 when going up (destination y < source y), +40 when going down
function buildPathSegments(): PathSegment[] {
  return [
    { cx: 250,  cy: 465 }, // l1 → l2   (going up)
    { cx: 445,  cy: 350 }, // l2 → l3   (going up)
    { cx: 635,  cy: 235 }, // l3 → mb1  (going up)
    { cx: 800,  cy: 335 }, // mb1 → l4  (going down)
    { cx: 935,  cy: 470 }, // l4 → l5   (going down)
    { cx: 1100, cy: 385 }, // l5 → l6   (going up)
    { cx: 1295, cy: 255 }, // l6 → mb2  (going up)
    { cx: 1455, cy: 350 }, // mb2 → l7  (going down)
    { cx: 1600, cy: 490 }, // l7 → l8   (going down)
    { cx: 1770, cy: 395 }, // l8 → mb3  (going up)
    { cx: 1940, cy: 255 }, // mb3 → l9  (going up)
    { cx: 2110, cy: 335 }, // l9 → mb4  (was l9 → l10)
    { cx: 2285, cy: 250 }, // mb4 → l10 (was l10 → mb4)
    { cx: 2445, cy: 155 }, // l10 → boss (was mb4 → boss)
  ]
}

// ── Atmosphere ──────────────────────────────────────────────
function buildAtmosphere(): AtmosphereEmitter[] {
  return [
    // Fireflies — green-yellow dots, slow float
    {
      particleFrame: 'particleDot',
      zone: { x: 0, y: 100, width: 2650, height: 600 },
      tint: 0xaaff44,
      frequency: 1200,
      lifespan: 5000,
      speed: { min: 3, max: 10 },
      gravityY: -5,
      scale: { start: 0.5, end: 0.1 },
      alpha: { start: 0.8, end: 0 },
    },
    // Rising fog/mist — white, large, very slow
    {
      particleFrame: 'particleDust',
      zone: { x: 0, y: 400, width: 2650, height: 320 },
      tint: 0xffffff,
      frequency: 1500,
      lifespan: 8000,
      speed: { min: 1, max: 5 },
      gravityY: -2,
      scale: { start: 1.0, end: 0.3 },
      alpha: { start: 0.3, end: 0 },
    },
  ]
}

// ── Animated tiles ──────────────────────────────────────────
function buildAnimatedTiles(): AnimatedTile[] {
  return [
    {
      frames: [10, 11], // murky water shimmer
      frameDuration: 600,
    },
  ]
}

// ── Export ───────────────────────────────────────────────────
export const WORLD2_MAP: WorldMapData = {
  world: 2,
  tilesetKey: 'world2-tileset',
  tilesetColumns: 10,

  ground: buildGround(),
  detail: buildDetail(),
  decorations: buildDecorations(),

  // Path snakes left-to-right
  nodePositions: [
    { x: 150,  y: 560 }, // l1 — fen entrance (left)
    { x: 350,  y: 450 }, // l2
    { x: 540,  y: 330 }, // l3
    { x: 730,  y: 220 }, // mb1
    { x: 870,  y: 370 }, // l4
    { x: 1000, y: 490 }, // l5
    { x: 1200, y: 360 }, // l6
    { x: 1390, y: 230 }, // mb2
    { x: 1520, y: 390 }, // l7
    { x: 1680, y: 510 }, // l8
    { x: 1860, y: 360 }, // mb3
    { x: 2020, y: 230 }, // l9
    { x: 2200, y: 360 }, // mb4 (was l10)
    { x: 2370, y: 220 }, // l10 — MonsterManual (was mb4)
    { x: 2520, y: 170 }, // boss (right)
  ],

  pathSegments: buildPathSegments(),
  atmosphere: buildAtmosphere(),
  animatedTiles: buildAnimatedTiles(),
}
