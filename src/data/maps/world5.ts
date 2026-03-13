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
  const g = fillGrid(ARCANE_TILE)

  // Scatter variants
  const altPositions = [
    [1, 10], [2, 22], [3, 34], [4, 6], [5, 18], [6, 30],
    [7, 2], [8, 14], [9, 26], [10, 38], [11, 8], [12, 20],
    [13, 32], [14, 4], [15, 16], [16, 28], [17, 36], [18, 12],
    [19, 24], [20, 6], [21, 18], [22, 30], [1, 26], [3, 8],
    [5, 36], [7, 16], [9, 28], [11, 4], [13, 20], [15, 32],
  ]
  for (const [r, c] of altPositions) {
    if (r < ROWS && c < COLS) {
      g[r][c] = ARCANE_TILE_ALT
    }
  }

  // Floating stone platforms
  const floatPatches = [
    [4, 8], [4, 9], [5, 8], [5, 9],
    [8, 28], [8, 29], [9, 28], [9, 29],
    [12, 16], [12, 17], [13, 16], [13, 17],
    [16, 24], [16, 25], [17, 24],
  ]
  for (const [r, c] of floatPatches) {
    if (r < ROWS && c < COLS) g[r][c] = FLOATING_STONE
  }

  // ── Path ascends steeply from bottom to top (tower climb) ──
  // Segment 1: l1 (bottom-center) → l2 (up)
  vPath(g, 20, 18, 21, PATH_V)

  // Segment 2: l2 → l3 (right and up)
  g[18][20] = PATH_CORNER
  hPath(g, 18, 20, 24, PATH_H)
  g[18][24] = PATH_CORNER
  vPath(g, 24, 16, 18, PATH_V)

  // Segment 3: l3 → mb1 (left and up)
  g[16][24] = PATH_CORNER
  hPath(g, 16, 18, 24, PATH_H)
  g[16][18] = PATH_CORNER
  vPath(g, 18, 14, 16, PATH_V)

  // Segment 4: mb1 → l4 (right and up)
  g[14][18] = PATH_CORNER
  hPath(g, 14, 18, 24, PATH_H)
  g[14][24] = PATH_CORNER
  vPath(g, 24, 12, 14, PATH_V)

  // Segment 5: l4 → l5 (left and up)
  g[12][24] = PATH_CORNER
  hPath(g, 12, 16, 24, PATH_H)
  g[12][16] = PATH_CORNER
  vPath(g, 16, 10, 12, PATH_V)

  // Segment 6: l5 → mb2 (right and up)
  g[10][16] = PATH_CORNER
  hPath(g, 10, 16, 22, PATH_H)
  g[10][22] = PATH_CORNER
  vPath(g, 22, 8, 10, PATH_V)

  // Segment 7: mb2 → l6 (left and up)
  g[8][22] = PATH_CORNER
  hPath(g, 8, 18, 22, PATH_H)
  g[8][18] = PATH_CORNER
  vPath(g, 18, 7, 8, PATH_V)

  // Segment 8: l6 → l7 (right and up)
  g[7][18] = PATH_CORNER
  hPath(g, 7, 18, 24, PATH_H)
  g[7][24] = PATH_CORNER
  vPath(g, 24, 5, 7, PATH_V)

  // Segment 9: l7 → mb3 (left and up)
  g[5][24] = PATH_CORNER
  hPath(g, 5, 20, 24, PATH_H)
  g[5][20] = PATH_CORNER
  vPath(g, 20, 4, 5, PATH_V)

  // Segment 10: mb3 → l8 (up-center)
  g[4][20] = PATH_CORNER
  hPath(g, 4, 20, 22, PATH_H)
  g[4][22] = PATH_CORNER
  vPath(g, 22, 3, 4, PATH_V)

  // Segment 11: l8 → boss (center, top)
  g[3][22] = PATH_CORNER
  hPath(g, 3, 20, 22, PATH_H)
  g[3][20] = PATH_CORNER
  vPath(g, 20, 1, 3, PATH_V)

  // ── Void / starfield areas ─────────────────────────────────
  // Void on edges — the tower floats in space
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < 3; c++) {
      if (g[r][c] === ARCANE_TILE || g[r][c] === ARCANE_TILE_ALT) {
        g[r][c] = VOID_1
      }
    }
    for (let c = 37; c < COLS; c++) {
      if (g[r][c] === ARCANE_TILE || g[r][c] === ARCANE_TILE_ALT) {
        g[r][c] = VOID_1
      }
    }
  }
  // Some void patches inside for atmosphere
  g[10][6] = VOID_1
  g[10][7] = VOID_1
  g[11][6] = VOID_1
  g[11][7] = VOID_1
  g[6][32] = VOID_1
  g[6][33] = VOID_1
  g[7][32] = VOID_1
  g[7][33] = VOID_1

  // Path to special nodes
  vPath(g, 14, 20, 22, PATH_V)
  hPath(g, 22, 12, 18, PATH_H)

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
    [180, 120], [400, 80], [700, 100], [1000, 80],
    [300, 300], [600, 250], [900, 280], [150, 500],
    [800, 450], [1050, 400],
  ]
  for (const [x, y] of pillarSpots) {
    decs.push({ tileIndex: CRYSTAL_PILLAR, x, y, flicker: true })
  }

  // Tall crystal pillars
  decs.push({ tileIndex: CRYSTAL_PILLAR_TALL, x: 250, y: 180 })
  decs.push({ tileIndex: CRYSTAL_PILLAR_TALL, x: 550, y: 140 })
  decs.push({ tileIndex: CRYSTAL_PILLAR_TALL, x: 850, y: 160 })
  decs.push({ tileIndex: CRYSTAL_PILLAR_TALL, x: 1100, y: 200 })

  // Runic circles — gold outlines on floor
  const runeCircleSpots = [
    [320, 400], [540, 320], [720, 380], [940, 340],
    [480, 550], [660, 500], [880, 520],
  ]
  for (const [x, y] of runeCircleSpots) {
    decs.push({ tileIndex: RUNIC_CIRCLE, x, y, pulse: true })
  }

  // Floating books
  const bookSpots = [
    [200, 350], [400, 280], [600, 350], [800, 300],
    [1000, 350], [350, 480], [750, 460],
  ]
  for (const [x, y] of bookSpots) {
    decs.push({ tileIndex: FLOATING_BOOK, x, y, sway: true })
  }

  // Enchanted braziers — purple fire
  decs.push({ tileIndex: ENCHANTED_BRAZIER, x: 160, y: 440, flicker: true })
  decs.push({ tileIndex: ENCHANTED_BRAZIER, x: 500, y: 400, flicker: true })
  decs.push({ tileIndex: ENCHANTED_BRAZIER, x: 760, y: 360, flicker: true })
  decs.push({ tileIndex: ENCHANTED_BRAZIER, x: 1020, y: 420, flicker: true })
  decs.push({ tileIndex: ENCHANTED_BRAZIER, x: 380, y: 600, flicker: true })
  decs.push({ tileIndex: ENCHANTED_BRAZIER, x: 900, y: 580, flicker: true })

  // Magic runes scattered
  decs.push({ tileIndex: MAGIC_RUNE, x: 280, y: 250, pulse: true })
  decs.push({ tileIndex: MAGIC_RUNE, x: 640, y: 200, pulse: true })
  decs.push({ tileIndex: MAGIC_RUNE, x: 960, y: 240, pulse: true })

  // Arcane symbols
  decs.push({ tileIndex: ARCANE_SYMBOL, x: 420, y: 160 })
  decs.push({ tileIndex: ARCANE_SYMBOL, x: 780, y: 140 })
  decs.push({ tileIndex: ARCANE_SYMBOL, x: 1080, y: 160 })

  // Starfield patches
  decs.push({ tileIndex: STARFIELD_PATCH, x: 40, y: 300, flicker: true })
  decs.push({ tileIndex: STARFIELD_PATCH, x: 40, y: 500, flicker: true })
  decs.push({ tileIndex: STARFIELD_PATCH, x: 1220, y: 300, flicker: true })
  decs.push({ tileIndex: STARFIELD_PATCH, x: 1220, y: 500, flicker: true })

  return decs
}

