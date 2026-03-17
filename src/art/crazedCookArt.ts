// src/art/crazedCookArt.ts
import Phaser from 'phaser'

export function generateCrazedCookTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists('orc_customer')) return
  generateOrcCustomerTexture(scene)
  generateCookTextures(scene)
  generateKitchenBackground(scene)
}

function generateOrcCustomerTexture(scene: Phaser.Scene) {
  // Seated orc: stocky, wide, grey-green
  // Canvas: 48px wide × 40px tall (larger than goblin's slim silhouette)
  const s = 3 // pixel scale
  const g = scene.add.graphics()

  // Body / torso (wide and squat)
  g.fillStyle(0x6b7c3a) // warty grey-green
  g.fillRect(4 * s, 10 * s, 8 * s, 6 * s)

  // Body highlight
  g.fillStyle(0x8a9e4a)
  g.fillRect(5 * s, 11 * s, 3 * s, 2 * s)

  // Leather bib / vest (dark brown)
  g.fillStyle(0x3e2a10)
  g.fillRect(5 * s, 10 * s, 6 * s, 4 * s)
  g.fillRect(6 * s, 14 * s, 4 * s, 2 * s)

  // Head (wide, flat-nosed)
  g.fillStyle(0x6b7c3a)
  g.fillRect(3 * s, 3 * s, 10 * s, 8 * s)

  // Ears (wide and flat)
  g.fillRect(1 * s, 5 * s, 2 * s, 3 * s)
  g.fillRect(13 * s, 5 * s, 2 * s, 3 * s)

  // Forehead warts
  g.fillStyle(0x556030)
  g.fillRect(5 * s, 3 * s, 1 * s, 1 * s)
  g.fillRect(8 * s, 4 * s, 1 * s, 1 * s)
  g.fillRect(11 * s, 3 * s, 1 * s, 1 * s)

  // Eyes (beady yellow)
  g.fillStyle(0xddcc00)
  g.fillRect(5 * s, 6 * s, 2 * s, 2 * s)
  g.fillRect(9 * s, 6 * s, 2 * s, 2 * s)
  // Pupils (black dot)
  g.fillStyle(0x000000)
  g.fillRect(6 * s, 7 * s, 1 * s, 1 * s)
  g.fillRect(10 * s, 7 * s, 1 * s, 1 * s)

  // Flat wide nose
  g.fillStyle(0x4a5a28)
  g.fillRect(6 * s, 8 * s, 4 * s, 2 * s)
  // Nostrils
  g.fillStyle(0x2a3a18)
  g.fillRect(6 * s, 9 * s, 1 * s, 1 * s)
  g.fillRect(9 * s, 9 * s, 1 * s, 1 * s)

  // Mouth line (wide scowl)
  g.fillStyle(0x2a3a18)
  g.fillRect(5 * s, 10 * s, 6 * s, 1 * s)

  // Two bottom tusks jutting up
  g.fillStyle(0xeeeecc)
  g.fillRect(6 * s, 9 * s, 1 * s, 2 * s)
  g.fillRect(9 * s, 9 * s, 1 * s, 2 * s)

  // Arms (hunched forward)
  g.fillStyle(0x6b7c3a)
  g.fillRect(1 * s, 12 * s, 3 * s, 4 * s)
  g.fillRect(12 * s, 12 * s, 3 * s, 4 * s)

  // Hands (fists on counter)
  g.fillStyle(0x556030)
  g.fillRect(0 * s, 15 * s, 3 * s, 3 * s)
  g.fillRect(13 * s, 15 * s, 3 * s, 3 * s)

  g.generateTexture('orc_customer', 16 * s, 20 * s)
  g.destroy()
}

function generateCookTextures(scene: Phaser.Scene) {
  // Cook 1: white apron, ladle
  generateCookWithTool(scene, 'cook_ladle', 0xffffff, (g: Phaser.GameObjects.Graphics, s: number) => {
    // Ladle: yellow handle + round head
    g.fillStyle(0xddaa00)
    g.fillRect(11 * s, 8 * s, 1 * s, 5 * s)
    g.fillStyle(0xffcc22)
    g.fillRect(10 * s, 5 * s, 3 * s, 3 * s)
  })

  // Cook 2: stained apron, kitchen knife
  generateCookWithTool(scene, 'cook_knife', 0xccaa88, (g: Phaser.GameObjects.Graphics, s: number) => {
    // Knife: grey blade + brown handle
    g.fillStyle(0x888888)
    g.fillRect(11 * s, 6 * s, 1 * s, 4 * s)
    g.fillStyle(0x8b5e2a)
    g.fillRect(11 * s, 10 * s, 1 * s, 3 * s)
    // Blade tip
    g.fillStyle(0xaaaaaa)
    g.fillRect(11 * s, 5 * s, 1 * s, 1 * s)
  })

  // Cook 3: tall chef hat, wooden spoon
  generateCookWithTool(scene, 'cook_spoon', 0xffffff, (g: Phaser.GameObjects.Graphics, s: number) => {
    // Tall chef hat (taller white rectangle above head)
    g.fillStyle(0xffffff)
    g.fillRect(5 * s, 0 * s, 4 * s, 4 * s)
    // Wooden spoon: brown handle + oval bowl
    g.fillStyle(0x8b5e2a)
    g.fillRect(11 * s, 7 * s, 1 * s, 5 * s)
    g.fillStyle(0xaa7040)
    g.fillRect(10 * s, 4 * s, 3 * s, 3 * s)
  })
}

