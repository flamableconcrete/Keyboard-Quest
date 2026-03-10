import Phaser from 'phaser'
import { loadProfile, saveProfile } from '../utils/profile'
import { ProfileData, ItemData } from '../types'
import { ITEMS } from '../data/items'

export class ShopScene extends Phaser.Scene {
  private profileSlot!: number
  private profile!: ProfileData


  constructor() { super('Shop') }

  init(data: { profileSlot: number }) {
    this.profileSlot = data.profileSlot
    this.profile = loadProfile(data.profileSlot)!
  }

  create() {
    const { width, height } = this.scale

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e)

    this.add.text(width / 2, 40, 'THE MERCHANTS TENT', {
      fontSize: '32px', color: '#ffd700', fontStyle: 'bold'
    }).setOrigin(0.5)

    this.add.text(width - 40, 40, `Gold: ${this.profile.gold ?? 0}`, {
      fontSize: '24px', color: '#ffd700', fontStyle: 'bold'
    }).setOrigin(1, 0.5)

    const back = this.add.text(60, 40, '← BACK', {
      fontSize: '20px', color: '#ffffff', backgroundColor: '#4e4e6a', padding: { x: 10, y: 5 }
    }).setInteractive({ useHandCursor: true })

    back.on('pointerdown', () => {
      this.scene.start('OverlandMap', { profileSlot: this.profileSlot })
    })

    const categories: ('weapon' | 'armor' | 'accessory')[] = ['weapon', 'armor', 'accessory']
    const columnWidth = width / 3

    categories.forEach((cat, i) => {
      const cx = columnWidth * i + columnWidth / 2
      const title = cat === 'accessory' ? 'ACCESSORIES' : cat.toUpperCase() + 'S'
      this.add.text(cx, 100, title, {
        fontSize: '24px', color: '#ffffff', fontStyle: 'bold'
      }).setOrigin(0.5)

      const catItems = ITEMS.filter(item => item.slot === cat && item.goldCost > 0)
      catItems.forEach((item, j) => {
        const cy = 160 + j * 100
        this.renderItemCard(cx, cy, item)
      })
    })
  }

  private renderItemCard(x: number, y: number, item: ItemData) {
    const isOwned = this.profile.ownedItemIds.includes(item.id)
    const canAfford = (this.profile.gold ?? 0) >= item.goldCost

    const bgColor = isOwned ? 0x223322 : canAfford ? 0x333366 : 0x2a2a2a
    const bg = this.add.rectangle(x, y, 380, 90, bgColor)
      .setStrokeStyle(2, 0x4e4e6a)

    if (!isOwned && canAfford) {
      bg.setInteractive({ useHandCursor: true })
      bg.on('pointerdown', () => {
        this.profile.gold -= item.goldCost
        this.profile.ownedItemIds.push(item.id)
        saveProfile(this.profileSlot, this.profile)
        this.scene.restart({ profileSlot: this.profileSlot })
      })
    }

    this.add.text(x - 180, y - 30, item.name, { fontSize: '18px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0, 0.5)

    let effectStr = ''
    if (item.effect.power) effectStr += `+${item.effect.power} PWR `
    if (item.effect.hp) effectStr += `+${item.effect.hp} HP `
    if (item.effect.defeatAdditionalEnemiesChance) effectStr += `${item.effect.defeatAdditionalEnemiesChance * 100}% Cleave `
    if (item.effect.absorbAttacksChance) effectStr += `${item.effect.absorbAttacksChance * 100}% Block `
    if (item.effect.bonusGoldChance) effectStr += `${item.effect.bonusGoldChance * 100}% Bonus Gold `
    if (item.effect.captureChanceBonus) effectStr += `+${item.effect.captureChanceBonus * 100}% Capture `

    this.add.text(x - 180, y - 5, effectStr.trim(), { fontSize: '12px', color: '#00ff00' }).setOrigin(0, 0.5)
    this.add.text(x - 180, y + 15, item.description, { fontSize: '11px', color: '#aaaaaa', wordWrap: { width: 360 } }).setOrigin(0, 0)

    const statusText = isOwned ? 'OWNED' : `${item.goldCost} Gold`
    const statusColor = isOwned ? '#44ff44' : canAfford ? '#ffd700' : '#ff4444'
    this.add.text(x + 180, y - 30, statusText, { fontSize: '16px', color: statusColor, fontStyle: 'bold' }).setOrigin(1, 0.5)
  }
}
