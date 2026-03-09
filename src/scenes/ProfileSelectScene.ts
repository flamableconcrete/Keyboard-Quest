// src/scenes/ProfileSelectScene.ts
import Phaser from 'phaser'
import { getAllProfiles, loadProfile, saveProfile, deleteProfile, exportProfile, importProfile, createProfile } from '../utils/profile'
import { ProfileData } from '../types'
import { AVATAR_CONFIGS } from '../data/avatars'

const MONO_FONT = '"Courier New", Courier, monospace'

export class ProfileSelectScene extends Phaser.Scene {
  private typingBuffer = ''
  private profiles: (ProfileData | null)[] = []
  private selectedAvatarId: string = 'avatar_0'

  constructor() { super('ProfileSelect') }

  create() {
    this.profiles = getAllProfiles()
    this.typingBuffer = ''
    this.render()
  }

  private drawPixelPanel(x: number, y: number, w: number, h: number, fillColor: number, borderColor: number): Phaser.GameObjects.Graphics {
    const gfx = this.add.graphics()
    const border = 3
    // Outer border
    gfx.fillStyle(borderColor)
    gfx.fillRect(x - w / 2, y - h / 2, w, h)
    // Inner fill
    gfx.fillStyle(fillColor)
    gfx.fillRect(x - w / 2 + border, y - h / 2 + border, w - border * 2, h - border * 2)
    // Corner notches (pixel-art style - cut corners with background color)
    gfx.fillStyle(0x1a1a2e)
    gfx.fillRect(x - w / 2, y - h / 2, border, border)
    gfx.fillRect(x + w / 2 - border, y - h / 2, border, border)
    gfx.fillRect(x - w / 2, y + h / 2 - border, border, border)
    gfx.fillRect(x + w / 2 - border, y + h / 2 - border, border, border)
    return gfx
  }

