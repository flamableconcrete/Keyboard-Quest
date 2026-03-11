// src/scenes/boss-types/HydraBoss.ts
import Phaser from 'phaser'
import { getItem } from '../../data/items'
import { LevelConfig } from '../../types'
import { loadProfile } from '../../utils/profile'
import { TypingEngine } from '../../components/TypingEngine'
import { getWordPool } from '../../utils/words'
import { calcAccuracyStars, calcSpeedStars } from '../../utils/scoring'
import { setupPause } from '../../utils/pauseSetup'

interface Head {
  sprite: Phaser.GameObjects.Rectangle
  label: Phaser.GameObjects.Text
  word: string
}

export class HydraBoss extends Phaser.Scene {
  private level!: LevelConfig
  private profileSlot!: number
  private engine!: TypingEngine

  private phase = 1
  private maxPhases = 3
  private heads: Head[] = []
  private headCount = 0 // Current number of active heads
  private totalDefeated = 0
  private targetDefeated = 0

  private bossHpText!: Phaser.GameObjects.Text
  private headCountText!: Phaser.GameObjects.Text
  private phaseText!: Phaser.GameObjects.Text
  private hpText!: Phaser.GameObjects.Text
  private timerText!: Phaser.GameObjects.Text
  private regrowBar!: Phaser.GameObjects.Rectangle

  private playerHp = 5
  private timeLeft = 0
  private timerEvent?: Phaser.Time.TimerEvent
  private regrowTimer?: Phaser.Time.TimerEvent
  private finished = false

  private headColors = [0x228b22, 0x006400, 0x32cd32] // Different shades of green

