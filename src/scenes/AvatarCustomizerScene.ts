import Phaser from 'phaser'
import { createProfile, saveProfile, loadProfile } from '../utils/profile'
import { ProfileData } from '../types'
import { AvatarConfig, SKIN_TONES, HAIR_STYLES, HAIR_COLORS, EYE_COLORS, ACCESSORIES, SHIRT_COLORS, PANTS_COLORS, SHOE_COLORS } from '../data/avatars'
import { AvatarRenderer } from '../components/AvatarRenderer'

const MONO_FONT = '"Courier New", Courier, monospace'

export class AvatarCustomizerScene extends Phaser.Scene {
  private slot!: number
  private playerName!: string
  private config!: AvatarConfig
  private previewImage!: Phaser.GameObjects.Image
  private isEditingExisting: boolean = false
  private existingProfile!: ProfileData

  constructor() {
    super('AvatarCustomizer')
  }

  init(data: { slot: number; playerName: string; isEditingExisting?: boolean }) {
    this.slot = data.slot
    this.playerName = data.playerName
    this.isEditingExisting = data.isEditingExisting || false

    if (this.isEditingExisting) {
      const p = loadProfile(this.slot)
      if (p) {
        this.existingProfile = p
        if (p.avatarConfig) {
          this.config = JSON.parse(JSON.stringify(p.avatarConfig))
        } else {
          this.config = this.createDefaultConfig()
        }
      } else {
        this.config = this.createDefaultConfig()
      }
    } else {
      this.config = this.createDefaultConfig()
    }
  }

  private createDefaultConfig(): AvatarConfig {
    return {
      id: `custom_${Date.now()}`,
      skinTone: SKIN_TONES[0],
      hairStyle: HAIR_STYLES[0],
      hairColor: HAIR_COLORS[0],
      eyeColor: EYE_COLORS[0],
      accessory: ACCESSORIES[0],
      shirtColor: SHIRT_COLORS[0],
      pantsColor: PANTS_COLORS[0],
      shoeColor: SHOE_COLORS[0]
    }
  }

  create() {
    const { width, height } = this.scale

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e)

    const titleText = this.isEditingExisting ? 'Edit Hero' : 'Choose Your Hero'
    this.add.text(width / 2, 50, titleText, {
      fontSize: '32px', color: '#ffd700', fontFamily: MONO_FONT
    }).setOrigin(0.5)

    this.add.text(width / 2, 90, this.playerName, {
      fontSize: '20px', color: '#888888', fontFamily: MONO_FONT
    }).setOrigin(0.5)

    // Layout
    // Center: Big Avatar
    const avatarX = width / 2
    const avatarY = height / 2 + 30


    this.previewImage = this.add.image(avatarX, avatarY, '').setScale(3)

    this.renderPreview()

    // Selectors Layout
    // Left and Right Columns
    const leftX = width / 2 - 350
    const rightX = width / 2 + 350
    const startY = 150
    const spacing = 50

    this.createSelector(leftX, startY, 'Skin Tone', SKIN_TONES, 'skinTone', (val: number) => this.toHexColor(val))
    this.createSelector(leftX, startY + spacing, 'Hair Style', HAIR_STYLES, 'hairStyle', (val: string) => val)
    this.createSelector(leftX, startY + spacing * 2, 'Hair Color', HAIR_COLORS, 'hairColor', (val: number) => this.toHexColor(val))
    this.createSelector(leftX, startY + spacing * 3, 'Eye Color', EYE_COLORS, 'eyeColor', (val: number) => this.toHexColor(val))

    this.createSelector(rightX, startY, 'Shirt', SHIRT_COLORS, 'shirtColor', (val: number) => this.toHexColor(val))
    this.createSelector(rightX, startY + spacing, 'Pants', PANTS_COLORS, 'pantsColor', (val: number) => this.toHexColor(val))
    this.createSelector(rightX, startY + spacing * 2, 'Shoes', SHOE_COLORS, 'shoeColor', (val: number) => this.toHexColor(val))
    this.createSelector(rightX, startY + spacing * 3, 'Accessory', ACCESSORIES, 'accessory', (val: string) => val)

    // Outfits System
    const outfitsY = height - 120
    this.add.text(width / 2, outfitsY - 40, 'Saved Outfits (Click to Save/Load)', {
      fontSize: '18px', color: '#aaaaaa', fontFamily: MONO_FONT
    }).setOrigin(0.5)

    for (let i = 0; i < 5; i++) {
      this.createOutfitSlot(width / 2 - 200 + i * 100, outfitsY, i)
    }

    // Confirm Button
    const confirmY = height - 50
    const confirmBox = this.add.rectangle(width / 2, confirmY, 200, 50, 0x2a6a2a).setInteractive({ useHandCursor: true })
    this.add.text(width / 2, confirmY, 'CONFIRM', {
      fontSize: '24px', color: '#ffffff', fontFamily: MONO_FONT
    }).setOrigin(0.5)

    confirmBox.on('pointerdown', () => this.handleConfirm())

