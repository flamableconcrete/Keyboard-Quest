// src/art/crazedCookArt.ts
import Phaser from 'phaser'
import { COOK_STATIONS } from '../data/cookStations'

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

  // ── Seating zone (bottom half, below counter at y=360) ──────────────────
  const counterY = 360
  const seatTile = 16
  for (let row = 0; row * seatTile < height - counterY - 40; row++) {
    for (let col = 0; col * seatTile < width; col++) {
      g.fillStyle(0x9e9e8a)
      g.fillRect(col * seatTile, counterY + 40 + row * seatTile, seatTile, seatTile)
      g.fillStyle(0x888878)
      g.fillRect(col * seatTile, counterY + 40 + row * seatTile, seatTile, 1)
      g.fillRect(col * seatTile, counterY + 40 + row * seatTile, 1, seatTile)
    }
  }

  // ── Serving counter band (unchanged) ────────────────────────────────────
  g.fillStyle(0x8b6340)
  g.fillRect(0, counterY, width, 40)
  g.fillStyle(0xaa7a50)
  g.fillRect(0, counterY, width, 4)
  g.fillStyle(0x6a4a28)
  g.fillRect(0, counterY + 36, width, 4)

  // ── Kitchen floor (y=130 to y=360) ──────────────────────────────────────
  const floorY = 130
  const tileSize = 24
  for (let row = 0; row * tileSize < counterY - floorY; row++) {
    for (let col = 0; col * tileSize < width; col++) {
      const isDark = (row + col) % 2 === 0
      g.fillStyle(isDark ? 0x4a3728 : 0x3a2a1e)
      g.fillRect(col * tileSize, floorY + row * tileSize, tileSize, tileSize)
    }
  }

  // ── Back wall (y=0 to y=130) ─────────────────────────────────────────────
  const stoneH = 20
  const stoneW = 40
  for (let row = 0; row * stoneH < floorY; row++) {
    const offset = (row % 2) * (stoneW / 2)
    for (let col = -1; col * stoneW < width; col++) {
      g.fillStyle(row % 2 === 0 ? 0x2a2318 : 0x1e1a10)
      g.fillRect(col * stoneW + offset, row * stoneH, stoneW - 2, stoneH - 2)
    }
  }

  // ── Back counter surface (y=100 to y=130) ───────────────────────────────
  g.fillStyle(0x7a5530)
  g.fillRect(0, 100, width, 30)
  g.fillStyle(0x9a6a40)
  g.fillRect(0, 100, width, 4)
  g.fillStyle(0x5a3a20)
  g.fillRect(0, 126, width, 4)

  // ── Back-counter station art ─────────────────────────────────────────────
  const drawStove = (cx: number) => {
    g.fillStyle(0x222222)
    g.fillRect(cx - 28, 62, 56, 38)
    g.fillStyle(0x111111)
    g.fillRect(cx - 22, 68, 20, 20)
    g.fillRect(cx + 2,  68, 20, 20)
    g.fillStyle(0xcc3300)
    g.fillRect(cx - 20, 70, 16, 16)
    g.fillRect(cx + 4,  70, 16, 16)
    g.fillStyle(0xff8800)
    g.fillRect(cx - 17, 73, 10, 10)
    g.fillRect(cx + 7,  73, 10, 10)
    g.fillStyle(0xffcc00)
    g.fillRect(cx - 14, 76, 4, 4)
    g.fillRect(cx + 10, 76, 4, 4)
    g.fillStyle(0x444444)
    g.fillRect(cx - 16, 92, 6, 6)
    g.fillRect(cx + 10, 92, 6, 6)
  }
  drawStove(COOK_STATIONS[0].x) // stove_left
  drawStove(COOK_STATIONS[5].x) // stove_right

  const sinkX = COOK_STATIONS[1].x
  g.fillStyle(0x888888)
  g.fillRect(sinkX - 24, 70, 48, 30)
  g.fillStyle(0x6699cc)
  g.fillRect(sinkX - 20, 74, 40, 22)
  g.fillStyle(0x4477aa)
  g.fillRect(sinkX - 20, 92, 40, 4)
  g.fillStyle(0x555555)
  g.fillRect(sinkX - 2, 62, 4, 10)
  g.fillStyle(0x888888)
  g.fillRect(sinkX - 8, 62, 16, 4)

  const spiceX = COOK_STATIONS[2].x
  g.fillStyle(0x5a3a18)
  g.fillRect(spiceX - 30, 40, 60, 5)
  g.fillStyle(0x5a3a18)
  g.fillRect(spiceX - 30, 65, 60, 5)
  g.fillStyle(0x5a3a18)
  g.fillRect(spiceX - 30, 90, 60, 5)
  const jarColors = [0xcc2222, 0x22aacc, 0xddaa00, 0x44cc44, 0xcc6600]
  for (let i = 0; i < 5; i++) {
    g.fillStyle(jarColors[i])
    g.fillRect(spiceX - 28 + i * 12, 46, 8, 14)
    g.fillStyle(0xcccccc)
    g.fillRect(spiceX - 28 + i * 12, 44, 8, 4)
  }
  for (let i = 0; i < 4; i++) {
    g.fillStyle(jarColors[(i + 2) % 5])
    g.fillRect(spiceX - 24 + i * 14, 71, 10, 14)
    g.fillStyle(0xcccccc)
    g.fillRect(spiceX - 24 + i * 14, 69, 10, 4)
  }

  const herbX = COOK_STATIONS[3].x
  g.fillStyle(0x3a2208)
  g.fillRect(herbX - 36, 0, 72, 12)
  const bundleOffsets = [-20, 0, 20]
  bundleOffsets.forEach(ox => {
    g.fillStyle(0x5a3a18)
    g.fillRect(herbX + ox, 12, 2, 20)
    g.fillStyle(0x3a6630)
    g.fillRect(herbX + ox - 6, 26, 14, 12)
    g.fillStyle(0x2a4a24)
    g.fillRect(herbX + ox - 4, 34, 10, 4)
    g.fillStyle(0x5a8850)
    g.fillRect(herbX + ox - 4, 26, 6, 4)
  })

  const fridgeX = COOK_STATIONS[4].x
  g.fillStyle(0x7a6040)
  g.fillRect(fridgeX - 22, 30, 44, 70)
  g.fillStyle(0x888888)
  g.fillRect(fridgeX - 22, 44, 44, 4)
  g.fillRect(fridgeX - 22, 68, 44, 4)
  g.fillRect(fridgeX - 22, 90, 44, 4)
  g.fillStyle(0x6a5030)
  g.fillRect(fridgeX - 18, 34, 36, 56)
  g.fillStyle(0xaaaaaa)
  g.fillRect(fridgeX + 8, 58, 4, 14)
  g.fillStyle(0x9a7a50)
  g.fillRect(fridgeX - 22, 30, 44, 4)

  // ── Prep island (y=200–240, x=160–1040) ──────────────────────────────────
  const islandX1 = 160
  const islandX2 = 1040
  const islandY1 = 200
  const islandY2 = 240
  g.fillStyle(0x8b6340)
  g.fillRect(islandX1, islandY1, islandX2 - islandX1, islandY2 - islandY1)
  g.fillStyle(0xaa7a50)
  g.fillRect(islandX1, islandY1, islandX2 - islandX1, 4)
  g.fillStyle(0x6a4a28)
  g.fillRect(islandX1, islandY2 - 4, islandX2 - islandX1, 4)
  g.fillStyle(0x6a4a28)
  g.fillRect(islandX1, islandY1, 8, islandY2 - islandY1)
  g.fillRect(islandX2 - 8, islandY1, 8, islandY2 - islandY1)

  // ── Island station art ───────────────────────────────────────────────────
  const cauldronX = COOK_STATIONS[6].x
  g.fillStyle(0xcc3300)
  g.fillRect(cauldronX - 18, 228, 36, 10)
  g.fillStyle(0xff8800)
  g.fillRect(cauldronX - 14, 224, 28, 10)
  g.fillStyle(0xffcc00)
  g.fillRect(cauldronX - 8, 220, 16, 8)
  g.fillStyle(0x222222)
  g.fillRect(cauldronX - 22, 200, 44, 26)
  g.fillStyle(0x333333)
  g.fillRect(cauldronX - 24, 208, 48, 14)
  g.fillStyle(0x444444)
  g.fillRect(cauldronX - 20, 198, 40, 6)
  g.fillStyle(0x558855)
  g.fillRect(cauldronX - 8, 200, 6, 6)
  g.fillRect(cauldronX + 4, 202, 4, 4)
  g.fillRect(cauldronX - 2, 196, 6, 6)
  g.fillStyle(0x333333)
  g.fillRect(cauldronX - 28, 206, 6, 6)
  g.fillRect(cauldronX + 22, 206, 6, 6)

  const boardX = COOK_STATIONS[7].x
  g.fillStyle(0xc8a060)
  g.fillRect(boardX - 30, 204, 60, 30)
  g.fillStyle(0xaa8040)
  g.fillRect(boardX - 30, 230, 60, 4)
  g.fillRect(boardX + 26, 204, 4, 30)
  g.fillStyle(0x886630)
  g.fillRect(boardX - 20, 210, 1, 18)
  g.fillRect(boardX - 10, 208, 1, 20)
  g.fillRect(boardX,      210, 1, 16)
  g.fillRect(boardX + 10, 212, 1, 14)
  g.fillRect(boardX + 18, 209, 1, 18)
  g.fillStyle(0xaaaaaa)
  g.fillRect(boardX - 24, 216, 36, 4)
  g.fillStyle(0x8b5e2a)
  g.fillRect(boardX - 24, 214, 10, 8)

  const mortarX = COOK_STATIONS[8].x
  g.fillStyle(0x888888)
  g.fillRect(mortarX - 2, 200, 6, 18)
  g.fillStyle(0xaaaaaa)
  g.fillRect(mortarX - 6, 214, 14, 8)
  g.fillStyle(0x888888)
  g.fillRect(mortarX - 20, 218, 40, 20)
  g.fillStyle(0x555555)
  g.fillRect(mortarX - 16, 222, 32, 12)
  g.fillStyle(0x666666)
  g.fillRect(mortarX - 14, 234, 28, 6)
  g.fillStyle(0xddcc88)
  g.fillRect(mortarX - 12, 224, 24, 6)

  // ── Floor/wall station art ────────────────────────────────────────────────
  const barrelX = COOK_STATIONS[9].x
  g.fillStyle(0x3a2208)
  g.fillRect(barrelX - 36, 260, 72, 80)
  g.fillRect(barrelX - 36, 300, 72, 6)
  const barrelColors = [0x7a4a18, 0x5a3a10, 0x8a5a20]
  barrelColors.forEach((col, i) => {
    g.fillStyle(col)
    g.fillRect(barrelX - 28 + i * 20, 264, 16, 30)
    g.fillStyle(0x444422)
    g.fillRect(barrelX - 28 + i * 20, 270, 16, 3)
    g.fillRect(barrelX - 28 + i * 20, 284, 16, 3)
  })
  barrelColors.forEach((col, i) => {
    g.fillStyle(col)
    g.fillRect(barrelX - 28 + i * 20, 308, 16, 28)
    g.fillStyle(0x444422)
    g.fillRect(barrelX - 28 + i * 20, 314, 16, 3)
    g.fillRect(barrelX - 28 + i * 20, 326, 16, 3)
  })
  g.fillStyle(0xddcc88)
  g.fillRect(barrelX - 24, 275, 8, 6)
  g.fillRect(barrelX - 4,  275, 8, 6)
  g.fillRect(barrelX + 16, 275, 8, 6)

  const ovenX = COOK_STATIONS[10].x
  g.fillStyle(0x555550)
  g.fillRect(ovenX - 40, 258, 80, 80)
  g.fillStyle(0xff6600)
  g.fillRect(ovenX - 26, 280, 52, 50)
  g.fillStyle(0xff9900)
  g.fillRect(ovenX - 20, 288, 40, 36)
  g.fillStyle(0xffcc44)
  g.fillRect(ovenX - 10, 296, 20, 20)
  g.fillStyle(0x555550)
  g.fillRect(ovenX - 30, 270, 60, 12)
  g.fillRect(ovenX - 26, 262, 52, 10)
  g.fillRect(ovenX - 18, 258, 36, 6)
  g.fillStyle(0x444440)
  g.fillRect(ovenX - 38, 260, 8, 8)
  g.fillRect(ovenX + 30, 260, 8, 8)
  g.fillRect(ovenX - 38, 300, 8, 8)
  g.fillRect(ovenX + 30, 300, 8, 8)
  g.fillStyle(0x333330)
  g.fillRect(ovenX - 22, 322, 44, 6)

  g.generateTexture('kitchen_bg', width, height)
  g.destroy()
}
