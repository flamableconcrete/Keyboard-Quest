import Phaser from 'phaser'
import { ProfileData } from '../types'
import { loadProfile, saveProfile } from '../utils/profile'
import { checkWorldMastery } from '../utils/scoring'
import { MASTERY_ITEMS, getItem } from '../data/items'
import { generateItemTexture } from '../art/itemsArt'

export class TrophyRoomScene extends Phaser.Scene {
  private profile!: ProfileData
  private profileSlot!: number

  constructor() {
    super('TrophyRoom')
  }

  init(data: { profileSlot: number }) {
    this.profileSlot = data.profileSlot
    this.profile = loadProfile(this.profileSlot)!
  }

  create() {
    const { width, height } = this.scale

    // Semi-transparent modal background
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
      .setInteractive()
      .on('pointerdown', () => this.closeScene())

    // Main modal panel
    const panelWidth = 1000
    const panelHeight = 550
    const panelX = width / 2
    const panelY = height / 2
    this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x1a1a2e)
      .setStrokeStyle(4, 0x4e4e6a)
      .setInteractive()

    // Close Button (top right of modal)
    this.add
      .text(panelX + panelWidth / 2 - 20, panelY - panelHeight / 2 + 20, 'X', {
        fontSize: '24px',
        color: '#ff4444',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.closeScene())

    // Title
    this.add
      .text(panelX, panelY - panelHeight / 2 + 40, '🏆 TROPHY ROOM', {
        fontSize: '28px',
        color: '#ffd700',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    // --- Pedestals ---
    const pedestalSpacing = 185
    const startX = panelX - panelWidth / 2 + 120
    const pedestalY = panelY + 60

    for (let world = 1; world <= 5; world++) {
      const x = startX + (world - 1) * pedestalSpacing
      const mastered = checkWorldMastery(this.profile, world)

      // Pedestal base (lighter top)
      this.add.rectangle(x, pedestalY + 30, 80, 8, 0xA0896C)
      this.add.rectangle(x, pedestalY + 38, 80, 12, 0x8B7355)

      // Trophy or mystery
      if (mastered) {
        const masteryItemId = MASTERY_ITEMS[world]
        generateItemTexture(this, masteryItemId)
        this.add.image(x, pedestalY - 10, masteryItemId).setScale(1.5)

        const item = getItem(masteryItemId)
        this.add
          .text(x, pedestalY + 65, item?.name ?? '???', {
            fontSize: '12px',
            color: '#ffd700',
          })
          .setOrigin(0.5)

        // Auto-grant mastery item
        if (masteryItemId && !this.profile.ownedItemIds.includes(masteryItemId)) {
          this.profile.ownedItemIds.push(masteryItemId)
          saveProfile(this.profileSlot, this.profile)
        }
      } else {
        this.add.text(x, pedestalY - 20, '❓', { fontSize: '40px' }).setOrigin(0.5).setAlpha(0.3)

        this.add
          .text(x, pedestalY + 65, '???', {
            fontSize: '12px',
            color: '#555555',
          })
          .setOrigin(0.5)
      }

      // World label
      this.add
        .text(x, pedestalY + 85, `World ${world}`, {
          fontSize: '14px',
          color: '#ffffff',
        })
        .setOrigin(0.5)
    }
  }

  private closeScene() {
    this.scene.resume('OverlandMap')
    this.scene.stop()
  }
}
