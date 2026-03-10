// src/scenes/level-types/GuildRecruitmentLevel.ts
import Phaser from 'phaser'
import { LevelConfig } from '../../types'
import { TypingEngine } from '../../components/TypingEngine'
import { loadProfile } from '../../utils/profile'
import { getWordPool } from '../../utils/words'
import { calcAccuracyStars, calcSpeedStars } from '../../utils/scoring'

export class GuildRecruitmentLevel extends Phaser.Scene {
  private level!: LevelConfig
  private profileSlot!: number
  private engine!: TypingEngine
  private wordQueue: string[] = []
  private finished = false
  
  private timerText!: Phaser.GameObjects.Text
  private timeLeft = 0
  private timerEvent?: Phaser.Time.TimerEvent

  constructor() { super('GuildRecruitmentLevel') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.finished = false
  }

  create() {
    const { width, height } = this.scale

    // Background - Tavern theme
    this.add.rectangle(width / 2, height / 2, width, height, 0x4a2e1b)

    // HUD
    this.add.text(width / 2, 40, this.level.name, {
      fontSize: '28px', color: '#ffd700'
    }).setOrigin(0.5)

    this.timerText = this.add.text(width - 20, 20, '', {
      fontSize: '22px', color: '#ffffff'
    }).setOrigin(1, 0)

    this.add.text(width / 2, 100, 'Make your recruitment pitch!', {
      fontSize: '22px', color: '#dddddd'
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

    // Word pool (Pitch text)
    const difficulty = Math.max(1, Math.ceil(this.level.world / 2))
    const words = getWordPool(this.level.unlockedLetters, this.level.wordCount || 15, difficulty, this.level.world === 1 ? 5 : undefined)
    
    // Display the pitch
    this.add.text(width / 2, 200, words.join(' '), {
      fontSize: '24px', color: '#ffffff', wordWrap: { width: 800 }, align: 'center'
    }).setOrigin(0.5, 0)

    this.wordQueue = [...words]
    this.engine.setWord(this.wordQueue.shift()!)

    // Timer
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