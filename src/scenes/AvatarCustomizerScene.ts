import Phaser from 'phaser'
import { createProfile, saveProfile, loadProfile } from '../utils/profile'
import { ProfileData } from '../types'
import { AvatarConfig, SKIN_TONES, HAIR_STYLES, HAIR_COLORS, EYE_COLORS, ACCESSORIES, SHIRT_COLORS, PANTS_COLORS, SHOE_COLORS, randomizeOneConfig } from '../data/avatars'
import { AvatarRenderer } from '../components/AvatarRenderer'

const MONO_FONT = '"Courier New", Courier, monospace'

export class AvatarCustomizerScene extends Phaser.Scene {
  private slot!: number
  private playerName!: string
  private config!: AvatarConfig
  private previewImage!: Phaser.GameObjects.Image
  private isEditingExisting: boolean = false
  private existingProfile!: ProfileData
  private returnTo: string = 'ProfileSelect'
  private outfitSlotObjects: Phaser.GameObjects.GameObject[] = []

  constructor() {
    super('AvatarCustomizer')
  }

  init(data: { slot: number; playerName: string; isEditingExisting?: boolean; returnTo?: string }) {
    this.slot = data.slot
    this.playerName = data.playerName
    this.isEditingExisting = data.isEditingExisting || false
    this.returnTo = data.returnTo || 'ProfileSelect'

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

    // Center: Big Avatar
    const avatarX = width / 2
    const avatarY = height / 2 - 10

    this.previewImage = this.add.image(avatarX, avatarY, '').setScale(3)
    this.renderPreview()

    // Selectors: Left and Right Columns
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

    // Saved Outfits
    const outfitsY = height - 155
    this.add.text(width / 2, outfitsY - 30, 'Saved Outfits', {
      fontSize: '16px', color: '#aaaaaa', fontFamily: MONO_FONT
    }).setOrigin(0.5)

    this.drawOutfitSlots(width / 2, outfitsY)

    // Randomize Button
    const btnY = height - 55
    const randomizeBox = this.add.rectangle(width / 2 - 140, btnY, 160, 44, 0x2a2a4a).setStrokeStyle(2, 0x5555aa).setInteractive({ useHandCursor: true })
    this.add.text(width / 2 - 140, btnY, 'RANDOMIZE', {
      fontSize: '20px', color: '#ffffff', fontFamily: MONO_FONT
    }).setOrigin(0.5)

    randomizeBox.on('pointerdown', () => {
      this.config = randomizeOneConfig()
      this.updateAllDisplays()
    })

    // Confirm Button
    const confirmBox = this.add.rectangle(width / 2 + 140, btnY, 160, 44, 0x2a6a2a).setInteractive({ useHandCursor: true })
    this.add.text(width / 2 + 140, btnY, 'CONFIRM', {
      fontSize: '24px', color: '#ffffff', fontFamily: MONO_FONT
    }).setOrigin(0.5)

    confirmBox.on('pointerdown', () => this.handleConfirm())

    // Back button
    const backText = this.add.text(40, height - 55, '< Back', {
      fontSize: '20px', color: '#888888', fontFamily: MONO_FONT
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true })
    backText.on('pointerdown', () => {
      if (this.returnTo === 'Settings') {
        this.scene.start('Settings', { profileSlot: this.slot })
      } else {
        this.scene.start('ProfileSelect')
      }
    })
  }

  private getProfile(): ProfileData | null {
    return this.isEditingExisting ? this.existingProfile : loadProfile(this.slot)
  }

  private drawOutfitSlots(centerX: number, y: number) {
    // Clear old slot objects
    this.outfitSlotObjects.forEach(o => o.destroy())
    this.outfitSlotObjects = []

    const slotSpacing = 80
    const startX = centerX - (4 * slotSpacing) / 2
    const profile = loadProfile(this.slot)

    for (let i = 0; i < 5; i++) {
      const sx = startX + i * slotSpacing
      this.drawOneOutfitSlot(sx, y, i, profile)
    }
  }

