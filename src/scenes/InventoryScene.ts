import Phaser from 'phaser'
import { ProfileData, ItemData } from '../types'
import { loadProfile, saveProfile } from '../utils/profile'
import { getItem } from '../data/items'

export class InventoryScene extends Phaser.Scene {
  private profile!: ProfileData
  private profileSlot!: number
  private container!: Phaser.GameObjects.Container
  private selectionContainer!: Phaser.GameObjects.Container

  constructor() {
    super('Inventory')
  }

  init(data: { profileSlot: number }) {
    this.profileSlot = data.profileSlot
    this.profile = loadProfile(this.profileSlot)!
  }

  create() {
    const { width, height } = this.scale

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e)

    // Title
    this.add.text(width / 2, 40, 'INVENTORY & EQUIPMENT', {
      fontSize: '32px',
      color: '#e94560',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // Back Button
    this.add
      .text(60, 40, '← BACK', {
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: '#4e4e6a',
        padding: { x: 10, y: 5 },
      })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('OverlandMap', { profileSlot: this.profileSlot }))

    this.container = this.add.container(0, 0)
    this.selectionContainer = this.add.container(0, 0).setVisible(false)

    this.drawMainInventory()
  }

  private drawMainInventory() {
    this.container.removeAll(true)

    // --- Equipment Slots ---
    this.addSectionTitle(this.container, 100, 'EQUIPMENT')

    const slots: (keyof ProfileData['equipment'])[] = ['weapon', 'armor', 'accessory']
    slots.forEach((slot, i) => {
      const x = 200 + i * 250
      const y = 200
      this.drawEquipmentSlot(this.container, x, y, slot)
    })

    // --- Stats & Points ---
    this.addSectionTitle(this.container, 320, 'CHARACTER STATS')
    this.drawStats(this.container, 200, 380)

    // --- Spells ---
    this.addSectionTitle(this.container, 520, 'OWNED SPELLS')
    this.drawSpells(this.container, 200, 580)
  }

  private addSectionTitle(container: Phaser.GameObjects.Container, y: number, text: string) {
    container.add(
      this.add.text(100, y, text, {
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
    this.drawMainInventory()
  }

  private allocatePoint(key: 'hpPoints' | 'powerPoints' | 'focusPoints') {
    if (this.profile.statPoints > 0) {
      this.profile.statPoints--
      this.profile[key]++
      saveProfile(this.profileSlot, this.profile)
      this.drawMainInventory()
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
