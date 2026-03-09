import Phaser from 'phaser'
import { AvatarRenderer } from '../components/AvatarRenderer'

export class PreloadScene extends Phaser.Scene {
  constructor() { super('Preload') }

  preload() {
    const { width, height } = this.scale

    // Loading bar
    const bar = this.add.graphics()
    this.load.on('progress', (value: number) => {
      bar.clear()
      bar.fillStyle(0xffd700)
      bar.fillRect(width * 0.1, height * 0.5, width * 0.8 * value, 20)
    })

    this.add.text(width / 2, height * 0.5 - 40, 'Loading...', {
      fontSize: '24px', color: '#ffffff'
    }).setOrigin(0.5)

    // Generate placeholder textures
    const g = this.add.graphics()

    // tile-grass (Green square)
    g.fillStyle(0x34c924)
    g.fillRect(0, 0, 32, 32)
    g.generateTexture('tile-grass', 32, 32)
    g.clear()

    // tile-dirt (Brown square)
    g.fillStyle(0x8b5a2b)
    g.fillRect(0, 0, 32, 32)
    g.generateTexture('tile-dirt', 32, 32)
    g.clear()

    // tile-water (Blue square)
    g.fillStyle(0x248bc9)
    g.fillRect(0, 0, 32, 32)
    g.generateTexture('tile-water', 32, 32)
    g.clear()

    // avatar (White circle)
    g.fillStyle(0xffffff)
    g.fillCircle(16, 16, 14)
    g.generateTexture('avatar', 32, 32)
    g.clear()

    // node-castle (Gray castle with battlements)
    g.fillStyle(0xaaaaaa)
    g.fillRect(4, 12, 24, 20)
    g.fillRect(4, 4, 6, 8)
    g.fillRect(13, 4, 6, 8)
    g.fillRect(22, 4, 6, 8)
    g.generateTexture('node-castle', 32, 32)
    g.clear()

    // node-cave (Dark gray arch)
    g.fillStyle(0x444444)
    g.fillCircle(16, 20, 12)
    g.fillRect(4, 20, 24, 12)
    g.fillStyle(0x000000)
    g.fillCircle(16, 24, 6)
    g.fillRect(10, 24, 12, 8)
    g.generateTexture('node-cave', 32, 32)
    g.clear()

    // node-boss (Red skull)
    g.fillStyle(0xff0000)
    g.fillCircle(16, 16, 12)
    g.fillStyle(0x000000)
    g.fillCircle(12, 14, 3)
    g.fillCircle(20, 14, 3)
    g.fillRect(12, 22, 8, 4)
    g.generateTexture('node-boss', 32, 32)
    g.clear()

    g.destroy()

    this.generateWorld1Tileset()
    this.generateCommonMapSheet()

    // Real assets (pixel art sprites, tilesets, audio) are added here as they are created
    this.load.on('complete', () => {
      bar.destroy()
      this.scene.start('MainMenu')
    })
  }

  create() {
    AvatarRenderer.generateAll(this)
  }

