// src/scenes/SettingsScene.ts
import Phaser from 'phaser'
import { loadProfile, saveProfile } from '../utils/profile'

export class SettingsScene extends Phaser.Scene {
  private profileSlot!: number

  constructor() { super('Settings') }

  init(data: { profileSlot: number }) {
    this.profileSlot = data.profileSlot
  }

  create() {
    const { width, height } = this.scale
    const profile = loadProfile(this.profileSlot)!

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e)

    // Title
    this.add.text(width / 2, 80, 'SETTINGS', {
      fontSize: '40px', color: '#ffd700'
    }).setOrigin(0.5)

    // Game Mode label
    this.add.text(width / 2, 220, 'Game Mode', {
      fontSize: '26px', color: '#ffffff'
    }).setOrigin(0.5)

    // Regular button
    const regularBtn = this.add.text(width / 2 - 120, 290, '[ Regular ]', {
      fontSize: '28px',
      color: profile.gameMode === 'regular' ? '#ffd700' : '#888888',
      backgroundColor: '#222244',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    // Advanced button
    const advancedBtn = this.add.text(width / 2 + 120, 290, '[ Advanced ]', {
      fontSize: '28px',
      color: profile.gameMode === 'advanced' ? '#ffd700' : '#888888',
      backgroundColor: '#222244',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    // Description text
    const descText = this.add.text(width / 2, 370, this.getModeDescription(profile.gameMode), {
      fontSize: '18px', color: '#aaaaaa', wordWrap: { width: 700 }, align: 'center',
    }).setOrigin(0.5)

    const setMode = (mode: 'regular' | 'advanced') => {
      const p = loadProfile(this.profileSlot)!
      p.gameMode = mode
      saveProfile(this.profileSlot, p)
      regularBtn.setColor(mode === 'regular' ? '#ffd700' : '#888888')
      advancedBtn.setColor(mode === 'advanced' ? '#ffd700' : '#888888')
      descText.setText(this.getModeDescription(mode))
    }

    regularBtn.on('pointerdown', () => setMode('regular'))
    advancedBtn.on('pointerdown', () => setMode('advanced'))

    // Back button
    const back = this.add.text(60, 40, '← BACK', {
      fontSize: '22px', color: '#aaaaff'
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true })
    back.on('pointerdown', () => {
      this.scene.start('OverlandMap', { profileSlot: this.profileSlot })
    })
  }

  private getModeDescription(mode: 'regular' | 'advanced'): string {
    if (mode === 'regular') {
      return 'Regular: Enemies queue up and wait. Only the lead enemy can be defeated. No damage taken.'
    }
    return 'Advanced: Enemies march in real-time. Type fast or take damage!'
  }
}
