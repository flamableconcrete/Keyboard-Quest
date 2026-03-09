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

    // Real assets (pixel art sprites, tilesets, audio) are added here as they are created
    this.load.on('complete', () => {
      bar.destroy()
      this.scene.start('MainMenu')
    })
  }

  create() {
    AvatarRenderer.generateAll(this)
  }
}