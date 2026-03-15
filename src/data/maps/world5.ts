// src/data/maps/world5.ts
// World 5 — "The Typemancer's Tower" — arcane / magical tower theme

import type {
  WorldMapData,
  TileGrid,
  DecorationPlacement,
  PathSegment,
  AtmosphereEmitter,
  AnimatedTile,
} from './types'

// ── Tile index constants ────────────────────────────────────
const ARCANE_TILE = 0
const ARCANE_TILE_ALT = 1
const PATH_H = 2
const PATH_V = 3
const PATH_CORNER = 4
const FLOATING_STONE = 5
const VOID_1 = 10
// const VOID_2 = 11  // used only in animated tile frames

// Decoration indices
const CRYSTAL_PILLAR = 20
const CRYSTAL_PILLAR_TALL = 21
const RUNIC_CIRCLE = 22
const FLOATING_BOOK = 23
const ENCHANTED_BRAZIER = 24
const MAGIC_RUNE = 25
const ARCANE_SYMBOL = 30
const STARFIELD_PATCH = 31

// ── Grid helpers ────────────────────────────────────────────
const COLS = 74
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
  const g = fillGrid(ARCANE_TILE)

  // Scatter variants
  const altPositions = [
    [1, 19], [2, 41], [3, 63], [4, 11], [5, 33], [6, 56],
    [7, 4], [8, 26], [9, 48], [10, 70], [11, 15], [12, 37],
    [13, 59], [14, 7], [15, 30], [16, 52], [17, 67], [18, 22],
    [19, 44], [20, 11], [21, 33], [22, 56], [1, 48], [3, 15],
    [5, 67], [7, 30], [9, 52], [11, 7], [13, 37], [15, 59],
  ]
  for (const [r, c] of altPositions) {
    if (r < ROWS && c < COLS) {
      g[r][c] = ARCANE_TILE_ALT
    }
  }

  // Floating stone platforms
  const floatPatches = [
    [4, 15], [4, 17], [5, 15], [5, 17],
    [8, 52], [8, 54], [9, 52], [9, 54],
    [12, 30], [12, 31], [13, 30], [13, 31],
    [16, 44], [16, 46], [17, 44],
  ]
  for (const [r, c] of floatPatches) {
    if (r < ROWS && c < COLS) g[r][c] = FLOATING_STONE
  }

  // ── Path ascends left-to-right (tower staircase) ───────────
  // l1(4,19) → l2(10,16)
  hPath(g, 19, 4, 10, PATH_H); g[19][10] = PATH_CORNER; vPath(g, 10, 16, 19, PATH_V)
  // l2(10,16) → l3(17,12)
  hPath(g, 16, 10, 17, PATH_H); g[16][17] = PATH_CORNER; vPath(g, 17, 12, 16, PATH_V)
  // l3(17,12) → mb1(23,8)
  hPath(g, 12, 17, 23, PATH_H); g[12][23] = PATH_CORNER; vPath(g, 23, 8, 12, PATH_V)
  // mb1(23,8) → l4(28,13)
  hPath(g, 8, 23, 28, PATH_H); g[8][28] = PATH_CORNER; vPath(g, 28, 8, 13, PATH_V)
  // l4(28,13) → l5(34,8)
  hPath(g, 13, 28, 34, PATH_H); g[13][34] = PATH_CORNER; vPath(g, 34, 8, 13, PATH_V)
  // l5(34,8) → mb2(40,5)
  hPath(g, 8, 34, 40, PATH_H); g[8][40] = PATH_CORNER; vPath(g, 40, 5, 8, PATH_V)
  // mb2(40,5) → l6(45,9)
  hPath(g, 5, 40, 45, PATH_H); g[5][45] = PATH_CORNER; vPath(g, 45, 5, 9, PATH_V)
  // l6(45,9) → l7(51,5)
  hPath(g, 9, 45, 51, PATH_H); g[9][51] = PATH_CORNER; vPath(g, 51, 5, 9, PATH_V)
  // l7(51,5) → mb3(56,3)
  hPath(g, 5, 51, 56, PATH_H); g[5][56] = PATH_CORNER; vPath(g, 56, 3, 5, PATH_V)
  // mb3(56,3) → l8(62,6)
  hPath(g, 3, 56, 62, PATH_H); g[3][62] = PATH_CORNER; vPath(g, 62, 3, 6, PATH_V)
  // l8(62,6) → mb4(67,3)
  hPath(g, 6, 62, 67, PATH_H); g[6][67] = PATH_CORNER; vPath(g, 67, 3, 6, PATH_V)
  // mb4(67,3) → boss(72,11)
  hPath(g, 3, 67, 72, PATH_H); g[3][72] = PATH_CORNER; vPath(g, 72, 3, 11, PATH_V)

  // ── Void / starfield areas ─────────────────────────────────
  // Void on edges — the tower floats in space
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < 6; c++) {
      if (g[r][c] === ARCANE_TILE || g[r][c] === ARCANE_TILE_ALT) {
        g[r][c] = VOID_1
      }
    }
    for (let c = 68; c < COLS; c++) {
      if (g[r][c] === ARCANE_TILE || g[r][c] === ARCANE_TILE_ALT) {
        g[r][c] = VOID_1
      }
    }
  }
  // Some void patches inside for atmosphere
  g[10][11] = VOID_1
  g[10][13] = VOID_1
  g[11][11] = VOID_1
  g[11][13] = VOID_1
  g[6][59] = VOID_1
  g[6][61] = VOID_1
  g[7][59] = VOID_1
  g[7][61] = VOID_1

  return g
}

