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
const COLS = 40
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
    [1, 8], [2, 15], [3, 28], [4, 5], [5, 33], [6, 10],
    [7, 22], [8, 38], [9, 3], [10, 18], [11, 30], [12, 7],
    [13, 25], [14, 12], [15, 35], [16, 9], [17, 20], [18, 37],
    [19, 4], [20, 27], [21, 14], [22, 31], [1, 24], [3, 36],
    [5, 11], [7, 29], [9, 16], [11, 6], [13, 34], [15, 19],
    [17, 2], [19, 38], [21, 22], [2, 32], [4, 13], [6, 26],
  ]
  for (const [r, c] of altPositions) {
    if (r < ROWS && c < COLS) {
      g[r][c] = MUD_ALT
    }
  }

  // ── Path snakes from bottom-right to top-left ──────────
  // Segment 1: l1 (bottom-right) → l2
  hPath(g, 18, 33, 37, PATH_H)
  g[18][33] = PATH_CORNER
  vPath(g, 33, 16, 18, PATH_V)

  // Segment 2: l2 → l3
  g[16][33] = PATH_CORNER
  hPath(g, 16, 28, 33, PATH_H)

  // Segment 3: l3 → mb1
  g[16][28] = PATH_CORNER
  vPath(g, 28, 14, 16, PATH_V)
  g[14][28] = PATH_CORNER
  hPath(g, 14, 24, 28, PATH_H)

  // Segment 4: mb1 → l4
  g[14][24] = PATH_CORNER
  vPath(g, 24, 12, 14, PATH_V)
  g[12][24] = PATH_CORNER
  hPath(g, 12, 20, 24, PATH_H)

  // Segment 5: l4 → l5
  g[12][20] = PATH_CORNER
  vPath(g, 20, 10, 12, PATH_V)
  g[10][20] = PATH_CORNER
  hPath(g, 10, 16, 20, PATH_H)

  // Segment 6: l5 → mb2
  g[10][16] = PATH_CORNER
  vPath(g, 16, 9, 10, PATH_V)
  g[9][16] = PATH_CORNER
  hPath(g, 9, 13, 16, PATH_H)

  // Segment 7: mb2 → l6
  g[9][13] = PATH_CORNER
  vPath(g, 13, 7, 9, PATH_V)
  g[7][13] = PATH_CORNER
  hPath(g, 7, 10, 13, PATH_H)

  // Segment 8: l6 → l7
  g[7][10] = PATH_CORNER
  vPath(g, 10, 8, 7, PATH_V) // goes down slightly
  g[8][10] = PATH_CORNER
  hPath(g, 8, 7, 10, PATH_H)

  // Segment 9: l7 → mb3
  g[8][7] = PATH_CORNER
  vPath(g, 7, 6, 8, PATH_V)
  g[6][7] = PATH_CORNER
  hPath(g, 6, 4, 7, PATH_H)

  // Segment 10: mb3 → l8
  g[6][4] = PATH_CORNER
  vPath(g, 4, 4, 6, PATH_V)
  g[4][4] = PATH_CORNER
  hPath(g, 4, 4, 8, PATH_H)

  // Segment 11: l8 → boss
  g[4][8] = PATH_CORNER
  vPath(g, 8, 2, 4, PATH_V)
  g[2][8] = PATH_CORNER
  hPath(g, 2, 3, 8, PATH_H)

  // ── Murky water pools ──────────────────────────────────────
  // Large swamp pool center-left
  for (let r = 14; r <= 17; r++) {
    for (let c = 2; c <= 6; c++) {
      if (g[r][c] === MUD || g[r][c] === MUD_ALT) {
        g[r][c] = MURKY_WATER
      }
    }
  }
  // Small pool near top-right
  g[3][30] = MURKY_WATER
  g[3][31] = MURKY_WATER
  g[4][30] = MURKY_WATER
  g[4][31] = MURKY_WATER
  g[4][32] = MURKY_WATER

  // Bottom swamp
  for (let c = 10; c <= 16; c++) {
    g[20][c] = MURKY_WATER
    g[21][c] = MURKY_WATER
  }

  // Path to special nodes
  vPath(g, 20, 18, 20, PATH_V)
  hPath(g, 20, 17, 24, PATH_H)

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
  placeDeadTree(80, 100)
  placeDeadTree(200, 150)
  placeDeadTree(400, 80)
  placeDeadTree(600, 120)
  placeDeadTree(900, 90)
  placeDeadTree(1100, 140)
  placeDeadTree(1200, 80)

  // Dead trees along bottom
  placeDeadTree(60, 660)
  placeDeadTree(300, 680)
  placeDeadTree(800, 660)
  placeDeadTree(1050, 670)

  // Mid-area dead trees
  placeDeadTree(150, 380)
  placeDeadTree(350, 300)
  placeDeadTree(550, 250)
  placeDeadTree(750, 350)
  placeDeadTree(950, 280)

  // Lily pads on water areas
  const lilyPadSpots = [
    [100, 480], [140, 500], [170, 470], [120, 520],
    [380, 650], [420, 660], [460, 640],
    [960, 120], [990, 130],
  ]
  for (const [x, y] of lilyPadSpots) {
    decs.push({ tileIndex: LILY_PAD, x, y, pulse: true })
  }

  // Cattails near water edges
  const cattailSpots = [
    [70, 450], [190, 530], [160, 450],
    [340, 640], [500, 650],
    [940, 100], [1010, 140],
  ]
  for (const [x, y] of cattailSpots) {
    decs.push({ tileIndex: CATTAIL, x, y, sway: true })
  }

  // Ruined stone pillars
  decs.push({ tileIndex: RUINED_PILLAR, x: 300, y: 200 })
  decs.push({ tileIndex: RUINED_PILLAR, x: 700, y: 180 })
  decs.push({ tileIndex: RUINED_PILLAR, x: 1000, y: 400 })
  decs.push({ tileIndex: RUINED_PILLAR, x: 500, y: 500 })

  // Mossy stones
  decs.push({ tileIndex: MOSSY_STONE, x: 240, y: 420 })
  decs.push({ tileIndex: MOSSY_STONE, x: 620, y: 380 })
  decs.push({ tileIndex: MOSSY_STONE_ALT, x: 850, y: 500 })
  decs.push({ tileIndex: MOSSY_STONE_ALT, x: 1100, y: 450 })

  return decs
}

