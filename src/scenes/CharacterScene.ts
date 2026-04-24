import Phaser from 'phaser'
import { ProfileData } from '../types'
import { loadProfile, saveProfile } from '../utils/profile'
import { getItem } from '../data/items'
import { generateAllItemTextures } from '../art/itemsArt'
import { AvatarConfig, SKIN_TONES, HAIR_STYLES, HAIR_COLORS, EYE_COLORS, ACCESSORIES, SHIRT_COLORS, PANTS_COLORS, SHOE_COLORS, randomizeOneConfig } from '../data/avatars'
import { AvatarRenderer } from '../components/AvatarRenderer'
import { InventoryController } from '../controllers/InventoryController'
import { GRID_COLS, GRID_ROWS } from '../controllers/BackpackGrid'
import { GridPanel } from '../components/GridPanel'
import { drawEquipSlotBox } from '../utils/equipSlot'

const MONO_FONT = 'monospace'

export class CharacterScene extends Phaser.Scene {
  private profile!: ProfileData
  private profileSlot!: number
  private container!: Phaser.GameObjects.Container

  private activeTab: 'inventory' | 'stats' | 'avatar' = 'inventory'
  private inventoryController!: InventoryController
  private avatarConfig!: AvatarConfig
  private avatarPreviewImage!: Phaser.GameObjects.Image
  private avatarDirty = false
  private originalAvatarId: string | null = null

  private readonly CELL_SIZE = 45
  private backpackPanel: GridPanel | null = null

  constructor() {
    super('Character')
  }

  init(data: { profileSlot: number }) {
    this.profileSlot = data.profileSlot
    this.profile = loadProfile(this.profileSlot)!
    this.inventoryController = new InventoryController(this.profile)

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
    this.backpackPanel?.destroy()
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
    // ── Paper doll ─────────────────────────────────────────────────────────
    const paperDollCX = startX + 200
    const paperDollCY = startY + 120

    // Render avatar with current equipment
    const pdKey = `pd_${this.profileSlot}`
    AvatarRenderer.generateOne(this, { ...this.avatarConfig, id: pdKey }, this.profile.equipment)
    this.container.add(
      this.add.image(paperDollCX, paperDollCY, pdKey).setScale(1.25).setDepth(5)
    )

    // Equipment slots around the avatar
    const slotConfigs = [
      { slot: 'weapon',    x: paperDollCX - 100, y: paperDollCY - 60  },
      { slot: 'armor',     x: paperDollCX + 40,  y: paperDollCY - 60  },
      { slot: 'accessory', x: paperDollCX + 40,  y: paperDollCY - 124 },
      { slot: 'trophy',    x: paperDollCX - 30,  y: paperDollCY + 65  },
    ] as const

    for (const { slot, x, y } of slotConfigs) {
      const itemId = this.profile.equipment[slot]
      const item = itemId ? (getItem(itemId) ?? null) : null
      const objs = drawEquipSlotBox(this, x, y, slot, item, {
        onUnequip: item ? () => {
          this.inventoryController.unequip(slot)
          this.profile.equipment = { ...this.inventoryController.equipment }
          saveProfile(this.profileSlot, this.profile)
          this.avatarDirty = true
          this.drawActiveTab()
        } : undefined,
        onDrop: () => {
          const draggingId = this.backpackPanel?.draggingItemId
          if (!draggingId) return
          const dragItem = getItem(draggingId)
          if (dragItem?.slot === slot) this.dropOnEquipSlot(draggingId, slot)
        },
      })
      objs.forEach(o => this.container.add(o))
    }

    // ── Spells (top-right) ─────────────────────────────────────────────────
    const rightX = startX + 400

    this.container.add(
      this.add.text(rightX, startY, 'OWNED SPELLS', {
        fontSize: '20px', color: '#ffd700', fontStyle: 'bold',
      })
    )
    this.drawSpells(this.container, rightX, startY + 35)

    // ── Backpack grid (bottom) ─────────────────────────────────────────────
    const gridOriginX = startX + 20
    const gridOriginY = startY + 300

    this.container.add(
      this.add.text(gridOriginX, gridOriginY - 25, 'BACKPACK', {
        fontSize: '20px', color: '#ffd700', fontStyle: 'bold',
      })
    )

    this.backpackPanel?.destroy()
    this.backpackPanel = new GridPanel(
      this, gridOriginX, gridOriginY, GRID_COLS, GRID_ROWS, this.CELL_SIZE
    )
    this.backpackPanel
      .onItemDrop((itemId, col, row) => {
        const moved = this.inventoryController.moveInBackpack(itemId, col, row)
        if (moved) saveProfile(this.profileSlot, this.profile)
        this.drawActiveTab()
      })
      .render(
        this.inventoryController.backpackGrid.getPlacements(),
        { draggable: true, grid: this.inventoryController.backpackGrid }
      )
  }

  private dropOnEquipSlot(itemId: string, slot: 'weapon' | 'armor' | 'accessory' | 'trophy') {
    this.backpackPanel?.cancelDrag()

    // Unequip whatever is currently there (returns it to backpack)
    const current = this.profile.equipment[slot]
    if (current && current !== itemId) {
      this.inventoryController.unequip(slot)
    }

    this.inventoryController.removeFromBackpack(itemId)
    this.inventoryController.equip(slot, itemId)
    this.profile.equipment = { ...this.inventoryController.equipment }
    saveProfile(this.profileSlot, this.profile)
    this.avatarDirty = true
    this.drawActiveTab()
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

}
