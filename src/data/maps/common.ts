// src/data/maps/common.ts

/** Frame names in the common spritesheet */
export const COMMON_FRAMES = {
  // Node sprites
  nodeLevel: 0,
  nodeMiniBoss: 1,
  nodeBoss: 2,
  nodeTavern: 3,
  nodeStable: 4,
  nodeInventory: 5,
  // Star icons
  starFilled: 6,
  starEmpty: 7,
  // Particle textures
  particleDot: 8,
  particleSpark: 9,
  particleLeaf: 10,
  particleDust: 11,
  // Lock/chain overlay
  lockOverlay: 12,
} as const

/** Common spritesheet layout */
export const COMMON_TILESET = {
  key: 'map-common',
  path: 'assets/maps/common.png',
  frameWidth: 32,
  frameHeight: 32,
  columns: 8,
} as const
