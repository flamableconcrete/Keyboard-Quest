// src/scenes/LevelResultScene.ts
import Phaser from 'phaser'
import { ProfileData, LevelConfig } from '../types'
import { loadProfile, saveProfile } from '../utils/profile'
import { getItem } from '../data/items'
import { calcXpReward, calcCharacterLevel, calcCompanionLevel } from '../utils/scoring'
import { getLevelsForWorld, ALL_LEVELS } from '../data/levels'
import { rotateShopItems } from '../utils/shop'

interface ResultData {
  level: LevelConfig
  profileSlot: number
  accuracyStars: number
  speedStars: number
  passed: boolean
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
    const { width, height } = this.scale
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

    // Companion XP
    const leveledUpCompanions: { name: string, level: number }[] = []

    if (this.profile.activeCompanionId || this.profile.activePetId) {
      const activeEntities = [...this.profile.companions, ...this.profile.pets]
        .filter(c => c.id === this.profile.activeCompanionId || c.id === this.profile.activePetId)

      for (const entity of activeEntities) {
        const prevCompLevel = calcCompanionLevel(entity.xp)
        entity.xp += xpGained
        const newCompanionLevel = calcCompanionLevel(entity.xp)

        if (newCompanionLevel > prevCompLevel) {
          leveledUpCompanions.push({ name: entity.name, level: newCompanionLevel })
        }
      }
    }

    // Award gold — 2 gold per enemy (word) defeated
    // Calculate gold based on bonus chance
    let baseGold = level.wordCount * 2
    const pProfile = loadProfile(this.resultData.profileSlot)
    const accessoryItem = pProfile?.equipment?.accessory ? getItem(pProfile.equipment.accessory) : null
    const goldChance = accessoryItem?.effect?.bonusGoldChance || 0
    const goldMultiplier = accessoryItem?.effect?.goldMultiplier || 0

    if (Math.random() < goldChance) {
      baseGold *= 2
    }
    const goldEarned = Math.floor(baseGold * (1 + goldMultiplier))
    this.profile.gold = (this.profile.gold ?? 0) + goldEarned

    // Save level result (only improve, never overwrite with worse total score)
    const prev = this.profile.levelResults[level.id]
    const currentStars = accuracyStars + speedStars
    const prevStars = prev ? prev.accuracyStars + prev.speedStars : -1

    if (!prev || currentStars > prevStars) {
      this.profile.levelResults[level.id] = {
        accuracyStars: accuracyStars as any,
        speedStars: speedStars as any,
        completedAt: Date.now(),
      }
    }

    // Award items/spells/titles
    if (level.rewards.item && !this.profile.ownedItemIds.includes(level.rewards.item)) {
      this.profile.ownedItemIds.push(level.rewards.item)
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

    // Rotate shop items if a mini-boss or boss was defeated
    if (level.isMiniBoss || level.isBoss) {
      if (!this.profile.currentShopItemIds) {
        this.profile.currentShopItemIds = []
      }
      this.profile.currentShopItemIds = rotateShopItems(this.profile.currentShopItemIds, this.profile.ownedItemIds || [])
    }

    saveProfile(this.resultData.profileSlot, this.profile)

    // Victory detection — route to VictoryScene if Typemancer defeated
    if (this.resultData.level.bossId === 'typemancer' && passed) {
      this.add.text(width / 2, height / 2, 'THE TYPEMANCER IS DEFEATED!', {
        fontSize: '36px', color: '#ffd700', fontStyle: 'bold', wordWrap: { width: 900 }
      }).setOrigin(0.5)
      this.time.delayedCall(2000, () => {
        this.scene.start('VictoryScene', { profileSlot: this.resultData.profileSlot })
      })
      return
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

    this.add.text(width / 2, 415, `+${goldEarned} Gold`, {
      fontSize: '24px', color: '#ffd700'
    }).setOrigin(0.5)

    let yPos = 455

    if (this.profile.characterLevel > prevLevel) {
      this.add.text(width / 2, yPos, `Level Up! Now Level ${this.profile.characterLevel}`, {
        fontSize: '24px', color: '#ffd700'
      }).setOrigin(0.5)
      yPos += 40
    }

    for (const comp of leveledUpCompanions) {
      this.add.text(width / 2, yPos, `${comp.name} Leveled Up! Now Level ${comp.level}`, {
        fontSize: '24px', color: '#aaffaa'
      }).setOrigin(0.5)
      yPos += 40
    }

    // Letter unlock banner
    if (level.miniBossUnlocksLetter) {
      this.add.text(width / 2, 500, `The letter "${level.miniBossUnlocksLetter.toUpperCase()}" has been restored!`, {
        fontSize: '26px', color: '#aaaaff'
      }).setOrigin(0.5)
    }


    // Continue button
    const cont = this.add.text(width / 2, 640, '[ Continue ]', {
      fontSize: '32px', color: '#ffffff'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    cont.on('pointerdown', () => {
      if (this.resultData.level.miniBossUnlocksLetter && passed) {
        this.scene.start('Cutscene', {
          letter: this.resultData.level.miniBossUnlocksLetter,
          title: this.resultData.level.rewards.title ?? 'A new letter awakens!',
          profileSlot: this.resultData.profileSlot,
          nextScene: 'OverlandMap',
          nextSceneData: { profileSlot: this.resultData.profileSlot },
        })
      } else {
        this.scene.start('OverlandMap', { profileSlot: this.resultData.profileSlot })
      }
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
