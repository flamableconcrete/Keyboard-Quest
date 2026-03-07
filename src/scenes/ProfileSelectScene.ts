// src/scenes/ProfileSelectScene.ts
import Phaser from 'phaser'
import { getAllProfiles, saveProfile, deleteProfile, exportProfile, importProfile, createProfile } from '../utils/profile'
import { ProfileData } from '../types'

export class ProfileSelectScene extends Phaser.Scene {
  private typingBuffer = ''
  private profiles: (ProfileData | null)[] = []

  constructor() { super('ProfileSelect') }

  create() {
    this.profiles = getAllProfiles()
    this.typingBuffer = ''
    this.render()
  }

  private render() {
    this.children.removeAll(true)
    const { width, height } = this.scale

    this.add.text(width / 2, 50, 'Select Your Hero', {
      fontSize: '40px', color: '#ffd700'
    }).setOrigin(0.5)

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
    const back = this.add.text(60, height - 40, '< Back', {
      fontSize: '24px', color: '#aaaaaa'
    }).setInteractive({ useHandCursor: true })
    back.on('pointerdown', () => this.scene.start('MainMenu'))
  }

  private renderFilledSlot(profile: ProfileData, slot: number, y: number) {
    const { width } = this.scale

    const box = this.add.rectangle(width / 2, y, 700, 100, 0x2a2a4a)
      .setInteractive({ useHandCursor: true })
    box.on('pointerdown', () => this.startGame(slot, profile))

    this.add.text(width / 2 - 300, y - 20, profile.playerName, {
      fontSize: '28px', color: '#ffffff'
    })
    this.add.text(width / 2 - 300, y + 10, `World ${profile.currentWorld} — Level ${profile.characterLevel}`, {
      fontSize: '18px', color: '#aaaaaa'
    })

    // Export button
    const exp = this.add.text(width / 2 + 200, y - 20, '[Export]', {
      fontSize: '18px', color: '#aaffaa'
    }).setInteractive({ useHandCursor: true })
    exp.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      ptr.event.stopPropagation()
      this.handleExport(profile)
    })

    // Delete button
    const del = this.add.text(width / 2 + 280, y - 20, '[Delete]', {
      fontSize: '18px', color: '#ff6666'
    }).setInteractive({ useHandCursor: true })
    del.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      ptr.event.stopPropagation()
      deleteProfile(slot)
      this.profiles[slot] = null
      this.render()
    })
  }

  private renderEmptySlot(slot: number, y: number) {
    const { width } = this.scale

    const box = this.add.rectangle(width / 2, y, 700, 100, 0x1a1a2e, 0.6)
      .setStrokeStyle(2, 0x4444aa)
      .setInteractive({ useHandCursor: true })

    this.add.text(width / 2, y - 15, '+ New Hero', {
      fontSize: '24px', color: '#aaaaff'
    }).setOrigin(0.5)

    // Import button
    const imp = this.add.text(width / 2 + 250, y - 10, '[Import]', {
      fontSize: '18px', color: '#aaffaa'
    }).setInteractive({ useHandCursor: true })

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
    this.children.removeAll(true)
    const { width, height } = this.scale

    this.add.text(width / 2, height * 0.35, 'Type your hero\'s name:', {
      fontSize: '32px', color: '#ffd700'
    }).setOrigin(0.5)

    const nameDisplay = this.add.text(width / 2, height * 0.5, '_', {
      fontSize: '48px', color: '#ffffff'
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.65, 'Press ENTER to confirm', {
      fontSize: '20px', color: '#888888'
    }).setOrigin(0.5)

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter' && this.typingBuffer.length > 0) {
        const profile = createProfile(this.typingBuffer)
        saveProfile(slot, profile)
        this.startGame(slot, profile)
      } else if (event.key === 'Backspace') {
        this.typingBuffer = this.typingBuffer.slice(0, -1)
      } else if (event.key.length === 1 && this.typingBuffer.length < 16) {
        this.typingBuffer += event.key
      }
      nameDisplay.setText(this.typingBuffer + '_')
    })
  }

  private startGame(slot: number, profile: ProfileData) {
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