import Phaser from 'phaser'
import { LevelConfig } from '../../types'
import { TypingEngine } from '../../components/TypingEngine'
import { loadProfile } from '../../utils/profile'
import { getWordPool } from '../../utils/words'
import { calcAccuracyStars, calcSpeedStars } from '../../utils/scoring'
import { setupPause } from '../../utils/pauseSetup'

interface Skeleton {
  word: string
  x: number
  speed: number
  sprite: Phaser.GameObjects.Rectangle
  label: Phaser.GameObjects.Text
  hp: number
}

export class SkeletonSwarmLevel extends Phaser.Scene {
  private level!: LevelConfig
  private profileSlot!: number
  private words: string[] = []
  private skeletons: Skeleton[] = []
  private activeSkeleton: Skeleton | null = null
  private engine!: TypingEngine
  private wordQueue: string[] = []
  private playerHp = 3
  private maxSkeletonReach = 0
  private hpText!: Phaser.GameObjects.Text
  private timerText!: Phaser.GameObjects.Text
  private waveTimer?: Phaser.Time.TimerEvent
  private skeletonsDefeated = 0
  private finished = false
  private currentWave = 0
  private maxWaves = 3

  constructor() { super('SkeletonSwarmLevel') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.finished = false
    this.skeletonsDefeated = 0
    this.playerHp = 3
    this.currentWave = 0
    this.maxWaves = Phaser.Math.Between(3, 5) // 3-5 waves
    this.skeletons = []
    this.activeSkeleton = null
    this.words = []
    this.wordQueue = []
  }

  create() {
    setupPause(this, this.profileSlot)
    const { width, height } = this.scale
    this.maxSkeletonReach = 80

    this.add.rectangle(width / 2, height / 2, width, height, 0x222222)

    this.hpText = this.add.text(20, 20, `HP: ${'❤️'.repeat(this.playerHp)}`, { fontSize: '22px', color: '#ff4444' })
    this.timerText = this.add.text(width - 20, 20, `Wave: 1/${this.maxWaves}`, { fontSize: '22px', color: '#ffffff' }).setOrigin(1, 0)
    this.add.text(width / 2, 20, this.level.name, { fontSize: '22px', color: '#ffd700' }).setOrigin(0.5, 0)

    this.engine = new TypingEngine({
      scene: this, x: width / 2, y: height - 80, fontSize: 40,
      onWordComplete: this.onWordComplete.bind(this),
      onWrongKey: this.onWrongKey.bind(this),
    })

    const difficulty = Math.ceil(this.level.world / 2)
    this.words = getWordPool(this.level.unlockedLetters, this.level.wordCount, difficulty, this.level.world === 1 ? 5 : undefined)
    this.wordQueue = [...this.words]

    this.spawnWave()
    this.waveTimer = this.time.addEvent({
      delay: 5000, loop: true, callback: () => {
        if (this.currentWave < this.maxWaves) {
          this.spawnWave()
        } else if (this.skeletons.length === 0) {
          this.endLevel(true)
        }
      }
    })
  }

  private spawnWave() {
    if (this.finished || this.wordQueue.length === 0 || this.currentWave >= this.maxWaves) return
    this.currentWave++
    this.timerText.setText(`Wave: ${this.currentWave}/${this.maxWaves}`)

    const numSkeletons = Math.min(3, this.wordQueue.length)
    for (let i = 0; i < numSkeletons; i++) {
      const word = this.wordQueue.shift()!
      const { width, height } = this.scale
      const y = Phaser.Math.Between(120, height - 140)
      const sprite = this.add.rectangle(width + 30 + i * 40, y, 40, 40, 0xdddddd)
      const label = this.add.text(width + 30 + i * 40, y - 30, word, {
        fontSize: '20px', color: '#000000', backgroundColor: '#ffffff', padding: { x: 4, y: 2 }
      }).setOrigin(0.5)
      const skeleton: Skeleton = { word, x: width + 30 + i * 40, speed: 40 + this.level.world * 10, sprite, label, hp: 1 }
      this.skeletons.push(skeleton)

      if (!this.activeSkeleton) this.setActiveSkeleton(skeleton)
    }
  }

  private setActiveSkeleton(skeleton: Skeleton | null) {
    this.activeSkeleton = skeleton
    if (skeleton) this.engine.setWord(skeleton.word)
    else this.engine.clearWord()
  }

  update(_time: number, delta: number) {
    if (this.finished) return
    this.skeletons.forEach(s => {
      s.x -= s.speed * (delta / 1000)
      s.sprite.setX(s.x)
      s.label.setX(s.x)
      if (s.x <= this.maxSkeletonReach) this.skeletonReachedPlayer(s)
    })
  }

  private skeletonReachedPlayer(skeleton: Skeleton) {
    this.removeSkeleton(skeleton)
    this.playerHp--
    this.hpText.setText(`HP: ${'❤️'.repeat(Math.max(0, this.playerHp))}`)
    this.cameras.main.shake(200, 0.01)
    if (this.playerHp <= 0) this.endLevel(false)
  }

  private onWordComplete(word: string, _elapsed: number) {
    const skeleton = this.skeletons.find(s => s.word === word)
    if (skeleton) {
      this.removeSkeleton(skeleton)
      this.skeletonsDefeated++
    }
    const next = this.skeletons[0] ?? null
    this.setActiveSkeleton(next)

    if (this.wordQueue.length === 0 && this.skeletons.length === 0) {
      this.endLevel(true)
    }
  }

  private onWrongKey() { this.cameras.main.flash(80, 120, 0, 0) }

  private removeSkeleton(skeleton: Skeleton) {
    skeleton.sprite.destroy()
    skeleton.label.destroy()
    this.skeletons = this.skeletons.filter(s => s !== skeleton)
  }

  private endLevel(passed: boolean) {
    if (this.finished) return
    this.finished = true
    this.waveTimer?.remove()
    this.engine.destroy()

    const elapsed = Date.now() - this.engine.sessionStartTime
    const acc = calcAccuracyStars(this.engine.correctKeystrokes, this.engine.totalKeystrokes)
    const spd = calcSpeedStars(Math.round(this.engine.completedWords / (elapsed / 60000)), this.level.world)
    const captureAttempt = this.level.captureEligible ? { monsterId: 'skeleton', monsterName: 'Skeleton' } : undefined

    const profile = loadProfile(this.profileSlot)
    const companionUsed = !!(profile?.activeCompanionId || profile?.activePetId)

    this.time.delayedCall(500, () => {
      this.scene.start('LevelResult', {
        level: this.level, profileSlot: this.profileSlot,
        accuracyStars: acc, speedStars: spd, passed, 
        companionUsed, captureAttempt
      })
    })
  }
}