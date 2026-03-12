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
  const g = fillGrid(FOREST_FLOOR)

  // Scatter variants
  const altPositions = [
    [1, 4], [2, 16], [3, 28], [4, 8], [5, 20], [6, 32],
    [7, 12], [8, 24], [9, 36], [10, 6], [11, 18], [12, 30],
    [13, 10], [14, 22], [15, 34], [16, 2], [17, 14], [18, 26],
    [19, 38], [20, 8], [21, 20], [22, 32], [1, 30], [3, 12],
    [5, 36], [7, 8], [9, 24], [11, 16], [13, 38], [15, 4],
  ]
  for (const [r, c] of altPositions) {
    if (r < ROWS && c < COLS) {
      g[r][c] = FOREST_FLOOR_ALT
    }
  }

  // Tangled root patches
  const rootPatches = [
    [4, 3], [4, 4], [5, 3], [5, 4],
    [10, 28], [10, 29], [11, 28], [11, 29],
    [16, 14], [16, 15], [17, 14], [17, 15],
    [8, 36], [8, 37], [9, 36],
  ]
  for (const [r, c] of rootPatches) {
    if (r < ROWS && c < COLS) g[r][c] = TANGLED_ROOTS
  }

  // Overgrown stone patches
  const stonePatches = [
    [6, 20], [6, 21], [7, 20],
    [14, 8], [14, 9],
    [18, 32], [18, 33],
  ]
  for (const [r, c] of stonePatches) {
    if (r < ROWS && c < COLS) g[r][c] = OVERGROWN_STONE
  }

  // ── Path weaves horizontally through middle ────────────
  // Segment 1: l1 (far left) → l2 (right)
  hPath(g, 14, 2, 8, PATH_H)

  // Segment 2: l2 → l3 (up then right)
  g[14][8] = PATH_CORNER
  vPath(g, 8, 11, 14, PATH_V)
  g[11][8] = PATH_CORNER
  hPath(g, 11, 8, 14, PATH_H)

  // Segment 3: l3 → mb1 (right then down)
  g[11][14] = PATH_CORNER
  vPath(g, 14, 11, 14, PATH_V)
  g[14][14] = PATH_CORNER
  hPath(g, 14, 14, 18, PATH_H)

  // Segment 4: mb1 → l4 (up)
  g[14][18] = PATH_CORNER
  vPath(g, 18, 10, 14, PATH_V)
  g[10][18] = PATH_CORNER
  hPath(g, 10, 18, 22, PATH_H)

  // Segment 5: l4 → l5 (down-right)
  g[10][22] = PATH_CORNER
  vPath(g, 22, 10, 13, PATH_V)
  g[13][22] = PATH_CORNER
  hPath(g, 13, 22, 26, PATH_H)

  // Segment 6: l5 → mb2 (up-right)
  g[13][26] = PATH_CORNER
  vPath(g, 26, 10, 13, PATH_V)
  g[10][26] = PATH_CORNER
  hPath(g, 10, 26, 30, PATH_H)

  // Segment 7: mb2 → l6 (down-right)
  g[10][30] = PATH_CORNER
  vPath(g, 30, 10, 14, PATH_V)
  g[14][30] = PATH_CORNER
  hPath(g, 14, 30, 34, PATH_H)

  // Segment 8: l6 → l7 (up-right)
  g[14][34] = PATH_CORNER
  vPath(g, 34, 11, 14, PATH_V)
  g[11][34] = PATH_CORNER
  hPath(g, 11, 34, 37, PATH_H)

  // Segment 9: l7 → mb3 (down)
  g[11][37] = PATH_CORNER
  vPath(g, 37, 11, 15, PATH_V)

  // Segment 10: mb3 → l8 (left and up)
  g[15][37] = PATH_CORNER
  hPath(g, 15, 34, 37, PATH_H)
  g[15][34] = PATH_CORNER
  vPath(g, 34, 8, 15, PATH_V) // long climb

  // Segment 11: l8 → boss (right)
  g[8][34] = PATH_CORNER
  hPath(g, 8, 34, 38, PATH_H)
  g[8][38] = PATH_CORNER
  vPath(g, 38, 5, 8, PATH_V)

  // Deep moss pools
  for (let r = 18; r <= 20; r++) {
    for (let c = 8; c <= 12; c++) {
      if (g[r][c] === FOREST_FLOOR || g[r][c] === FOREST_FLOOR_ALT) {
        g[r][c] = DEEP_MOSS
      }
    }
  }
  g[6][30] = DEEP_MOSS
  g[6][31] = DEEP_MOSS
  g[7][30] = DEEP_MOSS
  g[7][31] = DEEP_MOSS

  // Path to special nodes
  vPath(g, 20, 14, 20, PATH_V)
  hPath(g, 20, 16, 24, PATH_H)

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
  placeAncientTree(40, 120)
  placeAncientTree(200, 80)
  placeAncientTree(400, 100)
  placeAncientTree(600, 60)
  placeAncientTree(800, 100)
  placeAncientTree(1000, 80)
  placeAncientTree(1200, 120)

  // Bottom trees
  placeAncientTree(60, 680)
  placeAncientTree(240, 660)
  placeAncientTree(500, 680)
  placeAncientTree(900, 660)
  placeAncientTree(1150, 680)

  // Mid trees
  placeAncientTree(150, 350)
  placeAncientTree(450, 280)
  placeAncientTree(700, 350)
  placeAncientTree(950, 300)

  // Giant red mushrooms
  const mushroomSpots = [
    [120, 450], [280, 380], [480, 500], [640, 420],
    [820, 480], [1020, 400], [360, 600], [700, 580],
    [1100, 520],
  ]
  for (const [x, y] of mushroomSpots) {
    decs.push({ tileIndex: MUSHROOM_RED, x, y, pulse: true })
  }

  // Mushroom clusters
  decs.push({ tileIndex: MUSHROOM_CLUSTER, x: 180, y: 520 })
  decs.push({ tileIndex: MUSHROOM_CLUSTER, x: 560, y: 450 })
  decs.push({ tileIndex: MUSHROOM_CLUSTER, x: 880, y: 550 })
  decs.push({ tileIndex: MUSHROOM_CLUSTER, x: 1060, y: 480 })

  // Glowing moss patches
  const mossSpots = [
    [100, 400], [300, 320], [500, 360], [700, 280],
    [900, 340], [1100, 380], [250, 550], [650, 520],
  ]
  for (const [x, y] of mossSpots) {
    decs.push({ tileIndex: GLOWING_MOSS, x, y, flicker: true })
  }

  // Spider webs
  decs.push({ tileIndex: SPIDER_WEB, x: 200, y: 200 })
  decs.push({ tileIndex: SPIDER_WEB, x: 500, y: 160 })
  decs.push({ tileIndex: SPIDER_WEB, x: 800, y: 200 })
  decs.push({ tileIndex: SPIDER_WEB, x: 1100, y: 180 })

  // Twisted roots
  decs.push({ tileIndex: TWISTED_ROOT, x: 80, y: 550 })
  decs.push({ tileIndex: TWISTED_ROOT, x: 400, y: 580 })
  decs.push({ tileIndex: TWISTED_ROOT, x: 750, y: 600 })
  decs.push({ tileIndex: TWISTED_ROOT, x: 1050, y: 560 })

  // Ferns
  const fernSpots = [
    [60, 300], [200, 250], [380, 200], [560, 300],
    [740, 250], [920, 200], [1100, 280], [160, 620],
    [440, 640], [800, 620], [1180, 600],
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
    { cx: 160, cy: 420 },
    // l2 → l3: rightward wave
    { cx: 340, cy: 350 },
    // l3 → mb1: dip down
    { cx: 470, cy: 440 },
    // mb1 → l4: up-right
    { cx: 600, cy: 340 },
    // l4 → l5: down-right
    { cx: 720, cy: 420 },
    // l5 → mb2: up-right
    { cx: 840, cy: 340 },
    // mb2 → l6: down-right
    { cx: 960, cy: 420 },
    // l6 → l7: up-right
    { cx: 1100, cy: 340 },
    // l7 → mb3: dip down-right
    { cx: 1180, cy: 440 },
    // mb3 → l8: left and up
    { cx: 1100, cy: 300 },
    // l8 → boss: final right
    { cx: 1180, cy: 200 },
  ]
}

// ── Atmosphere ──────────────────────────────────────────────
function buildAtmosphere(): AtmosphereEmitter[] {
  return [
    // Falling leaves — green leaf shapes drifting down
    {
      particleFrame: 'particleLeaf',
      zone: { x: 0, y: -20, width: 1280, height: 100 },
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
      zone: { x: 0, y: 500, width: 1280, height: 220 },
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
    { x: 80, y: 450 },   // l1 — far left entrance
    { x: 240, y: 380 },  // l2
    { x: 420, y: 360 },  // l3
    { x: 560, y: 440 },  // mb1
    { x: 680, y: 340 },  // l4
    { x: 800, y: 420 },  // l5
    { x: 920, y: 340 },  // mb2
    { x: 1050, y: 430 }, // l6
    { x: 1160, y: 360 }, // l7
    { x: 1180, y: 470 }, // mb3
    { x: 1080, y: 280 }, // l8
    { x: 1200, y: 180 }, // boss
  ],

  specialNodes: {
    tavern: { x: 620, y: 640 },
    stable: { x: 760, y: 640 },
    shop: { x: 900, y: 640 },
  },

  pathSegments: buildPathSegments(),
  atmosphere: buildAtmosphere(),
  animatedTiles: buildAnimatedTiles(),
}