function generateCookWithTool(
  scene: Phaser.Scene,
  key: string,
  apronColor: number,
  drawTool: (g: Phaser.GameObjects.Graphics, s: number) => void
) {
  const s = 2
  const g = scene.add.graphics()

  // Body
  g.fillStyle(0xcc9966) // human skin tone
  g.fillRect(4 * s, 5 * s, 6 * s, 7 * s)

  // Apron
  g.fillStyle(apronColor)
  g.fillRect(4 * s, 7 * s, 6 * s, 5 * s)
  // Apron straps
  g.fillRect(4 * s, 5 * s, 1 * s, 2 * s)
  g.fillRect(9 * s, 5 * s, 1 * s, 2 * s)

  // Head
  g.fillStyle(0xcc9966)
  g.fillRect(4 * s, 1 * s, 6 * s, 5 * s)

  // Eyes
  g.fillStyle(0x333333)
  g.fillRect(5 * s, 3 * s, 1 * s, 1 * s)
  g.fillRect(8 * s, 3 * s, 1 * s, 1 * s)

  // Mouth (smile)
  g.fillRect(6 * s, 5 * s, 2 * s, 1 * s)

  // Arms
  g.fillStyle(0xcc9966)
  g.fillRect(2 * s, 7 * s, 2 * s, 4 * s)
  g.fillRect(10 * s, 7 * s, 2 * s, 4 * s)

  // Draw tool in right hand
  drawTool(g, s)

  g.generateTexture(key, 14 * s, 16 * s)
  g.destroy()
}

function generateKitchenBackground(scene: Phaser.Scene) {
  const { width, height } = scene.scale
  const g = scene.add.graphics()

  // Kitchen zone (top half - above counter at y≈360)
  const kitchenHeight = 360
  const tileSize = 32
  for (let row = 0; row * tileSize < kitchenHeight; row++) {
    for (let col = 0; col * tileSize < width; col++) {
      const isDark = (row + col) % 2 === 0
      g.fillStyle(isDark ? 0x4a3728 : 0x3a2a1e)
      g.fillRect(col * tileSize, row * tileSize, tileSize, tileSize)
    }
  }

  // Seating zone (bottom half - below counter)
  const seatTile = 16
  for (let row = 0; row * seatTile < height - kitchenHeight - 40; row++) {
    for (let col = 0; col * seatTile < width; col++) {
      g.fillStyle(0x9e9e8a)
      g.fillRect(col * seatTile, kitchenHeight + 40 + row * seatTile, seatTile, seatTile)
      // Subtle grout lines
      g.fillStyle(0x888878)
      g.fillRect(col * seatTile, kitchenHeight + 40 + row * seatTile, seatTile, 1)
      g.fillRect(col * seatTile, kitchenHeight + 40 + row * seatTile, 1, seatTile)
    }
  }

  // Serving counter band
  g.fillStyle(0x8b6340)
  g.fillRect(0, kitchenHeight, width, 40)
  // Counter highlight stripe
  g.fillStyle(0xaa7a50)
  g.fillRect(0, kitchenHeight, width, 4)
  // Counter shadow
  g.fillStyle(0x6a4a28)
  g.fillRect(0, kitchenHeight + 36, width, 4)

  // Stove top-left corner
  g.fillStyle(0x222222)
  g.fillRect(20, 20, 80, 60)
  g.fillStyle(0x444444)
  g.fillRect(30, 30, 25, 25)
  g.fillRect(60, 30, 25, 25)
  // Burner rings
  g.fillStyle(0xff4400)
  g.fillRect(35, 35, 15, 15)
  g.fillRect(65, 35, 15, 15)
  // Flame flicker dots
  g.fillStyle(0xffaa00)
  g.fillRect(40, 38, 5, 5)
  g.fillRect(70, 38, 5, 5)

  // Stove top-right corner
  g.fillStyle(0x222222)
  g.fillRect(width - 100, 20, 80, 60)
  g.fillStyle(0x444444)
  g.fillRect(width - 90, 30, 25, 25)
  g.fillRect(width - 60, 30, 25, 25)
  g.fillStyle(0xff4400)
  g.fillRect(width - 85, 35, 15, 15)
  g.fillRect(width - 55, 35, 15, 15)
  g.fillStyle(0xffaa00)
  g.fillRect(width - 80, 38, 5, 5)
  g.fillRect(width - 50, 38, 5, 5)

  g.generateTexture('kitchen_bg', width, height)
  g.destroy()
}
