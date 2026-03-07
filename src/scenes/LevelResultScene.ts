// src/scenes/LevelResultScene.ts
import Phaser from 'phaser'
import { ProfileData, LevelConfig } from '../types'
import { loadProfile, saveProfile } from '../utils/profile'
import { calcXpReward, calcCharacterLevel } from '../utils/scoring'
import { getLevelsForWorld } from '../data/levels'
import { ITEMS } from '../data/items'
import { createCompanion } from '../data/companions'

interface ResultData {
  level: LevelConfig
  profileSlot: number
  accuracyStars: number
  speedStars: number
  passed: boolean
  captureAttempt?: { monsterId: string; monsterName: string }
}

export class LevelResultScene extends Phaser.Scene {
  private profile!: ProfileData
  private resultData!: ResultData

  constructor() { super('LevelResult') }

  init(data: ResultData) {
    this.resultData = data
    this.profile = loadProfile(data.profileSlot)!
  }

  create() {
    const { width } = this.scale
    const { level, accuracyStars, speedStars, passed } = this.resultData

    if (!passed) {
      this.showFailScreen()
      return
    }

    // Award XP
    const baseXp = level.rewards.xp
    const xpGained = calcXpReward(accuracyStars, speedStars, baseXp)
    const prevLevel = this.profile.characterLevel
    this.profile.xp += xpGained
    this.profile.characterLevel = calcCharacterLevel(this.profile.xp)

    // Save level result (only improve, never overwrite with worse)
    const prev = this.profile.levelResults[level.id]
    if (!prev || accuracyStars + speedStars > prev.accuracyStars + prev.speedStars) {
      this.profile.levelResults[level.id] = {
        accuracyStars: accuracyStars as any,
        speedStars: speedStars as any,
        completedAt: Date.now(),
      }
    }

    // Award items/spells/titles
    if (level.rewards.item && !this.profile.equipment.weapon) {
      // Simplified: give item to first empty slot
    }
    if (level.rewards.title) {
      if (!this.profile.titles.includes(level.rewards.title)) {
        this.profile.titles.push(level.rewards.title)
      }
    }

    // Unlock next level(s)
    this.unlockNextLevels(level)

    // Letter unlock if mini-boss
    if (level.miniBossUnlocksLetter && !this.profile.unlockedLetters.includes(level.miniBossUnlocksLetter)) {
      this.profile.unlockedLetters.push(level.miniBossUnlocksLetter)
    }

    // Capture attempt with Lucky Charm bonus
    if (this.resultData.captureAttempt) {
      const accessory = this.profile.equipment.accessory
      const item = accessory ? ITEMS.find(i => i.id === accessory) : null
      const bonusChance = item?.effect.captureChanceBonus ?? 0
      const captureSuccess = Math.random() < (0.2 + bonusChance)

      if (captureSuccess) {
        const pet = createCompanion(this.resultData.captureAttempt.monsterId)
        if (!this.profile.pets.find(p => p.id === pet.id)) {
          this.profile.pets.push(pet)
          if (this.profile.pets.length >= 10 && !this.profile.titles.includes('Beast Tamer')) {
            this.profile.titles.push('Beast Tamer')
          }
        }
      }

      saveProfile(this.resultData.profileSlot, this.profile)

      const captureMsg = captureSuccess
        ? `You captured a ${this.resultData.captureAttempt.monsterName}!`
        : `The ${this.resultData.captureAttempt.monsterName} escaped...`
      this.add.text(width / 2, 520, captureMsg, {
        fontSize: '22px', color: captureSuccess ? '#aaffaa' : '#ff8888'
      }).setOrigin(0.5)
    } else {
      saveProfile(this.resultData.profileSlot, this.profile)
    }

    // Render result
    this.add.text(width / 2, 80, 'VICTORY!', {
      fontSize: '56px', color: '#ffd700', fontStyle: 'bold'
    }).setOrigin(0.5)

    this.add.text(width / 2, 170, level.name, {
      fontSize: '28px', color: '#ffffff'
    }).setOrigin(0.5)

    // Stars
    this.add.text(width / 2, 260, `Speed: ${'★'.repeat(speedStars)}${'☆'.repeat(5 - speedStars)}`, {
      fontSize: '32px', color: '#ffdd44'
    }).setOrigin(0.5)

    this.add.text(width / 2, 310, `Accuracy: ${'★'.repeat(accuracyStars)}${'☆'.repeat(5 - accuracyStars)}`, {
      fontSize: '32px', color: '#44ffdd'
    }).setOrigin(0.5)

    this.add.text(width / 2, 380, `+${xpGained} XP`, {
      fontSize: '28px', color: '#aaffaa'
    }).setOrigin(0.5)

    if (this.profile.characterLevel > prevLevel) {
      this.add.text(width / 2, 420, `Level Up! Now Level ${this.profile.characterLevel}`, {
        fontSize: '24px', color: '#ffd700'
      }).setOrigin(0.5)
    }

    // Letter unlock banner
    if (level.miniBossUnlocksLetter) {
      this.add.text(width / 2, 470, `The letter "${level.miniBossUnlocksLetter.toUpperCase()}" has been restored!`, {
        fontSize: '26px', color: '#aaaaff'
      }).setOrigin(0.5)
    }

    // Continue button
    const cont = this.add.text(width / 2, 640, '[ Continue ]', {
      fontSize: '32px', color: '#ffffff'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    cont.on('pointerdown', () => {
      this.scene.start('OverlandMap', { profileSlot: this.resultData.profileSlot })
    })
  }

  private showFailScreen() {
    const { width, height } = this.scale
    this.add.text(width / 2, height * 0.35, 'DEFEATED', {
      fontSize: '56px', color: '#ff4444', fontStyle: 'bold'
    }).setOrigin(0.5)
    this.add.text(width / 2, height * 0.5, 'Try again?', {
      fontSize: '28px', color: '#aaaaaa'
    }).setOrigin(0.5)
    const retry = this.add.text(width / 2, height * 0.65, '[ Retry ]', {
      fontSize: '32px', color: '#ffd700'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    retry.on('pointerdown', () => {
      this.scene.start('LevelIntro', { level: this.resultData.level, profileSlot: this.resultData.profileSlot })
    })
    const map = this.add.text(width / 2, height * 0.75, '[ Map ]', {
      fontSize: '28px', color: '#aaaaaa'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    map.on('pointerdown', () => {
      this.scene.start('OverlandMap', { profileSlot: this.resultData.profileSlot })
    })
  }

  private unlockNextLevels(completedLevel: LevelConfig) {
    // Find subsequent levels in the same world and unlock the next one
    const worldLevels = getLevelsForWorld(completedLevel.world)
    const idx = worldLevels.findIndex((l: LevelConfig) => l.id === completedLevel.id)
    if (idx >= 0 && idx + 1 < worldLevels.length) {
      const next = worldLevels[idx + 1]
      if (!this.profile.unlockedLevelIds.includes(next.id)) {
        this.profile.unlockedLevelIds.push(next.id)
      }
    }
  }
}