// ── Path segments ───────────────────────────────────────────
function buildPathSegments(): PathSegment[] {
  return [
    // l1 → l2: straight up with slight curve
    { cx: 660, cy: 600 },
    // l2 → l3: zigzag right-up
    { cx: 740, cy: 530 },
    // l3 → mb1: left-up
    { cx: 560, cy: 480 },
    // mb1 → l4: right-up
    { cx: 740, cy: 420 },
    // l4 → l5: left-up
    { cx: 520, cy: 370 },
    // l5 → mb2: right-up
    { cx: 700, cy: 310 },
    // mb2 → l6: left-up
    { cx: 580, cy: 260 },
    // l6 → l7: right-up
    { cx: 740, cy: 210 },
    // l7 → mb3: left-up
    { cx: 620, cy: 160 },
    // mb3 → l8: up
    { cx: 680, cy: 110 },
    // l8 → mb4: right-up
    { cx: 720, cy: 70 },
    // mb4 → boss: final ascent to summit
    { cx: 760, cy: 30 },
  ]
}

// ── Atmosphere ──────────────────────────────────────────────
function buildAtmosphere(): AtmosphereEmitter[] {
  return [
    // Magic sparkles — blue-gold dots floating/orbiting
    {
      particleFrame: 'particleSpark',
      zone: { x: 100, y: 50, width: 1080, height: 620 },
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
      zone: { x: 100, y: 100, width: 1080, height: 520 },
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
    { x: 640, y: 660 },  // l1 — tower base
    { x: 640, y: 580 },  // l2
    { x: 740, y: 520 },  // l3
    { x: 580, y: 460 },  // mb1
    { x: 740, y: 400 },  // l4
    { x: 540, y: 340 },  // l5
    { x: 700, y: 280 },  // mb2
    { x: 580, y: 240 },  // l6
    { x: 740, y: 190 },  // l7
    { x: 640, y: 140 },  // mb3
    { x: 700, y: 90 },   // l8
    { x: 760, y: 60 },   // mb4
    { x: 840, y: 20 },   // boss — tower summit
  ],

  specialNodes: {
    tavern: { x: 540, y: 700 },
    stable: { x: 680, y: 700 },
    shop: { x: 820, y: 700 },
  },

  pathSegments: buildPathSegments(),
  atmosphere: buildAtmosphere(),
  animatedTiles: buildAnimatedTiles(),
}