  private drawOneOutfitSlot(x: number, y: number, index: number, profileParams?: any) {
    const profile = this.getProfile() || profileParams
    const outfit = profile?.savedOutfits?.[index] ?? null

    // Frame
    const frame = this.add.rectangle(x, y, 48, 48, 0x111122).setStrokeStyle(2, outfit ? 0x4444aa : 0x333344)
    this.outfitSlotObjects.push(frame)

    // Thumbnail or empty label
    if (outfit) {
      const thumbKey = `outfit_thumb_${this.slot}_${index}_${Date.now()}`
      const thumbConfig = { ...outfit, id: thumbKey }
      AvatarRenderer.generateOne(this, thumbConfig, profile?.equipment)
      const thumb = this.add.image(x, y, thumbKey).setDisplaySize(24, 48)
      this.outfitSlotObjects.push(thumb)
    } else {
      const empty = this.add.text(x, y, '--', { fontSize: '14px', color: '#444444', fontFamily: MONO_FONT }).setOrigin(0.5)
      this.outfitSlotObjects.push(empty)
    }

    // Slot number
    const label = this.add.text(x, y - 32, `${index + 1}`, { fontSize: '12px', color: '#666666', fontFamily: MONO_FONT }).setOrigin(0.5)
    this.outfitSlotObjects.push(label)

    // Icon buttons row below frame
    const iconY = y + 34
    const iconSpacing = 20

    // Save button
    const saveBtn = this.add.text(x - iconSpacing, iconY, '\u2913', { fontSize: '16px', color: '#44aa44', fontFamily: MONO_FONT })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
    saveBtn.on('pointerover', () => saveBtn.setColor('#88ff88'))
    saveBtn.on('pointerout', () => saveBtn.setColor('#44aa44'))
    saveBtn.on('pointerdown', () => this.saveOutfit(index, x, y))
    this.outfitSlotObjects.push(saveBtn)

    // Load button (only if outfit exists)
    if (outfit) {
      const loadBtn = this.add.text(x, iconY, '\u2912', { fontSize: '16px', color: '#4488cc', fontFamily: MONO_FONT })
        .setOrigin(0.5).setInteractive({ useHandCursor: true })
      loadBtn.on('pointerover', () => loadBtn.setColor('#88ccff'))
      loadBtn.on('pointerout', () => loadBtn.setColor('#4488cc'))
      loadBtn.on('pointerdown', () => this.loadOutfit(index))
      this.outfitSlotObjects.push(loadBtn)

      // Clear button
      const clearBtn = this.add.text(x + iconSpacing, iconY, '\u2715', { fontSize: '14px', color: '#aa4444', fontFamily: MONO_FONT })
        .setOrigin(0.5).setInteractive({ useHandCursor: true })
      clearBtn.on('pointerover', () => clearBtn.setColor('#ff8888'))
      clearBtn.on('pointerout', () => clearBtn.setColor('#aa4444'))
      clearBtn.on('pointerdown', () => this.clearOutfit(index))
      this.outfitSlotObjects.push(clearBtn)
    }
  }

  private saveOutfit(index: number, slotX: number, slotY: number) {
    let p = this.getProfile()
    if (!p) {
      if (!this.isEditingExisting) {
        p = createProfile(this.playerName, this.config.id, this.config)
        saveProfile(this.slot, p)
      } else {
        return
      }
    }
    if (!p.savedOutfits) p.savedOutfits = []
    p.savedOutfits[index] = JSON.parse(JSON.stringify(this.config))
    saveProfile(this.slot, p)
    if (this.isEditingExisting) this.existingProfile = p

    // Flash feedback
    const flash = this.add.rectangle(slotX, slotY, 48, 48, 0x44ff44, 0.5)
    this.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() })

    // Redraw outfit slots to show new thumbnail
    const { width } = this.scale
    this.drawOutfitSlots(width / 2, slotY)
  }

  private loadOutfit(index: number) {
    const p = this.getProfile()
    if (p?.savedOutfits?.[index]) {
      this.config = JSON.parse(JSON.stringify(p.savedOutfits[index]))
      this.config.id = `custom_${Date.now()}`
      this.updateAllDisplays()
    }
  }

  private clearOutfit(index: number) {
    const p = this.getProfile()
    if (p?.savedOutfits) {
      delete p.savedOutfits[index]
      saveProfile(this.slot, p)
      if (this.isEditingExisting) this.existingProfile = p

      // Redraw outfit slots
      const { width, height } = this.scale
      this.drawOutfitSlots(width / 2, height - 155)
    }
  }

  private updateAllDisplays() {
    this.renderPreview()
    this.children.getAll().forEach((c: any) => {
      if (c.updateDisplayCallback) {
        c.updateDisplayCallback()
      }
    })
    // Redraw outfit slots in case config changed
    const { width, height } = this.scale
    this.drawOutfitSlots(width / 2, height - 155)
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
    const p = loadProfile(this.slot)
    AvatarRenderer.generateOne(this, this.config, p?.equipment)
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
