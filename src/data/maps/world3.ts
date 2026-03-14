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
  const g = fillGrid(VOLCANIC_ROCK)

  // Scatter variants
  const altPositions = [
    [1, 6], [2, 18], [3, 30], [4, 10], [5, 24], [6, 36],
    [7, 4], [8, 16], [9, 28], [10, 8], [11, 20], [12, 32],
    [13, 2], [14, 14], [15, 26], [16, 38], [17, 12], [18, 22],
    [19, 34], [20, 6], [21, 18], [22, 30], [1, 22], [3, 34],
    [5, 8], [7, 20], [9, 32], [11, 14], [13, 26], [15, 38],
  ]
  for (const [r, c] of altPositions) {
    if (r < ROWS && c < COLS) {
      g[r][c] = VOLCANIC_ROCK_ALT
    }
  }

  // Ash stone patches
  const ashPatches = [
    [2, 20], [2, 21], [3, 20], [3, 21],
    [8, 6], [8, 7], [9, 6], [9, 7],
    [15, 30], [15, 31], [16, 30], [16, 31],
  ]
  for (const [r, c] of ashPatches) {
    if (r < ROWS && c < COLS) g[r][c] = ASH_STONE
  }

  // Cracked earth areas
  const crackPatches = [
    [6, 14], [6, 15], [7, 14],
    [12, 24], [12, 25], [13, 24],
    [18, 8], [18, 9],
  ]
  for (const [r, c] of crackPatches) {
    if (r < ROWS && c < COLS) g[r][c] = CRACKED_EARTH
  }

  // ── Path spirals upward from bottom-center ─────────────
  // Segment 1: l1 (bottom-center) → l2 (right)
  hPath(g, 19, 18, 24, PATH_H)

  // Segment 2: l2 → l3 (up-right)
  g[19][24] = PATH_CORNER
  vPath(g, 24, 17, 19, PATH_V)
  g[17][24] = PATH_CORNER
  hPath(g, 17, 24, 30, PATH_H)

  // Segment 3: l3 → mb1 (up)
  g[17][30] = PATH_CORNER
  vPath(g, 30, 14, 17, PATH_V)

  // Segment 4: mb1 → l4 (left)
  g[14][30] = PATH_CORNER
  hPath(g, 14, 24, 30, PATH_H)
  g[14][24] = PATH_CORNER
  vPath(g, 24, 12, 14, PATH_V)

  // Segment 5: l4 → l5 (left and up)
  g[12][24] = PATH_CORNER
  hPath(g, 12, 18, 24, PATH_H)
  g[12][18] = PATH_CORNER
  vPath(g, 18, 10, 12, PATH_V)

  // Segment 6: l5 → mb2 (left)
  g[10][18] = PATH_CORNER
  hPath(g, 10, 12, 18, PATH_H)

  // Segment 7: mb2 → l6 (up)
  g[10][12] = PATH_CORNER
  vPath(g, 12, 8, 10, PATH_V)
  g[8][12] = PATH_CORNER
  hPath(g, 8, 8, 12, PATH_H)

  // Segment 8: l6 → l7 (right and up)
  g[8][8] = PATH_CORNER
  vPath(g, 8, 6, 8, PATH_V)
  g[6][8] = PATH_CORNER
  hPath(g, 6, 8, 14, PATH_H)

  // Segment 9: l7 → mb3 (up-right)
  g[6][14] = PATH_CORNER
  vPath(g, 14, 4, 6, PATH_V)
  g[4][14] = PATH_CORNER
  hPath(g, 4, 14, 20, PATH_H)

  // Segment 10: mb3 → l8 (up)
  g[4][20] = PATH_CORNER
  vPath(g, 20, 3, 4, PATH_V)

  // Segment 11: l8 → boss (up-center)
  g[3][20] = PATH_CORNER
  hPath(g, 3, 18, 20, PATH_H)
  g[3][18] = PATH_CORNER
  vPath(g, 18, 1, 3, PATH_V)

  // ── Lava flows ─────────────────────────────────────────────
  // Central lava river
  for (let r = 10; r <= 16; r++) {
    for (let c = 14; c <= 16; c++) {
      if (g[r][c] === VOLCANIC_ROCK || g[r][c] === VOLCANIC_ROCK_ALT) {
        g[r][c] = LAVA_1
      }
    }
  }
  // Lava pool near top
  g[5][20] = LAVA_1
  g[5][21] = LAVA_1
  g[5][22] = LAVA_1
  g[6][21] = LAVA_1
  g[6][22] = LAVA_1

  // Small lava pool bottom-left
  g[18][4] = LAVA_1
  g[18][5] = LAVA_1
  g[19][4] = LAVA_1
  g[19][5] = LAVA_1

  // Path down to special nodes
  vPath(g, 20, 19, 21, PATH_V)
  hPath(g, 21, 16, 24, PATH_H)

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
    [60, 100], [220, 60], [400, 130], [700, 80],
    [1000, 100], [1200, 60], [150, 300], [500, 250],
    [850, 180], [1100, 300],
  ]
  for (const [x, y] of spireSpots) {
    decs.push({ tileIndex: OBSIDIAN_SPIRE, x, y })
  }

  // Tall spires
  decs.push({ tileIndex: OBSIDIAN_SPIRE_TALL, x: 300, y: 80 })
  decs.push({ tileIndex: OBSIDIAN_SPIRE_TALL, x: 900, y: 60 })
  decs.push({ tileIndex: OBSIDIAN_SPIRE_TALL, x: 1150, y: 120 })

  // Smoldering stumps
  const stumpSpots = [
    [100, 500], [300, 420], [500, 380], [700, 300],
    [900, 450], [1050, 350], [200, 620], [600, 600],
    [850, 580], [1100, 550],
  ]
  for (const [x, y] of stumpSpots) {
    decs.push({ tileIndex: SMOLDERING_STUMP, x, y, flicker: true })
  }

  // Ember vents
  const ventSpots = [
    [180, 400], [450, 350], [680, 270], [950, 380],
    [350, 550], [750, 520],
  ]
  for (const [x, y] of ventSpots) {
    decs.push({ tileIndex: EMBER_VENT, x, y, flicker: true })
  }

  // Boulders
  decs.push({ tileIndex: BOULDER, x: 50, y: 650 })
  decs.push({ tileIndex: BOULDER, x: 400, y: 660 })
  decs.push({ tileIndex: BOULDER, x: 1000, y: 640 })
  decs.push({ tileIndex: BOULDER, x: 1200, y: 660 })

  // Lava cracks
  decs.push({ tileIndex: LAVA_CRACK, x: 450, y: 450, flicker: true })
  decs.push({ tileIndex: LAVA_CRACK, x: 650, y: 400, flicker: true })
  decs.push({ tileIndex: LAVA_CRACK, x: 800, y: 480, flicker: true })

  // Scorched ground patches
  decs.push({ tileIndex: SCORCHED_GROUND, x: 250, y: 500 })
  decs.push({ tileIndex: SCORCHED_GROUND, x: 550, y: 480 })
  decs.push({ tileIndex: SCORCHED_GROUND, x: 900, y: 520 })

  return decs
}

