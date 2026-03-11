import Phaser from 'phaser'
import { ProfileData, ItemData } from '../types'
import { loadProfile, saveProfile } from '../utils/profile'
import { getItem } from '../data/items'
import { AVATAR_CONFIGS, randomizeAvatarConfigs } from '../data/avatars'
import { AvatarRenderer } from '../components/AvatarRenderer'

const MONO_FONT = 'monospace'

export class CharacterScene extends Phaser.Scene {
  private profile!: ProfileData
  private profileSlot!: number
  private container!: Phaser.GameObjects.Container
  private selectionContainer!: Phaser.GameObjects.Container

  private activeTab: 'inventory' | 'stats' | 'avatar' = 'inventory'
  private selectedAvatarId: string = ''

  constructor() {
    super('Character')
  }

  init(data: { profileSlot: number }) {
    this.profileSlot = data.profileSlot
    this.profile = loadProfile(this.profileSlot)!
    this.selectedAvatarId = this.profile.avatarChoice || 'avatar_0'
  }

  create() {
    const { width, height } = this.scale

    // Semi-transparent modal background
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)

    // Main modal panel
    const panelWidth = 1000
    const panelHeight = 600
    const panelX = width / 2
    const panelY = height / 2
    this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x1a1a2e).setStrokeStyle(4, 0x4e4e6a)

    // Block clicks behind the modal
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0)
      .setInteractive()
      .setDepth(-1)

    // Close Button (top right of modal)
    this.add
      .text(panelX + panelWidth / 2 - 20, panelY - panelHeight / 2 + 20, 'X', {
        fontSize: '24px',
        color: '#ff4444',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.resume('OverlandMap')
        this.scene.stop()
      })

    this.container = this.add.container(0, 0)
    this.selectionContainer = this.add.container(0, 0).setVisible(false)

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
    this.selectionContainer.setVisible(false)

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

    const slots: (keyof ProfileData['equipment'])[] = ['weapon', 'armor', 'accessory']
    slots.forEach((slot, i) => {
      const x = startX + 100 + i * 250
      const y = startY + 100
      this.drawEquipmentSlot(this.container, x, y, slot)
    })

    this.addSectionTitle(this.container, startY + 200, 'OWNED SPELLS')
    this.drawSpells(this.container, startX + 50, startY + 250)
  }

  private drawStatsTab(startX: number, startY: number) {
    this.addSectionTitle(this.container, startY, 'CHARACTER STATS')
    this.drawStats(this.container, startX + 50, startY + 60)
  }

  private drawAvatarTab(startX: number, startY: number) {
    this.addSectionTitle(this.container, startY, 'AVATAR')

    const cols = 6
    const cellSize = 72
    const gridStartX = startX + 50 + cellSize / 2
    const gridStartY = startY + 100

    let highlightRect: Phaser.GameObjects.Rectangle | null = null

    AVATAR_CONFIGS.forEach((config, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      const ax = gridStartX + col * cellSize
      const ay = gridStartY + row * cellSize

      // Dark frame
      const frame = this.add.rectangle(ax, ay, 56, 56, 0x2a2a4a)
      frame.setStrokeStyle(2, 0x4444aa)
      this.container.add(frame)

      // Avatar image
      const img = this.add.image(ax, ay, config.id).setDisplaySize(36, 72)
      img.setInteractive({ useHandCursor: true })
      this.container.add(img)

      // Default selection highlight
      if (config.id === this.selectedAvatarId) {
        highlightRect = this.add.rectangle(ax, ay, 60, 60)
        highlightRect.setFillStyle(0x000000, 0)
        highlightRect.setStrokeStyle(3, 0xffd700)
        this.container.add(highlightRect)
      }

      img.on('pointerdown', () => {
        this.selectedAvatarId = config.id
        this.profile.avatarChoice = this.selectedAvatarId
        saveProfile(this.profileSlot, this.profile)

        if (highlightRect) {
          highlightRect.destroy()
        }
        highlightRect = this.add.rectangle(ax, ay, 60, 60)
        highlightRect.setFillStyle(0x000000, 0)
        highlightRect.setStrokeStyle(3, 0xffd700)
        this.container.add(highlightRect)
      })
    })

    // Buttons row
    const confirmY = startY + 450

    // Randomize button
    const randomizeBg = this.add.rectangle(startX + 150, confirmY, 150, 40, 0x2a2a4a).setStrokeStyle(2, 0x5555aa)
      .setInteractive({ useHandCursor: true })
    const randomizeText = this.add.text(startX + 150, confirmY, 'Randomize', {
      fontSize: '20px', color: '#ffffff', fontFamily: MONO_FONT
    }).setOrigin(0.5)

    randomizeBg.on('pointerdown', () => {
      randomizeAvatarConfigs()
      AvatarRenderer.generateAll(this)
      this.selectedAvatarId = AVATAR_CONFIGS[0]?.id || 'avatar_0'
      this.profile.avatarChoice = this.selectedAvatarId
      saveProfile(this.profileSlot, this.profile)
      this.drawActiveTab() // Redraw to show new avatars
    })

    // Customize button
    const customizeBg = this.add.rectangle(startX + 400, confirmY, 150, 40, 0x2a6a2a).setStrokeStyle(2, 0x44aa44)
      .setInteractive({ useHandCursor: true })
    const customizeText = this.add.text(startX + 400, confirmY, 'Customize', {
      fontSize: '20px', color: '#ffffff', fontFamily: MONO_FONT
    }).setOrigin(0.5)

    customizeBg.on('pointerdown', () => {
      this.scene.resume('OverlandMap')
      this.scene.stop()
      this.scene.get('OverlandMap').scene.start('AvatarCustomizer', {
        slot: this.profileSlot,
        playerName: this.profile.playerName,
        isEditingExisting: true
      })
    })

    this.container.add([randomizeBg, randomizeText, customizeBg, customizeText])
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

  private drawEquipmentSlot(
    container: Phaser.GameObjects.Container,
    x: number,
    y: number,
    slot: keyof ProfileData['equipment']
  ) {
    const itemId = this.profile.equipment[slot]
    const item = itemId ? getItem(itemId) : null

    const box = this.add.rectangle(x, y, 200, 100, 0x16213e).setStrokeStyle(2, 0x4e4e6a)
    box.setInteractive({ useHandCursor: true })
    box.on('pointerdown', () => this.showItemSelection(slot))
    container.add(box)

    container.add(
      this.add
        .text(x, y - 40, slot.toUpperCase(), { fontSize: '14px', color: '#888888' })
        .setOrigin(0.5)
    )

    const itemName = item ? item.name : 'EMPTY'
    const itemColor = item ? '#ffffff' : '#444444'
    container.add(
      this.add
        .text(x, y, itemName, { fontSize: '18px', color: itemColor, fontStyle: 'bold' })
        .setOrigin(0.5)
    )

    if (item) {
      const effectText = this.getEffectString(item.effect)
      container.add(
        this.add
          .text(x, y + 25, effectText, { fontSize: '12px', color: '#00ff00' })
          .setOrigin(0.5)
      )
    }
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

  private showItemSelection(slot: 'weapon' | 'armor' | 'accessory') {
    this.container.setVisible(false)
    this.selectionContainer.setVisible(true).removeAll(true)

    const { width, height } = this.scale
    this.selectionContainer.add(this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8))

    this.selectionContainer.add(
      this.add
        .text(width / 2, 100, `SELECT ${slot.toUpperCase()}`, {
          fontSize: '28px',
          color: '#ffd700',
        })
        .setOrigin(0.5)
    )

    const ownedItems = this.profile.ownedItemIds
      .map((id) => getItem(id))
      .filter((item): item is ItemData => !!item && item.slot === slot)

    // Add "Unequip" option
    const options = [null, ...ownedItems]

    options.forEach((item, i) => {
      const x = width / 2
      const y = 200 + i * 80
      const name = item ? item.name : '--- UNEQUIP ---'
      const desc = item ? `${item.description} (${this.getEffectString(item.effect)})` : ''

      const bg = this.add.rectangle(x, y, 600, 60, 0x16213e).setStrokeStyle(1, 0x4e4e6a)
      bg.setInteractive({ useHandCursor: true })
      bg.on('pointerdown', () => {
        this.profile.equipment[slot] = item ? item.id : null
        saveProfile(this.profileSlot, this.profile)
        this.hideItemSelection()
      })
      this.selectionContainer.add(bg)

      this.selectionContainer.add(
        this.add.text(x, y - 10, name, { fontSize: '20px', color: '#ffffff' }).setOrigin(0.5)
      )
      if (desc) {
        this.selectionContainer.add(
          this.add.text(x, y + 15, desc, { fontSize: '14px', color: '#888888' }).setOrigin(0.5)
        )
      }
    })

    const cancelBtn = this.add
      .text(width / 2, height - 100, 'CANCEL', {
        fontSize: '20px',
        color: '#ff4444',
        backgroundColor: '#222',
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.hideItemSelection())
    this.selectionContainer.add(cancelBtn)
  }

  private hideItemSelection() {
    this.selectionContainer.setVisible(false)
    this.container.setVisible(true)
    this.drawActiveTab()
  }

  private allocatePoint(key: 'hpPoints' | 'powerPoints' | 'focusPoints') {
    if (this.profile.statPoints > 0) {
      this.profile.statPoints--
      this.profile[key]++
      saveProfile(this.profileSlot, this.profile)
      this.drawActiveTab()
    }
  }

  private getEffectString(effect: ItemData['effect']): string {
    const parts: string[] = []
    if (effect.hp) parts.push(`+${effect.hp} HP`)
    if (effect.power) parts.push(`+${effect.power} PWR`)
    if (effect.focusBonus) parts.push(`+${effect.focusBonus} FOCUS`)
    if (effect.goldMultiplier) parts.push(`+${(effect.goldMultiplier * 100).toFixed(0)}% Gold`)
    return parts.join(', ')
  }
}
