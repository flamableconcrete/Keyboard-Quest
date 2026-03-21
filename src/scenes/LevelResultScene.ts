// src/scenes/LevelResultScene.ts
import Phaser from 'phaser'
import { ProfileData, LevelConfig } from '../types'
import { loadProfile, saveProfile } from '../utils/profile'
import { getItem } from '../data/items'
import { calcXpReward, calcCharacterLevel, calcCompanionLevel } from '../utils/scoring'
import { rotateShopItems } from '../utils/shop'
import { MapNavigationController } from '../controllers/MapNavigationController'

interface ResultData {
  level: LevelConfig
  profileSlot: number
  accuracyStars: number
  speedStars: number
  passed: boolean
  extraGold?: number
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
    const goldEarned = Math.floor(baseGold * (1 + goldMultiplier)) + (this.resultData.extraGold || 0)
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
    const navCtrl = new MapNavigationController(this.profile)
    const newUnlocks = navCtrl.getNewUnlocks(level.id, level.world, level.isBoss ?? false)
    for (const id of newUnlocks) {
      if (!this.profile.unlockedLevelIds.includes(id)) {
        this.profile.unlockedLevelIds.push(id)
      }
    }

    // Letter unlock if mini-boss
    if (level.isMiniBoss && level.miniBossUnlocksLetter && !this.profile.unlockedLetters.includes(level.miniBossUnlocksLetter)) {
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
    if (level.isMiniBoss && level.miniBossUnlocksLetter) {
      this.add.text(width / 2, yPos, `The letter "${level.miniBossUnlocksLetter.toUpperCase()}" has been restored!`, {
        fontSize: '26px', color: '#aaaaff'
      }).setOrigin(0.5)
      yPos += 40
    }


    // Continue button — positioned below all dynamic content with a minimum gap
    const contY = Math.max(yPos + 40, height * 0.8)
    const cont = this.add.text(width / 2, contY, '[ Continue ]  (Space)', {
      fontSize: '32px', color: '#ffffff'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    const doContinue = () => {
      if (this.resultData.level.isMiniBoss && this.resultData.level.miniBossUnlocksLetter && passed) {
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
    }

    cont.on('pointerdown', doContinue)

    this.input.keyboard!.once('keydown-SPACE', doContinue)
  }

  private showFailScreen() {
    const { width, height } = this.scale
    this.add.text(width / 2, height * 0.35, 'DEFEATED', {
      fontSize: '56px', color: '#ff4444', fontStyle: 'bold'
    }).setOrigin(0.5)
    this.add.text(width / 2, height * 0.5, 'Try again?', {
      fontSize: '28px', color: '#aaaaaa'
    }).setOrigin(0.5)

    const retryPrompt = this.add.text(width / 2, height * 0.65, 'Press SPACE or click to retry', {
      fontSize: '22px', color: '#aaaaaa'
    }).setOrigin(0.5)

    this.tweens.add({
      targets: retryPrompt,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    const doRetry = () => {
      this.scene.start('LevelIntro', { level: this.resultData.level, profileSlot: this.resultData.profileSlot })
    }

    // Capture global pointer down (like in LevelIntroScene) if they aren't clicking the map button
    const pointerDownHandler = (_pointer: Phaser.Input.Pointer, currentlyOver: any[]) => {
      // Check if we are clicking on the interactive map button instead
      if (currentlyOver && currentlyOver.length > 0 && currentlyOver[0] === map) {
        return // Let the map button handler take this
      }
      this.input.off('pointerdown', pointerDownHandler)
      this.input.keyboard!.off('keydown-SPACE', keyHandler)
      doRetry()
    }

    this.input.on('pointerdown', pointerDownHandler)

    const keyHandler = () => {
      this.input.off('pointerdown', pointerDownHandler)
      doRetry()
    }
    this.input.keyboard!.once('keydown-SPACE', keyHandler)

    const map = this.add.text(width / 2, height * 0.75, '[ Map ]', {
      fontSize: '28px', color: '#aaaaaa'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    map.on('pointerdown', () => {
      this.input.off('pointerdown', pointerDownHandler)
      this.input.keyboard!.off('keydown-SPACE', keyHandler)
      this.scene.start('OverlandMap', { profileSlot: this.resultData.profileSlot })
    })
  }

}
