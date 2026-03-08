// src/scenes/LevelResultScene.ts
import Phaser from 'phaser'
import { ProfileData, LevelConfig } from '../types'
import { loadProfile, saveProfile } from '../utils/profile'
import { calcXpReward, calcCharacterLevel } from '../utils/scoring'
import { getLevelsForWorld, ALL_LEVELS } from '../data/levels'
import { ITEMS } from '../data/items'
import { createCompanion } from '../data/companions'

interface ResultData {
  level: LevelConfig
  profileSlot: number
  accuracyStars: number
  speedStars: number
  passed: boolean
  companionUsed: boolean
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

    // Award gold — 2 gold per enemy (word) defeated
    const goldEarned = level.wordCount * 2
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
        companionUsed: this.resultData.companionUsed,
      }
    } else if (currentStars === prevStars) {
      // If same score, but this run was solo and previous wasn't, prioritize the solo run
      if (this.resultData.companionUsed === false && prev.companionUsed === true) {
        this.profile.levelResults[level.id].companionUsed = false
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

    // Solo Scribe title check
    this.checkSoloScribe()

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

    if (this.profile.characterLevel > prevLevel) {
      this.add.text(width / 2, 455, `Level Up! Now Level ${this.profile.characterLevel}`, {
        fontSize: '24px', color: '#ffd700'
      }).setOrigin(0.5)
    }

    // Letter unlock banner
    if (level.miniBossUnlocksLetter) {
      this.add.text(width / 2, 500, `The letter "${level.miniBossUnlocksLetter.toUpperCase()}" has been restored!`, {
        fontSize: '26px', color: '#aaaaff'
      }).setOrigin(0.5)
    }

    if (level.isBoss) {
      const soloStatus = this.resultData.companionUsed ? '❌ Companion Used' : '✅ Solo'
      this.add.text(width / 2, 455, `Solo Scribe Status: ${soloStatus}`, {
        fontSize: '24px', color: this.resultData.companionUsed ? '#ff8888' : '#88ff88'
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
          nextScene: 'OverlandMap',
          nextSceneData: { profileSlot: this.resultData.profileSlot },
        })
      } else {
        this.scene.start('OverlandMap', { profileSlot: this.resultData.profileSlot })
      }
    })
  }

  private checkSoloScribe() {
    const bossLevelConfigs = ALL_LEVELS.filter(l => l.isBoss)
    let allSolo = true
    for (const config of bossLevelConfigs) {
      const result = this.profile.levelResults[config.id]
      if (!result || result.companionUsed !== false) {
        allSolo = false
        break
      }
    }
    if (allSolo && !this.profile.titles.includes('Solo Scribe')) {
      this.profile.titles.push('Solo Scribe')
    }
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
