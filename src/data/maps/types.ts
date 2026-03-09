// src/data/maps/types.ts

/** A 2D grid of tile indices. -1 = empty/transparent. */
export type TileGrid = number[][]

/** Decoration placed as a sprite on the map */
export interface DecorationPlacement {
  /** Tile index in the world tileset */
  tileIndex: number
  /** Pixel position (top-left of the tile) */
  x: number
  y: number
  /** Optional depth offset for y-sorting */
  depthOffset?: number
  /** If true, apply ambient sway tween */
  sway?: boolean
  /** If true, apply ambient scale pulse */
  pulse?: boolean
  /** If true, apply alpha flicker */
  flicker?: boolean
}

/** Bezier control point for curved path between nodes */
export interface PathSegment {
  /** Control point for quadratic bezier (omit for straight line) */
  cx?: number
  cy?: number
}

/** Node position on the map (pixel coords) */
export interface MapNodePosition {
  x: number
  y: number
}

/** Particle emitter config for world atmosphere */
export interface AtmosphereEmitter {
  /** Key into common spritesheet frame name */
  particleFrame: string
  /** Emitter zone bounds (pixel coords) */
  zone: { x: number; y: number; width: number; height: number }
  /** Particle tint color */
  tint: number
  /** Particles per second */
  frequency: number
  /** Particle lifespan in ms */
  lifespan: number
  /** Speed range */
  speed: { min: number; max: number }
  /** Gravity Y (negative = float up) */
  gravityY?: number
  /** Scale range */
  scale?: { start: number; end: number }
  /** Alpha range */
  alpha?: { start: number; end: number }
}

/** Animated tile definition — cycles through tile indices */
export interface AnimatedTile {
  /** Tile indices in the tileset to cycle through */
  frames: number[]
  /** Duration per frame in ms */
  frameDuration: number
}

/** Full map data for one world */
export interface WorldMapData {
  /** Which world (1-5) */
  world: number
  /** Tileset image key (loaded in PreloadScene) */
  tilesetKey: string
  /** Number of columns in the tileset spritesheet */
  tilesetColumns: number
  /** Ground layer tile grid (40x23) */
  ground: TileGrid
  /** Terrain detail layer tile grid (40x23), -1 = transparent */
  detail: TileGrid
  /** Decoration sprites to place */
  decorations: DecorationPlacement[]
  /** Node pixel positions (indexed same as level array) */
  nodePositions: MapNodePosition[]
  /** Special node positions */
  specialNodes: Record<string, MapNodePosition>
  /** Bezier path segments between consecutive nodes */
  pathSegments: PathSegment[]
  /** Atmosphere particle emitters */
  atmosphere: AtmosphereEmitter[]
  /** Animated tile definitions */
  animatedTiles: AnimatedTile[]
}
