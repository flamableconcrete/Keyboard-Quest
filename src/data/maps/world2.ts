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

  // ── Path snakes from bottom-right to top-left ──────────
  // Segment 1: l1 (bottom-right) → l2
  hPath(g, 18, 68, 77, PATH_H)
  g[18][68] = PATH_CORNER
  vPath(g, 68, 16, 18, PATH_V)

  // Segment 2: l2 → l3
  g[16][68] = PATH_CORNER
  hPath(g, 16, 58, 68, PATH_H)

  // Segment 3: l3 → mb1
  g[16][58] = PATH_CORNER
  vPath(g, 58, 14, 16, PATH_V)
  g[14][58] = PATH_CORNER
  hPath(g, 14, 50, 58, PATH_H)

  // Segment 4: mb1 → l4
  g[14][50] = PATH_CORNER
  vPath(g, 50, 12, 14, PATH_V)
  g[12][50] = PATH_CORNER
  hPath(g, 12, 41, 50, PATH_H)

  // Segment 5: l4 → l5
  g[12][41] = PATH_CORNER
  vPath(g, 41, 10, 12, PATH_V)
  g[10][41] = PATH_CORNER
  hPath(g, 10, 33, 41, PATH_H)

  // Segment 6: l5 → mb2
  g[10][33] = PATH_CORNER
  vPath(g, 33, 9, 10, PATH_V)
  g[9][33] = PATH_CORNER
  hPath(g, 9, 27, 33, PATH_H)

  // Segment 7: mb2 → l6
  g[9][27] = PATH_CORNER
  vPath(g, 27, 7, 9, PATH_V)
  g[7][27] = PATH_CORNER
  hPath(g, 7, 21, 27, PATH_H)

  // Segment 8: l6 → l7
  g[7][21] = PATH_CORNER
  vPath(g, 21, 8, 7, PATH_V) // goes down slightly
  g[8][21] = PATH_CORNER
  hPath(g, 8, 15, 21, PATH_H)

  // Segment 9: l7 → mb3
  g[8][15] = PATH_CORNER
  vPath(g, 15, 6, 8, PATH_V)
  g[6][15] = PATH_CORNER
  hPath(g, 6, 8, 15, PATH_H)

  // Segment 10: mb3 → l8
  g[6][8] = PATH_CORNER
  vPath(g, 8, 4, 6, PATH_V)
  g[4][8] = PATH_CORNER
  hPath(g, 4, 8, 17, PATH_H)

  // Segment 11: l8 → boss
  g[4][17] = PATH_CORNER
  vPath(g, 17, 2, 4, PATH_V)
  g[2][17] = PATH_CORNER
  hPath(g, 2, 6, 17, PATH_H)

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

  // Path to special nodes
  vPath(g, 42, 18, 20, PATH_V)
  hPath(g, 20, 35, 50, PATH_H)

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

// ── Path segments (bezier control points between consecutive nodes) ──
function buildPathSegments(): PathSegment[] {
  return [
    // l1 → l2: curve leftward
    { cx: 2277, cy: 560 },
    // l2 → l3: gentle curve
    { cx: 2008, cy: 500 },
    // l3 → mb1: sweeping left
    { cx: 1718, cy: 460 },
    // mb1 → l4: slight S-curve
    { cx: 1491, cy: 420 },
    // l4 → l5: leftward rise
    { cx: 1242, cy: 360 },
    // l5 → mb2: short curve
    { cx: 994, cy: 320 },
    // mb2 → l6: up and left
    { cx: 828, cy: 260 },
    // l6 → l7: leftward
    { cx: 621, cy: 280 },
    // l7 → mb3: curve up-left
    { cx: 414, cy: 220 },
    // mb3 → l8: upward
    { cx: 373, cy: 160 },
    // l8 → l9: curve slightly
    { cx: 269, cy: 100 },
    // l9 → l10: continue approach
    { cx: 373, cy: 60 },
    // l10 → mb4: nearing the end
    { cx: 497, cy: 40 },
    // mb4 → boss: final approach
    { cx: 662, cy: 20 },
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

  // Path snakes from bottom-right to top-left
  nodePositions: [
    { x: 2381, y: 590 }, // l1 — fen entrance (bottom-right)
    { x: 2153, y: 530 }, // l2
    { x: 1863, y: 500 }, // l3
    { x: 1615, y: 450 }, // mb1
    { x: 1366, y: 400 }, // l4
    { x: 1097, y: 340 }, // l5
    { x: 890, y: 300 },  // mb2
    { x: 704, y: 250 },  // l6
    { x: 497, y: 270 },  // l7
    { x: 311, y: 210 },  // mb3
    { x: 414, y: 140 },  // l8
    { x: 331, y: 90 },   // l9
    { x: 455, y: 50 },   // l10
    { x: 580, y: 30 },   // mb4
    { x: 787, y: 20 },   // boss
  ],

  pathSegments: buildPathSegments(),
  atmosphere: buildAtmosphere(),
  animatedTiles: buildAnimatedTiles(),
}
