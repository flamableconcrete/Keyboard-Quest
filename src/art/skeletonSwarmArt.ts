import Phaser from 'phaser'

export function generateSkeletonSwarmTextures(scene: Phaser.Scene) {
  if (scene.textures.exists('ss_skeleton')) return
  generateSkeletonTexture(scene)
  generateRisingSkeletonTexture(scene)
  generateSkeletonBackground(scene)
  generateBoneFragmentTexture(scene)
  generateAshParticleTexture(scene)
  generateHeartTexture(scene)
  generateFireFrames(scene)
}

function generateSkeletonBackground(scene: Phaser.Scene) {
  const { width, height } = scene.scale
  const s = 1

  // Sky layer — deep blood-red fading to near-black
  const sky = scene.add.graphics()
  for (let y = 0; y < height * 0.6; y++) {
    const t = y / (height * 0.6)
    const r = Math.floor(0x3d * (1 - t))
    const color = (r << 16)
    sky.fillStyle(color)
    sky.fillRect(0, y, width, 1)
  }
  sky.generateTexture('ss_sky', width, Math.floor(height * 0.6))
  sky.destroy()

  // Ruins layer — broken stone walls silhouetted against sky
  const ruins = scene.add.graphics()
  ruins.fillStyle(0x0a0000)
  ruins.fillRect(0, 0, width, 120)

  // Left ruined wall section
  ruins.fillStyle(0x1a1010)
  ruins.fillRect(50, 20, 60, 100)
  ruins.fillRect(110, 40, 20, 80)
  ruins.fillRect(60, 10, 30, 30)
  // Arch remnant
  ruins.fillRect(130, 30, 80, 90)
  ruins.fillRect(210, 50, 15, 70)
  ruins.fillStyle(0x0a0000)
  ruins.fillRect(145, 55, 50, 65) // arch opening
  // Right ruined wall
  ruins.fillStyle(0x1a1010)
  ruins.fillRect(900, 15, 80, 105)
  ruins.fillRect(980, 35, 25, 85)
  ruins.fillRect(850, 30, 55, 90)
  ruins.fillStyle(0x2a1818) // mortar highlights
  ruins.fillRect(52, 22, 56, 2)
  ruins.fillRect(52, 40, 56, 2)
  ruins.fillRect(52, 60, 56, 2)
  ruins.fillRect(132, 32, 76, 2)
  ruins.fillRect(132, 52, 76, 2)

  ruins.generateTexture('ss_ruins', width, 120)
  ruins.destroy()

  // Battlefield layer — cracked earth, skulls, broken weapons
  const field = scene.add.graphics()
  field.fillStyle(0x3a2e1e)
  field.fillRect(0, 0, width, 200)

  // Crack lines
  field.lineStyle(1 * s, 0x2a1e0e)
  field.beginPath()
  field.moveTo(100, 10); field.lineTo(130, 60); field.lineTo(150, 40)
  field.moveTo(300, 5); field.lineTo(320, 80); field.lineTo(360, 50)
  field.moveTo(600, 20); field.lineTo(650, 90)
  field.moveTo(800, 15); field.lineTo(840, 70); field.lineTo(870, 40)
  field.strokePath()

  // Skulls (simplified pixel shapes)
  const drawSkull = (g: Phaser.GameObjects.Graphics, x: number, y: number) => {
    g.fillStyle(0xccbbaa)
    g.fillRect(x, y, 8, 6)
    g.fillRect(x + 1, y + 6, 6, 2)
    g.fillStyle(0x1a1008)
    g.fillRect(x + 1, y + 1, 2, 2) // left eye socket
    g.fillRect(x + 5, y + 1, 2, 2) // right eye socket
  }
  drawSkull(field, 200, 140)
  drawSkull(field, 450, 160)
  drawSkull(field, 700, 130)
  drawSkull(field, 950, 155)

  // Broken weapons sticking from dirt
  field.fillStyle(0x888877) // blade
  field.fillRect(280, 80, 3, 50)
  field.fillStyle(0x554433) // haft
  field.fillRect(280, 125, 3, 30)
  field.fillStyle(0x888877)
  field.fillRect(720, 70, 3, 60)
  field.fillStyle(0x554433)
  field.fillRect(720, 120, 3, 40)

  field.generateTexture('ss_battlefield', width, 200)
  field.destroy()
}

// Stub functions — Task 2 will fill these in
function generateSkeletonTexture(_scene: Phaser.Scene) {}
function generateRisingSkeletonTexture(_scene: Phaser.Scene) {}
function generateBoneFragmentTexture(_scene: Phaser.Scene) {}
function generateAshParticleTexture(_scene: Phaser.Scene) {}
function generateHeartTexture(_scene: Phaser.Scene) {}
function generateFireFrames(_scene: Phaser.Scene) {}