    // Back button
    const backText = this.add.text(40, height - 60, '< Back', {
      fontSize: '20px', color: '#888888', fontFamily: MONO_FONT
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true })
    backText.on('pointerdown', () => {
      if (this.isEditingExisting) {
        this.scene.start('ProfileSelect')
      } else {
        this.scene.start('ProfileSelect') // The startNaming step isn't directly exposed, going to ProfileSelect is safe
      }
    })
  }

  private createOutfitSlot(x: number, y: number, index: number) {
    const bg = this.add.rectangle(x, y, 60, 60, 0x2a2a4a).setStrokeStyle(2, 0x4444aa).setInteractive({ useHandCursor: true })
    this.add.text(x, y, `Slot ${index + 1}`, { fontSize: '14px', color: '#ffffff', fontFamily: MONO_FONT }).setOrigin(0.5)

    bg.on('pointerdown', () => {
      const profile = this.isEditingExisting ? this.existingProfile : loadProfile(this.slot)
      profile?.savedOutfits || []

      // If slot has outfit, load it. If we click again? Let's implement Load on Left Click, Save on Shift+Click?
      // Better UI: Click to Load if it exists. Right click or Long press to save?
      // For simplicity: If there's an outfit, let's load it. But we need a way to save.
      // Let's make the box split in two? Or simply: click to Load. A "Save to Slot" button above?
      // Or just a single button that cycles "Load / Overwrite" - actually, let's add two small texts "L" and "S"
    })

    // Sub-buttons for Load and Save
    const loadBtn = this.add.rectangle(x - 15, y + 40, 30, 20, 0x228822).setInteractive({ useHandCursor: true })
    this.add.text(x - 15, y + 40, 'L', { fontSize: '12px' }).setOrigin(0.5)
    loadBtn.on('pointerdown', () => {
      const p = this.isEditingExisting ? this.existingProfile : loadProfile(this.slot)
      if (p && p.savedOutfits && p.savedOutfits[index]) {
        this.config = JSON.parse(JSON.stringify(p.savedOutfits[index]))
        this.config.id = `custom_${Date.now()}`
        this.updateAllDisplays()
      }
    })

    const saveBtn = this.add.rectangle(x + 15, y + 40, 30, 20, 0x882222).setInteractive({ useHandCursor: true })
    this.add.text(x + 15, y + 40, 'S', { fontSize: '12px' }).setOrigin(0.5)
    saveBtn.on('pointerdown', () => {
      let p = this.isEditingExisting ? this.existingProfile : loadProfile(this.slot)
      if (!p) {
        // If profile doesn't exist yet, we can't really save.
        // But let's create a temporary one if needed, or just warn
        if (!this.isEditingExisting) {
          p = createProfile(this.playerName, this.config.id, this.config)
          saveProfile(this.slot, p)
        }
      }
      if (p) {
        if (!p.savedOutfits) p.savedOutfits = []
        p.savedOutfits[index] = JSON.parse(JSON.stringify(this.config))
        saveProfile(this.slot, p)
        // feedback flash
        const flash = this.add.rectangle(x, y, 60, 60, 0xffffff, 0.5)
        this.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() })
      }
    })
  }

  private updateAllDisplays() {
    this.renderPreview()
    this.children.getAll().forEach((c: any) => {
      if (c.updateDisplayCallback) {
        c.updateDisplayCallback()
      }
    })
  }

  private toHexColor(num: number): string {
    return '#' + num.toString(16).padStart(6, '0')
  }


  private createSelector(
    x: number,
    y: number,
    label: string,
    options: any[],
    key: keyof AvatarConfig,
    formatVal: (val: any) => string
  ) {
    this.add.text(x, y - 20, label, { fontSize: '16px', color: '#aaaaaa', fontFamily: MONO_FONT }).setOrigin(0.5)

    this.add.rectangle(x, y + 5, 200, 30, 0x111122).setStrokeStyle(1, 0x333366)

    const isColor = typeof this.config[key] === 'number'

    let colorSwatch: Phaser.GameObjects.Rectangle | null = null
    let valText: Phaser.GameObjects.Text

    if (isColor) {
      colorSwatch = this.add.rectangle(x - 50, y + 5, 20, 20, this.config[key] as number)
      valText = this.add.text(x + 10, y + 5, formatVal(this.config[key]), { fontSize: '16px', color: '#ffffff', fontFamily: MONO_FONT }).setOrigin(0.5)
    } else {
      valText = this.add.text(x, y + 5, formatVal(this.config[key]), { fontSize: '16px', color: '#ffffff', fontFamily: MONO_FONT }).setOrigin(0.5)
    }

    const leftBtn = this.add.text(x - 80, y + 5, '<', { fontSize: '24px', color: '#ffd700', fontFamily: MONO_FONT })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
    const rightBtn = this.add.text(x + 80, y + 5, '>', { fontSize: '24px', color: '#ffd700', fontFamily: MONO_FONT })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })

    const updateDisplay = () => {
      valText.setText(formatVal(this.config[key]))
      if (colorSwatch && typeof this.config[key] === 'number') {
        colorSwatch.setFillStyle(this.config[key] as number)
      }
    }

    ;(valText as any).updateDisplayCallback = updateDisplay

    leftBtn.on('pointerdown', () => {
      let idx = options.indexOf(this.config[key] as any)
      idx = (idx - 1 + options.length) % options.length
      ;(this.config as any)[key] = options[idx]
      updateDisplay()
      this.renderPreview()
    })

    rightBtn.on('pointerdown', () => {
      let idx = options.indexOf(this.config[key] as any)
      idx = (idx + 1) % options.length
      ;(this.config as any)[key] = options[idx]
      updateDisplay()
      this.renderPreview()
    })
  }

  private renderPreview() {
    this.config.id = `custom_${Date.now()}`
    AvatarRenderer.generateOne(this, this.config)
    this.previewImage.setTexture(this.config.id)
  }

  private handleConfirm() {
    let profile: ProfileData | null = loadProfile(this.slot)
    if (!profile) {
      profile = createProfile(this.playerName, this.config.id, this.config)
    } else {
      profile.avatarConfig = this.config
      profile.avatarChoice = this.config.id
    }

    saveProfile(this.slot, profile)

    this.registry.set('profileSlot', this.slot)
    this.registry.set('profile', profile)
    this.scene.start('OverlandMap', { profileSlot: this.slot })
  }
}
