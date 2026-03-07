import Phaser from 'phaser'
import { loadProfile, saveProfile } from '../utils/profile'
import { calcCompanionLevel } from '../utils/scoring'
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

    this.add.text(width / 2, 85, 'Your Captured Pets', {
      fontSize: '22px', color: '#cccccc'
    }).setOrigin(0.5)

    const pets = this.profile.pets
    if (pets.length === 0) {
      this.add.text(width / 2, 300, 'No pets yet!\nDefeat monsters on capture-eligible levels to tame them.', {
        fontSize: '20px', color: '#888888', align: 'center'
      }).setOrigin(0.5)
    } else {
      pets.forEach((pet, i) => {
        const col = i % 4
        const row = Math.floor(i / 4)
        const cx = 160 + col * 250
        const cy = 180 + row * 160
        this.renderPetCard(cx, cy, pet, pet.id === this.profile.activePetId)
      })
    }

    const back = this.add.text(width / 2, height - 40, '[ Back to Map ]', {
      fontSize: '24px', color: '#ffffff'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    back.on('pointerdown', () => {
      this.scene.start('OverlandMap', { profileSlot: this.profileSlot })
    })
  }

  private renderPetCard(x: number, y: number, pet: CompanionData, isActive: boolean) {
    const level = calcCompanionLevel(pet.xp)
    const bg = this.add.rectangle(x, y, 220, 130, isActive ? 0x224422 : 0x223322)
      .setInteractive({ useHandCursor: true })
    this.add.text(x, y - 40, pet.name, { fontSize: '13px', color: '#ffffff', wordWrap: { width: 200 } }).setOrigin(0.5)
    this.add.text(x, y - 5, `Level ${level} · x${pet.autoStrikeCount} auto-strike`, { fontSize: '13px', color: '#aaffaa' }).setOrigin(0.5)
    this.add.text(x, y + 20, pet.backstory, { fontSize: '10px', color: '#888888', wordWrap: { width: 200 } }).setOrigin(0.5)
    this.add.text(x, y + 48, isActive ? '✓ Active' : '[ Set Active ]', {
      fontSize: '13px', color: isActive ? '#44ff44' : '#aaaaff'
    }).setOrigin(0.5)
    bg.on('pointerdown', () => {
      this.profile.activePetId = pet.id
      saveProfile(this.profileSlot, this.profile)
      this.scene.restart({ profileSlot: this.profileSlot })
    })
  }
}
