import Phaser from 'phaser'

/**
 * Generates all textures needed for the DungeonTrapDisarm level (Lost Ruins of Elda).
 * Call once in create() before building game objects.
 */
export function generateDungeonTrapTextures(scene: Phaser.Scene) {
  if (scene.textures.exists('dungeon_bg')) return

  generateDungeonBackground(scene)
  generateTrapIdleTexture(scene)
  generateTrapActiveTexture(scene)
  generateTrapDangerTexture(scene)
  generateTrapExplosionTexture(scene)
  generateHeartFullTexture(scene)
  generateHeartEmptyTexture(scene)
  generateDustParticleTexture(scene)
  generateGlowRingTexture(scene)
}

// ---------------------------------------------------------------------------
// Dungeon Background
// ---------------------------------------------------------------------------
function generateDungeonBackground(scene: Phaser.Scene) {
  const { width, height } = scene.scale
  const g = scene.add.graphics()

  // Deep stone floor gradient (dark charcoal)
  const floorColors = [0x0d0d0d, 0x111111, 0x161616, 0x121212]
  floorColors.forEach((color, i) => {
    g.fillStyle(color)
    g.fillRect(0, i * (height / floorColors.length), width, height / floorColors.length + 1)
  })

  // Stone wall texture - horizontal mortar lines
  g.lineStyle(1, 0x252525, 0.8)
  for (let y = 0; y <= height; y += 40) {
    g.lineBetween(0, y, width, y)
  }

  // Stone blocks - vertical joints staggered each row
  for (let row = 0; row * 40 < height; row++) {
    const offset = (row % 2) * 60
    for (let x = offset; x < width; x += 120) {
      g.lineStyle(1, 0x1e1e1e, 0.9)
      g.lineBetween(x, row * 40, x, (row + 1) * 40)
    }
  }

  // Large stone arch at top center
  g.lineStyle(3, 0x2a2020, 0.7)
  g.strokeRect(width / 2 - 120, 0, 240, 120)
  g.fillStyle(0x080808)
  g.fillRect(width / 2 - 110, 0, 220, 110)

  // Arch keystone
  g.fillStyle(0x2a2020)
  g.fillTriangle(width / 2 - 20, 0, width / 2 + 20, 0, width / 2, 30)

  // Second, smaller arch on left
  g.fillStyle(0x080808)
  g.fillRect(20, 60, 80, 90)
  g.lineStyle(2, 0x2a2020, 0.6)
  g.strokeRect(20, 60, 80, 90)

  // Crack lines scattered across walls
  const cracks = [
    [100, 50, 125, 90], [300, 120, 280, 180], [width - 80, 80, width - 90, 150],
    [200, 200, 220, 260], [width - 200, 300, width - 170, 380],
    [50, 300, 40, 380], [width / 2 + 80, 80, width / 2 + 60, 160],
  ] as [number, number, number, number][]
  g.lineStyle(1, 0x2a2020, 0.8)
  cracks.forEach(([x1, y1, x2, y2]) => g.lineBetween(x1, y1, x2, y2))

  // Torch brackets - left wall
  drawTorch(g, 40, 160)
  drawTorch(g, 40, 380)
  // Torch brackets - right wall
  drawTorchRight(g, width - 40, 160)
  drawTorchRight(g, width - 40, 380)

  // Stone floor band at bottom
  g.fillStyle(0x1a1515)
  g.fillRect(0, height - 60, width, 60)
  g.lineStyle(2, 0x2a2020)
  g.lineBetween(0, height - 60, width, height - 60)

  // Subtle rune markings on floor
  const runePositions = [
    { x: width * 0.2, y: height * 0.7 },
    { x: width * 0.5, y: height * 0.65 },
    { x: width * 0.8, y: height * 0.72 },
  ]
  runePositions.forEach(pos => {
    g.lineStyle(1, 0x3a2a5a, 0.6)
    g.strokeCircle(pos.x, pos.y, 20)
    g.lineBetween(pos.x - 20, pos.y, pos.x + 20, pos.y)
    g.lineBetween(pos.x, pos.y - 20, pos.x, pos.y + 20)
  })

  g.generateTexture('dungeon_bg', width, height)
  g.destroy()
}

function drawTorch(g: Phaser.GameObjects.Graphics, x: number, y: number) {
  // Bracket
  g.fillStyle(0x3a3028)
  g.fillRect(x - 4, y - 30, 8, 4)
  // Handle
  g.fillStyle(0x5a4a38)
  g.fillRect(x - 3, y - 26, 6, 20)
  // Flame (orange/yellow layers)
  g.fillStyle(0xff6600, 0.9)
  g.fillTriangle(x - 8, y - 26, x + 8, y - 26, x, y - 50)
  g.fillStyle(0xffaa00, 0.85)
  g.fillTriangle(x - 5, y - 26, x + 5, y - 26, x, y - 42)
  g.fillStyle(0xffee44, 0.7)
  g.fillTriangle(x - 2, y - 28, x + 2, y - 28, x, y - 36)
}

