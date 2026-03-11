import Phaser from 'phaser'
import { loadProfile, saveProfile } from '../utils/profile'
import { calcCompanionLevel } from '../utils/scoring'
import { PET_TEMPLATES, createCompanion } from '../data/companions'
import { ProfileData, CompanionData } from '../types'

export class StableScene extends Phaser.Scene {
  private profileSlot!: number
  private profile!: ProfileData

  constructor() { super('Stable') }

  init(data: { profileSlot: number }) {
    this.profileSlot = data.profileSlot
    this.profile = loadProfile(data.profileSlot)!
  }

  create() {
    const { width, height } = this.scale

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a2a1a)

    this.add.text(width / 2, 40, 'The Creature Stable', {
      fontSize: '32px', color: '#aaffaa'
    }).setOrigin(0.5)

    this.add.text(width / 2, 85, 'Your Animal Companions', {
      fontSize: '22px', color: '#cccccc'
    }).setOrigin(0.5)

    this.add.text(width / 2, 115, 'Pets provide auto-strikes that automatically destroy enemies.', {
      fontSize: '14px', color: '#88aaff', fontStyle: 'italic'
    }).setOrigin(0.5)

    const pets = this.profile.pets
    if (pets.length === 0) {
      this.add.text(width / 2, 300, 'No animal companions yet. Buy some below!', {
        fontSize: '20px', color: '#888888', align: 'center'
      }).setOrigin(0.5)
    } else {
      pets.forEach((pet, i) => {
        const col = i % 3
        const row = Math.floor(i / 3)
        const cx = 200 + col * 300
        const cy = 160 + row * 180
        this.renderPetCard(cx, cy, pet, pet.id === this.profile.activePetId)
      })
    }

    this.add.text(width / 2, height - 220, 'Available to Buy:', {
      fontSize: '20px', color: '#aaaaff'
    }).setOrigin(0.5)

    this.add.text(width - 20, 20, `Gold: ${this.profile.gold ?? 0}`, {
      fontSize: '20px', color: '#ffd700'
    }).setOrigin(1, 0)

    const available = PET_TEMPLATES.filter(
      t => !this.profile.pets.find(p => p.id === t.id)
    )
    available.slice(0, 3).forEach((t, i) => {
      const cx = 200 + i * 300
      const cy = height - 140
      const canAfford = (this.profile.gold ?? 0) >= t.goldCost
      const card = this.add.rectangle(cx, cy, 260, 90, canAfford ? 0x333366 : 0x2a2a2a)
        .setInteractive({ useHandCursor: true })
      this.add.text(cx, cy - 25, t.name, { fontSize: '14px', color: '#ffffff' }).setOrigin(0.5)
      this.add.text(cx, cy, `Cost: ${t.goldCost} Gold`, {
        fontSize: '13px', color: canAfford ? '#ffd700' : '#886600'
      }).setOrigin(0.5)
      this.add.text(cx, cy + 22, canAfford ? '[ Buy ]' : '[ Not enough gold ]', {
        fontSize: '13px', color: canAfford ? '#aaaaff' : '#666666'
      }).setOrigin(0.5)
      card.on('pointerdown', () => {
        if (!this.profile.pets.find(p => p.id === t.id) && (this.profile.gold ?? 0) >= t.goldCost) {
          this.profile.gold -= t.goldCost
          this.profile.pets.push(createCompanion(t.id))
          saveProfile(this.profileSlot, this.profile)
          this.scene.restart({ profileSlot: this.profileSlot })
        }
      })
    })

    const back = this.add.text(width / 2, height - 40, '[ Back to Map ]', {
      fontSize: '24px', color: '#ffffff'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    back.on('pointerdown', () => {
      this.scene.start('OverlandMap', { profileSlot: this.profileSlot })
    })
  }

  private renderPetCard(x: number, y: number, pet: CompanionData, isActive: boolean) {
    const level = calcCompanionLevel(pet.xp)
    const bg = this.add.rectangle(x, y, 260, 150, isActive ? 0x224422 : 0x223322)
      .setInteractive({ useHandCursor: true })
    this.add.text(x, y - 50, pet.name, { fontSize: '14px', color: '#ffffff', wordWrap: { width: 240 } }).setOrigin(0.5)
    this.add.text(x, y - 10, `Level ${level} · x${pet.autoStrikeCount} auto-strike`, { fontSize: '14px', color: '#aaffaa' }).setOrigin(0.5)
    this.add.text(x, y + 20, pet.backstory, { fontSize: '11px', color: '#888888', wordWrap: { width: 240 } }).setOrigin(0.5)
    const activeLabel = isActive ? '✓ Active' : '[ Set Active ]'
    this.add.text(x, y + 55, activeLabel, {
      fontSize: '14px', color: isActive ? '#44ff44' : '#aaaaff'
    }).setOrigin(0.5)
    bg.on('pointerdown', () => {
      this.profile.activePetId = pet.id
      saveProfile(this.profileSlot, this.profile)
      this.scene.restart({ profileSlot: this.profileSlot })
    })
  }
}