function buildDetail(): TileGrid {
  return fillGrid(-1)
}

// ── Decorations ─────────────────────────────────────────────
function buildDecorations(): DecorationPlacement[] {
  const decs: DecorationPlacement[] = []

  // Crystal pillars — blue-purple translucent
  const pillarSpots = [
    [331, 120], [734, 80], [1285, 100], [1836, 80],
    [551, 300], [1102, 250], [1652, 280], [275, 500],
    [1469, 450], [1928, 400],
  ]
  for (const [x, y] of pillarSpots) {
    decs.push({ tileIndex: CRYSTAL_PILLAR, x, y, flicker: true })
  }

  // Tall crystal pillars
  decs.push({ tileIndex: CRYSTAL_PILLAR_TALL, x: 459, y: 180 })
  decs.push({ tileIndex: CRYSTAL_PILLAR_TALL, x: 1010, y: 140 })
  decs.push({ tileIndex: CRYSTAL_PILLAR_TALL, x: 1561, y: 160 })
  decs.push({ tileIndex: CRYSTAL_PILLAR_TALL, x: 2020, y: 200 })

  // Runic circles — gold outlines on floor
  const runeCircleSpots = [
    [588, 400], [992, 320], [1322, 380], [1726, 340],
    [882, 550], [1212, 500], [1616, 520],
  ]
  for (const [x, y] of runeCircleSpots) {
    decs.push({ tileIndex: RUNIC_CIRCLE, x, y, pulse: true })
  }

  // Floating books
  const bookSpots = [
    [367, 350], [734, 280], [1102, 350], [1469, 300],
    [1836, 350], [643, 480], [1377, 460],
  ]
  for (const [x, y] of bookSpots) {
    decs.push({ tileIndex: FLOATING_BOOK, x, y, sway: true })
  }

  // Enchanted braziers — purple fire
  decs.push({ tileIndex: ENCHANTED_BRAZIER, x: 294, y: 440, flicker: true })
  decs.push({ tileIndex: ENCHANTED_BRAZIER, x: 918, y: 400, flicker: true })
  decs.push({ tileIndex: ENCHANTED_BRAZIER, x: 1395, y: 360, flicker: true })
  decs.push({ tileIndex: ENCHANTED_BRAZIER, x: 1873, y: 420, flicker: true })
  decs.push({ tileIndex: ENCHANTED_BRAZIER, x: 698, y: 600, flicker: true })
  decs.push({ tileIndex: ENCHANTED_BRAZIER, x: 1652, y: 580, flicker: true })

  // Magic runes scattered
  decs.push({ tileIndex: MAGIC_RUNE, x: 514, y: 250, pulse: true })
  decs.push({ tileIndex: MAGIC_RUNE, x: 1175, y: 200, pulse: true })
  decs.push({ tileIndex: MAGIC_RUNE, x: 1762, y: 240, pulse: true })

  // Arcane symbols
  decs.push({ tileIndex: ARCANE_SYMBOL, x: 771, y: 160 })
  decs.push({ tileIndex: ARCANE_SYMBOL, x: 1432, y: 140 })
  decs.push({ tileIndex: ARCANE_SYMBOL, x: 1983, y: 160 })

  // Starfield patches
  decs.push({ tileIndex: STARFIELD_PATCH, x: 73, y: 300, flicker: true })
  decs.push({ tileIndex: STARFIELD_PATCH, x: 73, y: 500, flicker: true })
  decs.push({ tileIndex: STARFIELD_PATCH, x: 2240, y: 300, flicker: true })
  decs.push({ tileIndex: STARFIELD_PATCH, x: 2240, y: 500, flicker: true })

  return decs
}

