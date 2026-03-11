// src/scenes/SettingsScene.ts
import Phaser from 'phaser'
import { loadProfile, saveProfile } from '../utils/profile'
import { AVATAR_CONFIGS, randomizeAvatarConfigs } from '../data/avatars'
import { AvatarRenderer } from '../components/AvatarRenderer'

const MONO_FONT = '"Courier New", Courier, monospace'

export class SettingsScene extends Phaser.Scene {
  private profileSlot!: number
  private selectedAvatarId: string = ''

  constructor() { super('Settings') }

  init(data: { profileSlot: number }) {
    this.profileSlot = data.profileSlot
  }

  create() {
    this.renderSettings()
  }

  private renderSettings() {
    this.children.removeAll(true)
    const { width, height } = this.scale
    const profile = loadProfile(this.profileSlot)!

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e)

    // Title
    this.add.text(width / 2, 60, 'SETTINGS', {
      fontSize: '40px', color: '#ffd700'
    }).setOrigin(0.5)

    // Avatar Section
    const avatarKey = this.textures.exists(profile.avatarChoice) ? profile.avatarChoice : 'avatar_0'
    this.add.image(width / 2, 130, avatarKey).setDisplaySize(48, 96)

    const changeAvatarBtn = this.add.text(width / 2, 180, '[ Change Avatar ]', {
      fontSize: '20px',
      color: '#88cc88',
      backgroundColor: '#222244',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    changeAvatarBtn.on('pointerdown', () => {
      this.showAvatarGallery(profile.avatarChoice)
    })

    // Game Mode label
    this.add.text(width / 2, 240, 'Game Mode', {
      fontSize: '26px', color: '#ffffff'
    }).setOrigin(0.5)

    // Regular button
    const regularBtn = this.add.text(width / 2 - 120, 290, '[ Regular ]', {
      fontSize: '24px',
      color: profile.gameMode === 'regular' ? '#ffd700' : '#888888',
      backgroundColor: '#222244',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    // Advanced button
    const advancedBtn = this.add.text(width / 2 + 120, 290, '[ Advanced ]', {
      fontSize: '24px',
      color: profile.gameMode === 'advanced' ? '#ffd700' : '#888888',
      backgroundColor: '#222244',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    // Description text
    const descText = this.add.text(width / 2, 350, this.getModeDescription(profile.gameMode), {
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

    // Finger Hints label
    this.add.text(width / 2, 420, 'Finger Hints', {
      fontSize: '26px', color: '#ffffff'
    }).setOrigin(0.5)

    // ON button
    const onBtn = this.add.text(width / 2 - 80, 480, '[ ON ]', {
      fontSize: '24px',
      color: profile.showFingerHints ? '#ffd700' : '#888888',
      backgroundColor: '#222244',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    // OFF button
    const offBtn = this.add.text(width / 2 + 80, 480, '[ OFF ]', {
      fontSize: '24px',
      color: !profile.showFingerHints ? '#ffd700' : '#888888',
      backgroundColor: '#222244',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    // Finger hints description
    const hintsDesc = this.add.text(width / 2, 540, this.getHintsDescription(profile.showFingerHints), {
      fontSize: '18px', color: '#aaaaaa', wordWrap: { width: 700 }, align: 'center',
    }).setOrigin(0.5)

    const setHints = (on: boolean) => {
      const p = loadProfile(this.profileSlot)!
      p.showFingerHints = on
      saveProfile(this.profileSlot, p)
      onBtn.setColor(on ? '#ffd700' : '#888888')
      offBtn.setColor(!on ? '#ffd700' : '#888888')
      hintsDesc.setText(this.getHintsDescription(on))
    }

    onBtn.on('pointerdown', () => setHints(true))
    offBtn.on('pointerdown', () => setHints(false))

    // Back button
    const back = this.add.text(60, 40, '← BACK', {
      fontSize: '22px', color: '#aaaaff'
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true })
    back.on('pointerdown', () => {
      this.scene.start('OverlandMap', { profileSlot: this.profileSlot })
    })
  }

  private showAvatarGallery(currentAvatar: string, keepSelected: boolean = false) {
    this.children.removeAll(true)
    this.selectedAvatarId = currentAvatar
    if (!keepSelected || !AVATAR_CONFIGS.some(c => c.id === this.selectedAvatarId)) {
      this.selectedAvatarId = AVATAR_CONFIGS.some(c => c.id === currentAvatar) ? currentAvatar : (AVATAR_CONFIGS[0]?.id || 'avatar_0')
    }
    const { width, height } = this.scale

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e)

    // Title
    this.add.text(width / 2, 60, 'Choose Your Avatar', {
      fontSize: '32px', color: '#ffd700', fontFamily: MONO_FONT
    }).setOrigin(0.5)

    // Avatar grid
    const cols = 6
    const cellSize = 72
    const gridWidth = cols * cellSize
    const startX = width / 2 - gridWidth / 2 + cellSize / 2
    const startY = 140

    let highlightRect: Phaser.GameObjects.Rectangle | null = null

    AVATAR_CONFIGS.forEach((config, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      const ax = startX + col * cellSize
      const ay = startY + row * cellSize

      // Dark frame
      const frame = this.add.rectangle(ax, ay, 56, 56, 0x2a2a4a)
      frame.setStrokeStyle(2, 0x4444aa)

      // Avatar image
      const img = this.add.image(ax, ay, config.id).setDisplaySize(36, 72)
      img.setInteractive({ useHandCursor: true })

      // Default selection highlight
      if (config.id === this.selectedAvatarId) {
        highlightRect = this.add.rectangle(ax, ay, 60, 60)
        highlightRect.setFillStyle(0x000000, 0)
        highlightRect.setStrokeStyle(3, 0xffd700)
      }

      img.on('pointerdown', () => {
        this.selectedAvatarId = config.id
        if (highlightRect) {
          highlightRect.destroy()
        }
        highlightRect = this.add.rectangle(ax, ay, 60, 60)
        highlightRect.setFillStyle(0x000000, 0)
        highlightRect.setStrokeStyle(3, 0xffd700)
      })
    })

    // Buttons
    const confirmY = height - 80

    // Randomize button
    const randomizeBg = this.add.rectangle(width / 2 + 200, confirmY, 150, 40, 0x2a2a4a)
    randomizeBg.setStrokeStyle(2, 0x5555aa)
    randomizeBg.setInteractive({ useHandCursor: true })

    this.add.text(width / 2 + 200, confirmY, 'Randomize', {
      fontSize: '20px', color: '#ffffff', fontFamily: MONO_FONT
    }).setOrigin(0.5)

    randomizeBg.on('pointerdown', () => {
      randomizeAvatarConfigs()
      AvatarRenderer.generateAll(this)
      this.showAvatarGallery(this.selectedAvatarId, true)
    })

    // Customize button
    const customizeBg = this.add.rectangle(width / 2 - 200, confirmY, 150, 40, 0x2a6a2a)
    customizeBg.setStrokeStyle(2, 0x44aa44)
    customizeBg.setInteractive({ useHandCursor: true })

    this.add.text(width / 2 - 200, confirmY, 'Customize', {
      fontSize: '20px', color: '#ffffff', fontFamily: MONO_FONT
    }).setOrigin(0.5)

    customizeBg.on('pointerdown', () => {
      const p = loadProfile(this.profileSlot)!
      this.scene.start('AvatarCustomizer', {
        slot: this.profileSlot,
        playerName: p.playerName,
        isEditingExisting: true
      })
    })

    // CONFIRM button
    // Simple rect for background instead of drawPixelPanel since it might not exist here
    const confirmBg = this.add.rectangle(width / 2, confirmY, 200, 50, 0x2a6a2a)
    confirmBg.setStrokeStyle(2, 0x44aa44)
    confirmBg.setInteractive({ useHandCursor: true })

    this.add.text(width / 2, confirmY, 'CONFIRM', {
      fontSize: '24px', color: '#ffffff', fontFamily: MONO_FONT
    }).setOrigin(0.5)

    confirmBg.on('pointerdown', () => {
      const p = loadProfile(this.profileSlot)!
      p.avatarChoice = this.selectedAvatarId
      saveProfile(this.profileSlot, p)
      this.renderSettings()
    })

    // Back button
    const backText = this.add.text(60, 40, '← Back', {
      fontSize: '22px', color: '#aaaaff', fontFamily: MONO_FONT
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true })
    backText.on('pointerdown', () => {
      this.renderSettings()
    })
  }

  private getModeDescription(mode: 'regular' | 'advanced'): string {
    if (mode === 'regular') {
      return 'Regular: Enemies queue up and wait. Only the lead enemy can be defeated. No damage taken.'
    }
    return 'Advanced: Enemies march in real-time. Type fast or take damage!'
  }

  private getHintsDescription(on: boolean): string {
    if (on) {
      return 'Show which finger to use and the next letter to type during levels.'
    }
    return 'Finger hints are hidden. For experienced typists.'
  }
}
