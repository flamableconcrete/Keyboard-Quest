import Phaser from 'phaser'

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

    // Placeholder: load a generated atlas or simple colored rectangles
    // Real assets (pixel art sprites, tilesets, audio) are added here as they are created
    this.load.on('complete', () => {
      bar.destroy()
      this.scene.start('MainMenu')
    })
  }

  create() {}
}