function drawTorchRight(g: Phaser.GameObjects.Graphics, x: number, y: number) {
  g.fillStyle(0x3a3028)
  g.fillRect(x - 4, y - 30, 8, 4)
  g.fillStyle(0x5a4a38)
  g.fillRect(x - 3, y - 26, 6, 20)
  g.fillStyle(0xff6600, 0.9)
  g.fillTriangle(x - 8, y - 26, x + 8, y - 26, x, y - 50)
  g.fillStyle(0xffaa00, 0.85)
  g.fillTriangle(x - 5, y - 26, x + 5, y - 26, x, y - 42)
  g.fillStyle(0xffee44, 0.7)
  g.fillTriangle(x - 2, y - 28, x + 2, y - 28, x, y - 36)
}

// ---------------------------------------------------------------------------
// Trap Sprites
// ---------------------------------------------------------------------------
const TRAP_SIZE = 64

function generateTrapIdleTexture(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  const s = TRAP_SIZE

  // Stone pressure plate - grey, slightly raised
  g.fillStyle(0x4a4040)
  g.fillRect(4, 4, s - 8, s - 8)

  // Inner plate
  g.fillStyle(0x5a5050)
  g.fillRect(8, 8, s - 16, s - 16)

  // Rune etched into plate (blue-ish, dim)
  g.lineStyle(2, 0x3a3a8a, 0.7)
  g.strokeCircle(s / 2, s / 2, 16)
  g.lineBetween(s / 2 - 16, s / 2, s / 2 + 16, s / 2)
  g.lineBetween(s / 2, s / 2 - 16, s / 2, s / 2 + 16)

  // Corner bolts
  g.fillStyle(0x3a3030)
  const corners = [[8,8],[s-8,8],[8,s-8],[s-8,s-8]]
  corners.forEach(([cx,cy]) => g.fillRect(cx-3,cy-3,6,6))

  // Subtle glow (blue, soft)
  g.fillStyle(0x2222aa, 0.15)
  g.fillCircle(s / 2, s / 2, 20)

  // Edge highlight (top-left lighter)
  g.lineStyle(1, 0x7a7070, 0.6)
  g.lineBetween(4, 4, s - 4, 4)
  g.lineBetween(4, 4, 4, s - 4)

  g.generateTexture('trap_idle', s, s)
  g.destroy()
}

function generateTrapActiveTexture(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  const s = TRAP_SIZE

  // Plate - darker, pressed
  g.fillStyle(0x402828)
  g.fillRect(4, 4, s - 8, s - 8)
  g.fillStyle(0x503838)
  g.fillRect(8, 8, s - 16, s - 16)

  // Glowing rune (orange)
  g.fillStyle(0xff6600, 0.35)
  g.fillCircle(s / 2, s / 2, 22)

  g.lineStyle(2, 0xff8800, 0.9)
  g.strokeCircle(s / 2, s / 2, 16)
  g.lineBetween(s / 2 - 16, s / 2, s / 2 + 16, s / 2)
  g.lineBetween(s / 2, s / 2 - 16, s / 2, s / 2 + 16)
  // Diagonal cross for extra rune flair
  g.lineBetween(s / 2 - 11, s / 2 - 11, s / 2 + 11, s / 2 + 11)
  g.lineBetween(s / 2 + 11, s / 2 - 11, s / 2 - 11, s / 2 + 11)

  // Corner bolts
  g.fillStyle(0x6a4030)
  const corners = [[8,8],[s-8,8],[8,s-8],[s-8,s-8]]
  corners.forEach(([cx,cy]) => g.fillRect(cx-3,cy-3,6,6))

  // Hot center glow
  g.fillStyle(0xff4400, 0.25)
  g.fillCircle(s / 2, s / 2, 10)

  g.lineStyle(1, 0xaa6040, 0.7)
  g.lineBetween(4, 4, s - 4, 4)
  g.lineBetween(4, 4, 4, s - 4)

  g.generateTexture('trap_active', s, s)
  g.destroy()
}

