import Phaser from 'phaser'
import { LevelConfig } from '../../types'
import { TypingEngine } from '../../components/TypingEngine'
import { getWordPool } from '../../utils/words'
import { calcAccuracyStars, calcSpeedStars } from '../../utils/scoring'

interface Undead {
  word: string
  x: number
  speed: number
  sprite: Phaser.GameObjects.Rectangle
  label: Phaser.GameObjects.Text
  hp: number
}

export class UndeadSiegeLevel extends Phaser.Scene {
  private level!: LevelConfig
  private profileSlot!: number
  private words: string[] = []
  private undeads: Undead[] = []
  private activeUndead: Undead | null = null
  private engine!: TypingEngine
  private wordQueue: string[] = []
  private castleHp = 5
  private maxUndeadReach = 100
  private castleHpText!: Phaser.GameObjects.Text
  private waveText!: Phaser.GameObjects.Text
  private spawnTimer?: Phaser.Time.TimerEvent
  private undeadsDefeated = 0
  private finished = false
  private currentWave = 1
  private maxWaves = 3

  constructor() { super('UndeadSiegeLevel') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.finished = false
    this.undeadsDefeated = 0
    this.castleHp = 5
    this.currentWave = 1
  }

  create() {
    const { width, height } = this.scale

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a2a3a)

    // Castle
    this.add.rectangle(50, height / 2, 100, height - 200, 0x555555)

    this.castleHpText = this.add.text(20, 20, `Castle HP: ${'🛡️'.repeat(this.castleHp)}`, { fontSize: '22px', color: '#88aaff' })
    this.waveText = this.add.text(width - 20, 20, `Wave: 1/${this.maxWaves}`, { fontSize: '22px', color: '#ffffff' }).setOrigin(1, 0)
    this.add.text(width / 2, 20, this.level.name, { fontSize: '22px', color: '#ffd700' }).setOrigin(0.5, 0)

    this.engine = new TypingEngine({
      scene: this, x: width / 2, y: height - 80, fontSize: 40,
      onWordComplete: this.onWordComplete.bind(this),
      onWrongKey: this.onWrongKey.bind(this),
    })

    const difficulty = Math.ceil(this.level.world / 2)
    this.words = getWordPool(this.level.unlockedLetters, this.level.wordCount, difficulty)
    this.wordQueue = [...this.words]

    this.spawnTimer = this.time.addEvent({
      delay: 2000, loop: true, callback: this.spawnUndead, callbackScope: this
    })
    this.spawnUndead()
  }

  private spawnUndead() {
    if (this.finished) return
    if (this.wordQueue.length === 0) {
      if (this.undeads.length === 0) this.endLevel(true)
      return
    }

    const word = this.wordQueue.shift()!
    const { width, height } = this.scale
    const y = Phaser.Math.Between(150, height - 150)
    const sprite = this.add.rectangle(width + 30, y, 40, 40, 0x336633)
    const label = this.add.text(width + 30, y - 30, word, {
      fontSize: '20px', color: '#ffffff', backgroundColor: '#000000', padding: { x: 4, y: 2 }
    }).setOrigin(0.5)
    
    const undead: Undead = { word, x: width + 30, speed: 40 + this.level.world * 10, sprite, label, hp: 1 }
    this.undeads.push(undead)

    if (!this.activeUndead) this.setActiveUndead(undead)

    // Update wave logic simplistically based on words remaining
    const totalWords = this.words.length
    const wordsSpawned = totalWords - this.wordQueue.length
    this.currentWave = Math.min(this.maxWaves, Math.ceil((wordsSpawned / totalWords) * this.maxWaves)) || 1
    this.waveText.setText(`Wave: ${this.currentWave}/${this.maxWaves}`)
  }

  private setActiveUndead(undead: Undead | null) {
    this.activeUndead = undead
    if (undead) this.engine.setWord(undead.word)
    else this.engine.clearWord()
  }

  update(_time: number, delta: number) {
    if (this.finished) return
    this.undeads.forEach(u => {
      u.x -= u.speed * (delta / 1000)
      u.sprite.setX(u.x)
      u.label.setX(u.x)
      if (u.x <= this.maxUndeadReach) this.undeadReachedCastle(u)
    })
  }

  private undeadReachedCastle(undead: Undead) {
    this.removeUndead(undead)
    this.castleHp--
    this.castleHpText.setText(`Castle HP: ${'🛡️'.repeat(Math.max(0, this.castleHp))}`)
    this.cameras.main.shake(200, 0.01)
    if (this.castleHp <= 0) this.endLevel(false)
  }

  private onWordComplete(word: string, _elapsed: number) {
    const undead = this.undeads.find(u => u.word === word)
    if (undead) {
      this.removeUndead(undead)
      this.undeadsDefeated++
    }
    const next = this.undeads[0] ?? null
    this.setActiveUndead(next)

    if (this.wordQueue.length === 0 && this.undeads.length === 0) {
      this.endLevel(true)
    }
  }

  private onWrongKey() { this.cameras.main.flash(80, 120, 0, 0) }

  private removeUndead(undead: Undead) {
    undead.sprite.destroy()
    undead.label.destroy()
    this.undeads = this.undeads.filter(u => u !== undead)
  }

  private endLevel(passed: boolean) {
    if (this.finished) return
    this.finished = true
    this.spawnTimer?.remove()
    this.engine.destroy()

    const elapsed = Date.now() - this.engine.sessionStartTime
    const acc = calcAccuracyStars(this.engine.correctKeystrokes, this.engine.totalKeystrokes)
    const spd = calcSpeedStars(Math.round(this.engine.completedWords / (elapsed / 60000)), this.level.world)
    const captureAttempt = this.level.captureEligible ? { monsterId: 'undead', monsterName: 'Undead' } : undefined

    this.time.delayedCall(500, () => {
      this.scene.start('LevelResult', {
        level: this.level, profileSlot: this.profileSlot,
        accuracyStars: acc, speedStars: spd, passed, captureAttempt
      })
    })
  }
}