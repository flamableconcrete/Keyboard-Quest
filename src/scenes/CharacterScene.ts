import Phaser from 'phaser'
import { ProfileData, ItemData } from '../types'
import { loadProfile, saveProfile } from '../utils/profile'
import { getItem, getItemColor } from '../data/items'
import { generateAllItemTextures } from '../art/itemsArt'
import { AvatarConfig, SKIN_TONES, HAIR_STYLES, HAIR_COLORS, EYE_COLORS, ACCESSORIES, SHIRT_COLORS, PANTS_COLORS, SHOE_COLORS, randomizeOneConfig } from '../data/avatars'
import { AvatarRenderer } from '../components/AvatarRenderer'

const MONO_FONT = 'monospace'

export class CharacterScene extends Phaser.Scene {
  private profile!: ProfileData
  private profileSlot!: number
  private container!: Phaser.GameObjects.Container

  private activeTab: 'inventory' | 'stats' | 'avatar' = 'inventory'
  private activeSlotSelection: 'weapon' | 'armor' | 'accessory' | 'trophy' | null = null
  private avatarConfig!: AvatarConfig
  private avatarPreviewImage!: Phaser.GameObjects.Image
  private avatarDirty = false
  private originalAvatarId: string | null = null

  constructor() {
    super('Character')
  }

  init(data: { profileSlot: number }) {
    this.profileSlot = data.profileSlot
    this.profile = loadProfile(this.profileSlot)!

    // Initialize avatar config once from profile
    if (this.profile.avatarConfig) {
      this.originalAvatarId = this.profile.avatarConfig.id
      this.avatarConfig = JSON.parse(JSON.stringify(this.profile.avatarConfig))
    } else {
      this.avatarConfig = randomizeOneConfig()
    }
  }

  create() {
    const { width, height } = this.scale
    const mobile = this.registry.get('isMobile')

    generateAllItemTextures(this)

    // Semi-transparent modal background
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
      .setInteractive()
      .on('pointerdown', () => this.closeScene())

    // Main modal panel
    const panelWidth = mobile ? width - 40 : 1000
    const panelHeight = mobile ? height - 40 : 600
    const panelX = width / 2
    const panelY = height / 2
    this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x1a1a2e)
      .setStrokeStyle(4, 0x4e4e6a)
      .setInteractive() // prevent clicks passing through to the background

    // Close Button (top right of modal)
    this.add
      .text(panelX + panelWidth / 2 - 20, panelY - panelHeight / 2 + 20, 'X', {
        fontSize: mobile ? '18px' : '24px',
        color: '#ff4444',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.closeScene())

    this.container = this.add.container(0, 0)

    this.drawTabs(panelX - panelWidth / 2, panelY - panelHeight / 2)
    this.drawActiveTab()
  }

  private drawTabs(startX: number, startY: number) {
    // Clear old tabs logic might be needed if we redraw tabs, but for now we'll just clear the whole scene if we re-render tabs, or we can just make tabs once and update visually.
    // Actually, drawTabs is called once. We should keep references to the tab backgrounds if we want to change their color.
    // Let's store them.
    this.children.getAll().filter(c => c.getData('isTab')).forEach(c => c.destroy())

    const tabs = [
      { id: 'inventory', icon: '🎒', y: startY + 60 },
      { id: 'stats', icon: '📊', y: startY + 140 },
      { id: 'avatar', icon: '👤', y: startY + 220 }
    ] as const

    tabs.forEach(tab => {
      const isSelected = this.activeTab === tab.id
      const bg = this.add.rectangle(startX + 40, tab.y, 60, 60, isSelected ? 0x4e4e6a : 0x2a2a4a)
        .setStrokeStyle(2, 0x8888aa)
        .setInteractive({ useHandCursor: true })
        .setData('isTab', true)
        .on('pointerdown', () => {
          if (this.activeTab !== tab.id) {
            this.activeTab = tab.id
            this.activeSlotSelection = null // reset slot selection on tab change
            this.drawTabs(startX, startY) // redraw tabs to update selection color
            this.drawActiveTab()
          }
        })

      const text = this.add.text(startX + 40, tab.y, tab.icon, { fontSize: '32px' }).setOrigin(0.5)
        .setData('isTab', true)

      this.add.existing(bg)
      this.add.existing(text)
    })
  }

