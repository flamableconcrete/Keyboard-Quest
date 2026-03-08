import Phaser from 'phaser'

/**
 * Generates all textures needed for the GoblinWhacker level.
 * Call once in create() before building game objects.
 */
export function generateGoblinWhackerTextures(scene: Phaser.Scene) {
  if (scene.textures.exists('goblin')) return // already generated

  generateGoblinTexture(scene)
  generateGoblinDeathTexture(scene)
  generateHeroTexture(scene)
  generateHeartTexture(scene)
  generateForestBackground(scene)
}

function generateGoblinTexture(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  const s = 3 // pixel scale

  // Body (green)
  g.fillStyle(0x44aa44)
  g.fillRect(4 * s, 6 * s, 8 * s, 8 * s)

  // Head (lighter green)
  g.fillStyle(0x55cc55)
  g.fillRect(5 * s, 2 * s, 6 * s, 5 * s)

  // Eyes (red)
  g.fillStyle(0xff2222)
  g.fillRect(6 * s, 3 * s, 1 * s, 2 * s)
  g.fillRect(9 * s, 3 * s, 1 * s, 2 * s)

  // Ears (pointy)
  g.fillStyle(0x55cc55)
  g.fillRect(3 * s, 2 * s, 2 * s, 1 * s)
  g.fillRect(11 * s, 2 * s, 2 * s, 1 * s)
  g.fillRect(2 * s, 1 * s, 1 * s, 1 * s)
  g.fillRect(13 * s, 1 * s, 1 * s, 1 * s)

  // Mouth
  g.fillStyle(0x225522)
  g.fillRect(7 * s, 5 * s, 2 * s, 1 * s)

  // Arms
  g.fillStyle(0x44aa44)
  g.fillRect(2 * s, 7 * s, 2 * s, 4 * s)
  g.fillRect(12 * s, 7 * s, 2 * s, 4 * s)

  // Legs
  g.fillStyle(0x337733)
  g.fillRect(5 * s, 14 * s, 3 * s, 3 * s)
  g.fillRect(8 * s, 14 * s, 3 * s, 3 * s)

  // Club in right hand
  g.fillStyle(0x8B4513)
  g.fillRect(13 * s, 5 * s, 2 * s, 7 * s)
  g.fillStyle(0x6B3410)
  g.fillRect(12 * s, 4 * s, 4 * s, 2 * s)

  // Black outline (simplified)
  g.lineStyle(1, 0x000000, 0.6)
  g.strokeRect(4 * s, 6 * s, 8 * s, 8 * s)
  g.strokeRect(5 * s, 2 * s, 6 * s, 5 * s)

  g.generateTexture('goblin', 16 * s, 17 * s)
  g.destroy()
}

function generateGoblinDeathTexture(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  const s = 3

  // Poof cloud particles
  const colors = [0xaaaaaa, 0x888888, 0x666666, 0xbbbbbb]
  const positions = [
    [4, 4], [8, 2], [12, 5], [6, 8], [10, 9], [3, 6], [13, 3], [7, 11],
  ]
  positions.forEach(([px, py], i) => {
    g.fillStyle(colors[i % colors.length], 0.7)
    g.fillCircle(px * s, py * s, (2 + (i % 2)) * s)
  })

  // Stars
  g.fillStyle(0xffff44)
  g.fillRect(2 * s, 1 * s, 2 * s, 2 * s)
  g.fillRect(14 * s, 2 * s, 2 * s, 2 * s)
  g.fillRect(8 * s, 0, 1 * s, 1 * s)

  g.generateTexture('goblin_death', 16 * s, 14 * s)
  g.destroy()
}

