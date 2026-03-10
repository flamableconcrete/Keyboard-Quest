// src/scenes/level-types/SillyChallengeLevel.ts
import Phaser from 'phaser'
import { LevelConfig } from '../../types'
import { TypingEngine } from '../../components/TypingEngine'
import { loadProfile } from '../../utils/profile'
import { getWordPool } from '../../utils/words'

interface SillyEntity {
  word: string
  x: number
  speed: number
  sprite: Phaser.GameObjects.Rectangle
  label: Phaser.GameObjects.Text
  hp: number
}

export class SillyChallengeLevel extends Phaser.Scene {
  private level!: LevelConfig
  private profileSlot!: number
  private words: string[] = []
  private entities: SillyEntity[] = []
  private activeEntity: SillyEntity | null = null
  private engine!: TypingEngine
  private wordQueue: string[] = []
  private playerHp = 3
  private maxEntityReach = 0
  private hpText!: Phaser.GameObjects.Text
  private timerText!: Phaser.GameObjects.Text
  private timeLeft = 0
  private timerEvent?: Phaser.Time.TimerEvent
  private spawnTimer?: Phaser.Time.TimerEvent
  private finished = false

  constructor() { super('SillyChallengeLevel') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.finished = false
    this.playerHp = 3
  }

  create() {
    const { width, height } = this.scale
    this.maxEntityReach = 80

    // Background - silly color
    this.add.rectangle(width / 2, height / 2, width, height, 0xffaacc)

    // HUD
    this.hpText = this.add.text(20, 20, `HP: ${'❤️'.repeat(this.playerHp)}`, {
      fontSize: '22px', color: '#ff4444'
    })
    this.timerText = this.add.text(width - 20, 20, '', {
      fontSize: '22px', color: '#000000'
    }).setOrigin(1, 0)

    // Level name
    this.add.text(width / 2, 20, this.level.name, {
      fontSize: '22px', color: '#000000'
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
          if (this.timeLeft <= 0) this.endLevel(true) // Always pass
        }
      })
    }

    // Spawn entities
    this.spawnTimer = this.time.addEvent({
      delay: 2500, loop: true, callback: this.spawnEntity, callbackScope: this
    })
    this.spawnEntity()
  }

  private spawnEntity() {
    if (this.finished || this.wordQueue.length === 0) return
    const word = this.wordQueue.shift()!
    const { width, height } = this.scale
    const y = Phaser.Math.Between(120, height - 140)
    
    // Silly yellow sprite (e.g., block of cheese)
    const sprite = this.add.rectangle(width + 30, y, 40, 40, 0xffff00)
    const label = this.add.text(width + 30, y - 30, word, {
      fontSize: '20px', color: '#000000',
      backgroundColor: '#ffffff', padding: { x: 4, y: 2 }
    }).setOrigin(0.5)
    
    const entity: SillyEntity = { word, x: width + 30, speed: 60 + this.level.world * 10, sprite, label, hp: 1 }
    this.entities.push(entity)

    if (!this.activeEntity) this.setActiveEntity(entity)
  }

  private setActiveEntity(entity: SillyEntity | null) {
    this.activeEntity = entity
    if (entity) {
      this.engine.setWord(entity.word)
    } else {
      this.engine.clearWord()
    }
  }

  update(_time: number, delta: number) {
    if (this.finished) return

    this.entities.forEach(g => {
      g.x -= g.speed * (delta / 1000)
      g.sprite.setX(g.x)
      g.label.setX(g.x)
      if (g.x <= this.maxEntityReach) {
        this.entityReachedPlayer(g)
      }
    })
  }

  private entityReachedPlayer(entity: SillyEntity) {
    this.removeEntity(entity)
    this.playerHp--
    this.hpText.setText(`HP: ${'❤️'.repeat(Math.max(0, this.playerHp))}`)
    this.cameras.main.shake(200, 0.01)
    if (this.playerHp <= 0) {
      this.endLevel(true) // SillyChallenge never fails
    }
  }

  private onWordComplete(word: string, _elapsed: number) {
    const entity = this.entities.find(g => g.word === word)
    if (entity) {
      this.removeEntity(entity)
    }
    
    const next = this.entities[0] ?? null
    this.setActiveEntity(next)

    if (this.wordQueue.length === 0 && this.entities.length === 0) {
      this.endLevel(true)
    }
  }

  private onWrongKey() {
    this.cameras.main.flash(80, 120, 0, 0)
  }

  private removeEntity(entity: SillyEntity) {
    entity.sprite.destroy()
    entity.label.destroy()
    this.entities = this.entities.filter(g => g !== entity)
  }

  private endLevel(passed: boolean) {
    if (this.finished) return
    this.finished = true
    this.timerEvent?.remove()
    this.spawnTimer?.remove()
    this.engine.destroy()

    const profile = loadProfile(this.profileSlot)
    const companionUsed = !!(profile?.activeCompanionId || profile?.activePetId)

    // SillyChallenge always gives max stars for base XP
    this.time.delayedCall(500, () => {
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