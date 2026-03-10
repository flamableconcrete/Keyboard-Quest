import Phaser from 'phaser'

export function generateGenericBossTextures(scene: Phaser.Scene) {
  if (scene.textures.exists('generic_boss')) return

  const rt = scene.add.renderTexture(0, 0, 64, 64)
  const gfx = scene.make.graphics({}, false)

  // Body
  gfx.fillStyle(0x8B0000) // Dark Red
  gfx.fillRoundedRect(16, 16, 32, 40, 8)

  // Eyes
  gfx.fillStyle(0xFFD700) // Gold
  gfx.fillCircle(24, 28, 4)
  gfx.fillCircle(40, 28, 4)

  // Pupils
  gfx.fillStyle(0x000000)
  gfx.fillCircle(24, 28, 1.5)
  gfx.fillCircle(40, 28, 1.5)

  // Mouth (jagged)
  gfx.lineStyle(2, 0x000000)
  gfx.beginPath()
  gfx.moveTo(20, 44)
  gfx.lineTo(24, 40)
  gfx.lineTo(28, 44)
  gfx.lineTo(32, 40)
  gfx.lineTo(36, 44)
  gfx.lineTo(40, 40)
  gfx.lineTo(44, 44)
  gfx.strokePath()

  // Horns
  gfx.fillStyle(0x555555)
  gfx.beginPath()
  gfx.moveTo(16, 20)
  gfx.lineTo(8, 8)
  gfx.lineTo(24, 16)
  gfx.fillPath()

  gfx.beginPath()
  gfx.moveTo(48, 20)
  gfx.lineTo(56, 8)
  gfx.lineTo(40, 16)
  gfx.fillPath()

  rt.draw(gfx)
  rt.saveTexture('generic_boss')
  rt.destroy()
  gfx.destroy()
}
