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

  // ── Path ascends steeply from bottom to top (tower climb) ──
  // Segment 1: l1 (bottom-center) → l2 (up)
  vPath(g, 37, 18, 21, PATH_V)

  // Segment 2: l2 → l3 (right and up)
  g[18][37] = PATH_CORNER
  hPath(g, 18, 37, 44, PATH_H)
  g[18][44] = PATH_CORNER
  vPath(g, 44, 16, 18, PATH_V)

  // Segment 3: l3 → mb1 (left and up)
  g[16][44] = PATH_CORNER
  hPath(g, 16, 33, 44, PATH_H)
  g[16][33] = PATH_CORNER
  vPath(g, 33, 14, 16, PATH_V)

  // Segment 4: mb1 → l4 (right and up)
  g[14][33] = PATH_CORNER
  hPath(g, 14, 33, 44, PATH_H)
  g[14][44] = PATH_CORNER
  vPath(g, 44, 12, 14, PATH_V)

  // Segment 5: l4 → l5 (left and up)
  g[12][44] = PATH_CORNER
  hPath(g, 12, 30, 44, PATH_H)
  g[12][30] = PATH_CORNER
  vPath(g, 30, 10, 12, PATH_V)

  // Segment 6: l5 → mb2 (right and up)
  g[10][30] = PATH_CORNER
  hPath(g, 10, 30, 41, PATH_H)
  g[10][41] = PATH_CORNER
  vPath(g, 41, 8, 10, PATH_V)

  // Segment 7: mb2 → l6 (left and up)
  g[8][41] = PATH_CORNER
  hPath(g, 8, 33, 41, PATH_H)
  g[8][33] = PATH_CORNER
  vPath(g, 33, 7, 8, PATH_V)

  // Segment 8: l6 → l7 (right and up)
  g[7][33] = PATH_CORNER
  hPath(g, 7, 33, 44, PATH_H)
  g[7][44] = PATH_CORNER
  vPath(g, 44, 5, 7, PATH_V)

  // Segment 9: l7 → mb3 (left and up)
  g[5][44] = PATH_CORNER
  hPath(g, 5, 37, 44, PATH_H)
  g[5][37] = PATH_CORNER
  vPath(g, 37, 4, 5, PATH_V)

  // Segment 10: mb3 → l8 (up-center)
  g[4][37] = PATH_CORNER
  hPath(g, 4, 37, 41, PATH_H)
  g[4][41] = PATH_CORNER
  vPath(g, 41, 3, 4, PATH_V)

  // Segment 11: l8 → boss (center, top)
  g[3][41] = PATH_CORNER
  hPath(g, 3, 37, 41, PATH_H)
  g[3][37] = PATH_CORNER
  vPath(g, 37, 1, 3, PATH_V)

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

  // Path to special nodes
  vPath(g, 26, 20, 22, PATH_V)
  hPath(g, 22, 22, 33, PATH_H)

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
function buildPathSegments(): PathSegment[] {
  return [
    // l1 → l2: straight up with slight curve
    { cx: 1212, cy: 600 },
    // l2 → l3: zigzag right-up
    { cx: 1359, cy: 530 },
    // l3 → mb1: left-up
    { cx: 1028, cy: 480 },
    // mb1 → l4: right-up
    { cx: 1359, cy: 420 },
    // l4 → l5: left-up
    { cx: 955, cy: 370 },
    // l5 → mb2: right-up
    { cx: 1285, cy: 310 },
    // mb2 → l6: left-up
    { cx: 1065, cy: 260 },
    // l6 → l7: right-up
    { cx: 1359, cy: 210 },
    // l7 → mb3: left-up
    { cx: 1138, cy: 160 },
    // mb3 → l8: up
    { cx: 1248, cy: 110 },
    // l8 → mb4: right-up
    { cx: 1322, cy: 70 },
    // mb4 → boss: final ascent to summit
    { cx: 1395, cy: 30 },
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

  // Path ascends steeply — tower climb pattern (zigzag up)
  nodePositions: [
    { x: 1175, y: 660 },  // l1 — tower base
    { x: 1175, y: 580 },  // l2
    { x: 1359, y: 520 },  // l3
    { x: 1065, y: 460 },  // mb1
    { x: 1359, y: 400 },  // l4
    { x: 992, y: 340 },   // l5
    { x: 1285, y: 280 },  // mb2
    { x: 1065, y: 240 },  // l6
    { x: 1359, y: 190 },  // l7
    { x: 1175, y: 140 },  // mb3
    { x: 1285, y: 90 },   // l8
    { x: 1395, y: 60 },   // mb4
    { x: 1542, y: 20 },   // boss — tower summit
  ],

  pathSegments: buildPathSegments(),
  atmosphere: buildAtmosphere(),
  animatedTiles: buildAnimatedTiles(),
}
