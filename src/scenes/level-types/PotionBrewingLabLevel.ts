// src/scenes/level-types/PotionBrewingLabLevel.ts
import Phaser from 'phaser'
import { LevelConfig } from '../../types'
import { TypingEngine } from '../../components/TypingEngine'
import { loadProfile } from '../../utils/profile'
import { getWordPool } from '../../utils/words'
import { calcAccuracyStars, calcSpeedStars } from '../../utils/scoring'
import { setupPause } from '../../utils/pauseSetup'

export class PotionBrewingLabLevel extends Phaser.Scene {
  private level!: LevelConfig
  private profileSlot!: number
  private words: string[] = []
  private wordQueue: string[] = []
  private engine!: TypingEngine
  private timerText!: Phaser.GameObjects.Text
  private timeLeft = 0
  private timerEvent?: Phaser.Time.TimerEvent
  private finished = false
  
  private recipeTexts: Phaser.GameObjects.Text[] = []

  constructor() { super('PotionBrewingLabLevel') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.finished = false
  }

  create() {
    setupPause(this, this.profileSlot)
    const { width, height } = this.scale

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x2e1a3a)


    const pProfileAvatar = loadProfile(this.profileSlot)
    const avatarKey = this.textures.exists(pProfileAvatar?.avatarChoice || '') ? pProfileAvatar!.avatarChoice : 'avatar_0'
    this.add.image(100, height - 100, avatarKey).setScale(1.5).setDepth(5)


    // Level name
    this.add.text(width / 2, 20, this.level.name, {
      fontSize: '22px', color: '#ffd700'
    }).setOrigin(0.5, 0)
    
    // Timer
    this.timerText = this.add.text(width - 20, 20, '', {
      fontSize: '22px', color: '#ffffff'
    }).setOrigin(1, 0)

    // Typing engine
    this.engine = new TypingEngine({
      scene: this,
      x: width / 2 + 100,
      y: height / 2,
      fontSize: 48,
      onWordComplete: this.onWordComplete.bind(this),
      onWrongKey: this.onWrongKey.bind(this),
    })

    // Word pool (5-10 words for recipe)
    const difficulty = Math.ceil(this.level.world / 2)
    const count = Math.min(10, Math.max(5, this.level.wordCount))
    this.words = getWordPool(this.level.unlockedLetters, count, difficulty, this.level.world === 1 ? 5 : undefined)
    this.wordQueue = [...this.words]

    // Draw recipe list on left
    this.add.text(50, 80, "Potion Recipe:", { fontSize: '28px', color: '#ffaaaa' })
    this.recipeTexts = this.words.map((w, i) => {
      return this.add.text(50, 130 + i * 40, w, {
        fontSize: '24px', color: '#888888'
      })
    })

    if (this.level.timeLimit) {
      this.timeLeft = this.level.timeLimit
      this.timerEvent = this.time.addEvent({
        delay: 1000, repeat: this.level.timeLimit - 1,
        callback: () => {
          this.timeLeft--
          this.timerText.setText(`${this.timeLeft}s`)
          if (this.timeLeft <= 0) this.endLevel(false)
        }
      })
    }

    this.showNextWord()
  }

  private showNextWord() {
    if (this.finished) return
    if (this.wordQueue.length === 0) {
      this.endLevel(true)
      return
    }
    const currentIdx = this.words.length - this.wordQueue.length
    
    // Update recipe highlighting
    this.recipeTexts.forEach((t, i) => {
      if (i < currentIdx) t.setColor('#44ff44').setAlpha(0.5) // done
      else if (i === currentIdx) t.setColor('#ffffff').setAlpha(1) // current
      else t.setColor('#888888').setAlpha(0.8) // pending
    })

    const word = this.wordQueue.shift()!
    this.engine.setWord(word)
  }

  private onWordComplete(_word: string, _elapsed: number) {
    // Add satisfying potion pop effect
    this.cameras.main.flash(50, 0, 255, 0)
    this.showNextWord()
  }

  private onWrongKey() {
    this.cameras.main.flash(80, 120, 0, 0)
    // Wrong order / wrong key plays error sound (simulated with red flash/shake here)
    this.cameras.main.shake(100, 0.01)
  }

  update() {
    // No continuous updates needed
  }

  private endLevel(passed: boolean) {
    if (this.finished) return
    this.finished = true
    this.timerEvent?.remove()
    this.engine.destroy()

    const elapsed = Date.now() - this.engine.sessionStartTime
    const acc = calcAccuracyStars(this.engine.correctKeystrokes, this.engine.totalKeystrokes)
    const spd = calcSpeedStars(Math.round(this.engine.completedWords / (elapsed / 60000)), this.level.world)
    this.time.delayedCall(500, () => {
      this.scene.start('LevelResult', {
        level: this.level,
        profileSlot: this.profileSlot,
        accuracyStars: acc,
        speedStars: spd,
        passed
      })
    })
  }
}
