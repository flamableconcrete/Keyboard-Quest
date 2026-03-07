// src/scenes/level-types/WoodlandFestivalLevel.ts
import Phaser from 'phaser'
import { LevelConfig } from '../../types'
import { TypingEngine } from '../../components/TypingEngine'
import { loadProfile } from '../../utils/profile'
import { getWordPool } from '../../utils/words'

export class WoodlandFestivalLevel extends Phaser.Scene {
  private level!: LevelConfig
  private profileSlot!: number
  private engine!: TypingEngine
  private wordQueue: string[] = []
  private finished = false
  
  private playerScore = 0
  private aiScore = 0
  private playerScoreText!: Phaser.GameObjects.Text
  private aiScoreText!: Phaser.GameObjects.Text
  private aiTimer?: Phaser.Time.TimerEvent

  constructor() { super('WoodlandFestivalLevel') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.finished = false
    this.playerScore = 0
    this.aiScore = 0
  }

  create() {
    const { width, height } = this.scale

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x2d4a1e)

    // HUD
    this.add.text(width / 2, 40, this.level.name, {
      fontSize: '28px', color: '#ffd700'
    }).setOrigin(0.5)

    this.add.text(width / 2, 80, 'Typing Contest vs Animal Champion!', {
      fontSize: '20px', color: '#ffffff'
    }).setOrigin(0.5)

    this.playerScoreText = this.add.text(200, 200, 'Player Score: 0', {
      fontSize: '24px', color: '#44ff44'
    })

    this.aiScoreText = this.add.text(width - 400, 200, 'Animal Score: 0', {
      fontSize: '24px', color: '#ff4444'
    })

    // Typing engine
    this.engine = new TypingEngine({
      scene: this,
      x: width / 2,
      y: height - 120,
      fontSize: 40,
      onWordComplete: this.onWordComplete.bind(this),
      onWrongKey: this.onWrongKey.bind(this),
    })

    const difficulty = Math.max(1, Math.ceil(this.level.world / 2))
    const words = getWordPool(this.level.unlockedLetters, this.level.wordCount || 15, difficulty)
    this.wordQueue = [...words]

    this.engine.setWord(this.wordQueue.shift()!)

    // AI logic
    this.aiTimer = this.time.addEvent({
      delay: Math.max(1000, 3000 - this.level.world * 200), // AI types faster in later worlds
      loop: true,
      callback: () => {
        if (this.finished) return
        this.aiScore++
        this.aiScoreText.setText(`Animal Score: ${this.aiScore}`)
      }
    })
  }

  private onWordComplete(_word: string, _elapsed: number) {
    this.playerScore++
    this.playerScoreText.setText(`Player Score: ${this.playerScore}`)

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
    this.aiTimer?.remove()

    const profile = loadProfile(this.profileSlot)
    const companionUsed = !!(profile?.activeCompanionId || profile?.activePetId)

    // WoodlandFestival has no fail state, max stars for base XP
    this.time.delayedCall(1000, () => {
      this.scene.start('LevelResult', {
        level: this.level,
        profileSlot: this.profileSlot,
        accuracyStars: 5,
        speedStars: 5,
        passed,
        companionUsed,
      })
    })
  }
}