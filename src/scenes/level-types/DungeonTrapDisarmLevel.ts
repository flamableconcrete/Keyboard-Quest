// src/scenes/level-types/DungeonTrapDisarmLevel.ts
import Phaser from 'phaser'
import { LevelConfig } from '../../types'
import { TypingEngine } from '../../components/TypingEngine'
import { loadProfile } from '../../utils/profile'
import { getWordPool } from '../../utils/words'
import { calcAccuracyStars, calcSpeedStars } from '../../utils/scoring'

interface Trap {
  word: string
  x: number
  y: number
  timeLeft: number
  maxTime: number
  sprite: Phaser.GameObjects.Rectangle
  barBg: Phaser.GameObjects.Rectangle
  barFill: Phaser.GameObjects.Rectangle
  label: Phaser.GameObjects.Text
}

export class DungeonTrapDisarmLevel extends Phaser.Scene {
  private level!: LevelConfig
  private profileSlot!: number
  private words: string[] = []
  private traps: Trap[] = []
  private activeTrap: Trap | null = null
  private engine!: TypingEngine
  private wordQueue: string[] = []
  private playerHp = 3
  private hpText!: Phaser.GameObjects.Text
  private timerText!: Phaser.GameObjects.Text
  private timeLeft = 0
  private timerEvent?: Phaser.Time.TimerEvent
  private spawnTimer?: Phaser.Time.TimerEvent
  private trapsDisarmed = 0
  private finished = false

  constructor() { super('DungeonTrapDisarmLevel') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.finished = false
    this.trapsDisarmed = 0
    this.playerHp = 3
  }

  create() {
    const { width, height } = this.scale

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x3a2e3a)

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

    // Typing engine
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
    this.words = getWordPool(this.level.unlockedLetters, this.level.wordCount, difficulty, this.level.world === 1 ? 5 : undefined)
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

    // Spawn traps
    this.spawnTimer = this.time.addEvent({
      delay: 2000, loop: true, callback: this.spawnTrap, callbackScope: this
    })
    this.spawnTrap()
  }

  private spawnTrap() {
    if (this.finished || this.wordQueue.length === 0) return
    const word = this.wordQueue.shift()!
    const { width, height } = this.scale
    
    // Random position avoiding the edges and bottom text area
    const x = Phaser.Math.Between(150, width - 150)
    const y = Phaser.Math.Between(120, height - 200)
    
    const sprite = this.add.rectangle(x, y, 60, 60, 0x883333)
    const label = this.add.text(x, y - 40, word, {
      fontSize: '20px', color: '#ffffff',
      backgroundColor: '#000000', padding: { x: 4, y: 2 }
    }).setOrigin(0.5)
    
    const barWidth = 60
    const barBg = this.add.rectangle(x, y + 40, barWidth, 10, 0x000000)
    const barFill = this.add.rectangle(x - barWidth/2, y + 40, barWidth, 10, 0xff0000).setOrigin(0, 0.5)

    const maxTime = 5 + (10 / Math.max(1, this.level.world)) // Traps explode faster in later worlds
    
    const trap: Trap = { word, x, y, timeLeft: maxTime, maxTime, sprite, barBg, barFill, label }
    this.traps.push(trap)

    if (!this.activeTrap) this.setActiveTrap(trap)
  }

  private setActiveTrap(trap: Trap | null) {
    this.activeTrap = trap
    if (trap) {
      this.engine.setWord(trap.word)
    } else {
      this.engine.clearWord()
    }
  }

  update(_time: number, delta: number) {
    if (this.finished) return

    for (let i = this.traps.length - 1; i >= 0; i--) {
      const t = this.traps[i]
      t.timeLeft -= delta / 1000
      
      const pct = Math.max(0, t.timeLeft / t.maxTime)
      t.barFill.setDisplaySize(60 * pct, 10)
      
      if (pct < 0.3) t.barFill.setFillStyle(0xff0000)
      else if (pct < 0.6) t.barFill.setFillStyle(0xffff00)
      else t.barFill.setFillStyle(0x00ff00)

      if (t.timeLeft <= 0) {
        this.trapExploded(t)
      }
    }
  }

  private trapExploded(trap: Trap) {
    this.removeTrap(trap)
    this.playerHp--
    this.hpText.setText(`HP: ${'❤️'.repeat(Math.max(0, this.playerHp))}`)
    this.cameras.main.shake(300, 0.02)
    this.cameras.main.flash(200, 255, 0, 0)
    
    if (this.playerHp <= 0) {
      this.endLevel(false)
    } else {
      if (this.activeTrap === trap) {
        this.setActiveTrap(this.traps[0] ?? null)
      }
    }
  }

  private onWordComplete(word: string, _elapsed: number) {
    const trap = this.traps.find(t => t.word === word)
    if (trap) {
      this.removeTrap(trap)
      this.trapsDisarmed++
    }
    
    const next = this.traps[0] ?? null
    this.setActiveTrap(next)

    if (this.wordQueue.length === 0 && this.traps.length === 0) {
      this.endLevel(true)
    }
  }

  private onWrongKey() {
    this.cameras.main.flash(80, 120, 0, 0)
  }

  private removeTrap(trap: Trap) {
    trap.sprite.destroy()
    trap.label.destroy()
    trap.barBg.destroy()
    trap.barFill.destroy()
    this.traps = this.traps.filter(t => t !== trap)
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
