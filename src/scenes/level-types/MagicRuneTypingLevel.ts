// src/scenes/level-types/MagicRuneTypingLevel.ts
import Phaser from 'phaser'
import { LevelConfig } from '../../types'
import { TypingEngine } from '../../components/TypingEngine'
import { loadProfile } from '../../utils/profile'
import { getWordPool } from '../../utils/words'
import { calcAccuracyStars, calcSpeedStars } from '../../utils/scoring'

export class MagicRuneTypingLevel extends Phaser.Scene {
  private level!: LevelConfig
  private profileSlot!: number
  private words: string[] = []
  private wordQueue: string[] = []
  private engine!: TypingEngine
  private timerText!: Phaser.GameObjects.Text
  private timeLeft = 0
  private timerEvent?: Phaser.Time.TimerEvent
  private finished = false
  
  private runeContainer!: Phaser.GameObjects.Container

  constructor() { super('MagicRuneTypingLevel') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.finished = false
  }

  create() {
    const { width, height } = this.scale

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a3a)
    
    // Draw magic circle background
    const graphics = this.add.graphics()
    graphics.lineStyle(2, 0x00ffff, 0.5)
    graphics.strokeCircle(width / 2, height / 2, 200)
    graphics.strokeCircle(width / 2, height / 2, 220)

    // Level name
    this.add.text(width / 2, 20, this.level.name, {
      fontSize: '22px', color: '#ffd700'
    }).setOrigin(0.5, 0)
    
    // Timer
    this.timerText = this.add.text(width - 20, 20, '', {
      fontSize: '22px', color: '#ffffff'
    }).setOrigin(1, 0)
    
    this.runeContainer = this.add.container(width / 2, height / 2)

    // Typing engine
    this.engine = new TypingEngine({
      scene: this,
      x: width / 2,
      y: height / 2,
      fontSize: 56,
      onWordComplete: this.onWordComplete.bind(this),
      onWrongKey: this.onWrongKey.bind(this),
    })

    // Word pool
    const difficulty = Math.ceil(this.level.world / 2)
    this.words = getWordPool(this.level.unlockedLetters, this.level.wordCount, difficulty, this.level.world === 1 ? 5 : undefined)
    this.wordQueue = [...this.words]

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
    const word = this.wordQueue.shift()!
    this.engine.setWord(word)
    
    // Pulse effect
    this.tweens.add({
      targets: this.runeContainer,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 200,
      yoyo: true,
    })
  }

  private onWordComplete(_word: string, _elapsed: number) {
    // Magic rune flash
    this.cameras.main.flash(150, 0, 255, 255)
    this.showNextWord()
  }

  private onWrongKey() {
    this.cameras.main.flash(80, 120, 0, 0)
  }

  update() {
    // Rotate magic circle slightly
    this.runeContainer.rotation += 0.005
  }

  private endLevel(passed: boolean) {
    if (this.finished) return
    this.finished = true
    this.timerEvent?.remove()
    this.engine.destroy()

    const elapsed = Date.now() - this.engine.sessionStartTime
    const acc = calcAccuracyStars(this.engine.correctKeystrokes, this.engine.totalKeystrokes)
    const spd = calcSpeedStars(Math.round(this.engine.completedWords / (elapsed / 60000)), this.level.world)

    const profile = loadProfile(this.profileSlot)
    const companionUsed = !!(profile?.activeCompanionId || profile?.activePetId)

    this.time.delayedCall(500, () => {
      this.scene.start('LevelResult', {
        level: this.level,
        profileSlot: this.profileSlot,
        accuracyStars: acc,
        speedStars: spd,
        passed,
        companionUsed,
      })
    })
  }
}