  private drawActiveTab() {
    this.container.removeAll(true)

    const { width, height } = this.scale
    const contentX = width / 2 - 350
    const contentY = height / 2 - 250

    if (this.activeTab === 'inventory') {
      this.drawInventoryTab(contentX, contentY)
    } else if (this.activeTab === 'stats') {
      this.drawStatsTab(contentX, contentY)
    } else if (this.activeTab === 'avatar') {
      this.drawAvatarTab(contentX, contentY)
    }
  }

  private drawInventoryTab(startX: number, startY: number) {
    this.addSectionTitle(this.container, startY, 'EQUIPMENT & ITEMS')

    // Slots on left
    const slotsX = startX + 100
    // Avatar paper doll preview in center
    const avatarX = startX + 350
    const avatarY = startY + 150

    this.renderTabPreview()
    this.avatarPreviewImage = this.add.image(avatarX, avatarY, this.avatarConfig.id).setScale(2)
    this.container.add(this.avatarPreviewImage)

    // Weapon
    this.drawPaperDollSlot(this.container, slotsX, avatarY - 90, 'weapon')

    // Armor
    this.drawPaperDollSlot(this.container, slotsX, avatarY, 'armor')

    // Accessory
    this.drawPaperDollSlot(this.container, slotsX, avatarY + 90, 'accessory')

    // Trophy
    this.drawPaperDollSlot(this.container, slotsX, avatarY + 180, 'trophy')

    if (this.activeSlotSelection) {
      this.drawItemSelectionList(startX + 640, startY + 50, this.activeSlotSelection)
    }

    this.addSectionTitle(this.container, startY + 380, 'OWNED SPELLS')
    this.drawSpells(this.container, startX + 50, startY + 420)
  }

  private drawStatsTab(startX: number, startY: number) {
    this.addSectionTitle(this.container, startY, 'CHARACTER STATS')
    this.drawStats(this.container, startX + 50, startY + 60)
  }

  private drawAvatarTab(startX: number, startY: number) {
    this.addSectionTitle(this.container, startY, 'EDIT HERO')

    const { width } = this.scale

    // Avatar preview in center
    const avatarX = width / 2 + 40
    const avatarY = startY + 220
    this.renderTabPreview()
    this.avatarPreviewImage = this.add.image(avatarX, avatarY, this.avatarConfig.id).setScale(2)
    this.container.add(this.avatarPreviewImage)

    // Selector columns flanking the avatar
    const leftX = startX + 140
    const rightX = width / 2 + 280
    const selectorY = startY + 60
    const spacing = 42

    const toHex = (num: number) => '#' + num.toString(16).padStart(6, '0')

    // Left column
    this.createTabSelector(leftX, selectorY, 'Skin', SKIN_TONES, 'skinTone', toHex)
    this.createTabSelector(leftX, selectorY + spacing, 'Hair Style', HAIR_STYLES, 'hairStyle', (v: string) => v)
    this.createTabSelector(leftX, selectorY + spacing * 2, 'Hair Color', HAIR_COLORS, 'hairColor', toHex)
    this.createTabSelector(leftX, selectorY + spacing * 3, 'Eyes', EYE_COLORS, 'eyeColor', toHex)

    // Right column
    this.createTabSelector(rightX, selectorY, 'Shirt', SHIRT_COLORS, 'shirtColor', toHex)
    this.createTabSelector(rightX, selectorY + spacing, 'Pants', PANTS_COLORS, 'pantsColor', toHex)
    this.createTabSelector(rightX, selectorY + spacing * 2, 'Shoes', SHOE_COLORS, 'shoeColor', toHex)
    this.createTabSelector(rightX, selectorY + spacing * 3, 'Accessory', ACCESSORIES, 'accessory', (v: string) => v)

    // Saved Outfits row
    const outfitsY = startY + 365
    const outfitsLabel = this.add.text(avatarX, outfitsY - 25, 'Saved Outfits', {
      fontSize: '13px', color: '#aaaaaa', fontFamily: MONO_FONT
    }).setOrigin(0.5)
    this.container.add(outfitsLabel)

    this.drawTabOutfitSlots(avatarX, outfitsY)

    // Buttons
    const btnY = startY + 460

    // Randomize button
    const randomizeBg = this.add.rectangle(avatarX - 100, btnY, 130, 34, 0x2a2a4a).setStrokeStyle(2, 0x5555aa)
      .setInteractive({ useHandCursor: true })
    const randomizeText = this.add.text(avatarX - 100, btnY, 'Randomize', {
      fontSize: '16px', color: '#ffffff', fontFamily: MONO_FONT
    }).setOrigin(0.5)
    this.container.add([randomizeBg, randomizeText])

    randomizeBg.on('pointerdown', () => {
      this.avatarConfig = randomizeOneConfig()
      this.drawActiveTab()
    })

    // Save button
    const saveBg = this.add.rectangle(avatarX + 100, btnY, 130, 34, 0x2a6a2a).setStrokeStyle(2, 0x44aa44)
      .setInteractive({ useHandCursor: true })
    const saveText = this.add.text(avatarX + 100, btnY, 'Save', {
      fontSize: '16px', color: '#ffffff', fontFamily: MONO_FONT
    }).setOrigin(0.5)
    this.container.add([saveBg, saveText])

    saveBg.on('pointerdown', () => {
      this.renderTabPreview()
      this.profile.avatarConfig = JSON.parse(JSON.stringify(this.avatarConfig))
      this.profile.avatarChoice = this.avatarConfig.id
      saveProfile(this.profileSlot, this.profile)
      this.avatarDirty = true

      saveBg.setFillStyle(0x44ff44)
      const savedLabel = this.add.text(avatarX + 100, btnY, 'Saved!', {
        fontSize: '16px', color: '#ffffff', fontFamily: MONO_FONT
      }).setOrigin(0.5)
      this.container.add(savedLabel)
      this.time.delayedCall(500, () => {
        saveBg.setFillStyle(0x2a6a2a)
        savedLabel.destroy()
      })
    })
  }

