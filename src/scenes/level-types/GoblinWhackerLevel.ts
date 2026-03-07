// src/scenes/level-types/GoblinWhackerLevel.ts
import Phaser from 'phaser'
import { LevelConfig } from '../../types'
import { TypingEngine } from '../../components/TypingEngine'
import { getWordPool } from '../../utils/words'
import { calcAccuracyStars, calcSpeedStars } from '../../utils/scoring'

interface Goblin {
  word: string
  x: number
  speed: number
  sprite: Phaser.GameObjects.Rectangle  // placeholder until art assets exist
  label: Phaser.GameObjects.Text
  hp: number
}

export class GoblinWhackerLevel extends Phaser.Scene {
  private level!: LevelConfig
  private profileSlot!: number
  private words: string[] = []
  private goblins: Goblin[] = []
  private activeGoblin: Goblin | null = null
  private engine!: TypingEngine
  private wordQueue: string[] = []
  private playerHp = 3
  private maxGoblinReach = 0  // x position where goblin damages player
  private hpText!: Phaser.GameObjects.Text
  private timerText!: Phaser.GameObjects.Text
  private timeLeft = 0
  private timerEvent?: Phaser.Time.TimerEvent
  private spawnTimer?: Phaser.Time.TimerEvent
  private goblinsDefeated = 0
  private finished = false

  constructor() { super('GoblinWhackerLevel') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.finished = false
    this.goblinsDefeated = 0
    this.playerHp = 3
  }

  create() {
    const { width, height } = this.scale
    this.maxGoblinReach = 80

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x2a4a1e)

    // HUD
    this.hpText = this.add.text(20, 20, `HP: ${'❤️'.repeat(this.playerHp)}`, {
      fontSize: '22px', color: '#ff4444'
    })
    this.timerText = this.add.text(width - 20, 20, '', {
      fontSize: '22px', color: '#ffffff'
    }).setOrigin(1, 0)

    // Level name
    this.add.text(width / 2, 20, this.level.name, {
      fontSize: '22px', color: '#ffd700'
    }).setOrigin(0.5, 0)

    // Typing engine (centered, lower third)
    this.engine = new TypingEngine({
      scene: this,
      x: width / 2,
      y: height - 80,
      fontSize: 40,
      onWordComplete: this.onWordComplete.bind(this),
      onWrongKey: this.onWrongKey.bind(this),
    })

    // Word pool
    const difficulty = Math.ceil(this.level.world / 2)
    this.words = getWordPool(this.level.unlockedLetters, this.level.wordCount, difficulty)
    this.wordQueue = [...this.words]

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

    // Spawn goblins
    this.spawnTimer = this.time.addEvent({
      delay: 2500, loop: true, callback: this.spawnGoblin, callbackScope: this
    })
    this.spawnGoblin()
  }

  private spawnGoblin() {
    if (this.finished || this.wordQueue.length === 0) return
    const word = this.wordQueue.shift()!
    const { width, height } = this.scale
    const y = Phaser.Math.Between(120, height - 140)
    const sprite = this.add.rectangle(width + 30, y, 40, 40, 0x44aa44)
    const label = this.add.text(width + 30, y - 30, word, {
      fontSize: '20px', color: '#ffffff',
      backgroundColor: '#000000', padding: { x: 4, y: 2 }
    }).setOrigin(0.5)
    const goblin: Goblin = { word, x: width + 30, speed: 60 + this.level.world * 10, sprite, label, hp: 1 }
    this.goblins.push(goblin)

    // Auto-focus first goblin
    if (!this.activeGoblin) this.setActiveGoblin(goblin)
  }

  private setActiveGoblin(goblin: Goblin | null) {
    this.activeGoblin = goblin
    if (goblin) {
      this.engine.setWord(goblin.word)
    } else {
      this.engine.clearWord()
    }
  }

  update(_time: number, delta: number) {
    if (this.finished) return

    this.goblins.forEach(g => {
      g.x -= g.speed * (delta / 1000)
      g.sprite.setX(g.x)
      g.label.setX(g.x)
      if (g.x <= this.maxGoblinReach) {
        this.goblinReachedPlayer(g)
      }
    })
  }

  private goblinReachedPlayer(goblin: Goblin) {
    // Check companion/pet auto-strike first
    // (simplified — full companion logic in Task 20)
    // Removed unused loadProfile to fix lint error
    this.removeGoblin(goblin)
    this.playerHp--
    this.hpText.setText(`HP: ${'❤️'.repeat(Math.max(0, this.playerHp))}`)
    this.cameras.main.shake(200, 0.01)
    if (this.playerHp <= 0) this.endLevel(false)
  }

  private onWordComplete(word: string, _elapsed: number) {
    const goblin = this.goblins.find(g => g.word === word)
    if (goblin) {
      this.removeGoblin(goblin)
      this.goblinsDefeated++
    }
    // Focus next goblin
    const next = this.goblins[0] ?? null
    this.setActiveGoblin(next)

    if (this.wordQueue.length === 0 && this.goblins.length === 0) {
      this.endLevel(true)
    }
  }

  private onWrongKey() {
    this.cameras.main.flash(80, 120, 0, 0)
  }

  private removeGoblin(goblin: Goblin) {
    goblin.sprite.destroy()
    goblin.label.destroy()
    this.goblins = this.goblins.filter(g => g !== goblin)
  }

  private endLevel(passed: boolean) {
    if (this.finished) return
    this.finished = true
    this.timerEvent?.remove()
    this.spawnTimer?.remove()
    this.engine.destroy()

    const elapsed = Date.now() - this.engine.sessionStartTime
    const acc = calcAccuracyStars(this.engine.correctKeystrokes, this.engine.totalKeystrokes)
    const spd = calcSpeedStars(Math.round(this.engine.completedWords / (elapsed / 60000)), this.level.world)

    const captureAttempt = this.level.captureEligible
      ? { monsterId: 'goblin', monsterName: 'Goblin' }
      : undefined

    this.time.delayedCall(500, () => {
      this.scene.start('LevelResult', {
        level: this.level,
        profileSlot: this.profileSlot,
        accuracyStars: acc,
        speedStars: spd,
        passed,
        captureAttempt,
      })
    })
  }
}