  /* ── Task 3: World 1 placeholder tileset (10×4 = 320×128) ── */
  private generateWorld1Tileset(): void {
    const g = this.add.graphics()
    const T = 32 // tile size

    const drawGrass = (col: number, row: number, baseColor: number) => {
      const x = col * T
      const y = row * T
      g.fillStyle(baseColor)
      g.fillRect(x, y, T, T)
      // detail dots
      g.fillStyle(0x3a7c1a)
      g.fillRect(x + 4, y + 8, 2, 2)
      g.fillRect(x + 14, y + 22, 2, 2)
      g.fillRect(x + 24, y + 6, 2, 2)
      g.fillRect(x + 10, y + 16, 2, 2)
    }

    // Row 0: Ground tiles
    // 0 - grass plain
    drawGrass(0, 0, 0x4a8c2a)
    // 1 - grass variant
    drawGrass(1, 0, 0x5a9c3a)
    // 2 - dirt path horizontal
    drawGrass(2, 0, 0x4a8c2a)
    g.fillStyle(0x8b6b3a)
    g.fillRect(2 * T, 12, T, 8)
    // 3 - dirt path vertical
    drawGrass(3, 0, 0x4a8c2a)
    g.fillStyle(0x8b6b3a)
    g.fillRect(3 * T + 12, 0, 8, T)
    // 4 - dirt corner
    drawGrass(4, 0, 0x4a8c2a)
    g.fillStyle(0x8b6b3a)
    g.fillRect(4 * T + 12, 0, 8, 20)
    g.fillRect(4 * T + 12, 12, 20, 8)
    // 5-9 - grass variants
    for (let i = 5; i <= 9; i++) {
      drawGrass(i, 0, 0x4a8c2a + (i - 5) * 0x040404)
    }

    // Row 1: Water and bridges
    // 10 - water frame 1
    g.fillStyle(0x2878b8)
    g.fillRect(0 * T, 1 * T, T, T)
    g.lineStyle(1, 0x5098d0)
    g.lineBetween(0 * T + 2, 1 * T + 8, 0 * T + 30, 1 * T + 8)
    g.lineBetween(0 * T + 4, 1 * T + 20, 0 * T + 28, 1 * T + 20)
    // 11 - water frame 2
    g.fillStyle(0x2878b8)
    g.fillRect(1 * T, 1 * T, T, T)
    g.lineStyle(1, 0x5098d0)
    g.lineBetween(1 * T + 4, 1 * T + 12, 1 * T + 28, 1 * T + 12)
    g.lineBetween(1 * T + 2, 1 * T + 24, 1 * T + 30, 1 * T + 24)
    // 12 - bridge
    g.fillStyle(0x6b5c3a)
    g.fillRect(2 * T, 1 * T + 4, T, 24)
    g.fillStyle(0x8b7c5a)
    g.fillRect(2 * T + 2, 1 * T + 2, 4, 28)
    g.fillRect(2 * T + 26, 1 * T + 2, 4, 28)
    // 13-19 - reserved (grass)
    for (let i = 3; i <= 9; i++) {
      drawGrass(i, 1, 0x4a8c2a)
    }

    // Row 2: Decorations
    // 20 - oak tree top
    drawGrass(0, 2, 0x4a8c2a)
    g.fillStyle(0x2d6b1a)
    g.fillCircle(0 * T + 16, 2 * T + 14, 12)
    g.fillStyle(0x3d8b2a)
    g.fillCircle(0 * T + 12, 2 * T + 10, 5)
    // 21 - oak tree trunk
    drawGrass(1, 2, 0x4a8c2a)
    g.fillStyle(0x6b4c2a)
    g.fillRect(1 * T + 12, 2 * T + 2, 8, 24)
    g.fillStyle(0x4a8c2a)
    g.fillRect(1 * T, 2 * T + 26, T, 6)
    // 22 - wildflowers
    drawGrass(2, 2, 0x4a8c2a)
    g.fillStyle(0xff88aa)
    g.fillCircle(2 * T + 8, 2 * T + 10, 3)
    g.fillCircle(2 * T + 24, 2 * T + 22, 3)
    g.fillStyle(0xffdd44)
    g.fillCircle(2 * T + 16, 2 * T + 18, 3)
    g.fillStyle(0xff88aa)
    g.fillCircle(2 * T + 22, 2 * T + 8, 3)
    // 23 - hay bale
    drawGrass(3, 2, 0x4a8c2a)
    g.fillStyle(0xccaa44)
    g.fillCircle(3 * T + 16, 2 * T + 18, 8)
    g.fillStyle(0xbbaa33)
    g.fillRect(3 * T + 8, 2 * T + 20, 16, 6)
    // 24 - fence horizontal
    drawGrass(4, 2, 0x4a8c2a)
    g.fillStyle(0x8b6b3a)
    g.fillRect(4 * T, 2 * T + 12, T, 4)
    g.fillRect(4 * T + 4, 2 * T + 6, 4, 16)
    g.fillRect(4 * T + 24, 2 * T + 6, 4, 16)
    // 25-29 - reserved (grass)
    for (let i = 5; i <= 9; i++) {
      drawGrass(i, 2, 0x4a8c2a)
    }

    // Row 3: Cottage
    // 30 - cottage left
    drawGrass(0, 3, 0x4a8c2a)
    g.fillStyle(0x884422)
    g.fillRect(0 * T + 2, 3 * T + 12, 28, 18)
    g.fillStyle(0xcc4444)
    const roofL = new Phaser.Geom.Triangle(0 * T + 0, 3 * T + 14, 0 * T + 16, 3 * T + 2, 0 * T + 32, 3 * T + 14)
    g.fillTriangleShape(roofL)
    // 31 - cottage right
    drawGrass(1, 3, 0x4a8c2a)
    g.fillStyle(0x884422)
    g.fillRect(1 * T + 2, 3 * T + 12, 28, 18)
    g.fillStyle(0xcc4444)
    const roofR = new Phaser.Geom.Triangle(1 * T + 0, 3 * T + 14, 1 * T + 16, 3 * T + 2, 1 * T + 32, 3 * T + 14)
    g.fillTriangleShape(roofR)
    g.fillStyle(0x666666)
    g.fillRect(1 * T + 22, 3 * T + 0, 6, 14)
    // 32-39 - reserved (grass)
    for (let i = 2; i <= 9; i++) {
      drawGrass(i, 3, 0x4a8c2a)
    }

    g.generateTexture('world1-tileset', 10 * T, 4 * T)
    g.destroy()
  }