  constructor() {
    super('HydraBoss')
  }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.finished = false
    this.playerHp = 5
    this.phase = 1
    this.totalDefeated = 0
    this.targetDefeated = this.level.wordCount
    this.heads = []
  }

  create() {
    setupPause(this, this.profileSlot)
    const { width, height } = this.scale

    // Dark swampy background
    this.add.rectangle(width / 2, height / 2, width, height, 0x051a05)

    const pProfileAvatar = loadProfile(this.profileSlot)
    const avatarKey = this.textures.exists(pProfileAvatar?.avatarChoice || '') ? pProfileAvatar!.avatarChoice : 'avatar_0'
    this.add.image(100, height - 100, avatarKey).setScale(1.5).setDepth(5)

    // HUD
    this.hpText = this.add.text(20, 20, `HP: ${'❤️'.repeat(this.playerHp)}`, {
      fontSize: '22px',
      color: '#ff4444',
    })
    this.timerText = this.add
      .text(width - 20, 20, '', {
        fontSize: '22px',
        color: '#ffffff',
      })
      .setOrigin(1, 0)

    this.add
      .text(width / 2, 20, this.level.name, {
        fontSize: '28px',
        color: '#00ff00',
      })
      .setOrigin(0.5, 0)

    this.phaseText = this.add
      .text(width / 2, 60, `Phase ${this.phase}/${this.maxPhases}`, {
        fontSize: '20px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5, 0)

    this.bossHpText = this.add
      .text(width / 2, 100, `Heads Defeated: ${this.totalDefeated}/${this.targetDefeated}`, {
        fontSize: '24px',
        color: '#00ff00',
      })
      .setOrigin(0.5)

    this.headCountText = this.add
      .text(width / 2, 130, `Active Heads: ${this.headCount}`, {
        fontSize: '18px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5)

    // Regrow Timer Bar
    const barWidth = 200
    this.add.rectangle(width / 2, 160, barWidth, 10, 0x333333).setOrigin(0.5)
    this.regrowBar = this.add.rectangle(width / 2 - barWidth / 2, 160, barWidth, 10, 0x00ff00).setOrigin(0, 0.5)

    // Typing engine
    this.engine = new TypingEngine({
      scene: this,
      x: width / 2,
      y: height - 100,
      fontSize: 48,
      onWordComplete: this.onWordComplete.bind(this),
      onWrongKey: this.onWrongKey.bind(this),
    })

    // Level Timer
    if (this.level.timeLimit) {
      this.timeLeft = this.level.timeLimit
      this.timerEvent = this.time.addEvent({
        delay: 1000,
        repeat: this.level.timeLimit - 1,
        callback: () => {
          this.timeLeft--
          this.timerText.setText(`${this.timeLeft}s`)
          if (this.timeLeft <= 0) this.endLevel(false)
        },
      })
    }

    this.startPhase()
  }

  private startPhase() {
    this.phaseText.setText(`Phase ${this.phase}/${this.maxPhases}`)

    // Initial heads for the phase
    const initialHeads = 2 + this.phase
    for (let i = 0; i < initialHeads; i++) {
      this.spawnHead()
    }

    this.updateRegrowTimer()
    this.cameras.main.flash(500, 0, 100, 0)
    this.updateTypingTarget()
  }

  private spawnHead() {
    if (this.finished) return

    const { width, height } = this.scale
    const difficulty = Math.ceil(this.level.wordCount / 10) + (this.phase - 1) // Adjusted difficulty
    const word = getWordPool(this.level.unlockedLetters, 1, difficulty, this.level.world === 1 ? 5 : undefined)[0]

    // Position head randomly in a central area
    const x = Phaser.Math.Between(width * 0.2, width * 0.8)
    const y = Phaser.Math.Between(height * 0.3, height * 0.6)

    const sprite = this.add.rectangle(x, y, 80, 120, this.headColors[Phaser.Math.Between(0, this.headColors.length - 1)])
    const label = this.add
      .text(x, y - 80, word, {
        fontSize: '24px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5)

    const head: Head = { sprite, label, word }
    this.heads.push(head)
    this.headCount = this.heads.length
    this.headCountText.setText(`Active Heads: ${this.headCount}`)

    // Animation for spawning
    sprite.setScale(0)
    this.tweens.add({
      targets: [sprite, label],
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
    })

    if (this.heads.length === 1) {
      this.updateTypingTarget()
    }
  }

  private updateRegrowTimer() {
    this.regrowTimer?.remove()

    // Regrow gets faster as phase increases and as more heads are defeated
    const baseDelay = Math.max(3000, 8000 - this.phase * 1000 - (this.totalDefeated / this.targetDefeated) * 2000)

    this.regrowTimer = this.time.addEvent({
      delay: baseDelay,
      callback: () => {
        this.spawnHead()
        this.bossAttack()
        this.updateRegrowTimer()
      },
      callbackScope: this,
    })
  }

  private updateTypingTarget() {
    if (this.heads.length > 0) {
      const target = this.heads[0]
      this.engine.setWord(target.word)

      // Highlight target head
      this.heads.forEach((h, i) => {
        h.label.setColor(i === 0 ? '#ffff00' : '#ffffff')
        h.sprite.setStrokeStyle(i === 0 ? 4 : 0, 0xffffff)
      })
    } else {
      this.engine.clearWord()
    }
  }

  private onWordComplete(_word: string, _elapsed: number) {
    if (this.finished) return

    const defeatedHead = this.heads.shift()
    if (defeatedHead) {
      const pProfileBoss = loadProfile(this.profileSlot)
      const weaponItemBoss = pProfileBoss?.equipment?.weapon ? getItem(pProfileBoss.equipment.weapon) : null
      const powerBonus = weaponItemBoss?.effect?.power || 0
      this.totalDefeated += (1 + powerBonus)
      this.bossHpText.setText(`Heads Defeated: ${this.totalDefeated}/${this.targetDefeated}`)

      // Death animation
      this.tweens.add({
        targets: [defeatedHead.sprite, defeatedHead.label],
        alpha: 0,
        scale: 1.5,
        duration: 200,
        onComplete: () => {
          defeatedHead.sprite.destroy()
          defeatedHead.label.destroy()
        },
      })
    }

    this.headCount = this.heads.length
    this.headCountText.setText(`Active Heads: ${this.headCount}`)

    // Check phase transition or win
    const phaseTarget = Math.ceil((this.targetDefeated / this.maxPhases) * this.phase)
    if (this.totalDefeated >= this.targetDefeated) {
      this.endLevel(true)
    } else if (this.totalDefeated >= phaseTarget && this.phase < this.maxPhases) {
      this.phase++
      // Clear remaining heads from previous phase
      this.heads.forEach((h) => {
        h.sprite.destroy()
        h.label.destroy()
      })
      this.heads = []
      this.startPhase()
    } else {
      // If we still have heads, next one
      if (this.heads.length > 0) {
        this.updateTypingTarget()
      } else {
        // If somehow no heads left but not finished phase, spawn one
        this.spawnHead()
      }
    }

    // Reset regrow timer on success? Let's make it a bit easier
    this.updateRegrowTimer()
  }

  private bossAttack() {
    if (this.finished) return

    // Every head "attacks" slightly
    this.cameras.main.shake(200, 0.005)

    // Player takes damage if heads are too many?
    // Actually the requirement says "if the player takes too long to type a word, a new head regrows".
    // Let's also deal damage when a head regrows.
    const pProfile = loadProfile(this.profileSlot)
    const armorItem = pProfile?.equipment?.armor ? getItem(pProfile.equipment.armor) : null
    const absorbChance = armorItem?.effect?.absorbAttacksChance || 0
    if (Math.random() < absorbChance) {
      const blockText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'BLOCKED!', { fontSize: '32px', color: '#00ffff' }).setOrigin(0.5).setDepth(3000)
      this.tweens.add({ targets: blockText, y: blockText.y - 50, alpha: 0, duration: 1000, onComplete: () => blockText.destroy() })
    } else {
      this.playerHp--
    }
    this.hpText.setText(`HP: ${'❤️'.repeat(Math.max(0, this.playerHp))}`)

    if (this.playerHp <= 0) {
      this.endLevel(false)
    }
  }

  private onWrongKey() {
    this.cameras.main.flash(80, 100, 0, 0)
  }

  private endLevel(passed: boolean) {
    if (this.finished) return
    this.finished = true

    this.timerEvent?.remove()
    this.regrowTimer?.remove()
    this.engine.destroy()

    if (passed) {
      this.bossHpText.setText('HYDRA DEFEATED!')
      this.heads.forEach((h) => {
        h.sprite.destroy()
        h.label.destroy()
      })
    }

    const elapsed = Date.now() - this.engine.sessionStartTime
    const acc = calcAccuracyStars(this.engine.correctKeystrokes, this.engine.totalKeystrokes)
    const spd = calcSpeedStars(Math.round(this.engine.completedWords / (elapsed / 60000)), this.level.world)
    this.time.delayedCall(1500, () => {
      this.scene.start('LevelResult', {
        level: this.level,
        profileSlot: this.profileSlot,
        accuracyStars: acc,
        speedStars: spd,
        passed
      })
    })
  }

  update() {
    if (this.regrowTimer && !this.finished) {
      const progress = this.regrowTimer.getProgress()
      const barWidth = 200
      this.regrowBar.width = barWidth * (1 - progress)
    }
  }
}
