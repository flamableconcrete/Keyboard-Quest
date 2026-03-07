// src/scenes/boss-types/BaronTypoBoss.ts
import Phaser from 'phaser'
import { LevelConfig } from '../../types'
import { loadProfile } from '../../utils/profile'
import { TypingEngine } from '../../components/TypingEngine'
import { getWordPool } from '../../utils/words'
import { calcAccuracyStars, calcSpeedStars } from '../../utils/scoring'

export class BaronTypoBoss extends Phaser.Scene {
  private level!: LevelConfig
  private profileSlot!: number
  private engine!: TypingEngine
  
  private phase = 1
  private maxPhases = 3
  private wordsPerPhase = 5
  private wordQueue: string[] = []

  private bossSprite!: Phaser.GameObjects.Rectangle
  private bossLabel!: Phaser.GameObjects.Text
  private bossHpText!: Phaser.GameObjects.Text
  private phaseText!: Phaser.GameObjects.Text
  
  private bossHp = 0
  private bossMaxHp = 0

  private playerHp = 5
  private hpText!: Phaser.GameObjects.Text
  private timerText!: Phaser.GameObjects.Text
  private timeLeft = 0
  private timerEvent?: Phaser.Time.TimerEvent
  private attackTimer?: Phaser.Time.TimerEvent
  private finished = false

  constructor() { super('BaronTypoBoss') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.finished = false
    this.playerHp = 5
    this.phase = 1
    // Number of words is dictated by config, distributed across 3 phases
    this.wordsPerPhase = Math.max(1, Math.ceil(this.level.wordCount / this.maxPhases))
  }

  create() {
    const { width, height } = this.scale

    // Deep Purple/Dark Background for Baron Typo
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a0a2a)

    // HUD
    this.hpText = this.add.text(20, 20, `HP: ${'❤️'.repeat(this.playerHp)}`, {
      fontSize: '22px', color: '#ff4444'
    })
    this.timerText = this.add.text(width - 20, 20, '', {
      fontSize: '22px', color: '#ffffff'
    }).setOrigin(1, 0)

    // Level name
    this.add.text(width / 2, 20, this.level.name, {
      fontSize: '28px', color: '#cc88ff'
    }).setOrigin(0.5, 0)
    
    this.phaseText = this.add.text(width / 2, 60, `Phase ${this.phase}/${this.maxPhases}`, {
      fontSize: '20px', color: '#aaaaaa'
    }).setOrigin(0.5, 0)

    // Boss Sprite (Baron is purple and sophisticated-looking placeholder)
    this.bossSprite = this.add.rectangle(width / 2, height / 2 - 50, 200, 300, 0x800080)
    this.bossSprite.setStrokeStyle(4, 0xffd700) // Gold trim
    
    this.bossMaxHp = this.level.wordCount
    this.bossHp = this.bossMaxHp
    this.bossHpText = this.add.text(width / 2, height / 2 - 220, `Baron Typo HP: ${this.bossHp}/${this.bossMaxHp}`, {
      fontSize: '24px', color: '#cc88ff'
    }).setOrigin(0.5)

    this.bossLabel = this.add.text(width / 2, height / 2 - 50, '', {
      fontSize: '40px', color: '#ffffff',
      backgroundColor: '#000000', padding: { x: 12, y: 6 },
      fontStyle: 'bold'
    }).setOrigin(0.5)

    // Typing engine
    this.engine = new TypingEngine({
      scene: this,
      x: width / 2,
      y: height - 100,
      fontSize: 48,
      onWordComplete: this.onWordComplete.bind(this),
      onWrongKey: this.onWrongKey.bind(this),
    })

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

