// src/scenes/boss-types/SlimeKingBoss.ts
import Phaser from 'phaser'
import { LevelConfig } from '../../types'
import { loadProfile } from '../../utils/profile'
import { TypingEngine } from '../../components/TypingEngine'
import { getWordPool } from '../../utils/words'
import { calcAccuracyStars, calcSpeedStars } from '../../utils/scoring'
import { setupPause } from '../../utils/pauseSetup'

interface Slime {
  word: string
  x: number
  y: number
  speed: number
  sprite: Phaser.GameObjects.Rectangle
  label: Phaser.GameObjects.Text
  hp: number
  size: number
}

export class SlimeKingBoss extends Phaser.Scene {
  private level!: LevelConfig
  private profileSlot!: number
  private engine!: TypingEngine
  
  private slimes: Slime[] = []
  private activeSlime: Slime | null = null
  
  private playerHp = 5
  private hpText!: Phaser.GameObjects.Text
  private bossHpText!: Phaser.GameObjects.Text
  private finished = false
  private attackTimer?: Phaser.Time.TimerEvent

  constructor() { super('SlimeKingBoss') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.finished = false
    this.playerHp = 5
    this.slimes = []
    this.activeSlime = null
  }

  create() {
    setupPause(this, this.profileSlot)
    const { width, height } = this.scale

    // Dark Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x111111)

    // HUD
    this.hpText = this.add.text(20, 20, `HP: ${'❤️'.repeat(this.playerHp)}`, {
      fontSize: '22px', color: '#ff4444'
    })

    this.add.text(width / 2, 20, this.level.name, {
      fontSize: '28px', color: '#ff8800'
    }).setOrigin(0.5, 0)
    
    this.bossHpText = this.add.text(width / 2, 60, `Slimes: 0`, {
      fontSize: '20px', color: '#aaaaaa'
    }).setOrigin(0.5, 0)

    // Typing engine
    this.engine = new TypingEngine({
      scene: this,
      x: width / 2,
      y: height - 100,
      fontSize: 48,
      onWordComplete: this.onWordComplete.bind(this),
      onWrongKey: this.onWrongKey.bind(this),
    })

    this.spawnInitialSlime()

    // Boss Attack Timer
    this.attackTimer = this.time.addEvent({
      delay: 5000,
      loop: true,
      callback: this.bossAttack,
      callbackScope: this
    })
  }

  private bossAttack() {
    if (this.finished || this.slimes.length === 0) return

    // Pick a random slime to "attack"
    const attacker = Phaser.Utils.Array.GetRandom(this.slimes)
    
    this.tweens.add({
      targets: [attacker.sprite, attacker.label],
      scaleX: 1.2,
      scaleY: 1.2,
      yoyo: true,
      duration: 100,
      onComplete: () => {
        if (this.finished) return
        this.playerHp--
        this.hpText.setText(`HP: ${'❤️'.repeat(Math.max(0, this.playerHp))}`)
        this.cameras.main.shake(300, 0.01)
        if (this.playerHp <= 0) this.endLevel(false)
      }
    })
  }

  private spawnInitialSlime() {
    const { width, height } = this.scale
    // Get a long word for the king
    const difficulty = Math.ceil(this.level.world / 2) + 2 // Harder words for boss
    const words = getWordPool(this.level.unlockedLetters, 1, difficulty)
    const word = words[0] || 'slimeking'
    
    this.createSlime(word, width / 2, height / 2 - 50, 200)
  }

  private createSlime(word: string, x: number, y: number, size: number) {
    const sprite = this.add.rectangle(x, y, size, size, 0x44aaaa)
    const label = this.add.text(x, y, word, {
      fontSize: `${Math.max(16, size / 5)}px`, color: '#ffffff', backgroundColor: '#000000', padding: { x: 4, y: 2 }
    }).setOrigin(0.5)
    
    const slime: Slime = { word, x, y, speed: 0, sprite, label, hp: 1, size }
    this.slimes.push(slime)

    if (!this.activeSlime) this.setActiveSlime(slime)
    this.updateBossHp()
  }

  private setActiveSlime(slime: Slime | null) {
    this.activeSlime = slime
    if (slime) {
      this.engine.setWord(slime.word)
      // Highlight active slime
      this.slimes.forEach(s => s.sprite.setStrokeStyle(0))
      slime.sprite.setStrokeStyle(4, 0xffff00)
    } else {
      this.engine.clearWord()
    }
  }

  private updateBossHp() {
    this.bossHpText.setText(`Slimes: ${this.slimes.length}`)
  }

  private onWordComplete(word: string, _elapsed: number) {
    if (this.finished) return

    const slime = this.slimes.find(s => s.word === word)
    if (slime) {
      const oldX = slime.x
      const oldY = slime.y
      const oldSize = slime.size
      this.removeSlime(slime)
      
      if (word.length > 2) {
        const [w1, w2] = this.splitWord(word)
        // Offset the new slimes
        this.createSlime(w1, oldX - oldSize / 3, oldY, oldSize * 0.7)
        this.createSlime(w2, oldX + oldSize / 3, oldY, oldSize * 0.7)
      }
    }

    const next = this.slimes[0] ?? null
    this.setActiveSlime(next)

    if (this.slimes.length === 0) {
      this.endLevel(true)
    }
  }

  private splitWord(word: string): [string, string] {
    const mid = Math.ceil(word.length / 2)
    return [word.slice(0, mid), word.slice(mid)]
  }

  private onWrongKey() {
    this.cameras.main.flash(80, 120, 0, 0)
  }

  private removeSlime(slime: Slime) {
    slime.sprite.destroy()
    slime.label.destroy()
    this.slimes = this.slimes.filter(s => s !== slime)
    this.updateBossHp()
  }

  private endLevel(passed: boolean) {
    if (this.finished) return
    this.finished = true
    this.attackTimer?.remove()
    this.engine.destroy()

    const elapsed = Date.now() - this.engine.sessionStartTime
    const acc = calcAccuracyStars(this.engine.correctKeystrokes, this.engine.totalKeystrokes)
    const spd = calcSpeedStars(Math.round(this.engine.completedWords / (elapsed / 60000)), this.level.world)

    const captureAttempt = this.level.captureEligible
      ? { monsterId: 'slime_king', monsterName: 'Slime King' }
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