// ── Path segments ───────────────────────────────────────────
// cy offsets bow outward: -40 when going up, +40 when going down
function buildPathSegments(): PathSegment[] {
  return [
    { cx: 230,  cy: 520 }, // l1 → l2   (going up)
    { cx: 430,  cy: 405 }, // l2 → l3   (going up)
    { cx: 625,  cy: 290 }, // l3 → mb1  (going up)
    { cx: 810,  cy: 375 }, // mb1 → l4  (going down)
    { cx: 995,  cy: 295 }, // l4 → l5   (going up)
    { cx: 1180, cy: 170 }, // l5 → mb2  (going up)
    { cx: 1355, cy: 255 }, // mb2 → l6  (going down)
    { cx: 1530, cy: 180 }, // l6 → l7   (going up)
    { cx: 1710, cy: 80  }, // l7 → mb3  (going up)
    { cx: 1885, cy: 175 }, // mb3 → l8  (going down)
    { cx: 2055, cy: 95  }, // l8 → mb4  (going up)
    { cx: 2220, cy: 220 }, // mb4 → boss (going down to center)
  ]
}

// ── Atmosphere ──────────────────────────────────────────────
function buildAtmosphere(): AtmosphereEmitter[] {
  return [
    // Magic sparkles — blue-gold dots floating/orbiting
    {
      particleFrame: 'particleSpark',
      zone: { x: 184, y: 50, width: 1983, height: 620 },
      tint: 0x4488ff,
      frequency: 500,
      lifespan: 4000,
      speed: { min: 5, max: 15 },
      gravityY: -5,
      scale: { start: 0.5, end: 0.1 },
      alpha: { start: 0.8, end: 0 },
    },
    // Arcane pulses — purple brief flashes
    {
      particleFrame: 'particleDot',
      zone: { x: 184, y: 100, width: 1983, height: 520 },
      tint: 0x8844ff,
      frequency: 1500,
      lifespan: 1500,
      speed: { min: 2, max: 8 },
      gravityY: 0,
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.6, end: 0 },
    },
  ]
}

// ── Animated tiles ──────────────────────────────────────────
function buildAnimatedTiles(): AnimatedTile[] {
  return [
    {
      frames: [10, 11], // void/starfield twinkle
      frameDuration: 500,
    },
  ]
}

// ── Export ───────────────────────────────────────────────────
export const WORLD5_MAP: WorldMapData = {
  world: 5,
  tilesetKey: 'world5-tileset',
  tilesetColumns: 10,

  ground: buildGround(),
  detail: buildDetail(),
  decorations: buildDecorations(),

  // Path ascends left-to-right — tower staircase
  nodePositions: [
    { x: 130,  y: 620 }, // l1 — tower base (left)
    { x: 330,  y: 500 }, // l2
    { x: 530,  y: 390 }, // l3
    { x: 720,  y: 270 }, // mb1
    { x: 900,  y: 400 }, // l4
    { x: 1090, y: 270 }, // l5
    { x: 1270, y: 150 }, // mb2
    { x: 1440, y: 280 }, // l6
    { x: 1620, y: 160 }, // l7
    { x: 1800, y: 80  }, // mb3
    { x: 1970, y: 190 }, // l8
    { x: 2140, y: 80  }, // mb4
    { x: 2300, y: 360 }, // boss — Typemancer's throne (centered)
  ],

  pathSegments: buildPathSegments(),
  atmosphere: buildAtmosphere(),
  animatedTiles: buildAnimatedTiles(),
}
