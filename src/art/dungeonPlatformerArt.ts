import Phaser from 'phaser'

/**
 * Generates textures for the DungeonPlatformer level.
 * Reuses dungeon_bg/hearts/dust from dungeonTrapArt; adds floor + obstacle textures.
 */
export function generateDungeonPlatformerTextures(scene: Phaser.Scene) {
  if (scene.textures.exists('platform_floor')) return

  generateFloorTexture(scene)
  generateObstaclePit(scene)
  generateObstacleSpikes(scene)
  generateObstacleBoulder(scene)
  generateObstacleDoor(scene)
}

// ---------------------------------------------------------------------------
// Floor tile — tileable stone slab (160×80)
// ---------------------------------------------------------------------------
function generateFloorTexture(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  const w = 160, h = 80

  // Base stone
  g.fillStyle(0x2a2222)
  g.fillRect(0, 0, w, h)

  // Top edge highlight
  g.fillStyle(0x3a3232)
  g.fillRect(0, 0, w, 4)

  // Mortar lines
  g.lineStyle(1, 0x1a1515, 0.9)
  g.lineBetween(0, 20, w, 20)
  g.lineBetween(0, 40, w, 40)
  g.lineBetween(0, 60, w, 60)
  // Vertical joints staggered
  for (let row = 0; row < 4; row++) {
    const offset = (row % 2) * 40
    for (let x = offset; x < w; x += 80) {
      g.lineBetween(x, row * 20, x, (row + 1) * 20)
    }
  }

  // Surface texture — random darker spots
  g.fillStyle(0x201818, 0.5)
  const spots = [[20,10],[60,30],[100,50],[140,15],[30,55],[90,65],[120,8]]
  spots.forEach(([sx, sy]) => g.fillRect(sx, sy, 6, 4))

  g.generateTexture('platform_floor', w, h)
  g.destroy()
}

// ---------------------------------------------------------------------------
// Pit — dark gap (120×80)
// ---------------------------------------------------------------------------
function generateObstaclePit(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  const w = 120, h = 80

  // Darkness
  g.fillStyle(0x050505)
  g.fillRect(0, 0, w, h)

  // Jagged edges at top
  g.fillStyle(0x2a2222)
  g.fillTriangle(0, 0, 20, 0, 0, 15)
  g.fillTriangle(w, 0, w - 20, 0, w, 15)
  // Rocky lip
  g.fillStyle(0x1a1515)
  g.fillRect(0, 0, w, 4)
  g.fillRect(0, 0, 8, 12)
  g.fillRect(w - 8, 0, 8, 12)

  // Depth lines fading down
  g.lineStyle(1, 0x0a0a0a)
  for (let y = 15; y < h; y += 10) {
    g.lineBetween(10, y, w - 10, y)
  }

  g.generateTexture('obstacle_pit', w, h)
  g.destroy()
}

// ---------------------------------------------------------------------------
// Spikes — metal floor spikes (100×60, upper portion is spikes above floor line)
// ---------------------------------------------------------------------------
function generateObstacleSpikes(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  const w = 100, h = 60

  // Base plate
  g.fillStyle(0x3a3030)
  g.fillRect(0, h - 12, w, 12)

  // Spikes (5 triangles)
  const spikeW = 16, gap = 4
  const startX = (w - (5 * spikeW + 4 * gap)) / 2
  for (let i = 0; i < 5; i++) {
    const sx = startX + i * (spikeW + gap)
    // Shadow
    g.fillStyle(0x555555)
    g.fillTriangle(sx, h - 12, sx + spikeW, h - 12, sx + spikeW / 2, 4)
    // Spike body
    g.fillStyle(0x888888)
    g.fillTriangle(sx + 1, h - 12, sx + spikeW - 1, h - 12, sx + spikeW / 2, 6)
    // Highlight
    g.fillStyle(0xaaaaaa, 0.6)
    g.fillTriangle(sx + spikeW / 2 - 2, h - 12, sx + spikeW / 2 + 1, h - 12, sx + spikeW / 2, 10)
  }

  // Metallic sheen on tips
  g.fillStyle(0xcccccc, 0.4)
  for (let i = 0; i < 5; i++) {
    const sx = startX + i * (spikeW + gap) + spikeW / 2
    g.fillCircle(sx, 8, 2)
  }

  g.generateTexture('obstacle_spikes', w, h)
  g.destroy()
}

// ---------------------------------------------------------------------------
// Boulder — large round rock (80×80)
// ---------------------------------------------------------------------------
function generateObstacleBoulder(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  const s = 80

  // Shadow
  g.fillStyle(0x111111, 0.5)
  g.fillEllipse(s / 2 + 4, s / 2 + 4, s - 8, s - 12)

  // Main body
  g.fillStyle(0x5a4a3a)
  g.fillCircle(s / 2, s / 2, 34)

  // Highlight
  g.fillStyle(0x7a6a5a, 0.7)
  g.fillCircle(s / 2 - 8, s / 2 - 8, 18)

  // Surface cracks
  g.lineStyle(1, 0x3a3020)
  g.lineBetween(s / 2 - 10, s / 2 - 5, s / 2 + 15, s / 2 + 8)
  g.lineBetween(s / 2 + 5, s / 2 - 12, s / 2 - 5, s / 2 + 10)
  g.lineBetween(s / 2 - 15, s / 2 + 5, s / 2 + 8, s / 2 + 15)

  // Specular highlight
  g.fillStyle(0xbbaa88, 0.4)
  g.fillCircle(s / 2 - 10, s / 2 - 12, 6)

  g.generateTexture('obstacle_boulder', s, s)
  g.destroy()
}

// ---------------------------------------------------------------------------
// Door — locked stone door (80×120)
// ---------------------------------------------------------------------------
function generateObstacleDoor(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  const w = 80, h = 120

  // Door frame
  g.fillStyle(0x3a2a20)
  g.fillRect(0, 0, w, h)

  // Door panels
  g.fillStyle(0x5a4030)
  g.fillRect(6, 6, w - 12, h - 12)

  // Panel insets
  g.fillStyle(0x4a3525)
  g.fillRect(12, 12, w - 24, (h - 30) / 2 - 4)
  g.fillRect(12, 12 + (h - 30) / 2 + 2, w - 24, (h - 30) / 2 - 4)

  // Keyhole plate
  g.fillStyle(0x8a7a60)
  g.fillCircle(w - 20, h / 2, 8)
  g.fillStyle(0x2a1a10)
  g.fillCircle(w - 20, h / 2, 4)
  g.fillRect(w - 22, h / 2, 4, 10)

  // Lock icon glow
  g.fillStyle(0xffaa00, 0.3)
  g.fillCircle(w - 20, h / 2, 12)

  // Iron bands
  g.fillStyle(0x6a6a6a)
  g.fillRect(4, 20, w - 8, 4)
  g.fillRect(4, h - 24, w - 8, 4)

  // Studs
  g.fillStyle(0x888888)
  const studPositions = [[12,22],[w-12,22],[12,h-22],[w-12,h-22]]
  studPositions.forEach(([sx,sy]) => g.fillCircle(sx, sy, 3))

  g.generateTexture('obstacle_door', w, h)
  g.destroy()
}
