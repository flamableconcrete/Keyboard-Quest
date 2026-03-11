// src/scenes/level-types/DungeonEscapeLevel.ts
import Phaser from 'phaser'
import { LevelConfig } from '../../types'
import { TypingEngine } from '../../components/TypingEngine'
import { loadProfile } from '../../utils/profile'
import { getWordPool } from '../../utils/words'
import { calcAccuracyStars, calcSpeedStars } from '../../utils/scoring'
import { setupPause } from '../../utils/pauseSetup'

export class DungeonEscapeLevel extends Phaser.Scene {
  private level!: LevelConfig
  private profileSlot!: number
  private words: string[] = []
  private wordQueue: string[] = []
  private engine!: TypingEngine
  private timerText!: Phaser.GameObjects.Text
  private timeLeft = 0
  private timerEvent?: Phaser.Time.TimerEvent
  private finished = false
  
  private crackFill!: Phaser.GameObjects.Rectangle
  private totalWords = 0

  constructor() { super('DungeonEscapeLevel') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.finished = false
  }

  create() {
    setupPause(this, this.profileSlot)
    const { width, height } = this.scale

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a2e3a)


    const pProfileAvatar = loadProfile(this.profileSlot)
    const avatarKey = this.textures.exists(pProfileAvatar?.avatarChoice || '') ? pProfileAvatar!.avatarChoice : 'avatar_0'
    this.add.image(100, height - 100, avatarKey).setScale(1.5).setDepth(5)


    // Level name
    this.add.text(width / 2, 20, this.level.name, {
      fontSize: '22px', color: '#ffd700'
    }).setOrigin(0.5, 0)
    
    // Crack progress bar (escape progress)
    const barWidth = width * 0.8
    this.add.text(width / 2, height / 2 - 100, "Break the door!", { fontSize: '24px', color: '#aaaaaa' }).setOrigin(0.5)
    this.add.rectangle(width / 2, height / 2 - 60, barWidth, 30, 0x000000)
    this.crackFill = this.add.rectangle((width - barWidth) / 2, height / 2 - 60, 0, 30, 0xffaa00).setOrigin(0, 0.5)

    // Timer
    this.timerText = this.add.text(width - 20, 20, '', {
      fontSize: '22px', color: '#ffffff'
    }).setOrigin(1, 0)

    // Typing engine
    this.engine = new TypingEngine({
      scene: this,
      x: width / 2,
      y: height / 2 + 50,
      fontSize: 48,
      onWordComplete: this.onWordComplete.bind(this),
      onWrongKey: this.onWrongKey.bind(this),
    })

    // Word pool
    const difficulty = Math.ceil(this.level.world / 2)
    this.words = getWordPool(this.level.unlockedLetters, this.level.wordCount, difficulty, this.level.world === 1 ? 5 : undefined)
    this.wordQueue = [...this.words]
    this.totalWords = this.words.length

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
  }

  private onWordComplete(_word: string, _elapsed: number) {
    const completed = this.totalWords - this.wordQueue.length
    const pct = completed / this.totalWords
    this.crackFill.setDisplaySize((this.scale.width * 0.8) * pct, 30)
    
    // Shake effect to simulate breaking door
    this.cameras.main.shake(100, 0.005)

    this.showNextWord()
  }

  private onWrongKey() {
    this.cameras.main.flash(80, 120, 0, 0)
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
