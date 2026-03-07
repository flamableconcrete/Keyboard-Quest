// src/scenes/LevelIntroScene.ts
import Phaser from 'phaser'
import { LevelConfig } from '../types'

export class LevelIntroScene extends Phaser.Scene {
  private level!: LevelConfig
  private profileSlot!: number
  private typingBuffer = ''
  private target = ''
  private displayText!: Phaser.GameObjects.Text
  private errorFlash = false

  constructor() { super('LevelIntro') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.typingBuffer = ''
    // Target is level name, letters only, lowercase, spaces ignored
    this.target = this.level.name.toLowerCase().replace(/[^a-z]/g, '')
  }

  create() {
    const { width, height } = this.scale

    this.add.text(width / 2, height * 0.2, this.level.name, {
      fontSize: '52px', color: '#ffd700', fontStyle: 'bold'
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.32, this.level.storyBeat, {
      fontSize: '20px', color: '#cccccc', wordWrap: { width: 800 }, align: 'center'
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.52, 'Type the level name to enter:', {
      fontSize: '22px', color: '#aaaaaa'
    }).setOrigin(0.5)

    // Show target word with progress
    this.displayText = this.add.text(width / 2, height * 0.62, this.target, {
      fontSize: '40px', color: '#888888'
    }).setOrigin(0.5)

    this.input.keyboard?.on('keydown', this.handleKey, this)
  }

  private handleKey(event: KeyboardEvent) {
    const key = event.key.toLowerCase()
    if (key.length !== 1 || !/[a-z]/.test(key)) return

    const expected = this.target[this.typingBuffer.length]
    if (key === expected) {
      this.typingBuffer += key
      this.updateDisplay()
      if (this.typingBuffer === this.target) {
        this.time.delayedCall(200, () => {
          this.scene.start('Level', { level: this.level, profileSlot: this.profileSlot })
        })
      }
    } else {
      // Flash red on wrong key
      if (!this.errorFlash) {
        this.errorFlash = true
        this.cameras.main.flash(150, 180, 0, 0)
        this.time.delayedCall(200, () => { this.errorFlash = false })
      }
    }
  }

  private updateDisplay() {
    // Phaser doesn't support HTML in regular text — use color split approach
    this.displayText.destroy()
    const { width, height } = this.scale
    const charW = 24
    const totalW = this.target.length * charW
    const startX = width / 2 - totalW / 2

    this.target.split('').forEach((ch, i) => {
      const color = i < this.typingBuffer.length ? '#44ff44' : '#888888'
      this.add.text(startX + i * charW, height * 0.62, ch, {
        fontSize: '40px', color
      })
    })
  }
}