function generateHeroTexture(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  const s = 3

  // Boots
  g.fillStyle(0x5C4033)
  g.fillRect(5 * s, 22 * s, 4 * s, 3 * s)
  g.fillRect(11 * s, 22 * s, 4 * s, 3 * s)

  // Legs (dark pants)
  g.fillStyle(0x334455)
  g.fillRect(6 * s, 16 * s, 3 * s, 6 * s)
  g.fillRect(11 * s, 16 * s, 3 * s, 6 * s)

  // Body (tunic)
  g.fillStyle(0x2266aa)
  g.fillRect(5 * s, 8 * s, 10 * s, 8 * s)

  // Belt
  g.fillStyle(0x8B4513)
  g.fillRect(5 * s, 14 * s, 10 * s, 2 * s)
  g.fillStyle(0xffd700)
  g.fillRect(9 * s, 14 * s, 2 * s, 2 * s) // buckle

  // Arms
  g.fillStyle(0x2266aa)
  g.fillRect(3 * s, 9 * s, 2 * s, 6 * s)
  g.fillRect(15 * s, 9 * s, 2 * s, 6 * s)

  // Hands (skin)
  g.fillStyle(0xeebb99)
  g.fillRect(3 * s, 15 * s, 2 * s, 2 * s)
  g.fillRect(15 * s, 15 * s, 2 * s, 2 * s)

  // Head (skin)
  g.fillStyle(0xeebb99)
  g.fillRect(6 * s, 2 * s, 8 * s, 6 * s)

  // Hair
  g.fillStyle(0x553311)
  g.fillRect(6 * s, 1 * s, 8 * s, 2 * s)
  g.fillRect(5 * s, 2 * s, 1 * s, 3 * s)
  g.fillRect(14 * s, 2 * s, 1 * s, 3 * s)

  // Eyes
  g.fillStyle(0x2244aa)
  g.fillRect(8 * s, 4 * s, 1 * s, 1 * s)
  g.fillRect(11 * s, 4 * s, 1 * s, 1 * s)

  // Mouth (smile)
  g.fillStyle(0xcc7755)
  g.fillRect(9 * s, 6 * s, 2 * s, 1 * s)

  // Outline
  g.lineStyle(1, 0x000000, 0.4)
  g.strokeRect(5 * s, 8 * s, 10 * s, 8 * s)
  g.strokeRect(6 * s, 2 * s, 8 * s, 6 * s)

  g.generateTexture('hero', 20 * s, 25 * s)
  g.destroy()
}

function generateHeartTexture(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  const s = 2

  // Pixel heart shape
  g.fillStyle(0xff3344)
  g.fillRect(1 * s, 0, 2 * s, 1 * s)
  g.fillRect(5 * s, 0, 2 * s, 1 * s)
  g.fillRect(0, 1 * s, 8 * s, 1 * s)
  g.fillRect(0, 2 * s, 8 * s, 1 * s)
  g.fillRect(1 * s, 3 * s, 6 * s, 1 * s)
  g.fillRect(2 * s, 4 * s, 4 * s, 1 * s)
  g.fillRect(3 * s, 5 * s, 2 * s, 1 * s)

  // Highlight (shine)
  g.fillStyle(0xff7788)
  g.fillRect(2 * s, 1 * s, 1 * s, 1 * s)

  g.generateTexture('heart', 8 * s, 6 * s)
  g.destroy()
}

function generateForestBackground(scene: Phaser.Scene) {
  const { width, height } = scene.scale
  const g = scene.add.graphics()

  // Sky gradient (dark blue to lighter blue)
  const skyColors = [0x0a0a2e, 0x1a1a4e, 0x2a3a5e, 0x3a5a6e]
  skyColors.forEach((color, i) => {
    const bandH = (height * 0.6) / skyColors.length
    g.fillStyle(color)
    g.fillRect(0, i * bandH, width, bandH + 1)
  })

  // Distant mountains
  g.fillStyle(0x1a2a1e)
  drawMountainRange(g, width, height * 0.35, 80, 6)
  g.fillStyle(0x223322)
  drawMountainRange(g, width, height * 0.4, 60, 8)

  // Tree line (dark silhouettes)
  for (let x = 0; x < width; x += 40) {
    const treeH = 80 + Math.sin(x * 0.05) * 30
    const treeY = height * 0.4
    g.fillStyle(0x152015)
    g.fillRect(x + 15, treeY, 10, treeH)
    g.fillStyle(0x1a3a1a)
    g.fillTriangle(x, treeY + 20, x + 20, treeY - 40 - Math.sin(x * 0.03) * 20, x + 40, treeY + 20)
  }

  // Ground
  g.fillStyle(0x2a4a1e)
  g.fillRect(0, height * 0.55, width, height * 0.45)

  // Grass patches
  g.fillStyle(0x3a6a2e)
  for (let x = 0; x < width; x += 20) {
    const grassH = 4 + Math.sin(x * 0.1) * 3
    g.fillRect(x, height * 0.55 - grassH, 12, grassH + 2)
  }

  // Path (lighter brown dirt)
  g.fillStyle(0x5a4a30)
  g.fillRect(0, height * 0.7, width, height * 0.08)
  g.fillStyle(0x4a3a20)
  for (let x = 0; x < width; x += 30) {
    g.fillCircle(x + 10, height * 0.73, 3)
  }

  g.generateTexture('forest_bg', width, height)
  g.destroy()
}

function drawMountainRange(g: Phaser.GameObjects.Graphics, width: number, baseY: number, maxPeak: number, count: number) {
  const segW = width / count
  for (let i = 0; i < count; i++) {
    const peakH = maxPeak * (0.5 + Math.sin(i * 1.7) * 0.5)
    const x1 = i * segW
    const x2 = x1 + segW / 2
    const x3 = x1 + segW
    g.fillTriangle(x1, baseY, x2, baseY - peakH, x3, baseY)
  }
  g.fillRect(0, baseY, width, 10)
}