function generateTrapDangerTexture(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  const s = TRAP_SIZE

  // Plate - nearly black, cracked feel
  g.fillStyle(0x300808)
  g.fillRect(4, 4, s - 8, s - 8)
  g.fillStyle(0x401818)
  g.fillRect(8, 8, s - 16, s - 16)

  // Danger pulse (intense red glow)
  g.fillStyle(0xff0000, 0.4)
  g.fillCircle(s / 2, s / 2, 26)
  g.fillStyle(0xff2200, 0.5)
  g.fillCircle(s / 2, s / 2, 18)

  g.lineStyle(3, 0xff2200, 1.0)
  g.strokeCircle(s / 2, s / 2, 16)
  g.lineBetween(s / 2 - 16, s / 2, s / 2 + 16, s / 2)
  g.lineBetween(s / 2, s / 2 - 16, s / 2, s / 2 + 16)
  g.lineBetween(s / 2 - 11, s / 2 - 11, s / 2 + 11, s / 2 + 11)
  g.lineBetween(s / 2 + 11, s / 2 - 11, s / 2 - 11, s / 2 + 11)

  // Spike tips (triangles pointing outward)
  g.fillStyle(0xff4400)
  g.fillTriangle(s/2, 2, s/2 - 4, 10, s/2 + 4, 10)        // top spike
  g.fillTriangle(s/2, s-2, s/2 - 4, s-10, s/2 + 4, s-10)  // bottom spike
  g.fillTriangle(2, s/2, 10, s/2-4, 10, s/2+4)              // left spike
  g.fillTriangle(s-2, s/2, s-10, s/2-4, s-10, s/2+4)       // right spike

  // Corner bolts red
  g.fillStyle(0x991111)
  const corners = [[8,8],[s-8,8],[8,s-8],[s-8,s-8]]
  corners.forEach(([cx,cy]) => g.fillRect(cx-3,cy-3,6,6))

  // Bright center
  g.fillStyle(0xffffff, 0.2)
  g.fillCircle(s / 2, s / 2, 5)

  g.generateTexture('trap_danger', s, s)
  g.destroy()
}

function generateTrapExplosionTexture(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  const s = 120

  // Outer burst
  g.fillStyle(0xff4400, 0.6)
  g.fillCircle(s/2, s/2, 55)

  // Main explosion
  g.fillStyle(0xff8800, 0.8)
  g.fillCircle(s/2, s/2, 40)

  // Inner flash
  g.fillStyle(0xffcc00, 0.9)
  g.fillCircle(s/2, s/2, 25)

  // Core white
  g.fillStyle(0xffffff, 0.85)
  g.fillCircle(s/2, s/2, 12)

  // Jagged rays
  g.lineStyle(3, 0xff6600, 0.7)
  for (let angle = 0; angle < 360; angle += 45) {
    const rad = (angle * Math.PI) / 180
    g.lineBetween(
      s/2 + Math.cos(rad) * 20, s/2 + Math.sin(rad) * 20,
      s/2 + Math.cos(rad) * 55, s/2 + Math.sin(rad) * 55
    )
  }

  g.generateTexture('trap_explosion', s, s)
  g.destroy()
}

// ---------------------------------------------------------------------------
// HUD Elements
// ---------------------------------------------------------------------------
function generateHeartFullTexture(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  const s = 3

  g.fillStyle(0xff2244)
  g.fillRect(1*s, 0, 2*s, 1*s)
  g.fillRect(5*s, 0, 2*s, 1*s)
  g.fillRect(0, 1*s, 8*s, 1*s)
  g.fillRect(0, 2*s, 8*s, 1*s)
  g.fillRect(1*s, 3*s, 6*s, 1*s)
  g.fillRect(2*s, 4*s, 4*s, 1*s)
  g.fillRect(3*s, 5*s, 2*s, 1*s)

  g.fillStyle(0xff8899)
  g.fillRect(2*s, 1*s, 1*s, 1*s)

  g.generateTexture('heart_full', 8*s, 6*s)
  g.destroy()
}

function generateHeartEmptyTexture(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  const s = 3

  g.lineStyle(1, 0x553344)
  g.fillStyle(0x1a0810)
  g.fillRect(1*s, 0, 2*s, 1*s)
  g.fillRect(5*s, 0, 2*s, 1*s)
  g.fillRect(0, 1*s, 8*s, 1*s)
  g.fillRect(0, 2*s, 8*s, 1*s)
  g.fillRect(1*s, 3*s, 6*s, 1*s)
  g.fillRect(2*s, 4*s, 4*s, 1*s)
  g.fillRect(3*s, 5*s, 2*s, 1*s)

  g.generateTexture('heart_empty', 8*s, 6*s)
  g.destroy()
}

// ---------------------------------------------------------------------------
// Ambient Dust Particle
// ---------------------------------------------------------------------------
function generateDustParticleTexture(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  g.fillStyle(0xccbbaa, 0.6)
  g.fillCircle(3, 3, 3)
  g.generateTexture('dust_particle', 6, 6)
  g.destroy()
}

// ---------------------------------------------------------------------------
// Glow Ring (used behind active trap)
// ---------------------------------------------------------------------------
function generateGlowRingTexture(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  const r = 48
  g.lineStyle(6, 0xffaa00, 0.5)
  g.strokeCircle(r, r, r - 4)
  g.lineStyle(3, 0xffdd88, 0.3)
  g.strokeCircle(r, r, r - 10)
  g.generateTexture('glow_ring', r * 2, r * 2)
  g.destroy()
}