// ── Path segments ───────────────────────────────────────────
function buildPathSegments(): PathSegment[] {
  return [
    // l1 → l2: curve right
    { cx: 640, cy: 620 },
    // l2 → l3: up-right curve
    { cx: 850, cy: 560 },
    // l3 → mb1: upward
    { cx: 980, cy: 480 },
    // mb1 → l4: arc left
    { cx: 850, cy: 420 },
    // l4 → l5: left and up
    { cx: 680, cy: 370 },
    // l5 → mb2: leftward
    { cx: 500, cy: 340 },
    // mb2 → l6: up-left
    { cx: 350, cy: 280 },
    // l6 → l7: curve right
    { cx: 340, cy: 220 },
    // l7 → mb3: up-right
    { cx: 520, cy: 170 },
    // mb3 → l8: upward
    { cx: 620, cy: 120 },
    // l8 → l9: curve left
    { cx: 600, cy: 60 },
    // l9 → mb4: right upward
    { cx: 720, cy: 40 },
    // mb4 → boss: final climb
    { cx: 800, cy: 20 },
  ]
}

// ── Atmosphere ──────────────────────────────────────────────
function buildAtmosphere(): AtmosphereEmitter[] {
  return [
    // Floating embers — orange-red dots rising
    {
      particleFrame: 'particleDot',
      zone: { x: 0, y: 200, width: 1280, height: 520 },
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
      zone: { x: 0, y: -20, width: 1280, height: 100 },
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
    { x: 580, y: 610 },  // l1 — bottom-center start
    { x: 740, y: 580 },  // l2
    { x: 940, y: 540 },  // l3
    { x: 940, y: 450 },  // mb1
    { x: 780, y: 400 },  // l4
    { x: 600, y: 340 },  // l5
    { x: 420, y: 320 },  // mb2
    { x: 280, y: 270 },  // l6
    { x: 400, y: 210 },  // l7
    { x: 560, y: 150 },  // mb3
    { x: 640, y: 100 },  // l8
    { x: 680, y: 60 },   // l9
    { x: 760, y: 30 },   // mb4
    { x: 860, y: 20 },   // boss — summit
  ],

  pathSegments: buildPathSegments(),
  atmosphere: buildAtmosphere(),
  animatedTiles: buildAnimatedTiles(),
}