  private drawTabOutfitSlots(centerX: number, y: number) {
    const slotSpacing = 65
    const startX = centerX - (4 * slotSpacing) / 2

    for (let i = 0; i < 5; i++) {
      const sx = startX + i * slotSpacing
      this.drawOneTabOutfitSlot(sx, y, i)
    }
  }

  private drawOneTabOutfitSlot(x: number, y: number, index: number) {
    const outfit = this.profile.savedOutfits?.[index] ?? null

    // Frame
    const frame = this.add.rectangle(x, y, 40, 40, 0x111122).setStrokeStyle(1, outfit ? 0x4444aa : 0x333344)
    this.container.add(frame)

    // Thumbnail or empty
    if (outfit) {
      const thumbKey = `tab_outfit_${this.profileSlot}_${index}_${Date.now()}`
      const thumbConfig = { ...outfit, id: thumbKey }
      AvatarRenderer.generateOne(this, thumbConfig, this.profile.equipment)
      const thumb = this.add.image(x, y, thumbKey).setDisplaySize(20, 40)
      this.container.add(thumb)
    } else {
      const empty = this.add.text(x, y, '--', { fontSize: '11px', color: '#444444', fontFamily: MONO_FONT }).setOrigin(0.5)
      this.container.add(empty)
    }

    // Icon buttons below frame
    const iconY = y + 28
    const iconSpacing = 16

    // Save icon
    const saveBtn = this.add.text(x - iconSpacing, iconY, '\u2913', { fontSize: '13px', color: '#44aa44', fontFamily: MONO_FONT })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
    saveBtn.on('pointerover', () => saveBtn.setColor('#88ff88'))
    saveBtn.on('pointerout', () => saveBtn.setColor('#44aa44'))
    saveBtn.on('pointerdown', () => {
      if (!this.profile.savedOutfits) this.profile.savedOutfits = []
      this.profile.savedOutfits[index] = JSON.parse(JSON.stringify(this.avatarConfig))
      saveProfile(this.profileSlot, this.profile)
      // Flash + redraw
      const flash = this.add.rectangle(x, y, 40, 40, 0x44ff44, 0.5)
      this.container.add(flash)
      this.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => { flash.destroy(); this.drawActiveTab() } })
    })
    this.container.add(saveBtn)

    // Load icon (only if outfit exists)
    if (outfit) {
      const loadBtn = this.add.text(x, iconY, '\u2912', { fontSize: '13px', color: '#4488cc', fontFamily: MONO_FONT })
        .setOrigin(0.5).setInteractive({ useHandCursor: true })
      loadBtn.on('pointerover', () => loadBtn.setColor('#88ccff'))
      loadBtn.on('pointerout', () => loadBtn.setColor('#4488cc'))
      loadBtn.on('pointerdown', () => {
        this.avatarConfig = JSON.parse(JSON.stringify(outfit))
        this.avatarConfig.id = `custom_${Date.now()}`
        this.drawActiveTab()
      })
      this.container.add(loadBtn)

      // Clear icon
      const clearBtn = this.add.text(x + iconSpacing, iconY, '\u2715', { fontSize: '11px', color: '#aa4444', fontFamily: MONO_FONT })
        .setOrigin(0.5).setInteractive({ useHandCursor: true })
      clearBtn.on('pointerover', () => clearBtn.setColor('#ff8888'))
      clearBtn.on('pointerout', () => clearBtn.setColor('#aa4444'))
      clearBtn.on('pointerdown', () => {
        if (this.profile.savedOutfits) {
          delete this.profile.savedOutfits[index]
          saveProfile(this.profileSlot, this.profile)
          this.drawActiveTab()
        }
      })
      this.container.add(clearBtn)
    }
  }

  private createTabSelector(
    x: number,
    y: number,
    label: string,
    options: any[],
    key: keyof AvatarConfig,
    formatVal: (val: any) => string
  ) {
    this.container.add(
      this.add.text(x, y - 16, label, { fontSize: '13px', color: '#aaaaaa', fontFamily: MONO_FONT }).setOrigin(0.5)
    )

    this.container.add(
      this.add.rectangle(x, y + 5, 160, 24, 0x111122).setStrokeStyle(1, 0x333366)
    )

    const isColor = typeof this.avatarConfig[key] === 'number'
    let colorSwatch: Phaser.GameObjects.Rectangle | null = null
    let valText: Phaser.GameObjects.Text

    if (isColor) {
      colorSwatch = this.add.rectangle(x - 40, y + 5, 16, 16, this.avatarConfig[key] as number)
      valText = this.add.text(x + 10, y + 5, formatVal(this.avatarConfig[key]), { fontSize: '13px', color: '#ffffff', fontFamily: MONO_FONT }).setOrigin(0.5)
      this.container.add(colorSwatch)
    } else {
      valText = this.add.text(x, y + 5, formatVal(this.avatarConfig[key]), { fontSize: '13px', color: '#ffffff', fontFamily: MONO_FONT }).setOrigin(0.5)
    }
    this.container.add(valText)

    const leftBtn = this.add.text(x - 68, y + 5, '<', { fontSize: '20px', color: '#ffd700', fontFamily: MONO_FONT })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
    const rightBtn = this.add.text(x + 68, y + 5, '>', { fontSize: '20px', color: '#ffd700', fontFamily: MONO_FONT })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
    this.container.add([leftBtn, rightBtn])

    const update = () => {
      valText.setText(formatVal(this.avatarConfig[key]))
      if (colorSwatch && typeof this.avatarConfig[key] === 'number') {
        colorSwatch.setFillStyle(this.avatarConfig[key] as number)
      }
      this.renderTabPreview()
      this.avatarPreviewImage.setTexture(this.avatarConfig.id)
    }

    leftBtn.on('pointerdown', () => {
      let idx = options.indexOf(this.avatarConfig[key] as any)
      idx = (idx - 1 + options.length) % options.length
      ;(this.avatarConfig as any)[key] = options[idx]
      update()
    })

    rightBtn.on('pointerdown', () => {
      let idx = options.indexOf(this.avatarConfig[key] as any)
      idx = (idx + 1) % options.length
      ;(this.avatarConfig as any)[key] = options[idx]
      update()
    })
  }

  private renderTabPreview() {
    this.avatarConfig.id = `custom_${Date.now()}`
    AvatarRenderer.generateOne(this, this.avatarConfig, this.profile.equipment)
  }

  private addSectionTitle(container: Phaser.GameObjects.Container, y: number, text: string) {
    const { width } = this.scale
    container.add(
      this.add.text(width / 2 - 300, y, text, {
        fontSize: '20px',
        color: '#ffd700',
        fontStyle: 'bold',
      })
    )
  }

  private drawPaperDollSlot(
    container: Phaser.GameObjects.Container,
    x: number,
    y: number,
    slot: keyof ProfileData['equipment']
  ) {
    const itemId = this.profile.equipment[slot]
    const item = itemId ? getItem(itemId) : null

    const isSelected = this.activeSlotSelection === slot
    const boxColor = isSelected ? 0x2a2a4a : 0x16213e
    const boxStroke = isSelected ? 0x8888aa : 0x4e4e6a
    const box = this.add.rectangle(x, y, 160, 80, boxColor).setStrokeStyle(2, boxStroke)

    box.setInteractive({ useHandCursor: true })
    box.on('pointerdown', () => {
      this.activeSlotSelection = isSelected ? null : slot
      this.drawActiveTab()
    })
    container.add(box)

    if (item) {
      const unequipBtn = this.add.text(x + 65, y - 25, 'X', {
        fontSize: '14px',
        color: '#ff4444',
        fontStyle: 'bold'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })

      unequipBtn.on('pointerdown', () => {
        this.profile.equipment[slot] = null
        saveProfile(this.profileSlot, this.profile)
        this.avatarDirty = true
        this.drawActiveTab()
      })
      container.add(unequipBtn)
    }

    container.add(
      this.add
        .text(x, y - 25, slot.toUpperCase(), { fontSize: '12px', color: '#888888' })
        .setOrigin(0.5)
    )

    const itemName = item ? item.name : 'EMPTY'
    const itemColor = item ? getItemColor(item.rarity) : '#444444'

    const textOffsetX = item ? 15 : 0;

    container.add(
      this.add
        .text(x + textOffsetX, y, itemName, { fontSize: '14px', color: itemColor, fontStyle: 'bold' })
        .setOrigin(0.5)
    )

    if (item) {
      container.add(this.add.image(x - 45, y + 5, item.id).setScale(0.8))

      const effectText = this.getEffectString(item.effect)
      container.add(
        this.add
          .text(x + textOffsetX, y + 20, effectText, { fontSize: '11px', color: '#00ff00' })
          .setOrigin(0.5)
      )
    }
  }

  private drawItemSelectionList(x: number, y: number, slot: 'weapon' | 'armor' | 'accessory' | 'trophy') {
    this.container.add(
      this.add.text(x, y, `Select ${slot.toUpperCase()}`, {
        fontSize: '20px',
        color: '#ffd700',
        fontStyle: 'bold'
      }).setOrigin(0.5)
    )

    const ownedItems = this.profile.ownedItemIds
      .map((id) => getItem(id))
      .filter((item): item is ItemData => !!item && item.slot === slot)
      .sort((a, b) => {
        if (a.goldCost !== b.goldCost) return a.goldCost - b.goldCost;
        const ap = a.effect.power || a.effect.hp || a.effect.focusBonus || a.effect.goldMultiplier || 0;
        const bp = b.effect.power || b.effect.hp || b.effect.focusBonus || b.effect.goldMultiplier || 0;
        return ap - bp;
      })

    if (ownedItems.length === 0) {
      this.container.add(
        this.add.text(x, y + 40, 'No items available.', { fontSize: '14px', color: '#888888' }).setOrigin(0.5)
      )
      return
    }

    ownedItems.forEach((item, i) => {
      const itemY = y + 50 + i * 60
      const isEquipped = this.profile.equipment[slot] === item.id

      const bg = this.add.rectangle(x, itemY, 280, 50, isEquipped ? 0x2a2a4a : 0x16213e)
        .setStrokeStyle(1, isEquipped ? 0x44aa44 : 0x4e4e6a)

      bg.setInteractive({ useHandCursor: true })
      bg.on('pointerdown', () => {
        if (!isEquipped) {
          this.profile.equipment[slot] = item.id
          saveProfile(this.profileSlot, this.profile)
          this.avatarDirty = true
          this.drawActiveTab()
        }
      })
      this.container.add(bg)

      this.container.add(this.add.image(x - 110, itemY, item.id).setScale(0.8))

      this.container.add(
        this.add.text(x + 10, itemY - 10, item.name, { fontSize: '16px', color: isEquipped ? '#44aa44' : '#ffffff' }).setOrigin(0.5)
      )

      const effectText = this.getEffectString(item.effect)
      this.container.add(
        this.add.text(x + 10, itemY + 10, effectText, { fontSize: '12px', color: '#00ff00' }).setOrigin(0.5)
      )
    })
  }

  private drawStats(container: Phaser.GameObjects.Container, x: number, y: number) {
    const stats = [
      { name: 'Level', value: this.profile.characterLevel, key: null },
      { name: 'HP', value: 10 + this.profile.hpPoints * 2, key: 'hpPoints' },
      { name: 'Power', value: 5 + this.profile.powerPoints, key: 'powerPoints' },
      { name: 'Focus', value: 10 + this.profile.focusPoints, key: 'focusPoints' },
    ]

    stats.forEach((stat, i) => {
      const sy = y + i * 40
      container.add(
        this.add.text(x, sy, `${stat.name}: ${stat.value}`, { fontSize: '18px', color: '#ffffff' })
      )

      if (stat.key && this.profile.statPoints > 0) {
        const btn = this.add
          .text(x + 150, sy, '[ + ]', { fontSize: '18px', color: '#00ff00' })
          .setInteractive({ useHandCursor: true })
          .on('pointerdown', () => this.allocatePoint(stat.key as any))
        container.add(btn)
      }
    })

    if (this.profile.statPoints > 0) {
      container.add(
        this.add.text(x + 300, y, `Points Available: ${this.profile.statPoints}`, {
          fontSize: '20px',
          color: '#ffd700',
          fontStyle: 'bold',
        })
      )
    }
  }

  private drawSpells(container: Phaser.GameObjects.Container, x: number, y: number) {
    if (this.profile.spells.length === 0) {
      container.add(this.add.text(x, y, 'No spells learned yet.', { fontSize: '16px', color: '#666666' }))
      return
    }

    this.profile.spells.forEach((spellId, i) => {
      container.add(
        this.add.text(x + i * 200, y, `✨ ${spellId}`, {
          fontSize: '18px',
          color: '#a29bfe',
        })
      )
    })
  }



  private allocatePoint(key: 'hpPoints' | 'powerPoints' | 'focusPoints') {
    if (this.profile.statPoints > 0) {
      this.profile.statPoints--
      this.profile[key]++
      saveProfile(this.profileSlot, this.profile)
      this.drawActiveTab()
    }
  }

  private closeScene() {
    const mobile = this.registry.get('isMobile')
    if (mobile) {
      this.scene.start('MobileOverlandMap', { profileSlot: this.profileSlot })
    } else {
      if (this.avatarDirty) {
        // Restart OverlandMap so it picks up the new avatar
        this.scene.stop('OverlandMap')

        if (this.originalAvatarId && this.textures.exists(this.originalAvatarId)) {
          this.textures.remove(this.originalAvatarId)
        }
        if (this.profile.avatarConfig && this.textures.exists(this.profile.avatarConfig.id)) {
          this.textures.remove(this.profile.avatarConfig.id)
        }

        this.scene.start('OverlandMap', { profileSlot: this.profileSlot })
      } else {
        this.scene.resume('OverlandMap')
      }
      this.scene.stop()
    }
  }

  private getEffectString(effect: ItemData['effect']): string {
    const parts: string[] = []
    if (effect.hp) parts.push(`+${effect.hp} HP`)
    if (effect.power) parts.push(`+${effect.power} PWR`)
    if (effect.focusBonus) parts.push(`+${effect.focusBonus} FOCUS`)
    if (effect.goldMultiplier) parts.push(`+${(effect.goldMultiplier * 100).toFixed(0)}% Gold`)
    if (effect.defeatAdditionalEnemiesChance) parts.push(`${(effect.defeatAdditionalEnemiesChance * 100).toFixed(0)}% Double Kill`)
    if (effect.absorbAttacksChance) parts.push(`${(effect.absorbAttacksChance * 100).toFixed(0)}% Block`)
    if (effect.bonusGoldChance) parts.push(`${(effect.bonusGoldChance * 100).toFixed(0)}% Bonus Gold`)
    return parts.join(', ')
  }
}