// ── Path segments (bezier control points between consecutive nodes) ──
function buildPathSegments(): PathSegment[] {
  return [
    // l1 → l2: curve leftward
    { cx: 1100, cy: 560 },
    // l2 → l3: gentle curve
    { cx: 970, cy: 500 },
    // l3 → mb1: sweeping left
    { cx: 830, cy: 460 },
    // mb1 → l4: slight S-curve
    { cx: 720, cy: 420 },
    // l4 → l5: leftward rise
    { cx: 600, cy: 360 },
    // l5 → mb2: short curve
    { cx: 480, cy: 320 },
    // mb2 → l6: up and left
    { cx: 400, cy: 260 },
    // l6 → l7: leftward
    { cx: 300, cy: 280 },
    // l7 → mb3: curve up-left
    { cx: 200, cy: 220 },
    // mb3 → l8: upward
    { cx: 180, cy: 160 },
    // l8 → boss: final approach
    { cx: 130, cy: 100 },
  ]
}

// ── Atmosphere ──────────────────────────────────────────────
function buildAtmosphere(): AtmosphereEmitter[] {
  return [
    // Fireflies — green-yellow dots, slow float
    {
      particleFrame: 'particleDot',
      zone: { x: 0, y: 100, width: 1280, height: 600 },
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
      zone: { x: 0, y: 400, width: 1280, height: 320 },
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
    { x: 1150, y: 590 }, // l1 — fen entrance (bottom-right)
    { x: 1040, y: 530 }, // l2
    { x: 900, y: 500 },  // l3
    { x: 780, y: 450 },  // mb1
    { x: 660, y: 400 },  // l4
    { x: 530, y: 340 },  // l5
    { x: 430, y: 300 },  // mb2
    { x: 340, y: 250 },  // l6
    { x: 240, y: 270 },  // l7
    { x: 150, y: 210 },  // mb3
    { x: 200, y: 140 },  // l8
    { x: 110, y: 80 },   // boss
  ],

  specialNodes: {
    inventory: { x: 560, y: 630 },
    tavern: { x: 690, y: 630 },
    stable: { x: 820, y: 630 },
  },

  pathSegments: buildPathSegments(),
  atmosphere: buildAtmosphere(),
  animatedTiles: buildAnimatedTiles(),
}