  /* ── Task 5: Common map spritesheet (8×2 = 256×64) ── */
  private generateCommonMapSheet(): void {
    const g = this.add.graphics()
    const T = 32

    // Helper: fill a cell background with transparent (just skip, texture starts transparent)

    // Row 0: Nodes and stars
    // 0 - node-level: gray stone tower with white banner
    g.fillStyle(0x888888)
    g.fillRect(0 * T + 8, 0 * T + 6, 16, 24)
    g.fillRect(0 * T + 6, 0 * T + 4, 20, 4)
    g.fillStyle(0xaaaaaa)
    g.fillRect(0 * T + 6, 0 * T + 2, 20, 4)
    g.fillStyle(0xffffff)
    g.fillRect(0 * T + 13, 0 * T + 10, 6, 10)

    // 1 - node-miniboss: dark gatehouse with red spikes
    g.fillStyle(0x666666)
    g.fillRect(1 * T + 4, 1, 24, 30)
    g.fillRect(1 * T + 2, 0, 6, 8)
    g.fillRect(1 * T + 24, 0, 6, 8)
    g.fillStyle(0xcc4444)
    g.fillTriangleShape(new Phaser.Geom.Triangle(1 * T + 5, 0, 1 * T + 8, -6 + T, 1 * T + 2, 0))
    g.fillRect(1 * T + 10, 0, 4, 4)
    g.fillRect(1 * T + 18, 0, 4, 4)

    // 2 - node-boss: dark castle with red skull
    g.fillStyle(0x555555)
    g.fillRect(2 * T + 4, 6, 24, 26)
    g.fillRect(2 * T + 2, 2, 8, 10)
    g.fillRect(2 * T + 22, 2, 8, 10)
    g.fillStyle(0xcc0000)
    g.fillCircle(2 * T + 16, 16, 6)
    g.fillStyle(0x000000)
    g.fillCircle(2 * T + 14, 14, 2)
    g.fillCircle(2 * T + 18, 14, 2)

    // 3 - node-tavern: brown timber frame with yellow window/sign
    g.fillStyle(0x8b6b3a)
    g.fillRect(3 * T + 4, 8, 24, 22)
    g.fillStyle(0x6b4b2a)
    g.fillRect(3 * T + 4, 4, 24, 6)
    g.fillStyle(0xffdd44)
    g.fillRect(3 * T + 12, 14, 8, 6)
    g.fillRect(3 * T + 10, 4, 12, 4)

    // 4 - node-stable: darker brown barn with fence posts
    g.fillStyle(0x884422)
    g.fillRect(4 * T + 4, 8, 24, 22)
    g.fillStyle(0xaa5533)
    const barnRoof = new Phaser.Geom.Triangle(4 * T + 2, 10, 4 * T + 16, 0, 4 * T + 30, 10)
    g.fillTriangleShape(barnRoof)
    g.fillStyle(0x6b4c2a)
    g.fillRect(4 * T + 2, 26, 4, 6)
    g.fillRect(4 * T + 26, 26, 4, 6)

    // 5 - node-inventory: brown chest with gold clasp
    g.fillStyle(0x8b6b3a)
    g.fillRect(5 * T + 6, 10, 20, 16)
    g.fillStyle(0x6b4b2a)
    g.fillRect(5 * T + 6, 10, 20, 4)
    g.fillStyle(0xffd700)
    g.fillRect(5 * T + 14, 14, 4, 6)

    // 6 - star filled: gold cross/star shape
    g.fillStyle(0xffd700)
    g.fillRect(6 * T + 12, 4, 8, 24)
    g.fillRect(6 * T + 4, 12, 24, 8)
    g.fillRect(6 * T + 8, 8, 16, 16)

    // 7 - star empty: dark gray same shape
    g.fillStyle(0x444444)
    g.fillRect(7 * T + 12, 4, 8, 24)
    g.fillRect(7 * T + 4, 12, 24, 8)
    g.fillRect(7 * T + 8, 8, 16, 16)

    // Row 1: Particles and misc
    // 8 - particle dot (white circle radius 3)
    g.fillStyle(0xffffff)
    g.fillCircle(0 * T + 16, 1 * T + 16, 3)

    // 9 - particle spark (yellow cross)
    g.fillStyle(0xffff88)
    g.fillRect(1 * T + 14, 1 * T + 8, 4, 16)
    g.fillRect(1 * T + 8, 1 * T + 14, 16, 4)

    // 10 - particle leaf (green ellipse)
    g.fillStyle(0x44aa22)
    g.fillEllipse(2 * T + 16, 1 * T + 16, 12, 6)

    // 11 - particle dust (tan circle radius 4)
    g.fillStyle(0xccaa88)
    g.fillCircle(3 * T + 16, 1 * T + 16, 4)

    // 12 - lock overlay (gray padlock shape)
    g.fillStyle(0x888888)
    g.fillRect(4 * T + 10, 1 * T + 14, 12, 12)
    g.lineStyle(3, 0x888888)
    g.strokeCircle(4 * T + 16, 1 * T + 12, 6)

    // 13-15 reserved (empty)

    g.generateTexture('map-common', 8 * T, 2 * T)
    g.destroy()

    // Add as spritesheets with 32×32 frame size
    this.textures.get('map-common').add(
      '__BASE', 0, 0, 0, 8 * T, 2 * T
    )
    if (!this.textures.exists('map-common-sheet')) {
      const tex = this.textures.get('map-common')
      // Add individual frames for spritesheet access
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 8; col++) {
          tex.add(row * 8 + col, 0, col * T, row * T, T, T)
        }
      }
    }
  }
}