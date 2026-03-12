import Phaser from 'phaser'


export function generateAllCompanionTextures(scene: Phaser.Scene) {
  generateCompanionTexture(scene, 'mouse_guard_scout')
  generateCompanionTexture(scene, 'badger_warrior')
  generateCompanionTexture(scene, 'wizard_apprentice')
  generateCompanionTexture(scene, 'archer')

  generatePetTexture(scene, 'goblin')
  generatePetTexture(scene, 'slime')
  generatePetTexture(scene, 'skeleton')
  generatePetTexture(scene, 'baby_dragon')
}

export function generateCompanionTexture(scene: Phaser.Scene, companionId: string) {
  if (scene.textures.exists(companionId)) return

  const g = scene.add.graphics()
  const s = 3 // pixel scale

  switch (companionId) {
    case 'mouse_guard_scout':
      // Mouse body
      g.fillStyle(0x888888)
      g.fillRect(3*s, 4*s, 6*s, 8*s)
      // Ears
      g.fillCircle(3*s, 3*s, 2*s)
      g.fillCircle(9*s, 3*s, 2*s)
      g.fillStyle(0xffcccc)
      g.fillCircle(3*s, 3*s, 1*s)
      g.fillCircle(9*s, 3*s, 1*s)
      // Eyes
      g.fillStyle(0x000000)
      g.fillRect(4*s, 5*s, 1*s, 1*s)
      g.fillRect(7*s, 5*s, 1*s, 1*s)
      // Cape
      g.fillStyle(0x228b22)
      g.fillRect(2*s, 6*s, 8*s, 5*s)
      break
    case 'badger_warrior':
      // Badger body
      g.fillStyle(0x333333)
      g.fillRect(3*s, 3*s, 8*s, 10*s)
      // White stripe
      g.fillStyle(0xffffff)
      g.fillRect(6*s, 2*s, 2*s, 11*s)
      // Axe
      g.fillStyle(0x8b4513)
      g.fillRect(1*s, 5*s, 2*s, 8*s)
      g.fillStyle(0xaaaaaa)
      g.fillRect(0*s, 4*s, 4*s, 3*s)
      break
    case 'wizard_apprentice':
      // Robe
      g.fillStyle(0x4b0082)
      g.fillRect(4*s, 6*s, 6*s, 8*s)
      // Hat
      g.fillTriangle(4*s, 6*s, 7*s, 0*s, 10*s, 6*s)
      g.fillRect(3*s, 6*s, 8*s, 1*s)
      // Staff
      g.fillStyle(0x8b4513)
      g.fillRect(11*s, 2*s, 1*s, 12*s)
      g.fillStyle(0xffff00)
      g.fillCircle(11*s + s/2, 2*s, 2*s)
      break
    case 'archer':
      // Tunic
      g.fillStyle(0x006400)
      g.fillRect(4*s, 5*s, 6*s, 7*s)
      // Bow
      g.fillStyle(0x8b4513)
      g.strokeCircle(8*s, 8*s, 4*s)
      g.fillStyle(0x000000)
      g.fillRect(8*s, 4*s, 1*s, 8*s) // string
      break
  }

  g.generateTexture(companionId, 16 * s, 16 * s)
  g.destroy()
}

export function generatePetTexture(scene: Phaser.Scene, petId: string) {
  if (scene.textures.exists(petId)) return

  const g = scene.add.graphics()
  const s = 3

  switch (petId) {
    case 'goblin':
      g.fillStyle(0x44aa44)
      g.fillRect(4*s, 6*s, 8*s, 6*s) // body
      g.fillStyle(0x55cc55)
      g.fillRect(5*s, 3*s, 6*s, 4*s) // head
      g.fillStyle(0xff2222)
      g.fillRect(6*s, 4*s, 1*s, 1*s) // eye
      g.fillRect(9*s, 4*s, 1*s, 1*s) // eye
      break
    case 'slime':
      g.fillStyle(0x00ff00, 0.8)
      g.fillCircle(8*s, 10*s, 5*s)
      g.fillRect(3*s, 10*s, 10*s, 4*s)
      g.fillStyle(0x000000)
      g.fillRect(6*s, 9*s, 1*s, 1*s)
      g.fillRect(9*s, 9*s, 1*s, 1*s)
      break
    case 'skeleton':
      g.fillStyle(0xeeeeee)
      g.fillRect(5*s, 2*s, 6*s, 5*s) // skull
      g.fillRect(7*s, 7*s, 2*s, 5*s) // spine
      g.fillRect(4*s, 8*s, 8*s, 1*s) // ribs
      g.fillStyle(0x000000)
      g.fillRect(6*s, 4*s, 1*s, 1*s) // eye
      g.fillRect(9*s, 4*s, 1*s, 1*s) // eye
      break
    case 'baby_dragon':
      g.fillStyle(0xff4444)
      g.fillRect(4*s, 6*s, 8*s, 6*s) // body
      g.fillCircle(12*s, 5*s, 3*s) // head
      g.fillStyle(0xffaa00)
      g.fillTriangle(2*s, 8*s, 4*s, 6*s, 4*s, 10*s) // tail
      g.fillTriangle(6*s, 6*s, 8*s, 3*s, 10*s, 6*s) // wing
      break
  }

  g.generateTexture(petId, 16 * s, 16 * s)
  g.destroy()
}