    this.startPhase()
  }
  
  private startPhase() {
    this.phaseText.setText(`Phase ${this.phase}/${this.maxPhases}`)
    
    const difficulty = Math.ceil(this.level.world / 2) + (this.phase - 1)
    
    // Ensure we don't generate more words than remaining boss HP
    const wordsToGenerate = Math.min(this.wordsPerPhase, this.bossHp)
    const words = getWordPool(this.level.unlockedLetters, wordsToGenerate, difficulty)
    
    this.wordQueue = [...words]
    
    // Setup attack timer based on phase
    this.attackTimer?.remove()
    this.attackTimer = this.time.addEvent({
      delay: Math.max(2000, 5000 - (this.phase * 800)), // Gets faster each phase
      loop: true,
      callback: this.bossAttack,
      callbackScope: this
    })
    
    // Visual cue for phase change
    this.cameras.main.flash(500, 128, 0, 128)
    
    this.loadNextWord()
  }

  private scrambleWord(word: string): string {
    if (word.length <= 1) return word
    let scrambled = word
    let attempts = 0
    while (scrambled === word && attempts < 10) {
      scrambled = word.split('').sort(() => Math.random() - 0.5).join('')
      attempts++
    }
    return scrambled
  }

  private loadNextWord() {
    if (this.wordQueue.length === 0) {
      if (this.phase < this.maxPhases && this.bossHp > 0) {
        this.phase++
        this.startPhase()
      } else {
        this.endLevel(true)
      }
      return
    }
    const correctWord = this.wordQueue[0]
    const scrambledWord = this.scrambleWord(correctWord)
    
    this.bossLabel.setText(scrambledWord)
    
    // In Phase 1, show the correct word in the engine to help.
    // In Phase 2 & 3, show underscores in the engine to force looking at the boss.
    if (this.phase === 1) {
      this.engine.setWord(correctWord)
    } else {
      // Show underscores in the engine
      const underscores = '_'.repeat(correctWord.length)
      this.engine.setWord(correctWord, underscores)
    }
  }

  private bossAttack() {
    if (this.finished) return
    
    // Attack animation
    this.tweens.add({
      targets: this.bossSprite,
      y: this.bossSprite.y + 20,
      scaleX: 1.2,
      yoyo: true,
      duration: 150,
      onComplete: () => {
        this.playerHp--
        this.hpText.setText(`HP: ${'❤️'.repeat(Math.max(0, this.playerHp))}`)
        this.cameras.main.shake(300, 0.02)
        
        if (this.playerHp <= 0) this.endLevel(false)
      }
    })
  }

  private onWordComplete(_word: string, _elapsed: number) {
    if (this.finished) return

    this.wordQueue.shift()
    this.bossHp--
    this.bossHpText.setText(`Baron Typo HP: ${this.bossHp}/${this.bossMaxHp}`)

    // Visual damage cue
    this.bossSprite.setFillStyle(0xddaabb)
    this.time.delayedCall(100, () => {
      if (this.bossSprite) this.bossSprite.setFillStyle(0x800080)
    })

    this.loadNextWord()
  }

  private onWrongKey() {
    this.cameras.main.flash(80, 150, 0, 0)
  }

  private endLevel(passed: boolean) {
    if (this.finished) return
    this.finished = true
    this.timerEvent?.remove()
    this.attackTimer?.remove()
    this.engine.destroy()

    if (passed) {
      this.bossSprite.destroy()
      this.bossLabel.destroy()
      this.bossHpText.setText('FOILED!')
    }

    const elapsed = Date.now() - this.engine.sessionStartTime
    const acc = calcAccuracyStars(this.engine.correctKeystrokes, this.engine.totalKeystrokes)
    const spd = calcSpeedStars(Math.round(this.engine.completedWords / (elapsed / 60000)), this.level.world)

    const captureAttempt = this.level.captureEligible
      ? { monsterId: 'baron_typo', monsterName: 'Baron Typo' }
      : undefined

    const profile = loadProfile(this.profileSlot)
    const companionUsed = !!(profile?.activeCompanionId || profile?.activePetId)

    this.time.delayedCall(1500, () => {
      this.scene.start('LevelResult', {
        level: this.level,
        profileSlot: this.profileSlot,
        accuracyStars: acc,
        speedStars: spd,
        passed,
        companionUsed,
        captureAttempt,
      })
    })
  }
}
