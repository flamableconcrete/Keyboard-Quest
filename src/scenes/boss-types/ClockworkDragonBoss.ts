// src/scenes/boss-types/ClockworkDragonBoss.ts
import Phaser from 'phaser'
import { LevelConfig } from '../../types'
import { loadProfile } from '../../utils/profile'
import { TypingEngine } from '../../components/TypingEngine'
import { getWordPool } from '../../utils/words'
import { calcAccuracyStars, calcSpeedStars } from '../../utils/scoring'

interface Gear {
  container: Phaser.GameObjects.Container
  sprite: Phaser.GameObjects.Arc | Phaser.GameObjects.Rectangle
  label: Phaser.GameObjects.Text
  word: string
  orbitRadius: number
  orbitAngle: number
}

export class ClockworkDragonBoss extends Phaser.Scene {
  private level!: LevelConfig
  private profileSlot!: number
  private engine!: TypingEngine

  private phase = 1
  private maxPhases = 3
  private gears: Gear[] = []
  private totalDefeated = 0
  private targetDefeated = 0
  private wordsSpawnedInPhase = 0
  private wordsPerPhase = 0

  private bossHpText!: Phaser.GameObjects.Text
  private phaseText!: Phaser.GameObjects.Text
  private hpText!: Phaser.GameObjects.Text
  private timerText!: Phaser.GameObjects.Text
  
  private coreSprite!: Phaser.GameObjects.Arc

  private playerHp = 5
  private timeLeft = 0
  private timerEvent?: Phaser.Time.TimerEvent
  private attackTimer?: Phaser.Time.TimerEvent
  private finished = false

