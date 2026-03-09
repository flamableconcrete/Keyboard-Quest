// src/scenes/PauseScene.ts
import Phaser from 'phaser'

interface PauseData {
  levelKey: string
  profileSlot: number
}

export class PauseScene extends Phaser.Scene {
  private levelKey!: string
  private profileSlot!: number

  constructor() {
    super('PauseScene')
  }

  init(data: PauseData) {
    this.levelKey = data.levelKey
    this.profileSlot = data.profileSlot
  }

  create() {
    const { width, height } = this.scale
    
    // Dark semi-transparent overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)

    // Menu Panel
    const panelW = 400
    const panelH = 300
    this.add.rectangle(width / 2, height / 2, panelW, panelH, 0x1a1a2e).setStrokeStyle(4, 0x4a4a6a)

    // Title
    this.add.text(width / 2, height / 2 - 100, 'PAUSED', {
      fontSize: '36px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5)

    // Resume Button
    const resumeBtn = this.add.text(width / 2, height / 2, '[ Resume ]', {
      fontSize: '28px', color: '#aaffaa'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    
    resumeBtn.on('pointerdown', () => {
      this.scene.resume(this.levelKey)
      this.scene.stop()
    })
    resumeBtn.on('pointerover', () => resumeBtn.setColor('#ffffff'))
    resumeBtn.on('pointerout', () => resumeBtn.setColor('#aaffaa'))

    // Quit Button
    const quitBtn = this.add.text(width / 2, height / 2 + 70, '[ Quit to Map ]', {
      fontSize: '28px', color: '#ffaaaa'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    
    quitBtn.on('pointerdown', () => {
      this.scene.stop(this.levelKey)
      this.scene.stop()
      this.scene.start('OverlandMap', { profileSlot: this.profileSlot })
    })
    quitBtn.on('pointerover', () => quitBtn.setColor('#ffffff'))
    quitBtn.on('pointerout', () => quitBtn.setColor('#ffaaaa'))

    // Listen for Escape key to resume
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.resume(this.levelKey)
      this.scene.stop()
    })
  }
}
