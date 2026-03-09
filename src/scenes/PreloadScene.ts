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
    this.generateWorld2Tileset()
    this.generateWorld3Tileset()
    this.generateWorld4Tileset()
    this.generateWorld5Tileset()
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

  /* ── World 2: The Shadowed Fen tileset (10×4 = 320×128) ── */
  private generateWorld2Tileset(): void {
    const g = this.add.graphics()
    const T = 32

    const drawMud = (col: number, row: number, baseColor: number) => {
      const x = col * T
      const y = row * T
      g.fillStyle(baseColor)
      g.fillRect(x, y, T, T)
      // dark speckles
      g.fillStyle(0x2a2a1a)
      g.fillRect(x + 5, y + 10, 2, 2)
      g.fillRect(x + 18, y + 6, 2, 2)
      g.fillRect(x + 26, y + 22, 2, 2)
      g.fillRect(x + 10, y + 18, 2, 2)
    }

    // Row 0: Ground tiles
    // 0 - dark mud
    drawMud(0, 0, 0x3a3a2a)
    // 1 - dark mud variant
    drawMud(1, 0, 0x343428)
    // 2 - path horizontal (mossy stone path)
    drawMud(2, 0, 0x3a3a2a)
    g.fillStyle(0x4a5a4a)
    g.fillRect(2 * T, 12, T, 8)
    // 3 - path vertical
    drawMud(3, 0, 0x3a3a2a)
    g.fillStyle(0x4a5a4a)
    g.fillRect(3 * T + 12, 0, 8, T)
    // 4 - path corner
    drawMud(4, 0, 0x3a3a2a)
    g.fillStyle(0x4a5a4a)
    g.fillRect(4 * T + 12, 0, 8, 20)
    g.fillRect(4 * T + 12, 12, 20, 8)
    // 5-9 - mud variants
    for (let i = 5; i <= 9; i++) {
      drawMud(i, 0, 0x3a3a2a + (i - 5) * 0x020202)
    }

    // Row 1: Water and special
    // 10 - murky water frame 1
    g.fillStyle(0x1a4a3a)
    g.fillRect(0 * T, 1 * T, T, T)
    g.lineStyle(1, 0x2a5a4a)
    g.lineBetween(0 * T + 3, 1 * T + 10, 0 * T + 29, 1 * T + 10)
    g.lineBetween(0 * T + 5, 1 * T + 22, 0 * T + 27, 1 * T + 22)
    // 11 - murky water frame 2
    g.fillStyle(0x1a4a3a)
    g.fillRect(1 * T, 1 * T, T, T)
    g.lineStyle(1, 0x2a5a4a)
    g.lineBetween(1 * T + 5, 1 * T + 14, 1 * T + 27, 1 * T + 14)
    g.lineBetween(1 * T + 3, 1 * T + 26, 1 * T + 29, 1 * T + 26)
    // 12-19 - reserved (mud)
    for (let i = 2; i <= 9; i++) {
      drawMud(i, 1, 0x3a3a2a)
    }

    // Row 2: Decorations
    // 20 - dead tree top (gray-brown, no leaves)
    drawMud(0, 2, 0x3a3a2a)
    g.fillStyle(0x5a4a3a)
    // bare branches
    g.fillRect(0 * T + 14, 2 * T + 4, 4, 12)
    g.fillRect(0 * T + 8, 2 * T + 6, 6, 3)
    g.fillRect(0 * T + 20, 2 * T + 8, 6, 3)
    g.fillRect(0 * T + 6, 2 * T + 3, 3, 3)
    g.fillRect(0 * T + 24, 2 * T + 5, 3, 3)
    // 21 - dead tree trunk
    drawMud(1, 2, 0x3a3a2a)
    g.fillStyle(0x4a3a2a)
    g.fillRect(1 * T + 13, 2 * T + 2, 6, 26)
    // 22 - lily pad (dark green circle on water-like bg)
    drawMud(2, 2, 0x1a4a3a)
    g.fillStyle(0x2a6a2a)
    g.fillCircle(2 * T + 16, 2 * T + 16, 6)
    g.fillStyle(0x3a7a3a)
    g.fillCircle(2 * T + 14, 2 * T + 14, 3)
    // 23 - cattail
    drawMud(3, 2, 0x3a3a2a)
    g.fillStyle(0x3a5a2a)
    g.fillRect(3 * T + 15, 2 * T + 8, 2, 20)
    g.fillStyle(0x5a3a1a)
    g.fillRect(3 * T + 13, 2 * T + 4, 6, 8)
    // 24 - ruined stone pillar
    drawMud(4, 2, 0x3a3a2a)
    g.fillStyle(0x5a5a5a)
    g.fillRect(4 * T + 10, 2 * T + 6, 12, 22)
    g.fillStyle(0x6a6a6a)
    g.fillRect(4 * T + 8, 2 * T + 4, 16, 4)
    // crumbled top
    g.fillRect(4 * T + 12, 2 * T + 2, 4, 4)
    // 25-29 - reserved (mud)
    for (let i = 5; i <= 9; i++) {
      drawMud(i, 2, 0x3a3a2a)
    }

    // Row 3: More decorations
    // 30 - mossy stone
    drawMud(0, 3, 0x3a3a2a)
    g.fillStyle(0x4a5a4a)
    g.fillRect(0 * T + 8, 3 * T + 14, 16, 12)
    g.fillStyle(0x3a6a3a)
    g.fillRect(0 * T + 6, 3 * T + 12, 8, 4)
    // 31 - mossy stone variant
    drawMud(1, 3, 0x3a3a2a)
    g.fillStyle(0x4a5a4a)
    g.fillRect(1 * T + 6, 3 * T + 16, 20, 10)
    g.fillStyle(0x3a6a3a)
    g.fillRect(1 * T + 10, 3 * T + 14, 12, 4)
    // 32-39 - reserved (mud)
    for (let i = 2; i <= 9; i++) {
      drawMud(i, 3, 0x3a3a2a)
    }

    g.generateTexture('world2-tileset', 10 * T, 4 * T)
    g.destroy()
  }

  /* ── World 3: The Ember Peaks tileset (10×4 = 320×128) ── */
  private generateWorld3Tileset(): void {
    const g = this.add.graphics()
    const T = 32

    const drawRock = (col: number, row: number, baseColor: number) => {
      const x = col * T
      const y = row * T
      g.fillStyle(baseColor)
      g.fillRect(x, y, T, T)
      // cracks
      g.fillStyle(0x2a1a1a)
      g.fillRect(x + 6, y + 12, 3, 1)
      g.fillRect(x + 20, y + 8, 4, 1)
      g.fillRect(x + 12, y + 24, 5, 1)
      g.fillRect(x + 26, y + 18, 3, 1)
    }

    // Row 0: Ground tiles
    // 0 - volcanic rock
    drawRock(0, 0, 0x3a2a2a)
    // 1 - volcanic rock variant
    drawRock(1, 0, 0x342828)
    // 2 - path horizontal (ash stone path)
    drawRock(2, 0, 0x3a2a2a)
    g.fillStyle(0x5a5a5a)
    g.fillRect(2 * T, 12, T, 8)
    // 3 - path vertical
    drawRock(3, 0, 0x3a2a2a)
    g.fillStyle(0x5a5a5a)
    g.fillRect(3 * T + 12, 0, 8, T)
    // 4 - path corner
    drawRock(4, 0, 0x3a2a2a)
    g.fillStyle(0x5a5a5a)
    g.fillRect(4 * T + 12, 0, 8, 20)
    g.fillRect(4 * T + 12, 12, 20, 8)
    // 5 - ash stone
    drawRock(5, 0, 0x5a5a5a)
    // 6 - cracked earth
    drawRock(6, 0, 0x4a3a2a)
    g.lineStyle(1, 0x2a1a0a)
    g.lineBetween(6 * T + 8, 6, 6 * T + 16, 20)
    g.lineBetween(6 * T + 20, 8, 6 * T + 28, 26)
    // 7-9 - rock variants
    for (let i = 7; i <= 9; i++) {
      drawRock(i, 0, 0x3a2a2a + (i - 7) * 0x020202)
    }

    // Row 1: Lava and special
    // 10 - lava flow frame 1
    g.fillStyle(0xff4400)
    g.fillRect(0 * T, 1 * T, T, T)
    g.fillStyle(0xff6600)
    g.fillRect(0 * T + 4, 1 * T + 6, 8, 4)
    g.fillRect(0 * T + 16, 1 * T + 18, 10, 4)
    g.fillStyle(0xffaa00)
    g.fillRect(0 * T + 8, 1 * T + 12, 6, 3)
    // 11 - lava flow frame 2
    g.fillStyle(0xff4400)
    g.fillRect(1 * T, 1 * T, T, T)
    g.fillStyle(0xff6600)
    g.fillRect(1 * T + 8, 1 * T + 10, 10, 4)
    g.fillRect(1 * T + 4, 1 * T + 22, 8, 4)
    g.fillStyle(0xffaa00)
    g.fillRect(1 * T + 16, 1 * T + 8, 6, 3)
    // 12-19 - reserved (rock)
    for (let i = 2; i <= 9; i++) {
      drawRock(i, 1, 0x3a2a2a)
    }

    // Row 2: Decorations
    // 20 - obsidian spire (black pointed)
    drawRock(0, 2, 0x3a2a2a)
    g.fillStyle(0x1a1a1a)
    const spire = new Phaser.Geom.Triangle(0 * T + 10, 2 * T + 28, 0 * T + 16, 2 * T + 4, 0 * T + 22, 2 * T + 28)
    g.fillTriangleShape(spire)
    g.fillStyle(0x2a2a3a)
    g.fillRect(0 * T + 14, 2 * T + 10, 4, 4)
    // 21 - obsidian spire tall
    drawRock(1, 2, 0x3a2a2a)
    g.fillStyle(0x1a1a1a)
    const tallSpire = new Phaser.Geom.Triangle(1 * T + 12, 2 * T + 30, 1 * T + 16, 2 * T + 2, 1 * T + 20, 2 * T + 30)
    g.fillTriangleShape(tallSpire)
    // 22 - smoldering stump
    drawRock(2, 2, 0x3a2a2a)
    g.fillStyle(0x3a2a1a)
    g.fillRect(2 * T + 10, 2 * T + 14, 12, 14)
    g.fillStyle(0xff6600)
    g.fillRect(2 * T + 12, 2 * T + 12, 8, 4)
    // 23 - ember vent
    drawRock(3, 2, 0x3a2a2a)
    g.fillStyle(0x2a2a2a)
    g.fillCircle(3 * T + 16, 2 * T + 18, 8)
    g.fillStyle(0xff4400)
    g.fillCircle(3 * T + 16, 2 * T + 18, 4)
    // 24 - boulder
    drawRock(4, 2, 0x3a2a2a)
    g.fillStyle(0x4a4a4a)
    g.fillCircle(4 * T + 16, 2 * T + 18, 10)
    g.fillStyle(0x5a5a5a)
    g.fillCircle(4 * T + 13, 2 * T + 15, 4)
    // 25-29 - reserved (rock)
    for (let i = 5; i <= 9; i++) {
      drawRock(i, 2, 0x3a2a2a)
    }

    // Row 3: More decorations
    // 30 - lava crack
    drawRock(0, 3, 0x3a2a2a)
    g.lineStyle(2, 0xff4400)
    g.lineBetween(0 * T + 6, 3 * T + 8, 0 * T + 16, 3 * T + 20)
    g.lineBetween(0 * T + 16, 3 * T + 20, 0 * T + 26, 3 * T + 14)
    // 31 - scorched ground
    drawRock(1, 3, 0x2a1a1a)
    g.fillStyle(0x3a2a1a)
    g.fillRect(1 * T + 4, 3 * T + 4, 24, 24)
    // 32-39 - reserved (rock)
    for (let i = 2; i <= 9; i++) {
      drawRock(i, 3, 0x3a2a2a)
    }

    g.generateTexture('world3-tileset', 10 * T, 4 * T)
    g.destroy()
  }

  /* ── World 4: The Shrouded Wilds tileset (10×4 = 320×128) ── */
  private generateWorld4Tileset(): void {
    const g = this.add.graphics()
    const T = 32

    const drawForest = (col: number, row: number, baseColor: number) => {
      const x = col * T
      const y = row * T
      g.fillStyle(baseColor)
      g.fillRect(x, y, T, T)
      // leaf litter
      g.fillStyle(0x1a3a1a)
      g.fillRect(x + 4, y + 10, 2, 2)
      g.fillRect(x + 16, y + 6, 2, 2)
      g.fillRect(x + 24, y + 20, 2, 2)
      g.fillRect(x + 8, y + 26, 2, 2)
    }

    // Row 0: Ground tiles
    // 0 - dense forest floor
    drawForest(0, 0, 0x2a4a2a)
    // 1 - forest floor variant
    drawForest(1, 0, 0x264626)
    // 2 - path horizontal (root path)
    drawForest(2, 0, 0x2a4a2a)
    g.fillStyle(0x4a3a1a)
    g.fillRect(2 * T, 12, T, 8)
    // 3 - path vertical
    drawForest(3, 0, 0x2a4a2a)
    g.fillStyle(0x4a3a1a)
    g.fillRect(3 * T + 12, 0, 8, T)
    // 4 - path corner
    drawForest(4, 0, 0x2a4a2a)
    g.fillStyle(0x4a3a1a)
    g.fillRect(4 * T + 12, 0, 8, 20)
    g.fillRect(4 * T + 12, 12, 20, 8)
    // 5 - tangled roots
    drawForest(5, 0, 0x2a4a2a)
    g.fillStyle(0x4a3a1a)
    g.lineStyle(2, 0x4a3a1a)
    g.lineBetween(5 * T + 4, 8, 5 * T + 16, 20)
    g.lineBetween(5 * T + 20, 4, 5 * T + 28, 24)
    g.lineBetween(5 * T + 8, 26, 5 * T + 24, 12)
    // 6 - overgrown stone
    drawForest(6, 0, 0x5a6a4a)
    g.fillStyle(0x3a5a2a)
    g.fillRect(6 * T + 2, 4, 6, 4)
    g.fillRect(6 * T + 22, 8, 6, 4)
    // 7-9 - forest variants
    for (let i = 7; i <= 9; i++) {
      drawForest(i, 0, 0x2a4a2a + (i - 7) * 0x020402)
    }

    // Row 1: Moss and special
    // 10 - deep moss frame 1
    g.fillStyle(0x1a5a2a)
    g.fillRect(0 * T, 1 * T, T, T)
    g.fillStyle(0x2a6a3a)
    g.fillRect(0 * T + 6, 1 * T + 8, 8, 4)
    g.fillRect(0 * T + 18, 1 * T + 20, 8, 4)
    // 11 - deep moss frame 2
    g.fillStyle(0x1a5a2a)
    g.fillRect(1 * T, 1 * T, T, T)
    g.fillStyle(0x2a6a3a)
    g.fillRect(1 * T + 10, 1 * T + 12, 8, 4)
    g.fillRect(1 * T + 4, 1 * T + 24, 8, 4)
    // 12-19 - reserved (forest)
    for (let i = 2; i <= 9; i++) {
      drawForest(i, 1, 0x2a4a2a)
    }

    // Row 2: Decorations
    // 20 - giant mushroom (red cap with white spots)
    drawForest(0, 2, 0x2a4a2a)
    g.fillStyle(0xcc2222)
    g.fillCircle(0 * T + 16, 2 * T + 10, 10)
    g.fillStyle(0xffffff)
    g.fillCircle(0 * T + 12, 2 * T + 8, 2)
    g.fillCircle(0 * T + 20, 2 * T + 7, 2)
    g.fillCircle(0 * T + 16, 2 * T + 12, 2)
    g.fillStyle(0x8a6a4a)
    g.fillRect(0 * T + 14, 2 * T + 18, 4, 10)
    // 21 - mushroom cluster
    drawForest(1, 2, 0x2a4a2a)
    g.fillStyle(0xcc2222)
    g.fillCircle(1 * T + 10, 2 * T + 14, 6)
    g.fillCircle(1 * T + 22, 2 * T + 16, 5)
    g.fillStyle(0xffffff)
    g.fillCircle(1 * T + 8, 2 * T + 12, 1)
    g.fillCircle(1 * T + 21, 2 * T + 14, 1)
    g.fillStyle(0x8a6a4a)
    g.fillRect(1 * T + 9, 2 * T + 20, 2, 6)
    g.fillRect(1 * T + 21, 2 * T + 21, 2, 5)
    // 22 - ancient tree top (dark bark, green canopy)
    drawForest(2, 2, 0x2a4a2a)
    g.fillStyle(0x1a4a1a)
    g.fillCircle(2 * T + 16, 2 * T + 12, 13)
    g.fillStyle(0x2a5a2a)
    g.fillCircle(2 * T + 12, 2 * T + 8, 5)
    g.fillCircle(2 * T + 22, 2 * T + 10, 4)
    // 23 - ancient tree trunk
    drawForest(3, 2, 0x2a4a2a)
    g.fillStyle(0x3a2a1a)
    g.fillRect(3 * T + 11, 2 * T + 2, 10, 26)
    g.fillStyle(0x4a3a2a)
    g.fillRect(3 * T + 8, 2 * T + 20, 4, 8)
    g.fillRect(3 * T + 20, 2 * T + 22, 4, 6)
    // 24 - glowing moss (bright green-yellow patches)
    drawForest(4, 2, 0x2a4a2a)
    g.fillStyle(0x88cc44)
    g.fillCircle(4 * T + 10, 2 * T + 14, 5)
    g.fillCircle(4 * T + 22, 2 * T + 20, 4)
    g.fillStyle(0xaaee66)
    g.fillCircle(4 * T + 10, 2 * T + 12, 2)
    // 25 - spider web
    drawForest(5, 2, 0x2a4a2a)
    g.lineStyle(1, 0xdddddd, 0.6)
    g.lineBetween(5 * T + 4, 2 * T + 4, 5 * T + 28, 2 * T + 28)
    g.lineBetween(5 * T + 28, 2 * T + 4, 5 * T + 4, 2 * T + 28)
    g.lineBetween(5 * T + 16, 2 * T + 4, 5 * T + 16, 2 * T + 28)
    g.lineBetween(5 * T + 4, 2 * T + 16, 5 * T + 28, 2 * T + 16)
    // 26-29 - reserved
    for (let i = 6; i <= 9; i++) {
      drawForest(i, 2, 0x2a4a2a)
    }

    // Row 3: More decorations
    // 30 - twisted root
    drawForest(0, 3, 0x2a4a2a)
    g.fillStyle(0x4a3a1a)
    g.lineStyle(3, 0x4a3a1a)
    g.lineBetween(0 * T + 4, 3 * T + 24, 0 * T + 16, 3 * T + 10)
    g.lineBetween(0 * T + 16, 3 * T + 10, 0 * T + 28, 3 * T + 20)
    // 31 - fern
    drawForest(1, 3, 0x2a4a2a)
    g.fillStyle(0x3a7a2a)
    g.fillRect(1 * T + 15, 3 * T + 8, 2, 18)
    // fronds
    g.lineStyle(2, 0x3a7a2a)
    g.lineBetween(1 * T + 16, 3 * T + 10, 1 * T + 6, 3 * T + 16)
    g.lineBetween(1 * T + 16, 3 * T + 10, 1 * T + 26, 3 * T + 16)
    g.lineBetween(1 * T + 16, 3 * T + 16, 1 * T + 8, 3 * T + 22)
    g.lineBetween(1 * T + 16, 3 * T + 16, 1 * T + 24, 3 * T + 22)
    // 32-39 - reserved
    for (let i = 2; i <= 9; i++) {
      drawForest(i, 3, 0x2a4a2a)
    }

    g.generateTexture('world4-tileset', 10 * T, 4 * T)
    g.destroy()
  }

  /* ── World 5: The Typemancer's Tower tileset (10×4 = 320×128) ── */
  private generateWorld5Tileset(): void {
    const g = this.add.graphics()
    const T = 32

    const drawArcane = (col: number, row: number, baseColor: number) => {
      const x = col * T
      const y = row * T
      g.fillStyle(baseColor)
      g.fillRect(x, y, T, T)
      // tile pattern lines
      g.lineStyle(1, 0x3a2a4a, 0.4)
      g.lineBetween(x, y + 16, x + T, y + 16)
      g.lineBetween(x + 16, y, x + 16, y + T)
    }

    // Row 0: Ground tiles
    // 0 - arcane tile floor
    drawArcane(0, 0, 0x2a1a3a)
    // 1 - arcane tile variant
    drawArcane(1, 0, 0x281838)
    // 2 - path horizontal (gold-trimmed)
    drawArcane(2, 0, 0x2a1a3a)
    g.fillStyle(0x8a7a2a)
    g.fillRect(2 * T, 12, T, 8)
    // 3 - path vertical
    drawArcane(3, 0, 0x2a1a3a)
    g.fillStyle(0x8a7a2a)
    g.fillRect(3 * T + 12, 0, 8, T)
    // 4 - path corner
    drawArcane(4, 0, 0x2a1a3a)
    g.fillStyle(0x8a7a2a)
    g.fillRect(4 * T + 12, 0, 8, 20)
    g.fillRect(4 * T + 12, 12, 20, 8)
    // 5 - floating stone
    g.fillStyle(0x0a0a1a)
    g.fillRect(5 * T, 0, T, T)
    g.fillStyle(0x5a4a6a)
    g.fillRect(5 * T + 4, 6, 24, 20)
    g.fillStyle(0x6a5a7a)
    g.fillRect(5 * T + 6, 4, 20, 4)
    // 6-9 - arcane variants
    for (let i = 6; i <= 9; i++) {
      drawArcane(i, 0, 0x2a1a3a + (i - 6) * 0x020102)
    }

    // Row 1: Void and special
    // 10 - void/starfield frame 1
    g.fillStyle(0x0a0a1a)
    g.fillRect(0 * T, 1 * T, T, T)
    g.fillStyle(0xffffff)
    g.fillRect(0 * T + 6, 1 * T + 8, 1, 1)
    g.fillRect(0 * T + 18, 1 * T + 4, 1, 1)
    g.fillRect(0 * T + 24, 1 * T + 16, 1, 1)
    g.fillRect(0 * T + 10, 1 * T + 24, 1, 1)
    g.fillRect(0 * T + 28, 1 * T + 28, 1, 1)
    g.fillRect(0 * T + 14, 1 * T + 14, 1, 1)
    // 11 - void/starfield frame 2
    g.fillStyle(0x0a0a1a)
    g.fillRect(1 * T, 1 * T, T, T)
    g.fillStyle(0xffffff)
    g.fillRect(1 * T + 8, 1 * T + 12, 1, 1)
    g.fillRect(1 * T + 20, 1 * T + 6, 1, 1)
    g.fillRect(1 * T + 4, 1 * T + 20, 1, 1)
    g.fillRect(1 * T + 26, 1 * T + 10, 1, 1)
    g.fillRect(1 * T + 16, 1 * T + 26, 1, 1)
    g.fillRect(1 * T + 12, 1 * T + 18, 1, 1)
    // 12-19 - reserved (arcane)
    for (let i = 2; i <= 9; i++) {
      drawArcane(i, 1, 0x2a1a3a)
    }

    // Row 2: Decorations
    // 20 - crystal pillar (blue-purple)
    drawArcane(0, 2, 0x2a1a3a)
    g.fillStyle(0x4466aa, 0.7)
    g.fillRect(0 * T + 12, 2 * T + 4, 8, 24)
    g.fillStyle(0x6688cc, 0.5)
    g.fillRect(0 * T + 14, 2 * T + 6, 4, 20)
    // 21 - crystal pillar tall
    drawArcane(1, 2, 0x2a1a3a)
    g.fillStyle(0x4466aa, 0.7)
    g.fillRect(1 * T + 10, 2 * T + 2, 12, 28)
    g.fillStyle(0x6688cc, 0.5)
    g.fillRect(1 * T + 12, 2 * T + 4, 8, 24)
    g.fillStyle(0x88aaee)
    g.fillRect(1 * T + 14, 2 * T + 2, 4, 4)
    // 22 - runic circle (gold outline on floor)
    drawArcane(2, 2, 0x2a1a3a)
    g.lineStyle(1, 0xffd700, 0.8)
    g.strokeCircle(2 * T + 16, 2 * T + 16, 10)
    g.strokeCircle(2 * T + 16, 2 * T + 16, 6)
    g.fillStyle(0xffd700)
    g.fillRect(2 * T + 15, 2 * T + 6, 2, 20)
    g.fillRect(2 * T + 6, 2 * T + 15, 20, 2)
    // 23 - floating book
    drawArcane(3, 2, 0x2a1a3a)
    g.fillStyle(0x6b4c2a)
    g.fillRect(3 * T + 8, 2 * T + 10, 16, 12)
    g.fillStyle(0xeeeeee)
    g.fillRect(3 * T + 10, 2 * T + 12, 12, 8)
    g.fillStyle(0x6b4c2a)
    g.fillRect(3 * T + 15, 2 * T + 10, 2, 12)
    // 24 - enchanted brazier (purple fire)
    drawArcane(4, 2, 0x2a1a3a)
    g.fillStyle(0x4a4a4a)
    g.fillRect(4 * T + 10, 2 * T + 18, 12, 10)
    g.fillRect(4 * T + 8, 2 * T + 16, 16, 4)
    g.fillStyle(0x8844ff)
    const flame = new Phaser.Geom.Triangle(4 * T + 10, 2 * T + 16, 4 * T + 16, 2 * T + 4, 4 * T + 22, 2 * T + 16)
    g.fillTriangleShape(flame)
    g.fillStyle(0xaa66ff)
    const innerFlame = new Phaser.Geom.Triangle(4 * T + 13, 2 * T + 16, 4 * T + 16, 2 * T + 8, 4 * T + 19, 2 * T + 16)
    g.fillTriangleShape(innerFlame)
    // 25 - magic rune
    drawArcane(5, 2, 0x2a1a3a)
    g.fillStyle(0xffd700, 0.6)
    g.fillRect(5 * T + 14, 2 * T + 8, 4, 16)
    g.fillRect(5 * T + 8, 2 * T + 14, 16, 4)
    g.fillStyle(0xffd700, 0.4)
    g.fillRect(5 * T + 10, 2 * T + 10, 2, 2)
    g.fillRect(5 * T + 20, 2 * T + 10, 2, 2)
    g.fillRect(5 * T + 10, 2 * T + 20, 2, 2)
    g.fillRect(5 * T + 20, 2 * T + 20, 2, 2)
    // 26-29 - reserved
    for (let i = 6; i <= 9; i++) {
      drawArcane(i, 2, 0x2a1a3a)
    }

    // Row 3: More decorations
    // 30 - arcane symbol
    drawArcane(0, 3, 0x2a1a3a)
    g.lineStyle(1, 0x8844ff, 0.6)
    g.strokeCircle(0 * T + 16, 3 * T + 16, 10)
    const triSymbol = new Phaser.Geom.Triangle(0 * T + 16, 3 * T + 6, 0 * T + 8, 3 * T + 24, 0 * T + 24, 3 * T + 24)
    g.strokeTriangleShape(triSymbol)
    // 31 - starfield patch
    g.fillStyle(0x0a0a1a)
    g.fillRect(1 * T, 3 * T, T, T)
    g.fillStyle(0xffffff)
    g.fillRect(1 * T + 4, 3 * T + 6, 2, 2)
    g.fillRect(1 * T + 16, 3 * T + 4, 1, 1)
    g.fillRect(1 * T + 26, 3 * T + 12, 2, 2)
    g.fillRect(1 * T + 8, 3 * T + 20, 1, 1)
    g.fillRect(1 * T + 20, 3 * T + 24, 2, 2)
    g.fillRect(1 * T + 12, 3 * T + 14, 1, 1)
    g.fillStyle(0x4488ff)
    g.fillRect(1 * T + 22, 3 * T + 18, 1, 1)
    g.fillRect(1 * T + 6, 3 * T + 28, 1, 1)
    // 32-39 - reserved
    for (let i = 2; i <= 9; i++) {
      drawArcane(i, 3, 0x2a1a3a)
    }

    g.generateTexture('world5-tileset', 10 * T, 4 * T)
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