  constructor() {
    super('ClockworkDragonBoss')
  }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.finished = false
    this.playerHp = 5
    this.phase = 1
    this.totalDefeated = 0
    this.targetDefeated = this.level.wordCount
    this.wordsPerPhase = Math.max(1, Math.ceil(this.targetDefeated / this.maxPhases))
    this.wordsSpawnedInPhase = 0
    this.gears = []
  }

  create() {
    const { width, height } = this.scale

    // Metallic/Dark Industrial Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a1a)

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
        color: '#ffcc00',
      })
      .setOrigin(0.5, 0)

    this.phaseText = this.add
      .text(width / 2, 60, `Phase ${this.phase}/${this.maxPhases}`, {
        fontSize: '20px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5, 0)

    this.bossHpText = this.add
      .text(width / 2, 100, `Gears Jammed: ${this.totalDefeated}/${this.targetDefeated}`, {
        fontSize: '24px',
        color: '#ffcc00',
      })
      .setOrigin(0.5)

    // Dragon Core (The central point)
    this.coreSprite = this.add.circle(width / 2, height / 2 - 50, 60, 0x880000)
    this.coreSprite.setStrokeStyle(4, 0x555555)
    
    // Core visual pulsing
    this.tweens.add({
      targets: this.coreSprite,
      scale: 1.1,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

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
    this.wordsSpawnedInPhase = 0

    let gearsAtOnce = 3
    if (this.phase === 2) gearsAtOnce = 5
    else if (this.phase === 3) gearsAtOnce = 8

    // Distribute gears around the core
    const toSpawn = Math.min(gearsAtOnce, this.wordsPerPhase)
    for (let i = 0; i < toSpawn; i++) {
      this.spawnGear(i, gearsAtOnce)
    }

    this.cameras.main.flash(500, 255, 200, 0)
    this.updateTypingTarget()
    
    // Setup attack timer
    this.setupAttackTimer()
  }

  private spawnGear(indexInOrbit: number, totalInOrbit: number) {
    if (this.finished) return
    this.wordsSpawnedInPhase++

    const { width, height } = this.scale
    const difficulty = Math.ceil(this.level.world / 2) + (this.phase - 1)
    const word = getWordPool(this.level.unlockedLetters, 1, difficulty, this.level.world === 1 ? 5 : undefined)[0]

    const orbitRadius = 150 + (indexInOrbit % 2) * 50
    const orbitAngle = (indexInOrbit / totalInOrbit) * Math.PI * 2

    const container = this.add.container(width / 2, height / 2 - 50)
    
    const sprite = this.add.circle(0, 0, 40, 0x777777)
    sprite.setStrokeStyle(4, 0x333333)
    
    // Add "teeth" to the gear placeholder
    for (let i = 0; i < 8; i++) {
      const tooth = this.add.rectangle(
        Math.cos((i * Math.PI) / 4) * 40,
        Math.sin((i * Math.PI) / 4) * 40,
        15,
        15,
        0x555555
      )
      tooth.setRotation((i * Math.PI) / 4)
      container.add(tooth)
    }
    
    container.add(sprite)

    const label = this.add.text(0, 0, word, {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5)
    container.add(label)

    const gear: Gear = {
      container,
      sprite,
      label,
      word,
      orbitRadius,
      orbitAngle
    }
    
    this.gears.push(gear)

    // Initial positioning
    this.updateGearPosition(gear)
  }

  private setupAttackTimer() {
    this.attackTimer?.remove()
    const delay = Math.max(2000, 5000 - this.phase * 1000)
    
    this.attackTimer = this.time.addEvent({
      delay,
      loop: true,
      callback: this.bossAttack,
      callbackScope: this
    })
  }

  private updateGearPosition(gear: Gear) {
    const x = Math.cos(gear.orbitAngle) * gear.orbitRadius
    const y = Math.sin(gear.orbitAngle) * gear.orbitRadius
    gear.container.setPosition(this.coreSprite.x + x, this.coreSprite.y + y)
  }

  private updateTypingTarget() {
    if (this.gears.length > 0) {
      const target = this.gears[0]
      this.engine.setWord(target.word)

      // Highlight target gear
      this.gears.forEach((g, i) => {
        const isTarget = i === 0
        g.label.setColor(isTarget ? '#ffff00' : '#888888')
        g.label.setAlpha(isTarget ? 1 : 0.6)
        if (g.sprite instanceof Phaser.GameObjects.Arc) {
           g.sprite.setFillStyle(isTarget ? 0xaaaaaa : 0x777777)
        }
      })
    } else {
      this.engine.clearWord()
    }
  }

  private onWordComplete(_word: string, _elapsed: number) {
    if (this.finished) return

    const jammedGear = this.gears.shift()
    if (jammedGear) {
      this.totalDefeated++
      this.bossHpText.setText(`Gears Jammed: ${this.totalDefeated}/${this.targetDefeated}`)

      // Jamming animation
      this.tweens.add({
        targets: jammedGear.container,
        scale: 0,
        angle: 180,
        duration: 300,
        ease: 'Back.easeIn',
        onComplete: () => {
          jammedGear.container.destroy()
        },
      })
      
      // Visual feedback on core
      this.coreSprite.setFillStyle(0xffffff)
      this.time.delayedCall(50, () => {
        if (this.coreSprite) this.coreSprite.setFillStyle(0x880000)
      })
    }

    // Spawn replacement if phase isn't done
    if (this.wordsSpawnedInPhase < this.wordsPerPhase && this.totalDefeated < this.targetDefeated) {
      const gearsAtOnce = this.phase === 1 ? 3 : this.phase === 2 ? 5 : 8
      this.spawnGear(this.wordsSpawnedInPhase, gearsAtOnce)
    }

    // Check phase transition or win
    if (this.totalDefeated >= this.targetDefeated) {
      this.endLevel(true)
    } else if (this.gears.length === 0) {
      if (this.phase < this.maxPhases) {
        this.phase++
        this.startPhase()
      } else {
        this.endLevel(true)
      }
    } else {
      this.updateTypingTarget()
    }
  }

  private bossAttack() {
    if (this.finished) return

    // Steam burst / flash
    this.cameras.main.shake(300, 0.01)
    this.coreSprite.setScale(1.5)
    this.time.delayedCall(100, () => {
        if (this.coreSprite) this.coreSprite.setScale(1)
    })

    this.playerHp--
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
    this.attackTimer?.remove()
    this.engine.destroy()

    if (passed) {
      this.bossHpText.setText('DRAGON OVERLOADED!')
      this.gears.forEach((g) => g.container.destroy())
      this.gears = []
      
      // Core explosion effect
      this.tweens.add({
          targets: this.coreSprite,
          scale: 4,
          alpha: 0,
          duration: 500,
          ease: 'Cubic.easeOut'
      })
    }

    const elapsed = Date.now() - this.engine.sessionStartTime
    const acc = calcAccuracyStars(this.engine.correctKeystrokes, this.engine.totalKeystrokes)
    const spd = calcSpeedStars(Math.round(this.engine.completedWords / (elapsed / 60000)), this.level.world)

    const captureAttempt = this.level.captureEligible ? { monsterId: 'clockwork_dragon', monsterName: 'Clockwork Dragon' } : undefined

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

  update(_time: number, delta: number) {
    if (this.finished) return

    // Base spin speed + bonus based on missing HP
    const baseSpeed = 0.001
    const hpFactor = 1 - (this.totalDefeated / this.targetDefeated)
    const spinSpeed = baseSpeed + (1 - hpFactor) * 0.005
    
    this.gears.forEach((gear) => {
      gear.orbitAngle += spinSpeed * delta
      this.updateGearPosition(gear)
      
      // Rotate the gear itself
      gear.container.setRotation(gear.container.rotation + spinSpeed * delta * 2)
    })
  }
}
