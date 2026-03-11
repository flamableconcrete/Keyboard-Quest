import Phaser from 'phaser'
import { loadProfile, saveProfile } from '../utils/profile'
import { ProfileData, ItemData } from '../types'
import { ITEMS, getItem } from '../data/items'

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

      const catItems = ITEMS.filter(item =>
        item.slot === cat &&
        item.goldCost > 0 &&
        this.profile.currentShopItemIds?.includes(item.id) &&
        !this.profile.ownedItemIds.includes(item.id)
      )

      catItems.forEach((item, j) => {
        const cy = 160 + j * 100
        this.renderItemCard(cx, cy, item)
      })
    })
  }

  private renderItemCard(x: number, y: number, item: ItemData) {
    const canAfford = (this.profile.gold ?? 0) >= item.goldCost

    const bgColor = canAfford ? 0x333366 : 0x2a2a2a
    const bg = this.add.rectangle(x, y, 380, 90, bgColor)
      .setStrokeStyle(2, 0x4e4e6a)

    if (canAfford) {
      bg.setInteractive({ useHandCursor: true })
      bg.on('pointerdown', () => {
        this.profile.gold -= item.goldCost
        this.profile.ownedItemIds.push(item.id)

        // Remove item from shop pool upon purchase
        if (this.profile.currentShopItemIds) {
          this.profile.currentShopItemIds = this.profile.currentShopItemIds.filter(id => id !== item.id)
        }

        saveProfile(this.profileSlot, this.profile)
        this.scene.restart({ profileSlot: this.profileSlot })
      })
    }

    this.add.text(x - 180, y - 30, item.name, { fontSize: '18px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0, 0.5)

    const equippedItemId = this.profile.equipment[item.slot]
    const equippedItem = equippedItemId ? getItem(equippedItemId) : null

    let effectStr = ''

    if (item.effect.power) {
      const cur = equippedItem?.effect?.power || 0
      effectStr += cur === item.effect.power ? `+${item.effect.power} PWR ` : `PWR: ${cur} -> ${item.effect.power} `
    }
    if (item.effect.hp) {
      const cur = equippedItem?.effect?.hp || 0
      effectStr += cur === item.effect.hp ? `+${item.effect.hp} HP ` : `HP: ${cur} -> ${item.effect.hp} `
    }
    if (item.effect.defeatAdditionalEnemiesChance) {
      const cur = equippedItem?.effect?.defeatAdditionalEnemiesChance || 0
      effectStr += cur === item.effect.defeatAdditionalEnemiesChance ? `${item.effect.defeatAdditionalEnemiesChance * 100}% Cleave ` : `Cleave: ${cur * 100}% -> ${item.effect.defeatAdditionalEnemiesChance * 100}% `
    }
    if (item.effect.absorbAttacksChance) {
      const cur = equippedItem?.effect?.absorbAttacksChance || 0
      effectStr += cur === item.effect.absorbAttacksChance ? `${item.effect.absorbAttacksChance * 100}% Block ` : `Block: ${cur * 100}% -> ${item.effect.absorbAttacksChance * 100}% `
    }
    if (item.effect.bonusGoldChance) {
      const cur = equippedItem?.effect?.bonusGoldChance || 0
      effectStr += cur === item.effect.bonusGoldChance ? `${item.effect.bonusGoldChance * 100}% Bonus Gold ` : `Bonus Gold: ${cur * 100}% -> ${item.effect.bonusGoldChance * 100}% `
    }
    if (item.effect.goldMultiplier) {
      const cur = equippedItem?.effect?.goldMultiplier || 0
      effectStr += cur === item.effect.goldMultiplier ? `+${item.effect.goldMultiplier * 100}% Gold ` : `Gold: +${cur * 100}% -> +${item.effect.goldMultiplier * 100}% `
    }

    this.add.text(x - 180, y - 5, effectStr.trim(), { fontSize: '12px', color: '#00ff00' }).setOrigin(0, 0.5)
    this.add.text(x - 180, y + 15, item.description, { fontSize: '11px', color: '#aaaaaa', wordWrap: { width: 360 } }).setOrigin(0, 0)

    const statusText = `${item.goldCost} Gold`
    const statusColor = canAfford ? '#ffd700' : '#ff4444'
    this.add.text(x + 180, y - 30, statusText, { fontSize: '16px', color: statusColor, fontStyle: 'bold' }).setOrigin(1, 0.5)
  }
}
