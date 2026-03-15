import Phaser from 'phaser'
import { loadProfile, saveProfile } from '../utils/profile'
import { COMPANION_TEMPLATES, createCompanion } from '../data/companions'
import { calcCompanionLevel } from '../utils/scoring'
import { ProfileData, CompanionData } from '../types'
import { generateAllCompanionTextures } from '../art/companionsArt'

export class TavernScene extends Phaser.Scene {
  private profileSlot!: number
  private profile!: ProfileData

  constructor() { super('Tavern') }

  init(data: { profileSlot: number }) {
    this.profileSlot = data.profileSlot
    this.profile = loadProfile(data.profileSlot)!
  }

  create() {
    const { width, height } = this.scale
    const mobile = this.registry.get('isMobile')

    generateAllCompanionTextures(this)

    this.add.rectangle(width / 2, height / 2, width, height, 0x2a1a0a)

    this.add.text(width / 2, 40, 'The Wandering Badger Tavern', {
      fontSize: mobile ? '24px' : '32px', color: '#ffd700'
    }).setOrigin(0.5)

    this.add.text(width / 2, 85, 'Your Companions', {
      fontSize: '22px', color: '#cccccc'
    }).setOrigin(0.5)

    this.add.text(width / 2, 115, 'Companions provide auto-strikes that automatically destroy enemies.', {
      fontSize: '14px', color: '#88aaff', fontStyle: 'italic'
    }).setOrigin(0.5)

    const companions = this.profile.companions
    if (companions.length === 0) {
      this.add.text(width / 2, 200, 'No companions yet. Complete Guild Recruitment levels to recruit some!', {
        fontSize: '18px', color: '#888888', wordWrap: { width: 700 }
      }).setOrigin(0.5)
    } else {
      companions.forEach((c, i) => {
        const col = i % 3
        const row = Math.floor(i / 3)
        const cx = 340 + col * 300
        const cy = 230 + row * 180
        this.renderCompanionCard(cx, cy, c, c.id === this.profile.activeCompanionId)
      })
    }

    this.add.text(width / 2, height - 220, 'Available to Recruit:', {
      fontSize: '20px', color: '#aaaaff'
    }).setOrigin(0.5)

    this.add.text(width - 20, 20, `Gold: ${this.profile.gold ?? 0}`, {
      fontSize: '20px', color: '#ffd700'
    }).setOrigin(1, 0)

    const available = COMPANION_TEMPLATES.filter(
      t => !this.profile.companions.find(c => c.id === t.id)
    )
    available.slice(0, 3).forEach((t, i) => {
      const cx = 340 + i * 300
      const cy = height - 140
      const canAfford = (this.profile.gold ?? 0) >= t.goldCost
      const card = this.add.rectangle(cx, cy, 280, 90, canAfford ? 0x333366 : 0x2a2a2a)
        .setInteractive({ useHandCursor: true })
        
      this.add.image(cx - 90, cy, t.id).setScale(1.5)
      
      this.add.text(cx - 30, cy - 35, t.name, { fontSize: '14px', color: '#ffffff', wordWrap: { width: 160 } }).setOrigin(0, 0)
      this.add.text(cx - 30, cy + 5, `Cost: ${t.goldCost} Gold`, {
        fontSize: '13px', color: canAfford ? '#ffd700' : '#886600'
      }).setOrigin(0, 0)
      this.add.text(cx - 30, cy + 25, canAfford ? '[ Recruit ]' : '[ Not enough gold ]', {
        fontSize: '13px', color: canAfford ? '#aaaaff' : '#666666'
      }).setOrigin(0, 0)
      
      card.on('pointerdown', () => {
        if (!this.profile.companions.find(c => c.id === t.id) && (this.profile.gold ?? 0) >= t.goldCost) {
          this.profile.gold -= t.goldCost
          this.profile.companions.push(createCompanion(t.id))
          saveProfile(this.profileSlot, this.profile)
          this.scene.restart({ profileSlot: this.profileSlot })
        }
      })
    })

    const back = this.add.text(60, 40, '← BACK', {
      fontSize: mobile ? '22px' : '28px', color: '#ffffff', backgroundColor: '#4e4e6a', padding: { x: 20, y: 10 }
    }).setInteractive({ useHandCursor: true })
    back.on('pointerdown', () => {
      const target = this.registry.get('isMobile') ? 'MobileOverlandMap' : 'OverlandMap'
      this.scene.start(target, { profileSlot: this.profileSlot })
    })
  }

  private renderCompanionCard(x: number, y: number, companion: CompanionData, isActive: boolean) {
    const level = calcCompanionLevel(companion.xp)
    const bg = this.add.rectangle(x, y, 280, 150, isActive ? 0x334433 : 0x222244)
      .setInteractive({ useHandCursor: true })
      
    this.add.image(x - 90, y - 10, companion.id).setScale(2)
    
    this.add.text(x - 30, y - 65, companion.name, { fontSize: '15px', color: '#ffffff', wordWrap: { width: 160 } }).setOrigin(0, 0)
    this.add.text(x - 30, y - 25, `Lv ${level} · x${companion.autoStrikeCount} strike`, { fontSize: '13px', color: '#aaffaa' }).setOrigin(0, 0)
    this.add.text(x - 30, y - 5, companion.backstory, { fontSize: '11px', color: '#aaaaaa', wordWrap: { width: 160 } }).setOrigin(0, 0)
    
    const activeLabel = isActive ? '✓ Active' : '[ Set Active ]'
    this.add.text(x + 50, y + 55, activeLabel, { fontSize: '14px', color: isActive ? '#44ff44' : '#aaaaff' }).setOrigin(0.5)
    
    bg.on('pointerdown', () => {
      this.profile.activeCompanionId = companion.id
      saveProfile(this.profileSlot, this.profile)
      this.scene.restart({ profileSlot: this.profileSlot })
    })
  }
}