  private render() {
    this.children.removeAll(true)
    const { width, height } = this.scale

    const title = this.add.text(width / 2, 50, 'Select Your Hero', {
      fontSize: '40px', color: '#ffd700', fontFamily: MONO_FONT
    }).setOrigin(0.5)

    this.tweens.add({
      targets: title,
      alpha: 0.7,
      duration: 1500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })

    const slotY = [180, 340, 500, 660]
    this.profiles.forEach((profile, i) => {
      const y = slotY[i] ?? 180 + i * 140
      if (profile) {
        this.renderFilledSlot(profile, i, y)
      } else {
        this.renderEmptySlot(i, y)
      }
    })

    // Back button
    const backW = 120
    const backH = 40
    const backX = 80
    const backY = height - 40
    this.drawPixelPanel(backX, backY, backW, backH, 0x2a2a4a, 0x5555aa)
    const back = this.add.text(backX, backY, '< BACK', {
      fontSize: '18px', color: '#aaaaaa', fontFamily: MONO_FONT
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    back.on('pointerdown', () => this.scene.start('MainMenu'))
  }

  private renderFilledSlot(profile: ProfileData, slot: number, y: number) {
    const { width } = this.scale
    const panelW = 700
    const panelH = 100

    this.drawPixelPanel(width / 2, y, panelW, panelH, 0x2a2a4a, 0x5555aa)

    // Interactive hit area over the panel
    const box = this.add.rectangle(width / 2, y, panelW, panelH, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
    box.on('pointerdown', () => this.startGame(slot, profile))

    // Avatar
    const avatarX = width / 2 - panelW / 2 + 50
    const avatarKey = this.textures.exists(profile.avatarChoice) ? profile.avatarChoice : 'avatar_0'
    this.add.image(avatarX, y, avatarKey).setDisplaySize(48, 48)

    // Player name
    const textStartX = avatarX + 45
    this.add.text(textStartX, y - 30, profile.playerName, {
      fontSize: '24px', color: '#ffffff', fontFamily: MONO_FONT
    })

    // Stats line
    this.add.text(textStartX, y - 2, `Lv.${profile.characterLevel} — World ${profile.currentWorld}`, {
      fontSize: '16px', color: '#aaaaaa', fontFamily: MONO_FONT
    })

    // Star count
    let totalStars = 0
    if (profile.levelResults) {
      for (const key of Object.keys(profile.levelResults)) {
        const result = profile.levelResults[key]
        if (result) {
          totalStars += (result.accuracyStars ?? 0) + (result.speedStars ?? 0)
        }
      }
    }
    this.add.text(textStartX, y + 20, `★ ${totalStars}`, {
      fontSize: '16px', color: '#ffd700', fontFamily: MONO_FONT
    })

    // Active companion
    if (profile.activeCompanionId && profile.companions) {
      const companion = profile.companions.find(c => c.id === profile.activeCompanionId)
      if (companion) {
        this.add.text(textStartX + 80, y + 20, companion.name, {
          fontSize: '14px', color: '#88aacc', fontFamily: MONO_FONT
        })
      }
    }

    // Export button
    const exp = this.add.text(width / 2 + 200, y - 15, '[Export]', {
      fontSize: '16px', color: '#88cc88', fontFamily: MONO_FONT
    }).setInteractive({ useHandCursor: true })
    exp.on('pointerover', () => exp.setColor('#aaffaa'))
    exp.on('pointerout', () => exp.setColor('#88cc88'))
    exp.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      ptr.event.stopPropagation()
      this.handleExport(profile)
    })

    // Delete button
    const del = this.add.text(width / 2 + 200, y + 10, '[Delete]', {
      fontSize: '16px', color: '#cc6666', fontFamily: MONO_FONT
    }).setInteractive({ useHandCursor: true })
    del.on('pointerover', () => del.setColor('#ff8888'))
    del.on('pointerout', () => del.setColor('#cc6666'))
    del.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      ptr.event.stopPropagation()
      deleteProfile(slot)
      this.profiles[slot] = null
      this.render()
    })
  }

  private renderEmptySlot(slot: number, y: number) {
    const { width } = this.scale
    const panelW = 700
    const panelH = 100

    this.drawPixelPanel(width / 2, y, panelW, panelH, 0x1a1a2e, 0x333366)

    const box = this.add.rectangle(width / 2, y, panelW, panelH, 0x000000, 0)
      .setInteractive({ useHandCursor: true })

    const newHeroText = this.add.text(width / 2, y, '+ New Hero', {
      fontSize: '22px', color: '#8888cc', fontFamily: MONO_FONT
    }).setOrigin(0.5)

    this.tweens.add({
      targets: newHeroText,
      alpha: 0.4,
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })

    // Import button
    const imp = this.add.text(width / 2 + 250, y, '[Import]', {
      fontSize: '16px', color: '#88cc88', fontFamily: MONO_FONT
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    imp.on('pointerover', () => imp.setColor('#aaffaa'))
    imp.on('pointerout', () => imp.setColor('#88cc88'))

    box.on('pointerdown', () => {
      this.startNaming(slot)
    })
    imp.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      ptr.event.stopPropagation()
      this.handleImport(slot)
    })
  }

  private startNaming(slot: number) {
    this.typingBuffer = ''
    this.input.keyboard?.removeAllListeners()
    this.children.removeAll(true)
    const { width, height } = this.scale

    this.add.text(width / 2, height * 0.35, "Type your hero's name:", {
      fontSize: '32px', color: '#ffd700', fontFamily: MONO_FONT
    }).setOrigin(0.5)

    // Pixel panel background for the input area
    this.drawPixelPanel(width / 2, height * 0.5, 500, 80, 0x2a2a4a, 0x5555aa)

    const nameDisplay = this.add.text(width / 2, height * 0.5, '_', {
      fontSize: '48px', color: '#ffffff', fontFamily: MONO_FONT
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.65, 'Press ENTER to confirm', {
      fontSize: '20px', color: '#888888', fontFamily: MONO_FONT
    }).setOrigin(0.5)

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter' && this.typingBuffer.length > 0) {
        this.input.keyboard?.removeAllListeners()
        this.showAvatarGallery(slot, this.typingBuffer)
      } else if (event.key === 'Backspace') {
        this.typingBuffer = this.typingBuffer.slice(0, -1)
      } else if (event.key.length === 1 && this.typingBuffer.length < 16) {
        this.typingBuffer += event.key
      }
      nameDisplay.setText(this.typingBuffer + '_')
    })
  }

  private showAvatarGallery(slot: number, playerName: string) {
    this.children.removeAll(true)
    this.selectedAvatarId = 'avatar_0'
    const { width, height } = this.scale

    // Title
    this.add.text(width / 2, 30, 'Choose Your Avatar', {
      fontSize: '32px', color: '#ffd700', fontFamily: MONO_FONT
    }).setOrigin(0.5)

    // Player name
    this.add.text(width / 2, 65, playerName, {
      fontSize: '20px', color: '#888888', fontFamily: MONO_FONT
    }).setOrigin(0.5)

    // Avatar grid
    const cols = 6
    const cellSize = 72
    const gridWidth = cols * cellSize
    const startX = width / 2 - gridWidth / 2 + cellSize / 2
    const startY = 120

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
      const img = this.add.image(ax, ay, config.id).setDisplaySize(48, 48)
      img.setInteractive({ useHandCursor: true })

      // Default selection highlight for first avatar
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

    // CONFIRM button
    const confirmY = height - 60
    this.drawPixelPanel(width / 2, confirmY, 200, 50, 0x2a6a2a, 0x44aa44)
    const confirmText = this.add.text(width / 2, confirmY, 'CONFIRM', {
      fontSize: '24px', color: '#ffffff', fontFamily: MONO_FONT
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    confirmText.on('pointerdown', () => {
      const profile = createProfile(playerName, this.selectedAvatarId)
      saveProfile(slot, profile)
      this.startGame(slot, profile)
    })

    // Back button
    const backText = this.add.text(40, height - 60, '< Back', {
      fontSize: '20px', color: '#888888', fontFamily: MONO_FONT
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true })
    backText.on('pointerdown', () => {
      this.startNaming(slot)
    })
  }

  private startGame(slot: number, profile: ProfileData) {
    // Guard against navigating with a deleted/missing profile
    if (!loadProfile(slot)) return
    // Store active profile slot in registry for other scenes
    this.registry.set('profileSlot', slot)
    this.registry.set('profile', profile)
    this.scene.start('OverlandMap', { profileSlot: slot })
  }

  private handleExport(profile: ProfileData) {
    const json = exportProfile(profile)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kq_save_${profile.playerName}.kq`
    a.click()
    URL.revokeObjectURL(url)
  }

  private handleImport(slot: number) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.kq'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const profile = importProfile(reader.result as string)
        if (profile) {
          saveProfile(slot, profile)
          this.profiles[slot] = profile
          this.render()
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }
}
