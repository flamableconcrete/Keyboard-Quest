import Phaser from 'phaser'
import { loadProfile, saveProfile } from '../utils/profile'
import { ProfileData, ItemData } from '../types'
import { getItemColor, getItem } from '../data/items'
import { generateAllItemTextures } from '../art/itemsArt'
import { InventoryController } from '../controllers/InventoryController'
import { getAvailableConsumables } from '../utils/shop'

export class ShopScene extends Phaser.Scene {
  private profileSlot!: number
  private profile!: ProfileData
  private inventoryController!: InventoryController

  constructor() { super('Shop') }

  init(data: { profileSlot: number }) {
    this.profileSlot = data.profileSlot
    this.profile = loadProfile(data.profileSlot)!
    this.inventoryController = new InventoryController(this.profile)
  }

  create() {
    const { width, height } = this.scale
    const mobile = this.registry.get('isMobile')

    generateAllItemTextures(this)

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e)

    this.add.text(width / 2, 40, 'THE MERCHANTS TENT', {
      fontSize: mobile ? '24px' : '32px', color: '#ffd700', fontStyle: 'bold'
    }).setOrigin(0.5)

    this.add.text(width - 40, 40, `Gold: ${this.profile.gold ?? 0}`, {
      fontSize: mobile ? '18px' : '24px', color: '#ffd700', fontStyle: 'bold'
    }).setOrigin(1, 0.5)

    const back = this.add.text(60, 40, '← BACK', {
      fontSize: mobile ? '22px' : '28px', color: '#ffffff', backgroundColor: '#4e4e6a', padding: { x: 20, y: 10 }
    }).setInteractive({ useHandCursor: true })
    back.on('pointerdown', () => {
      const target = this.registry.get('isMobile') ? 'MobileOverlandMap' : 'OverlandMap'
      this.scene.start(target, { profileSlot: this.profileSlot })
    })

    const playerWorld = this.profile.currentWorld ?? 1
    const ownedIds = this.inventoryController.ownedItemIds

    // Columns: weapon | armor | accessory | preview+consumables
    const categories: ('weapon' | 'armor' | 'accessory')[] = ['weapon', 'armor', 'accessory']
    const columnWidth = width / 4

    // Current-tier items (3 per category, world-gated)
    categories.forEach((cat, i) => {
      const cx = columnWidth * i + columnWidth / 2
      const title = cat === 'accessory' ? 'ACCESSORIES' : cat.toUpperCase() + 'S'
      this.add.text(cx, 85, title, { fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5)

      const catItems = (this.profile.currentShopItemIds ?? [])
        .filter(id => {
          const item = getItem(id)
          return item?.slot === cat && !ownedIds.includes(id)
        })
        .slice(0, 3)
        .map(id => getItem(id)!)
        .filter(Boolean)

      catItems.forEach((item, j) => {
        this.renderItemCard(cx, 155 + j * 120, item)
      })
    })

    // Column 4: Preview items (next world tier) + consumables
    const col4x = columnWidth * 3 + columnWidth / 2

    this.add.text(col4x, 85, 'PREVIEW', {
      fontSize: '18px', color: '#aaaaff', fontStyle: 'bold'
    }).setOrigin(0.5)
    if (playerWorld < 5) {
      this.add.text(col4x, 105, `(World ${playerWorld + 1})`, {
        fontSize: '13px', color: '#7777aa'
      }).setOrigin(0.5)
    }

    const previewIds = (this.profile.previewShopItemIds ?? []).filter(id => !ownedIds.includes(id))
    previewIds.forEach((id, j) => {
      const item = getItem(id)
      if (item) this.renderItemCard(col4x, 145 + j * 120, item, true)
    })

    // Consumables section (always stocked, below preview)
    this.add.text(col4x, 390, 'CONSUMABLES', {
      fontSize: '18px', color: '#ffaa44', fontStyle: 'bold'
    }).setOrigin(0.5)

    const consumableIds = getAvailableConsumables(ownedIds)
    consumableIds.slice(0, 3).forEach((id, j) => {
      const item = getItem(id)
      if (item) this.renderItemCard(col4x, 440 + j * 100, item)
    })
  }

  private renderItemCard(x: number, y: number, item: ItemData, isPreview = false) {
    const gold = this.profile.gold ?? 0
    const canAfford = gold >= item.goldCost
    const backpackFull = !this.inventoryController.backpackGrid.findSpace(
      item.gridSize.w, item.gridSize.h
    )

    const canBuy = canAfford && !backpackFull
    const bgColor = canBuy ? 0x333366 : 0x2a2a2a
    const borderColor = isPreview ? 0x5555aa : 0x4e4e6a
    const bg = this.add.rectangle(x, y, 290, 100, bgColor).setStrokeStyle(2, borderColor)

    if (canBuy) {
      bg.setInteractive({ useHandCursor: true })
      bg.on('pointerdown', () => {
        this.profile.gold -= item.goldCost
        this.inventoryController.addToBackpack(item.id)

        // Remove from shop pool after purchase (gear only; consumables are unlimited)
        if (item.slot !== 'consumable') {
          if (this.profile.currentShopItemIds) {
            this.profile.currentShopItemIds = this.profile.currentShopItemIds.filter(id => id !== item.id)
          }
          if (this.profile.previewShopItemIds) {
            this.profile.previewShopItemIds = this.profile.previewShopItemIds.filter(id => id !== item.id)
          }
        }

        saveProfile(this.profileSlot, this.profile)
        this.scene.restart({ profileSlot: this.profileSlot })
      })
    }

    const itemColor = getItemColor(item.rarity)
    this.add.image(x - 120, y, item.id).setScale(1.5).setOrigin(0.5)
    this.add.text(x - 95, y - 35, item.name, { fontSize: '15px', color: itemColor, fontStyle: 'bold' }).setOrigin(0, 0.5)
    this.add.text(x - 95, y - 15, item.description, { fontSize: '10px', color: '#aaaaaa', wordWrap: { width: 210 } }).setOrigin(0, 0)

    const statusText = backpackFull && canAfford ? 'Bag full!' : `${item.goldCost}g`
    const statusColor = canBuy ? '#ffd700' : '#ff4444'
    this.add.text(x + 130, y - 35, statusText, { fontSize: '14px', color: statusColor, fontStyle: 'bold' }).setOrigin(1, 0.5)

    if (isPreview) {
      this.add.text(x + 130, y - 15, `W${item.worldUnlock}`, { fontSize: '11px', color: '#7777cc' }).setOrigin(1, 0.5)
    }

    const gridLabel = `${item.gridSize.w}×${item.gridSize.h} cells`
    this.add.text(x - 95, y + 30, gridLabel, { fontSize: '10px', color: '#666688' }).setOrigin(0, 0.5)
  }
}
