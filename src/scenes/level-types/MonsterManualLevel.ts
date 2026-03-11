// src/scenes/level-types/MonsterManualLevel.ts
import Phaser from 'phaser'
import { LevelConfig } from '../../types'
import { TypingEngine } from '../../components/TypingEngine'
import { loadProfile, saveProfile } from '../../utils/profile'
import { getWordPool } from '../../utils/words'
import { setupPause } from '../../utils/pauseSetup'

export class MonsterManualLevel extends Phaser.Scene {
  private level!: LevelConfig
  private profileSlot!: number
  private engine!: TypingEngine
  private words: string[] = []
  private wordQueue: string[] = []
  private finished = false

  constructor() { super('MonsterManualLevel') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.finished = false
  }

  create() {
    setupPause(this, this.profileSlot)
    const { width, height } = this.scale

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a2a3a)

    const pProfileAvatar = loadProfile(this.profileSlot)
    const avatarKey = this.textures.exists(pProfileAvatar?.avatarChoice || '') ? pProfileAvatar!.avatarChoice : 'avatar_0'
    this.add.image(100, height - 100, avatarKey).setScale(1.5).setDepth(5)

    // HUD
    this.add.text(width / 2, 40, this.level.name, {
      fontSize: '28px', color: '#ffd700'
    }).setOrigin(0.5)

    // Description text
    this.add.text(width / 2, 120, 'Monster Description:', {
      fontSize: '22px', color: '#aaaaaa'
    }).setOrigin(0.5)

    // Typing engine
    this.engine = new TypingEngine({
      scene: this,
      x: width / 2,
      y: height - 120,
      fontSize: 40,
      onWordComplete: this.onWordComplete.bind(this),
      onWrongKey: this.onWrongKey.bind(this),
    })

    // Word pool - we'll just generate a generic description from words
    const difficulty = Math.max(1, Math.ceil(this.level.world / 2))
    this.words = getWordPool(this.level.unlockedLetters, this.level.wordCount || 10, difficulty, this.level.world === 1 ? 5 : undefined)
    
    // Create a visual paragraph
    this.add.text(width / 2, 200, this.words.join(' '), {
      fontSize: '24px', color: '#ffffff', wordWrap: { width: 800 }, align: 'center'
    }).setOrigin(0.5, 0)

    this.wordQueue = [...this.words]
    this.engine.setWord(this.wordQueue.shift()!)
  }

  private onWordComplete(_word: string, _elapsed: number) {
    if (this.wordQueue.length === 0) {
      this.endLevel(true)
    } else {
      this.engine.setWord(this.wordQueue.shift()!)
    }
  }

  private onWrongKey() {
    this.cameras.main.flash(50, 100, 0, 0)
  }

  private endLevel(passed: boolean) {
    if (this.finished) return
    this.finished = true
    this.engine.destroy()

    const profile = loadProfile(this.profileSlot)// Record that the player has learned the boss weakness for this world
    if (profile && passed) {
      const worldBossMap: Record<number, string> = {
        1: 'grizzlefang',
        2: 'hydra',
        3: 'clockwork_dragon',
        4: 'badrang',
        5: 'typemancer',
      }
      profile.bossWeaknessKnown = worldBossMap[this.level.world] ?? null
      saveProfile(this.profileSlot, profile)
    }

    // No star pressure for MonsterManual
    this.time.delayedCall(500, () => {
      this.scene.start('LevelResult', {
        level: this.level,
        profileSlot: this.profileSlot,
        accuracyStars: 5,
        speedStars: 5,
        passed
      })
    })
  }
}